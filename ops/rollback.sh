#!/bin/bash
set -Eeuo pipefail
umask 077
ROOT=/home/deploy/flowkey-ops
exec 9>"$ROOT/deploy.lock"
flock -n 9 || { echo 'Deployment is running'; exit 1; }
mode=${1:---rehearse}
[[ "$mode" == --rehearse || "$mode" == --activate ]] || exit 2
[[ $# == 2 ]] || { echo 'Usage: rollback.sh --rehearse|--activate /absolute/release'; exit 2; }
release=$(realpath -e -- "$2")
[[ "$release" == "$ROOT/releases/"* && -f "$release/.next/BUILD_ID" && -f "$release/node_modules/next/dist/bin/next" ]] || exit 2
current=$(readlink -f "$ROOT/current")
# Unknown schema differences need a manual compatibility review; never roll the database back.
cmp -s "$current/prisma/schema.prisma" "$release/prisma/schema.prisma" || { echo 'Schema differs; compatibility review required'; exit 1; }
port=$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')
[[ "$mode" == --rehearse ]] || { port=4051; [[ "$(cat "$ROOT/current-port")" != 4051 ]] || port=4052; }
if [[ "$mode" == --rehearse ]]; then
 (cd "$release" && exec env PORT="$port" node node_modules/next/dist/bin/next start --hostname 127.0.0.1) > "$ROOT/reliability/rollback-candidate.log" 2>&1 &
 candidate=$!
 trap 'kill "$candidate" 2>/dev/null || true' EXIT
else
 # Only stop this application's inactive web slot.
 for stale in $(pm2 jlist | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{for(const p of JSON.parse(s))if(p.name.startsWith("flowkey-release-")&&p.name.endsWith("-"+process.argv[1]))console.log(p.name)})' "$port");do pm2 delete "$stale";done
 name="flowkey-release-rollback-$port"
 PORT="$port" pm2 start "$release/node_modules/next/dist/bin/next" --name "$name" --cwd "$release" -- start --hostname 127.0.0.1
 trap 'pm2 delete "$name" >/dev/null 2>&1 || true' ERR
fi
ready=0
for attempt in $(seq 1 30);do
 if [[ "$mode" == --rehearse ]] && ! kill -0 "$candidate" 2>/dev/null;then echo "Rollback candidate stopped";exit 1;fi
 if curl --max-time 3 -fsS "http://127.0.0.1:$port/api/health" >/dev/null;then ready=1;break;fi
 sleep 1
done
[[ "$ready" == 1 ]]
curl --max-time 5 -fsS "http://127.0.0.1:$port/login" >/dev/null
[[ $(curl --max-time 5 -sS -o /dev/null -w '%{http_code}' -H 'Origin: https://flowkey.uz' -H 'Content-Type: application/json' -d '{}' "http://127.0.0.1:$port/api/admin/tickets/rehearsal/replies") == 401 ]]
if [[ "$mode" == --rehearse ]]; then
 printf '{"ok":true,"at":"%s","release":"%s","liveTrafficChanged":false,"health":true,"login":true,"adminAccessDenied":true}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$release" > "$ROOT/reliability/rollback.json"
 echo 'Rollback candidate rehearsal passed; live traffic unchanged'
 exit 0
fi
oldport=$(cat "$ROOT/current-port")
sudo systemctl stop flowkey-deploy.timer
printf 'set $flowkey_backend http://127.0.0.1:%s;\n' "$port" > "$ROOT/upstream.new"
sudo /usr/local/sbin/flowkey-switch "$ROOT/upstream.new"
if ! curl --max-time 8 -fsS --resolve flowkey.uz:443:127.0.0.1 https://flowkey.uz/api/health >/dev/null;then
 printf 'set $flowkey_backend http://127.0.0.1:%s;\n' "$oldport" > "$ROOT/upstream.new"
 sudo /usr/local/sbin/flowkey-switch "$ROOT/upstream.new"
 exit 1
fi
# Keep the known working, schema-compatible worker until the operator chooses a worker release.
printf '%s\n' "$current" > "$ROOT/reliability/rollback-before-release"
ln -sfn "$release" "$ROOT/current"
printf '%s\n' "$port" > "$ROOT/current-port"
pm2 save
trap - ERR
echo 'Web rollback active; automatic deploy paused; database and worker unchanged'
