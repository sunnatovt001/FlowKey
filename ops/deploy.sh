#!/bin/bash
set -Eeuo pipefail
umask 077
ROOT=/home/deploy/flowkey-ops
exec 9>"$ROOT/deploy.lock"
flock -n 9 || exit 0
export GIT_SSH_COMMAND='ssh -i /home/deploy/.ssh/flowkey_readonly -o IdentitiesOnly=yes'
git --git-dir="$ROOT/repo.git" fetch origin main:refs/heads/main
sha=$(git --git-dir="$ROOT/repo.git" rev-parse main)
[[ "${1:-}" == --force || ! -f "$ROOT/current-sha" || "$(cat "$ROOT/current-sha")" != "$sha" ]] || exit 0
# Unknown database migrations require an explicit backwards-compatibility review.
if [[ -f "$ROOT/current-sha" ]]; then
 old=$(cat "$ROOT/current-sha")
 if ! git --git-dir="$ROOT/repo.git" diff --quiet "$old" "$sha" -- prisma; then
  echo 'Database schema changed: manual compatibility review required; previous release retained.' >&2
  exit 1
 fi
fi
release="$ROOT/releases/$(date -u +%Y%m%dT%H%M%S)-${sha:0:12}"
mkdir "$release"
git --git-dir="$ROOT/repo.git" archive "$sha" | tar -x -C "$release"
ln -s "$ROOT/shared/.env" "$release/.env"
ln -s "$ROOT/shared/local-data" "$release/local-data"
cd "$release"
npm ci --no-audit --no-fund
npx prisma generate
npx next typegen
npm run typecheck
npm test
npm run build
port=4051
[[ ! -f "$ROOT/current-port" || "$(cat "$ROOT/current-port")" != 4051 ]] || port=4052
# Stop only an obsolete FlowKey release occupying the inactive slot.
for stale in $(pm2 jlist | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{for(const p of JSON.parse(s))if(p.name.startsWith("flowkey-release-")&&p.name.endsWith("-"+process.argv[1]))console.log(p.name)})' "$port"); do pm2 delete "$stale"; done
name="flowkey-release-${sha:0:12}-$port"
cleanup() { pm2 delete "$name" >/dev/null 2>&1 || true; }
trap cleanup ERR
PORT="$port" pm2 start "$release/node_modules/next/dist/bin/next" --name "$name" --cwd "$release" -- start --hostname 127.0.0.1
healthy=0
for attempt in $(seq 1 60); do
 if curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null; then healthy=1; break; fi
 sleep 1
done
[[ "$healthy" == 1 ]]
curl -fsS "http://127.0.0.1:$port/login" >/dev/null
curl -fsS "http://127.0.0.1:$port/api/openapi" >/dev/null
oldport=$(cat "$ROOT/current-port" 2>/dev/null || echo 4050)
printf 'set $flowkey_backend http://127.0.0.1:%s;\n' "$port" > "$ROOT/upstream.new"
sudo /usr/local/sbin/flowkey-switch "$ROOT/upstream.new"
if ! curl -fsS --resolve flowkey.173.212.216.216.sslip.io:443:127.0.0.1 https://flowkey.173.212.216.216.sslip.io/api/health >/dev/null; then
 printf 'set $flowkey_backend http://127.0.0.1:%s;\n' "$oldport" > "$ROOT/upstream.new"
 sudo /usr/local/sbin/flowkey-switch "$ROOT/upstream.new"
 exit 1
fi
trap - ERR
[[ ! -f "$ROOT/current-port" ]] || cp "$ROOT/current-port" "$ROOT/previous-port"
[[ ! -f "$ROOT/current-sha" ]] || cp "$ROOT/current-sha" "$ROOT/previous-sha"
echo "$port" > "$ROOT/current-port"
echo "$sha" > "$ROOT/current-sha"
ln -sfn "$release" "$ROOT/current"
# Keep one worker; stop the original combined web/worker after switching.
pm2 stop FlowKey >/dev/null 2>&1 || true
pm2 delete FlowKey-worker >/dev/null 2>&1 || true
pm2 start "$release/scripts/worker.ts" --name FlowKey-worker --cwd "$release" --interpreter node --interpreter-args="--env-file=.env --import tsx"
pm2 save
printf 'Release active: %s port %s\n' "$sha" "$port"
