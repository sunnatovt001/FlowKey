#!/bin/bash
set -euo pipefail
ROOT=/home/deploy/flowkey-ops
exec 9>"$ROOT/deploy.lock"
flock -n 9 || { echo 'Deployment is running'; exit 1; }
sudo systemctl stop flowkey-deploy.timer
port=$(cat "$ROOT/previous-port" 2>/dev/null || echo 4050)
if [[ "$port" == 4050 ]]; then
 pm2 restart FlowKey
else
 name=$(pm2 jlist | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{for(const p of JSON.parse(s))if(p.name.startsWith("flowkey-release-")&&p.name.endsWith("-"+process.argv[1]))console.log(p.name)})' "$port")
 sha=$(cat "$ROOT/previous-sha")
 release=$(find "$ROOT/releases" -maxdepth 1 -type d -name "*-${sha:0:12}" | sort | tail -1)
 [[ -d "$release" ]]
 [[ -z "$name" ]] || pm2 delete "$name"
 PORT="$port" pm2 start "$release/node_modules/next/dist/bin/next" --name "flowkey-release-${sha:0:12}-$port" --cwd "$release" -- start --hostname 127.0.0.1
fi
for attempt in $(seq 1 30); do
 if curl -fsS "http://127.0.0.1:$port/login" >/dev/null; then break; fi
 sleep 1
done
curl -fsS "http://127.0.0.1:$port/login" >/dev/null
printf 'set $flowkey_backend http://127.0.0.1:%s;\n' "$port" > "$ROOT/upstream.new"
sudo /usr/local/sbin/flowkey-switch "$ROOT/upstream.new"
pm2 delete FlowKey-worker >/dev/null 2>&1 || true
if [[ "$port" != 4050 ]]; then
 sha=$(cat "$ROOT/previous-sha")
 release=$(find "$ROOT/releases" -maxdepth 1 -type d -name "*-${sha:0:12}" | sort | tail -1)
 pm2 start "$release/scripts/worker.ts" --name FlowKey-worker --cwd "$release" --interpreter node --interpreter-args="--env-file=.env --import tsx"
 ln -sfn "$release" "$ROOT/current"
 echo "$sha" > "$ROOT/current-sha"
else
 rm -f "$ROOT/current-sha"
fi
echo "$port" > "$ROOT/current-port"
pm2 save
echo "Rollback active on port $port. Automatic deployments paused."
