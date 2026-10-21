---
name: status
description: Tell the wedding app's owner where things stand in five short lines — what was just done, what's waiting on them, and what's next. Use when the owner types /status, or asks "what's next", "where are we up to" or "what's left".
---

Read `CLAUDE.md` ("Next up"), `docs/backlog.md` (especially "Checks waiting on
the owner's phone"), and `git log --oneline -8`. Then answer in at most five
lines, plain words, no headings:

1. **Just done:** the last change or two that went live (from the log).
2. **Waiting on you:** anything the owner has to check on their phone or decide
   (a database change waiting for an OK, a design pick, a check).
3. **Next:** the agreed next step from "Next up".
4. **Then:** the one after it.
5. A question: "Shall I start on …?"

Nothing else — no lists of options, no backlog dump. If the owner asks for
more, then go deeper.
