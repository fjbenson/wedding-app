#!/bin/bash
# After a change: rebuild the app against the private copy and restart it on :3100
# (up.sh does this too, but also starts the database; this is the quick one).
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${CHECK_DIR:-/tmp/wedding-check}"
for p in $(ps -eo pid,args | awk '/[n]ext-server/ {print $1}'); do kill "$p"; done
(cd "$REPO" && npm run build >"$WORK/build.log" 2>&1) || { tail -20 "$WORK/build.log"; exit 1; }
(cd "$REPO" && nohup npx next start -p 3100 > "$WORK/next.log" 2>&1 < /dev/null &) > /dev/null 2>&1
for _ in $(seq 30); do curl -s -o /dev/null http://127.0.0.1:3100/sign-in && break; sleep 1; done
echo "rebuilt"
