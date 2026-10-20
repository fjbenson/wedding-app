---
name: check
description: Look at the wedding app's changed screens on a private copy (a local database with the made-up demo wedding) before anything goes live. Use when the owner types /check, and on your own before pushing any change to a screen.
---

The owner can't see a change until it's live, and Vercel no longer reports
back, so check it here first. The private copy never touches the live
database or anyone's real details.

1. **Start it:** `bash scripts/check/up.sh` (a few minutes the first time in a
   chat, quicker after). It starts Docker, a local database with every
   migration, the demo wedding on a test login, and the app on
   http://127.0.0.1:3100. If it says "signed out" later, run it again (the
   test session lasts an hour).
2. **Photograph the screens the change touched**, at iPhone size:
   `node scripts/check/shoot.cjs /people "/area/venue" "/plan?view=list"`.
   It prints each page's status and flags crashes, "Something went wrong",
   and pages that scroll sideways. Cards open from the address (`?guest=` is
   cleared on load, so open a guest by tapping instead; write a small
   Playwright step for taps).
3. **Look at the pictures** (`/tmp/wedding-check/shots/`; cut tall ones into
   852px slices to read them) against `CLAUDE.md`'s design patterns. Fix what's
   off, then look again.
4. **Try a save** when the change adds or edits something: fill the form in
   Playwright and confirm the row in the database
   (`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres`).
5. **Finish:** `bash scripts/check/down.sh` stops the app and removes
   `.env.local` (git-ignored, but don't leave it pointing at the copy). Then
   typecheck, build and push as usual.

Tell the owner in a line what was checked ("checked Guests, the guest card and
a save on the private copy"). Juno can't be tried here (no key), nor a real
iPhone's keyboard or pickers — say so when it matters. If a new migration is
in the change, `up.sh` applies it to the copy only; the live database still
needs the owner's OK.
