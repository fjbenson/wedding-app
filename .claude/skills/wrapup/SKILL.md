---
name: wrapup
description: Wrap up a chat on the wedding app — make sure everything is saved and live, bring the project notes up to date, and tell the owner in a few lines what changed. Use when the owner types /wrapup.
---

The owner is finishing a chat and wants nothing left loose. They are new to
development: keep the report short and in plain words.

1. **Anything unsaved?** Run `git status`. If there are changes:
   - Leftover test pages or scratch files (e.g. a `src/app/zz-*` preview, a
     temporary edit to `src/middleware.ts`) are removed or reverted, not
     committed.
   - For real work: `npm run typecheck` and `npm run build` must pass, then
     commit with a clear message and push it live with
     `git push origin HEAD:main` (and to this chat's own branch). If either
     check fails, don't push — tell the owner what's broken.
2. **Bring the notes up to date** with what this chat decided or built:
   - `CLAUDE.md` — "Current state", "Next steps" and any decision worth
     keeping (with the date).
   - `docs/DESIGN.md` — if the look changed.
   - `.claude/skills/banana/SKILL.md` — if its one-line description of the
     look is now out of date.
   - Change only what's stale; don't rewrite what's still true. Commit and
     push these too.
3. **Notion** (https://app.notion.com/p/WEDDING-APP-3e13db5a9d15818891a3e37ab0800186)
   is the owner's hand-kept notes. Don't edit it unasked: say in one line
   whether it's now behind, and offer to update it.
4. **Report back**, briefly:
   - **What we did** — a few bullets, in plain words.
   - **Live?** — yes/no, and the link https://wedding-app-tau-dusky.vercel.app
   - **Anything the owner must do** — e.g. a migration to paste into
     Supabase, a key to add in Vercel, re-adding the home-screen app.
   - **Next time** — the next step from `CLAUDE.md`, and a reminder that
     `/banana` picks up from here in a new chat.
