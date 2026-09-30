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

## The plan: read this first

**`docs/information-architecture.md`** is the agreed map of the app (20 Sep
2026): five tabs — **Hub · People · Plan · Money · The Day** — plus the
not-tab pages (area page, Brainstorm, Inspo, Settings), and **38 screens**
marked MVP / Next / Later. `docs/design-brief.md` is the same thing written as
a brief for designers. **Build to these.** Before adding a screen, find it in
the list; if something doesn't fit, raise it with the owner rather than
inventing a new tab.

These two files were written on a side branch and only reached `main` on
30 Sep 2026 — until then build sessions couldn't see them, which is how a
separate RSVP tab got built against the plan (since folded into People).

## Current state

Planning pass is **done**. There is a data model, a database schema and a running
Next.js scaffold. Built so far, against the plan's tabs:

- **Setup** (`/setup`, screen 2): the couple's names and the date, then which
  areas apply. The home page sends anyone without a wedding, or without
  areas, here.
- **Hub** (`/`): cover, hub ring, "coming up" story. The ring's dots are the
  wedding's own **areas** (`areas` table, `0003_areas.sql`). Each dot opens
  its **area page** (`/area/[key]`, screens 5–6): key facts
  (`areas.details`, `0005_area_details.sql`), cost, to-dos and suppliers
  tagged with that area, and "take off the hub" / "not planning this". The
  ring's + opens `/area/new` (screen 7): add your own, or bring one back.
  Notes and Inspo blocks wait for Quick capture and Inspo. Suppliers file
  under the wedding's areas too (plus "Other").
- **People** (`/people`): the guest list by household — add, edit, remove,
  with a **role on the day** (bridesmaid, usher…; `0004_guest_roles.sql`;
  a role makes them `bridal_party`). "Everyone" is a row per guest that opens
  to show details on phones, and a full table on desktop (`guest-table.tsx`) —
  with **RSVPs folded in**: "Everyone" or one event at a time (`?event=`),
  invite by household or all, yes/no/? per person, meal and dietary notes.
  RSVPs are recorded by the couple; guests answering via their own link is
  "guest access", still deliberately not built. A **Suppliers** tab
  (`?tab=suppliers`, screens 12 and 13): business, category, status, quote,
  deposit, contract link, contact details. Queries in `src/lib/db/suppliers.ts`;
  categories in `src/lib/areas.ts` use the plan's starter-area ids so they line
  up when areas become rows. `/people/[id]` opens a guest or a supplier.
  A **Bridal party** tab (`?tab=party`, screen 11): guests with a role,
  grouped by role in the usual order, with call/email buttons, and "give
  someone a role" in place (`assignRoleAction`).
  **Invitations** (`/invitations`, screen 15, linked from the guest list):
  households to send to (flagging missing addresses; mark sent, or all),
  sent ones with how many have answered, and "still to hear from" — pending
  answers where the invitation has gone out — with text/call/email buttons,
  the text and email pre-written. Uses the existing `invitations.sent_at`.
  **Household detail** (`/people/household/[id]`, screen 9): address, a
  dietary summary, and each person's role, answers and meal; household names
  in the list link there. "Add someone" opens the guest form with that
  household picked and comes back after.
- **Plan** (`/plan`): the **Agenda** (screens 16–17, `agenda.tsx`) — to-dos,
  **appointments** (`0007_appointments.sql`, screen 21, `/plan/appointments/…`)
  and payments due on one month-by-month timeline, the wedding day as the
  final entry, filters `?show=todos|appointments|payments`, and a "Done and
  been" section — or **By area**
  (`?view=area`, screen 18) — every area of the wedding in its own order,
  empty ones with an "Add a to-do" that pre-picks the area. Tick off, add,
  edit, remove. The to-do form offers the wedding's own areas.
- **Money** (`/money`, screens 22–24; `0006_money.sql`): **Budget** — the
  wedding's budget and each area's share against committed and paid, by
  area — and **Payments** (`?tab=payments`): due and paid, tick to mark paid,
  overdue flagged, booked suppliers' unscheduled balances offered as
  payments. How committed/paid are counted lives only in `src/lib/budget.ts`
  (area pages use it too): committed = booked suppliers' quotes + payments
  not for a supplier; paid = supplier deposits + payments marked paid.
- **Quick capture and inbox** (screens 35–36, `0008_notes.sql`): jot a
  thought and/or a link from anywhere — a glass pen button above the phone
  menu bar, a button in the desktop sidebar, the pen on the hub cover — at
  `/capture?from=…`. Unfiled captures wait in `/inbox` (count in the
  sidebar) to be filed under an area, turned into a to-do, or removed;
  filed ones show in the area page's Notes block. Images aren't in yet:
  they need Supabase Storage (a bucket plus storage policies).
- **Settings** (`/settings`, screen 37; a gear on the hub cover, and the
  foot of the desktop sidebar): the couple's names and date; every area
  with the plan's two switches (Planning / On the hub — turning planning
  off also hides the dot), rename, and up/down order; and who has a login,
  with a plain warning that the wedding lives in this browser until proper
  sign-in.
- **Inspo** (`/inspo`, screens 29–33; `0010_inspo.sql`): the picture grid,
  folders = areas (`?folder=<key>` / `?folder=unsorted`), save a photo or a
  link (`/inspo/new`), one idea large (`/inspo/[id]`). Photos upload
  **straight from the phone** to the private `inspo` storage bucket
  (`src/lib/db/inspo-upload.ts`, the one browser-side query — shrunk to
  2000px first) under `<wedding id>/…`; storage policies mirror the table's.
  Shown via hour-long signed links. Pasted links get the page's own preview
  picture and title (`src/lib/link-preview.ts`: public web addresses only,
  4s, 600 KB). Area pages show their folder; the inbox shows unsorted
  pictures; reached from the Hub card, the sidebar and the capture page.
- **The Day** (`/day`, screens 25, 27, 28; `0009_the_day.sql`): **Run
  sheet** (hour by hour, with a Print button — menus hide when printing),
  **Seating** (`?tab=seating`: tables with seat counts, sit guests from an
  unseated list, "over" flagged; guests who declined everything are left
  out) and **Transport** (`?tab=transport`: each car/coach run and who's in
  it). Seats and passengers can only point at guests, tables and runs of
  the same wedding (composite foreign keys on `(id, wedding_id)`). The
  agenda's wedding-day line links here. Still to come: the drag-about
  seating floor plan (screen 26).

**Every MVP screen in the plan is now built** (30 Sep 2026). Areas are rows,
but `milestones.category` and `supplier_details.category` still hold an
area's `key` as text rather than the plan's `area_id`. Older to-dos may carry
`guests` or `timeline` as their area (from before areas were rows);
`areaName()` in `src/lib/areas.ts` still names them, and "By area" shows them
in their own group rather than losing them. Old `/guests`, `/timeline`, `/rsvps` links redirect
(`next.config.ts`). Shared form pieces live in `src/components/form-bits.tsx`
and `form-page.tsx`.

**It is deployed.** Live at https://wedding-app-tau-dusky.vercel.app — Vercel
builds from `main` on every push, and branches get their own preview URLs. The
Supabase project exists with `0001_init.sql` applied, and Vercel holds
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase now
calls the anon key the *publishable* key — same thing).

**Shipping changes: no pull requests.** At the owner's request (29 Sep
2026), changes go straight to `main` with `git push origin HEAD:main`, which
`.claude/settings.json` allows. Before every push, `npm run typecheck` and
`npm run build` must pass. Vercel deploys `main` about a minute later, and a
build that fails there leaves the last good version live. Tell the owner in
plain words what changed once it's pushed.

This exists so design can be looked at rather than described: push a change, get
a link the owner can open on their phone.

In BLAST terms: **B, L and A are done** (scope locked, stack chosen, ERD and
schema written and reviewed by the owner). **S is in progress** — the owner has
settled on an editorial, ivory-and-champagne look with a floating glass hub
ring (`docs/DESIGN.md`). The palette, fonts and glass working default are now
in `tailwind.config.ts` and `src/app/globals.css` (`.glass`, `.label`); the
existing sign-in, new-wedding and hub screens use them. Final glass use is
still open.
**T is part done** — hosting is live, the screens are not.

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

Full explanation in `docs/ERD.md`. Schema in `supabase/migrations/0001_init.sql`,
plus `0002_create_wedding.sql` to `0010_inspo.sql`. **New migrations are run
by hand** in the Supabase SQL editor — the owner has to paste them in. Until
0003 is run, `listAreas()` returns `null` and the app falls back to the
starter areas rather than breaking; until 0004 is run, a guest's role
quietly isn't saved (`saveGuestAction` retries without it).

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
- **Creating a wedding goes through `create_wedding()`**, not an insert. The
  policies chase their own tail on the first one — only a member can read a
  wedding, only a host can add members — so both inserts live in one
  `security definer` function. It reads `auth.uid()` itself, so it can't be
  used to create a wedding owned by someone else. Anything else that has to
  write its own way in will need the same treatment.

## Sign-in (temporary)

Email sign-in kept getting stuck (Supabase's built-in email sends only ~2 an
hour), so since 29 Sep 2026 **visitors are signed in anonymously** by
`src/lib/supabase/middleware.ts` — no sign-in screen. RLS still applies: an
anonymous user is a real `auth.uid()`. The catch: a wedding lives in the one
browser that made it. Needs "Allow anonymous sign-ins" on in Supabase.
Sign-out is hidden for anonymous users (it would lose the wedding). To bring
email sign-in back: set up custom SMTP (e.g. Resend), then link the anonymous
user to an email with `updateUser({ email })` so the wedding carries over.

**The owner's call (30 Sep 2026): proper sign-in is the very last thing
built.** Don't propose it as a next step before everything else is done;
Settings already warns that the wedding lives in one browser.

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
another's data. Run it against a scratch Postgres with the migrations applied
(stub `auth.users` — with `raw_user_meta_data jsonb` — and `auth.uid()` first,
plus `pgcrypto`; Supabase provides those). Postgres 16 is installed in the
cloud container; `initdb` must run as the `postgres` user, in a folder it owns
(e.g. `/var/lib/postgresql`). **Re-run it whenever RLS policies change.**

## Scope

**MVP (in scope):** contacts, timeline/milestones, RSVP — host-only.

**Deliberately not built yet:** chatbot, guest access/RBAC, guest-to-guest
messaging, seating plans, gift registry, photo uploads, inspo page. All are
additive — new tables hanging off `weddings`. None require changing the above.

## Next steps

1. ~~Owner reviews `docs/ERD.md`~~ — done 20 Sep 2026, model confirmed
2. ~~Create the Supabase project, run the migration, connect Vercel~~ — done
3. ~~Put the design tokens from `docs/DESIGN.md` into Tailwind~~ — done 29 Sep 2026
4. ~~Build first screens: sign in, hub, guest list, timeline, RSVP~~ — done 30 Sep 2026;
   realigned to the five-tab plan the same day
5. ~~Finish the plan's MVP screens~~ — done 30 Sep 2026. Now working through
   the plan's "Next" column: ~~area pages (5–7)~~, ~~Money (22–24)~~, ~~agenda and
   appointments (16, 17, 21)~~; ~~bridal party (11)~~, ~~invitations (15)~~, ~~quick capture and inbox
   (35, 36)~~ ~~settings (37)~~, ~~Inspo (29–33)~~ (pictures go through
   Inspo, which the inbox shows). **The plan's "Next"
   column is done** (30 Sep 2026) apart from capture images; next come the
   "Later" screens (The Day, Inspo, Brainstorm chat) — or the design pass. Suggested starter
   tasks (19) exist as the starter list.
6. Replace the hand-written types with `npm run db:types`

### Design work so far (links)

All private to the owner; open with the Artifact tool's `read` action.

- **Design canvas** — every home-screen round, 1 to 10:
  https://claude.ai/artifact/2dHwsq5ix7zUYZcRCMKZAw
- **Glass Lab** — glass settings; the owner's saves are in its `glass`
  collection: https://claude.ai/artifact/54QebGu6KFctdKXkD3rxbq
- **Taste Lab** — this-or-that picks (`results`, `saved` collections):
  https://claude.ai/artifact/XtPaK5WanEmYt9wDhEspyz

Where it landed is in `docs/DESIGN.md`. The owner asked to stop refining the
home screen for now. The palette and fonts are now in `tailwind.config.ts`;
the next step is building screens.

**Function first, design later (30 Sep 2026).** The owner chose to get every
screen working, then do one design pass across the whole app. "Stripping back"
means *styling detail*, not structure: the home screen keeps its cover, glass
hub ring, "coming up" list and menu bar. Keep new screens simple in style.
Every screen is phone-first and responsive: other screens sit in the `.page`
frame (`globals.css`), safe areas (notch, home bar) are respected, and no text
is under 12px. Check changes at 320px, 393px (iPhone 15) and desktop widths.

**Phone and desktop are designed separately (30 Sep 2026).** Below 1024px:
floating glass menu bar at the bottom (main tabs only, hidden on forms). From 1024px (`lg`): `AppShell` puts a
sidebar on the left instead, and the home screen puts the cover as a rounded
panel with "coming up" in a column beside it. Both menus read `src/lib/nav.ts`.
The cover is now a champagne-to-ivory gradient (no sample photo) and the ring's
icons are white.

**Speed (30 Sep 2026).** Taps felt ~1s slow. Signed-in screens now live in
the `src/app/(app)/` route group (the brackets don't change any web address):
its `layout.tsx` draws the sidebar/menu bar once and keeps it while moving
between screens, and its `loading.tsx` shows a placeholder the instant a
screen is tapped. The middleware and home page check the session with
`getClaims()` (checked on Vercel, no trip to Supabase) instead of `getUser()`,
and `getCurrentWedding()` is cached per request. Vercel's servers run in Dublin
(`dub1`, set in `vercel.json`) to sit next to Supabase, which is in Ireland
(`eu-west-1`). If either moves, move the other.

### Design decisions still open

Raised with the owner and deliberately deferred to the screen that needs them —
each is an added column, not a rebuild:

- **Meal choices** are free text; there's no list of set-menu options to pick from
- **No RSVP deadline** field, so nothing can show who's overdue
- **No budget** beyond per-supplier cost; a real budget view needs a new table
- **Milestones assign only to people with a login**, not to any contact
- **Children are a yes/no flag**, with no age tiers for catering
