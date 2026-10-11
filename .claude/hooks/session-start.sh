#!/bin/bash
# Start of every chat (cloud sessions): make sure we're working on the live
# version, install packages, then tell Claude to catch the owner up.
#
# Why: a chat's copy can be made from an old side branch. On 11 Oct 2026 one
# started from a branch stuck at 1 Oct, ten days and ~80 commits behind main,
# and nothing noticed until a push was refused.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

status=""
fetched=false
for wait in 2 4 8 16; do
  if git fetch -q origin main 2>/dev/null; then fetched=true; break; fi
  sleep "$wait"
done

if ! $fetched; then
  status="WARNING: couldn't reach GitHub to check this copy against main. Before building anything, run \`git fetch origin main\` and compare."
elif git merge-base --is-ancestor origin/main HEAD; then
  status="This copy is up to date with main ($(git log -1 --format='%h, %cd' --date=format:'%-d %b %Y' origin/main))."
elif git merge-base --is-ancestor HEAD origin/main; then
  behind=$(git rev-list --count HEAD..origin/main)
  if [ -z "$(git status --porcelain)" ] && git merge -q --ff-only origin/main 2>/dev/null; then
    status="This copy was $behind commits behind main, so it was brought up to date automatically. Mention this to the owner in one line."
  else
    status="WARNING: this copy is $behind commits behind main and couldn't be updated automatically (unsaved changes?). Sort this out before building anything: \`git status\`, then \`git merge --ff-only origin/main\`."
  fi
else
  status="WARNING: this copy and main have both moved on separately. Before building anything, look at \`git log --oneline HEAD...origin/main\` and tell the owner; don't push over main."
fi

# Packages, so typecheck and build work straight away. npm install (not ci)
# makes use of the copy the container keeps.
npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || \
  status="$status Note: \`npm install\` failed at start-up; run it before typecheck/build."

cat <<MSG
[Start of chat — wedding app]
$status

Catch-up: in your first reply, before doing anything else the owner asks,
give a short catch-up as $CLAUDE_PROJECT_DIR/.claude/catch-up.md describes.
If the owner's first message is a clear request, do the catch-up in two or
three lines and then get on with it.
MSG
