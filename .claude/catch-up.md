# Start-of-chat catch-up

Read by Claude at the start of every chat (the start-up hook in
`.claude/hooks/session-start.sh` points here). The owner doesn't type
anything for this. `/banana` is the *end*-of-chat wrap-up.

1. Read `CLAUDE.md` and `docs/DESIGN.md`.
2. Glance at the latest commits (`git log --oneline -10`) for anything newer
   than those files mention.
3. Reply briefly, in plain language (the owner is new to development):
   - **Where we are** — two or three lines: what's built, what's live.
   - **The look we chose** — one line (ivory magazine on paper-grain
     ivory, editorial type, glass cards, frosted hub ring).
   - **Links** — the design canvases, Glass Lab and Taste Lab from `CLAUDE.md`.
   - **Next step** — the agreed next step from `CLAUDE.md`, as a question:
     "Shall I start on …?"
4. If the start-up hook said this copy was behind main or couldn't be
   checked, say so in one line.

Don't start building until the owner says so — unless their first message
already asks for something.
