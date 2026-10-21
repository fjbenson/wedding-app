# Wedding App — context for Claude

> **Rule one, above everything else (owner, 13 Oct 2026): protecting the
> couples' and their guests' data comes first, every time, without fail.**
> Before building anything, ask what it does with people's details: who can
> see them, where they're sent, how long they're kept. If a feature and the
> data's safety pull in different directions, the data wins — raise it with
> the owner rather than choosing quietly.

A wedding planning app (working name **Rondé**), built to serve other couples,
not just one. The owner is new to development — explain things plainly, avoid
jargon where a normal word will do, and keep answers short unless asked to go
deeper. Phone first; laptop designed separately, sharing colours and type.

## Where things are written down

| File | What's in it |
|---|---|
| `CLAUDE.md` (this) | How we work, and how the app is **now** |
| `docs/backlog.md` | Parked ideas, open decisions, checks waiting on the owner |
| `docs/history.md` | Archive of the old notes (to 20 Oct 2026): every round, pick and U-turn. Out of date in places — don't add to it |
| `docs/DESIGN.md` | The look: palette, type system, glass, the Hub |
| `docs/information-architecture.md` | The agreed map: five tabs, 38 screens (20 Sep 2026) |
| `docs/ERD.md` | The data model explained |

**The app's map** (artifact, rebuilt 19 Oct 2026):
https://claude.ai/artifact/GfcFVHZX4vuf1Ykzdk1i5B. **Anything new goes on the
map before it's built**; if it fits no tab or the area page, stop and decide
with the owner. No new tabs without the owner.

**Keep this file short.** Record what's true now, with the date of a decision
and the owner's reason in a few words. Don't log every round here: when a
thing changes, replace its line. Parked ideas go in `docs/backlog.md`.

**Notion** (https://app.notion.com/p/WEDDING-APP-3e13db5a9d15818891a3e37ab0800186)
holds the owner's hand-kept notes and the BLAST framework (Blueprint · Link ·
Architect · Style · Trigger; B, L and A are done, S and T in progress). It
lags behind: trust this repo over it, and offer to update it — never unasked.

## What Claude decides alone (owner, 15 Oct 2026)

Rule one still comes first.

- **Just do it, tell the owner after:** bringing older screens into line with
  settled patterns and `docs/DESIGN.md`; small odd-ones-out; fixes, tidying,
  speed.
- **Build it, then the owner checks on their phone:** new pieces that follow
  a pattern that already exists.
- **Always the owner's call:** anything about people's data (who sees it,
  where it goes, how long it's kept); **any database change**; anything that
  costs money; new tabs or big changes to how the app is organised; the Hub's
  look, the brand and the name; choosing between design options (mock them on
  canvas 4 first).

## How we work (owner, 20 Oct 2026, from reading three chats)

- **Short replies:** about 100 words, plain words; more only when asked.
- **Mock up first, without being asked,** for anything new or any layout
  change (canvas 4, options to pick from). Fixes and small tweaks go straight in.
- **Sleep on database changes.** Write the migration and explain it, but run
  it only once the owner has seen the design working, or in a later chat —
  not minutes after picking a mock-up (four bits went unused in two days:
  lists, music_played, run_sheet_groups, the typed dish).
- **One topic per chat.** A new idea mid-chat goes in `docs/backlog.md`; suggest
  a fresh chat for it rather than building it there.
- **Screen changes: typecheck, build, push, and the owner looks on their
  phone** (owner, 21 Oct 2026: starting the private copy takes minutes; their
  phone takes 30 seconds). `/check` (`.claude/skills/check/SKILL.md`) only
  when the owner asks. **`/status`** gives the owner five lines on where
  things stand — use it when they ask what's next.

## Shipping

- **No pull requests** (owner, 29 Sep 2026): push straight to `main` with
  `git push origin HEAD:main` (allowed in `.claude/settings.json`), and to
  the chat's own branch. Before every push, `npm run typecheck` and
  `npm run build` must pass. Gather small changes into one push.
- **Vercel** builds `main` about a minute later; a failed build leaves the
  last good version live. Live at https://wedding-app-tau-dusky.vercel.app.
  Since the move to Pro (12 Oct 2026) Vercel no longer reports back to
  GitHub, so **ask the owner to check on their phone** (or vercel.com ›
  Deployments) before saying a change is live. `claude/…` branches don't
  build on Vercel (`vercel.json`).
- **Start of a chat:** `.claude/hooks/session-start.sh` brings the copy up to
  date with `main`, installs packages and points at `.claude/catch-up.md`.
  **End:** the owner types `/banana` (or `/wrapup`): save, push, update these
  notes, report back.
- Tell the owner in plain words what changed once it's pushed.

## Architecture (decided, don't relitigate)

| Piece | Role |
|---|---|
| Next.js 15 | Screens and server logic in one codebase |
| Vercel | Hosts it (Pro plan, Fluid compute, Dublin `dub1`) |
| Supabase | Postgres, Auth, Storage (Ireland, `eu-west-1`) |
| Anthropic API | Juno, the assistant (`claude-opus-5-5`) |
| Resend | Sign-in code emails (custom SMTP in Supabase) |

There is deliberately **no separate backend**. The one real future gap is
scheduled/background work (reminders, long assistant runs): add a worker
(likely Railway) as a third piece, without restructuring the others. Vercel
and Supabase sit in the same region; if one moves, move the other.

## Data and the database

- Schema in `supabase/migrations/0001_init.sql` … `0035_run_sheets.sql`,
  **all run** on the live project (**wedding-app**, `hfyuvtrglkdpqvtkzohb`).
- The Supabase connector is set up, so Claude can run migrations — but
  **always says in plain words what a change does and waits for the owner's
  OK**, and **never deletes data** unless the owner asks for exactly that.
  Read-only queries need no OK.
- **`weddings` is the tenant**; everything carries `wedding_id`. Access is via
  `wedding_members` (its `role` enum already has `guest`, so guest access is
  new rows and policies, never a rebuild). **Row-level security is the real
  access control** (`is_wedding_member()`, `is_wedding_host()`); app checks are
  a convenience. Link tables are tied to `(id, wedding_id)` on both sides so
  nothing can point at another wedding's rows.
- Households are separate from contacts (invitations go to a household, RSVPs
  come from people). RSVPs are per person per event (day / evening).
  Suppliers extend contacts via `supplier_details`. Creating a wedding goes
  through the `create_wedding()` function.
- Several values are stored as text joined with " · " (a guest's roles,
  dietary needs) — no migration needed to add one.
- **`supabase/tests/rls_isolation.sql`** proves one couple can't read or write
  another's data; it passes with all 35 migrations. **Re-run it whenever RLS
  policies change and add every new table to it.** Postgres 16 is in the cloud
  container (`initdb` as the `postgres` user in a folder it owns; stub
  `auth.users` with `raw_user_meta_data jsonb`, `auth.uid()`, and `pgcrypto`).
- Types in `src/types/db.ts` are hand-written; replacing them with
  `npm run db:types` is still to do.

## Sign-in and the demo

- **Email first** (11 Oct 2026): one box for the email, then a 6-digit code
  (codes, not links — a link opens Safari, not the home-screen app). A new
  email gets an account and goes to `/setup`. The middleware sends anyone
  not signed in to `/sign-in`. Files: `src/components/email-code-form.tsx`,
  `src/app/sign-in/actions.ts`, `src/lib/db/auth.ts`.
- Emails send from Resend's test address, which **only reaches the owner's
  own email** — nobody else can sign in until the app has its own web address
  verified in Resend.
- Home-screen app: `src/app/manifest.ts`, `appleWebApp` in `layout.tsx`.
- **Demo wedding** "Olivia & Theo" (12 Jun 2027), on the owner's login beside
  their real one: ~79 guests, suppliers at every stage, money, plan, run
  sheet (and the Bridesmaids and Groomsmen sheets), menu, drinks, seating,
  travel, decor, stationery sendings, timeline. All made up
  (07700 900xxx phones, @example.com), safe to screenshot. Switch in Settings ›
  Your weddings (`wedding` cookie). Reset by re-running
  `supabase/seed/demo-wedding.sql` — ask the owner first; keep it in step when
  adding features.

## Before real couples use it (owner's checklist)

Not legal advice. **Only item 7's Vercel half is done.**

1. Own web address + Resend domain (so anyone can get a code) — blocks the rest.
2. Privacy policy and terms (couples enter their guests' details), including
   that Juno sends the details a question needs to Anthropic.
3. Register with the ICO (~£50 a year).
4. Sign Supabase's, Vercel's and Anthropic's data processing agreements.
5. Allergies are health data: keep them for catering only.
6. Let a couple export or delete their wedding.
7. Supabase paid plan (~$25/month; free has no proper backups and pauses).
   Vercel Pro: done 12 Oct 2026.
8. Two-step login on Supabase, Vercel, GitHub and the Claude Console.
9. Then test with 3–5 real couples.
10. **On the App Store** (owner, 20 Oct 2026: non-negotiable — it has to feel
    legit to strangers): wrap the app with Capacitor, Apple developer
    account (~£79 a year), Apple's review and payment rules checked first.
    After the test, before charging people who don't know the owner.

## Conventions

### Code

- **All database queries live in `src/lib/db/`.** Nothing else imports the
  Supabase client (the browser uploads, `inspo-upload.ts` and
  `files-upload.ts`, live there too).
- **A screen's view lives in its web address; preferences in the browser.**
  Search, filters, the month, an open card go in the address with
  `replaceQuery()` (`src/lib/url-state.ts`) — **use `{ sync: true }` when
  opening or closing a card**, or `useSearchParams()` never hears it. Choices
  you'd want every time (a list's View) go in localStorage. `ViewMemory` and
  `src/lib/last-view.ts` make a form's back link return to the same view.
- **Server actions called from client code must never throw into React**
  (an old page calling a removed action blanks the screen): wrap them like
  `safely()` in `guest-card.tsx` and return a message. `(app)/error.tsx` is
  the safety net.
- **Never import plain values from a `"use client"` file into a server one**
  — it passes typecheck and build and crashes live. Put shared values in a
  plain file.
- Jobs the forms and Juno share live in `src/lib/jobs.ts` (plain inputs,
  return `{ ok, … }`, find the wedding themselves).
- **Dates are worded by the app** (`src/lib/dates.ts`), never
  `toLocaleDateString`, so phone and server agree. **Times** (owner, 20 Oct
  2026): the run sheet and what's printed for suppliers (moments, the menu,
  drinks) use the 24-hour clock (`formatClock`, "13:30"); everything else —
  appointments, journeys, lists — reads "2pm" (`formatTime`).
- **Amounts get commas as you type**: `MoneyInput` / `withCommas()`.
- New non-form screens go in `showsMenuBar()` (`src/lib/nav.ts`).
- Match the surrounding code; comments say why, often with the owner's date.

### Design patterns (settled; follow them on anything new)

See `docs/DESIGN.md` for the look itself (ivory and champagne on lamp-lit
paper, Fraunces, light glass cards, the frosted hub ring).

- **Every tab has the same bones:** a one-row top (title left at 32px, the
  view switch `CornerSwitch` right; no back arrow, no title drawings), a
  numbers card where KPIs help (`NumbersCard`; not on the run sheet), a search
  with the **round black + (40px, `AddButton`)** at its end, then **View** on
  the left and **Filter** on the right.
- **Filter** is one list of rows that each open their values in place, with
  counts; on phones a sheet from the bottom with "Show N …"
  (`FilterMenu` with `expandable`). Picks combine. Every tab can be narrowed
  to an area, and the area page's links land on that.
- **Black (ink) is for the main action only.** Picked tiles are white glass
  or champagne, never black.
- **Look at something in a card; add something on a full screen** (16 Oct
  2026). Things open as a card over the page (`CardSheet`; `plan-cards.tsx`
  mounted once in the `(app)` layout, set by `CardLink`), edited in place:
  **taps save at once, typing gets a small Save**. Where a tab can add more
  than one kind of thing, the + opens a choice (`AddMenu`) first.
- **One row for to-dos, appointments and payments:** the date large on the
  left (`DateStamp`), title and one short grey line (`RowLine`: at most two
  facts — a status only if off or finished, then when, then who; the area
  only when there's no one), the mark on the right.
- **Text · Call · Email** are round buttons with their word under
  (`RoundActions`); a missing one is a faded dashed circle that goes to where
  it's typed in.
- **Forms:** the name large, picture tiles over drop-downs (`visual-form.tsx`),
  Save always in reach (`SubmitBar`) with Cancel on its left; when editing,
  Save only rises once something changed, and neither leaves the form. A saved
  item shows a tile choice as a pill ("Change ⌄").
- **Every area picker ends with "Other"**, then "+ Add an area" (the ring's
  three steps, `AreaSteps`).
- **An empty screen still shows its shape:** faded ghost rows from the
  wedding's real areas, never made-up data.
- **Say less:** no explanatory sentences; an empty section is just its add.
- **Never colour alone** for meaning (overspend is rose stripes plus
  "▲ Over by £…").
- Phones: 16px side margin (`--gutter`), no text under 12px, inputs 16px+
  (no iPhone zoom), check at 320px, 393px and desktop. Laptops (from `lg`):
  the menu down the left like a magazine's contents (`side-bar.tsx`, 250px;
  canvas 4 "Laptop · Round 7", G, owner's pick 20 Oct 2026 — it replaced the
  top bar), pages beside it. **Cards sit beside the list** on a laptop
  (CardSheet's `beside`, `useBeside`; guest, household, group, supplier and
  plan cards): no dimming, the page steps aside 440px, another row swaps the
  card (canvas 4 "Laptop · Round 9", 1, 21 Oct 2026).

## The app today (21 Oct 2026)

Five tabs — **Hub · People · Plan · Money · The Day** — plus area pages,
Juno, Your notes, Inspo, Settings and Where things stand.

- **Hub** (`/`): the couple's names, the **hub ring** (its dots are the
  wedding's areas, its heart the days to go, opening **Where things stand**
  `/standing`; the + adds an area in three steps), **"Ask Juno"**, **This
  week** (due by Sunday plus overdue, ticked off in place), and tiles for
  Your notes and Inspo. On a laptop (canvas 4 "Laptop · Round 8", C, 21 Oct
  2026): a bigger ring (it grows with the screen) whose buttons sit on the edge of
  a faint circle, each with its name in small grey capitals and **five dots**
  filling gold as stages are done (Round 10, D3; `src/lib/hub-stages.ts`),
  and a column on the right filling the screen — **Needs a push** (the areas furthest behind, each
  with its next step) over This week; Your notes and Inspo are in the sidebar. The Hub's look is the owner's call.
- **Area pages** (`/area/[key]`, `area-view.tsx`; on a laptop a wide cover then
  two columns — a slim Next up row and the stages together in one big card left, Everything for / Only for / the
  foot right; canvas 4 "Laptop · Round 9", 2): a photo cover with the
  page's one + (`AddMenu`), a **Next up** card, the **five stages as a row of
  circles on a gold line, the open one's contents below** (`stage-tabs.tsx`;
  canvas 4 "Area page · Round 1" C2, 21 Oct 2026) — Ideas · Quote · Book · Pay · Ready (`src/lib/area-stage.ts`;
  each can step back). **Ideas are notes or inspo** (21 Oct 2026, canvas 4
  "Area page · Round 2", A): one card with the pictures, the area's notes as
  rows (a note icon, the first line, "Note · date"; tap to edit, no Edit
  button; 21 Oct 2026, Round 2's A) and "+ Add an
  idea" (A note · Inspo, both full screens; a note's is `/area/[key]/note`,
  Bullet and Tick-box on top) at the foot, counted as "N ideas"; key facts
  became notes (`areas.details` kept, unshown); "Save an idea" is now "Add
  inspo". Pay starts "Paid £X of £Y" with a bar. On the laptop Hub's ring, hovering a
  button says what's done: Not started · Ideas · Quoted · Booked · Paid · Ready.
  Then **"Everything for [area]"** in the tabs' order (suppliers, guests,
  plan, money, the day), then **"Only for [area]"** (Food & drink's menu and
  drinks), then a foot like the Hub: **Notes** and **Inspo** tiles (both open
  the Ideas stage; Decor and Stationery, with no stages, keep a notes fold
  there) and the timeline folded to one line (canvas 4 "Area page · Round 4",
  A, 21 Oct 2026). Special areas swap
  the stages for their own part: **Food & drink** (who you're feeding,
  with every dietary need listed there, what it comes to at the caterer's prices, the menu `/menu`,
  Drinks `/drinks`, food through the day), **Stationery** (What you send:
  Save the date · Invitation · Thank-you, with Send and "Did it go?"),
  **Decor** (items by where they go; `/day/decor` is the pack list),
  **Music** (moments with songs; send a moment to whoever's in charge).
- **People** (`/people`), **Guests | Suppliers**. The guest list
  (`guest-browser.tsx`): numbers card (Guests · Coming · Invited · To invite),
  search +, View (order, group by household / group / event / RSVP / table /
  staying / meal / sent…) and Filter; rows with initials, role star and an
  answer icon (on a laptop: one card with the total big and Coming · Yet to respond ·
  To invite beside it (they add up to it), each with its answer icon, and
  Can't come set apart; then columns — an answer pill per event, the same
  icons, meal, needs as tags, table — Round 9, 1b); can't-come folded at the foot. The **guest card** (`guest-card.tsx`)
  has a profile top (tap a figure to jump to it), Text · Call · Email, Guest of
  and RSVP sliders, roles, details (meal and drinks tiles, dietary picker,
  table), groups, travel, in the plan, timeline. A guest's meal is only the
  Adult / Child's / No meal tile (owner, 20 Oct 2026: the typed dish was
  dropped — one menu for everyone; old `rsvps.meal_choice` values stay in the
  database, unshown). Every guest count is **everyone still expected**
  (can't-comes left out), as the numbers card has it. **Households** open as an
  envelope card; **groups** as a card with Email them / Text (the couple's own
  app, everyone in Bcc). RSVP steps: To invite → Invited ("Yet to respond")
  → Coming / Can't come. **Suppliers** (`supplier-list.tsx`): a phone book
  grouped by area, the stage as a badge; the **supplier card** is a business
  card with Progress (In touch → Quote in → Booked → Paid; steps tick once reached, Paid from Money), Money, Documents (private
  `files` bucket), Contact, Decor from them, timeline.
- **Plan** (`/plan`), **Calendar | List**: to-dos and appointments only
  (payments live in Money). Calendar month on a glass card, a day card on
  tap, the month's list, Undated and Done folds. The List works like the guest
  list. Guests can be tagged "involved"; appointments can go to the phone's
  own calendar (.ics, Google, Outlook).
- **Money** (`/money`), **By area | By month**: Budget → Agreed → Paid. The
  top card leads with the budget until something's agreed. Area cards two to a
  row (owner, 21 Oct 2026; canvas 4 "Money · Rounds 2–3"): one figure (agreed,
  else the lowest quote, else the budget), a **Budgeted / Quoted / Booked
  pill**, and always a bar and a line under it (empty bar until booked; no
  "of budget" or over-budget on the card). Each opens its money from the
  bottom, headed by a **Next step** card (set a budget → add a quote →
  choose or book → mark paid / add the balance); quotes compared against the
  budget line; the month columns and payments by month; the budget page with
  "Share it out for us"; money towards it and bills family are paying.
- **The Day** (`/day`): the **run sheet** as an order of service, with three
  piece tiles — **Seating** (floor plan on a dot grid, round / long / top
  tables, a table close-up with saved chairs, dietary marks, seat a group or
  household, Send to the venue as a PDF), **Travel** (where everyone sleeps,
  journeys there and back) and **Decor** (pack list). **More than one run
  sheet** (20 Oct 2026, `run_sheets`, 0035): "The day" is the main one, others
  (Bridesmaids, Groomsmen, the photographer's list) are picked at the top
  (`sheet-picker.tsx`; on a laptop the pieces are slim pills by the title,
  the sheets' names run along the top and the sheet you're on sits in the
  middle with the ones either side tucked behind it and ‹ › to flip, going
  round — Round 9, 3b; Filter, Print and + sit by the sheet, no search there), made and edited on full screens (`/day/sheets/…`), and
  one tied to a group can be emailed to it. Each moment is on one sheet; Move
  to / Copy to on its card. Filter by area; Print. A moment's card: a cue card,
  then When · Where · In charge · Music · Notes · Area, food served there, and
  Send it.
- **History** (called the timeline in code; renamed on screen 21 Oct 2026,
  owner: Plan is what's to come, History what's happened) on every supplier, guest and household card (folded to one
  line), area page: only what's happened, newest first (a payment's "All payments to
  …" still shows what's due around a Today marker); calls,
  meetings, emails and notes are added on a full screen (`/history/new`; not `/timeline/…`, which an old redirect sends to Plan);
  stage changes and sendings are written by the app.
- **Juno** (the assistant; named 20 Oct 2026, owner): the Hub pill and the
  round pen beside the phone's menu bar (21 Oct 2026, canvas 4: it no longer
  floats over lists) open it. Typing searches the whole wedding at once with no AI
  (`searchWedding()`); Send asks Juno (`src/app/api/assistant/route.ts`,
  tools in `src/lib/assistant/tools.ts`, the general `look_up` in
  `src/lib/lookup-general.ts` — **what it can read is that file's list**).
  Answers are drawn by the app as blocks; adding a guest, to-do, payment or
  appointment runs as steps in the chat; every change is a confirm card, and it
  never deletes. It runs as the signed-in person, so RLS guards it. It **never
  sees** notes, files, Inspo, addresses or guests' phones and emails.
- **Your notes** (`/inbox`): a wall of paper notes with bullets and tick-boxes
  (`NoteEditor`); file under an area or make a to-do. **Inspo** (`/inspo`):
  pictures and links by area (private `inspo` bucket). **Settings**: names,
  date, areas (rename, order, switches), logins, Your weddings.

## Next up

From the audit of 20 Oct 2026 (agreed with the owner: notes tidied first):

1. **Polish over new features** for a week or two: the checks in
   `docs/backlog.md`, then the loose ends there.
2. **The launch checklist**, starting with the web address.
3. **3–5 real couples** trying it — so far the owner is the only user.
4. **Mock-up first** for anything bigger than a tweak (about 30 built things
   were taken back out in the first month).

When building resumes, the 20 Oct chat suggested: the Food & drink full-screen add and drink
guide; **invitations** — the address export, then guest links for RSVPs (the
owner sees invitations as a big pain point); weddings abroad.

## Design work (links)

All private to the owner; open with the Artifact tool's `read` action. New
rounds go on canvas 4.

- **Design canvas 4** (from 20 Oct 2026; new rounds go here): https://claude.ai/artifact/FbfEj4TubVHBT2YcVmPVNu
- **Design canvas 3** (full, 40 pages): https://claude.ai/artifact/TiZtToD5m6cEKxfu8PYbLL
- **Design canvas 2** (full): https://claude.ai/artifact/K49dGyMgVvGpiSGNHx1aRB
- **Design canvas 1** (full): https://claude.ai/artifact/2dHwsq5ix7zUYZcRCMKZAw
- **Glass Lab**: https://claude.ai/artifact/54QebGu6KFctdKXkD3rxbq
- **Taste Lab**: https://claude.ai/artifact/XtPaK5WanEmYt9wDhEspyz
- **Name Lab** (not played yet): https://claude.ai/artifact/DAfW9wxPmNQLQEtGhgqZPP
- **Icon audit**: https://claude.ai/artifact/SCHsvUpFJ6YdGBMb1EKqSY
