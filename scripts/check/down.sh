#!/bin/bash
# Ends a /check: stops the app and points the copy back at nothing local.
# The database is left running (and its demo kept) for the next check.
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
for p in $(ps -eo pid,args | awk '/[n]ext-server/ {print $1}'); do kill "$p"; done
rm -f "$REPO/.env.local"
echo "Stopped the app and removed .env.local."
