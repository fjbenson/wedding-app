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

Planning pass is **done**. There is a data model, a database schema, a running
Next.js scaffold and a **built design system**. There are still **no real MVP
screens** — the placeholder home page and `/design` are all there is.

**It is deployed.** Live at https://wedding-app-tau-dusky.vercel.app — Vercel
builds from `main` on every push, and branches get their own preview URLs. The
Supabase project exists with `0001_init.sql` applied, and Vercel holds
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase now
calls the anon key the *publishable* key — same thing).

This exists so design can be looked at rather than described: push a change, get
a link the owner can open on their phone.

In BLAST terms: **B, L and A are done** (scope locked, stack chosen, ERD and
schema written and reviewed by the owner). **S is done** — "warm and romantic"
is built out as a real design system; see below. **T is part done** — hosting is
live, the screens are not.

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

## Design system

Explained in `docs/DESIGN.md`. Tokens in `tailwind.config.ts`, components in
`src/components/ui/`.

Direction is **warm and romantic**: cream canvas, dusty rose primary, deep plum
ink, sage and gold accents. Nothing pure white, nothing pure black.

- **`/design` is the catalogue** — every colour, font and component on one page,
  live at https://wedding-app-tau-dusky.vercel.app/design. It renders the real
  components, so it's the fastest way to check a change didn't break the look.
- **Colours are named, never hex.** `bg-canvas`, `text-ink`, `bg-rose-500`. The
  only hex codes in the app are in `tailwind.config.ts`.
- **Status badges own the wording.** `RsvpBadge`, `MilestoneBadge` and friends
  map the database's enum values to words and colours in one place, so a
  declined guest looks the same on every screen.
- **`Field` takes a function**, not a control: `{(props) => <Input {...props} />}`.
  That's how the label, hint and error get wired to the input for screen
  readers, and how `error` turns the control red on its own.
- Fonts are Cormorant Garamond (display) and DM Sans (body), loaded in
  `src/app/layout.tsx`. `h1`–`h3` get the serif automatically.

No dark mode, deliberately — the direction is cream paper.

## Conventions

- **All database queries live in `src/lib/db/`.** Nothing else imports the
  Supabase client. This is what keeps a future backend split mechanical — don't
  scatter queries into components.
- **Row-level security is the real access control.** Policies are built on
  `is_wedding_member()` and `is_wedding_host()`. App-level checks are a
  convenience, not the guarantee.
- Types in `src/types/db.ts` are hand-written and mirror the migration. The
  Supabase project now exists, so these should be replaced with `npm run
  db:types` — not yet done.

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

1. ~~Owner reviews `docs/ERD.md`~~ — done 20 Sep 2026, model confirmed
2. ~~Create the Supabase project, run the migration, connect Vercel~~ — done
3. ~~Build the design system~~ — done, `docs/DESIGN.md` and `/design`
4. Build screens: sign in, dashboard (circle-with-dots hub), contacts, timeline,
   RSVP
5. Replace the hand-written types with `npm run db:types`

### Design decisions still open

Raised with the owner and deliberately deferred to the screen that needs them —
each is an added column, not a rebuild:

- **Meal choices** are free text; there's no list of set-menu options to pick from
- **No RSVP deadline** field, so nothing can show who's overdue
- **No budget** beyond per-supplier cost; a real budget view needs a new table
- **Milestones assign only to people with a login**, not to any contact
- **Children are a yes/no flag**, with no age tiers for catering
