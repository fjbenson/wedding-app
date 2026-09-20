# Wedding App — context for Claude

A wedding planning app, built to eventually serve other couples, not just one.
The owner is new to development — explain things plainly, avoid jargon where a
normal word will do, and keep answers short unless asked to go deeper.

## Project notes live in Notion

The owner's planning notes, task list and strategy framework are here:
**https://app.notion.com/p/WEDDING-APP-3e13db5a9d15818891a3e37ab0800186**

Sub-pages: BLAST — Strategy, Process Flow, Tasks, Decisions log, Architecture.

**BLAST has been dropped** (20 Sep 2026). The way of working is now in
`docs/PROCESS.md`. Notion still describes BLAST — ignore it. The short version:
build in **vertical slices**, one usable journey at a time, and decide the
expensive-to-reverse things early while leaving fields, colours and components
to follow the screens that need them.

**Read Notion at the start of a session, but trust this repo over it.** Notion is
hand-maintained and lags behind — as of Sept 2026 it still listed the ERD and the
hosting choices as open, when both were long settled here. Offer to bring it up
to date rather than working from it as-is.

## Current state

Planning pass is **done**. There is a data model, a database schema, a running
Next.js scaffold and a design system. There are still **no real MVP screens** —
the placeholder home page and `/design` are all there is.

**The visual direction has moved on.** A Claude Design pass on 20 Sep produced a
look the owner prefers to the one in `/design`, plus a solved version of the
circle-with-dots hub. See "Design system" below — don't assume `/design` is the
final look.

**It is deployed.** Live at https://wedding-app-tau-dusky.vercel.app — Vercel
builds from `main` on every push, and branches get their own preview URLs. The
Supabase project exists with `0001_init.sql` applied, and Vercel holds
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase now
calls the anon key the *publishable* key — same thing).

This exists so design can be looked at rather than described: push a change, get
a link the owner can open on their phone.

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

### The Claude Design pass (20 Sep 2026)

A mockup round in Claude Design produced a direction the owner prefers, and it
should win over what's in `/design` when the screens get built.

What's worth keeping from it:

- **A solved hub.** A breathing orb showing "% ready" and days to go, with area
  dots around it at their own completion levels — and those same dots collapse
  into a **sticky rail at the top on scroll**, becoming navigation. Tapping one
  filters a detail card below. Better than the sketch in `/design`.
- **Softer, more confident visuals** — gradient washes, frosted-glass panels,
  Cormorant Garamond kept, paired with Jost rather than DM Sans.
- **Reassuring copy as a design principle** — "nothing is overdue, you're ahead
  of schedule". Wedding planning is stressful; the app shouldn't add to it.

What to ignore from it:

- It designed **the whole app**, including seating plans, an inspiration board
  and a **chatbot as the primary interface** — all deliberately out of MVP
  scope. It also omitted the sign-in screen.
- Its guest list gives each guest **one RSVP status**. The schema is right and
  the mockup is wrong: RSVPs are per person *per event*.
- **Households don't appear** in it at all.

Treat the mockup as inspiration, never as a spec — see `docs/PROCESS.md`,
"diverge in the mockup, converge in the code".

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

Working in slices now — one usable journey at a time, each one shipped before
the next is designed. See `docs/PROCESS.md`.

**Done:** ERD reviewed and confirmed · Supabase + Vercel live · a design system
built · a Claude Design mockup round.

**Slice 1 — sign in + contacts.** The brief is `docs/DESIGN_BRIEF.md`. Designs
were still being iterated when the session ended. Build it so a real guest can
be added and saved, then ship it.

**Then, in order:** RSVP · timeline · the hub.

**Not yet scheduled:** replace the hand-written types with `npm run db:types`
(the Supabase project exists now, so this is unblocked).

### Open decisions

- **Whether the design system in `/design` survives.** The Claude Design
  direction is preferred. Re-pointing `tailwind.config.ts` at it is a small job;
  the components are disposable and were guessed before any screen existed.
- **Sign in: magic link or password?** Undecided.
- **Whether a separate test database is wanted** before screens start writing
  data. Right now preview deployments and the live site share one Supabase
  database, so a branch preview writes real rows.

### Design decisions still open

Raised with the owner and deliberately deferred to the screen that needs them —
each is an added column, not a rebuild:

- **Meal choices** are free text; there's no list of set-menu options to pick from
- **No RSVP deadline** field, so nothing can show who's overdue
- **No budget** beyond per-supplier cost; a real budget view needs a new table
- **Milestones assign only to people with a login**, not to any contact
- **Children are a yes/no flag**, with no age tiers for catering
