# Wedding App — context for Claude

A wedding planning app, built to eventually serve other couples, not just one.
The owner is new to development — explain things plainly, avoid jargon where a
normal word will do, and keep answers short unless asked to go deeper.

## Project notes live in Notion

The owner's planning notes, task list and strategy framework are here:
**https://app.notion.com/p/WEDDING-APP-3e13db5a9d15818891a3e37ab0800186**

Sub-pages: BLAST — Strategy, Process Flow, Tasks, Decisions log, Architecture.

The project runs on the **BLAST** framework:

| | Stage | Means |
|---|---|---|
| **B** | Blueprint your outcome | Vision and scope, before any tool |
| **L** | Link your integrations | Pick the APIs, hosts and database |
| **A** | Architect the plan | AI maps the system, owner approves |
| **S** | Style the experience | UI, brand, user flow |
| **T** | Trigger the execution | Build, ship, automate |

**Read Notion at the start of a session, but trust this repo over it.** Notion is
hand-maintained and lags behind — as of Sept 2026 it still listed the ERD and the
hosting choices as open, when both were long settled here. Offer to bring it up
to date rather than working from it as-is.

## Current state

Planning pass is **done**. There is a data model, a database schema and a running
Next.js scaffold. There are **no real screens yet** — just a placeholder page.

Nothing is deployed. No Vercel project, no Supabase project. The code is only on
GitHub.

In BLAST terms: **B, L and A are done** (scope locked, stack chosen, ERD and
schema written and reviewed by the owner). **S is in progress** — the owner has
picked a "warm and romantic" direction; the design system itself is not built.
**T has not started.**

## Architecture (decided, don't relitigate)

| Piece | Role |
|---|---|
| Next.js 15 | The app — screens *and* server logic in one codebase |
| Vercel | Hosts the Next.js app |
| Supabase | Postgres, Auth, and later Storage + Realtime |

**There is deliberately no separate backend service.** This was discussed at
length. The features that would justify one are covered:

- Chatbot streaming → runs fine in Vercel functions
- Guest-to-guest chat → clients connect directly to Supabase Realtime
- Photo upload → clients upload directly to Supabase Storage

The one genuine future gap is **scheduled/background work** (timeline reminders,
long agent runs). When that arrives, add a worker (Railway is the likely home) as
a *third* piece. Don't restructure the other two.

## Data model

Full explanation in `docs/ERD.md`. Schema in `supabase/migrations/0001_init.sql`.

Decisions worth preserving:

- **`weddings` is the tenant.** Everything hangs off it and carries `wedding_id`.
- **Access is via `wedding_members`**, which has a `role` enum already containing
  `guest`. Guest access ships as a new row plus new policies — never a rebuild.
- **Households are separate from contacts.** Invitations go to a household; RSVPs
  come from individuals.
- **RSVPs are per contact per event.** Day vs evening guests is standard and
  horrible to retrofit.
- **Suppliers extend contacts** via `supplier_details` rather than padding every
  guest row with empty columns.

## Conventions

- **All database queries live in `src/lib/db/`.** Nothing else imports the
  Supabase client. This is what keeps a future backend split mechanical — don't
  scatter queries into components.
- **Row-level security is the real access control.** Policies are built on
  `is_wedding_member()` and `is_wedding_host()`. App-level checks are a
  convenience, not the guarantee.
- Types in `src/types/db.ts` are hand-written and mirror the migration. Once a
  Supabase project exists, replace them with `npm run db:types`.

## Verifying changes

```bash
npm run typecheck     # tsc
npm run build         # next build
```

`supabase/tests/rls_isolation.sql` proves one couple can't read or write
another's data. Run it against a scratch Postgres with the migration applied
(stub `auth.users` and `auth.uid()` first — Supabase provides those). **Re-run it
whenever RLS policies change.**

## Scope

**MVP (in scope):** contacts, timeline/milestones, RSVP — host-only.

**Deliberately not built yet:** chatbot, guest access/RBAC, guest-to-guest
messaging, seating plans, gift registry, photo uploads, inspo page. All are
additive — new tables hanging off `weddings`. None require changing the above.

## Next steps

1. Owner reviews `docs/ERD.md` and confirms the model matches their wedding
2. Design pass (Claude Design) — mockups and design system
3. Build screens: sign in, dashboard (circle-with-dots hub), contacts, timeline,
   RSVP
4. Create the real Supabase project, run the migration, connect Vercel
