#!/bin/bash
# The private copy for /check: a local database with every migration and the
# made-up demo wedding, and the app built against it on http://127.0.0.1:3100.
# Nothing here touches the live database. Run from anywhere; safe to re-run.
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${CHECK_DIR:-/tmp/wedding-check}"
mkdir -p "$WORK"
DB=postgresql://postgres:postgres@127.0.0.1:54322/postgres
ANON=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# 1. Docker (the cloud container doesn't start it by itself).
if ! docker info >/dev/null 2>&1; then
  (dockerd > "$WORK/dockerd.log" 2>&1 < /dev/null &) > /dev/null 2>&1
  for _ in $(seq 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi

# 2. The stand-in gateway on :54321 (Supabase's own one can't be downloaded here).
if ! curl -s -o /dev/null http://127.0.0.1:54321/; then
  (nohup node "$REPO/scripts/check/gateway.js" > "$WORK/gateway.log" 2>&1 < /dev/null &) > /dev/null 2>&1
  sleep 1
fi

# 3. The local database, with this copy's migrations.
mkdir -p "$WORK/supabase/migrations"
[ -f "$WORK/supabase/config.toml" ] || (cd "$WORK" && npx -y supabase@2 init --force >/dev/null 2>&1)
cp "$REPO"/supabase/migrations/*.sql "$WORK/supabase/migrations/"
(cd "$WORK" && npx -y supabase@2 start --ignore-health-check -x kong,studio,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta,realtime,mailpit,inbucket >/dev/null 2>&1) || true
for _ in $(seq 60); do curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321/auth/v1/health | grep -q 200 && break; sleep 2; done
# Migrations added since the copy was first made.
(cd "$WORK" && npx -y supabase@2 migration up --local >/dev/null 2>&1) || true

# 4. A test login and the demo wedding on it (only the first time).
USER_ID=$(psql "$DB" -tAc "select id from auth.users where email = 'check@example.com'")
if [ -z "$USER_ID" ]; then
  USER_ID=$(curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" \
    -H 'Content-Type: application/json' -d '{"email":"check@example.com","password":"check-pass-123","email_confirm":true}' \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
fi
if [ "$(psql "$DB" -tAc "select count(*) from weddings")" = "0" ]; then
  sed "s/86604270-61ba-4dc9-b7db-ab4d50e34b33/$USER_ID/g" "$REPO/supabase/seed/demo-wedding.sql" > "$WORK/seed.sql"
  psql "$DB" -q -v ON_ERROR_STOP=1 -f "$WORK/seed.sql"
fi
# A demo made by an earlier login: let the test login open it too.
psql "$DB" -q -c "insert into wedding_members (wedding_id, user_id, role) select w.id, '$USER_ID', 'owner' from weddings w where not exists (select 1 from wedding_members m where m.wedding_id = w.id and m.user_id = '$USER_ID')"

# 5. The app, built against the copy (.env.local is git-ignored; down.sh removes it).
printf 'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nNEXT_PUBLIC_SUPABASE_ANON_KEY=%s\n' "$ANON" > "$REPO/.env.local"
for p in $(ps -eo pid,args | awk '/[n]ext-server/ {print $1}'); do kill "$p"; done
(cd "$REPO" && npm run build >"$WORK/build.log" 2>&1) || { tail -20 "$WORK/build.log"; exit 1; }
(cd "$REPO" && nohup npx next start -p 3100 > "$WORK/next.log" 2>&1 < /dev/null &) > /dev/null 2>&1
for _ in $(seq 30); do curl -s -o /dev/null http://127.0.0.1:3100/sign-in && break; sleep 1; done

# 6. Sign the test login in for the browser (an hour-long session).
(cd "$REPO" && U=http://127.0.0.1:54321 K=$ANON OUT="$WORK/cookies.json" node scripts/check/login.mjs)
echo "Private copy ready: http://127.0.0.1:3100 (cookies in $WORK/cookies.json)"
