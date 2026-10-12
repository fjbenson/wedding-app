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
- **Hub** (`/`): names, hub ring, then under the ring (canvas 2, "Home ·
  Under the ring", option B, owner's pick 11 Oct 2026): **Your notes** — a
  jot box (with Link / Photo) that saves straight to the inbox, and the first
  three notes still to sort, each with "File it" (`home-notes.tsx`,
  `jot-form.tsx`) — then **coming up**: the next three to-dos, appointments
  and payments (`this-month.tsx`), then Inspo. All on glass cards (design
  settled 7 Oct 2026, round 15 — see `docs/DESIGN.md`). The ring's dots are the
  wedding's own **areas** (`areas` table, `0003_areas.sql`). Each dot opens
  its **area page** (`/area/[key]`, screens 5–6): key facts
  (`areas.details`, `0005_area_details.sql`), cost, to-dos and suppliers
  tagged with that area, and "take off the hub" / "not planning this". The
  ring's + opens `/area/new` (screen 7): add your own, or bring one back.
  **Area page design settled 7 Oct 2026** (canvas "Area page · Round 4 ·
  One template"): one template, same pieces in the same order for every
  area. A photo-collage cover from the area's Inspo folder (soft-colour
  tiles and a camera until photos exist; tapping it opens the folder, and
  `/inspo/[id]` steps through with ‹ ›; "⋯" holds take-off-hub / stop
  planning). Then the **five stages** — Dream · Compare · Book · Pay ·
  Ready (`src/lib/area-stage.ts`): the first four tick themselves from
  what's recorded, Ready is a button; "we're doing this ourselves"
  (`areas.diy`) skips Compare and Book. Then tiles (booked supplier with
  phone/email pop-ups to call or copy · to pay or budget · next
  appointment) and five sections: Suppliers (quotes until one's booked,
  then the rest fold away), Appointments, To-dos, Payment schedule, Notes
  (key facts via `?edit=facts`, plus captures; "- " lines become bullets,
  `rich-text.tsx`). Supplier labels: Asked · Quote in · Booked · Not taken
  (`0012_area_stages.sql` adds `quoted`, `areas.diy`, `areas.ready`).
  Notes can be added, edited and removed in place on the area page.
  Suppliers file under the wedding's areas too (plus "Other").
- **People** (`/people`): two tabs, **Guests · Suppliers** — a small
  rounded switch in the top-right corner above the title ("The guest list"
  / "Suppliers"); no PEOPLE label (canvas "Guest list · Round 13", C with
  a corner switch, 9 Oct 2026). A **gold line drawing of a quill on a
  scroll** sits at the end of the title row (`public/illustrations/
  quill-and-scroll.png`, made with Canva's image tool and cut out to the
  app's gold; canvas 2 "Guest list · Title drawing 2", option E, 11 Oct
  2026; hidden below 370px wide). **Every tab's title now has one**
  (canvas 2 "Tab titles · The set", 11 Oct 2026), through one shared
  piece, `src/components/page-title.tsx` (`<PageTitle drawing=…>`):
  Guests quill and scroll · Suppliers cards tied with a bow · Plan diary
  with a ribbon bookmark · Money coin purse (Budget and Payments) · The
  Day pocket watch (run sheet, Seating, Transport). The Hub has none — the
  ring is its picture. Sharp vector versions are a to-do. **Guest list
  design settled 8 Oct 2026** (canvas "Guest list · Round 2"):
  `guest-browser.tsx`. **Reworked 9 Oct 2026** (canvas "Guest list ·
  Rounds 3–7"): no event switch any more. The card is a big dark **All**
  with the breakdown beside it (Coming · Invited · Can't come, each with
  an arrow; To invite guests count only in All) — every one is a button
  that shows just those people. **The card counts whatever the filters
  leave**, by each guest's answer for their own event. Then search with a
  **Filter** button that drops down a small menu (Day guests · Evening
  guests, then Bridal party · Dietary needs · Children · No address yet,
  any mix); with filters on, the button goes dark with a count and each
  filter shows as a pill to take off (on their own line). The line just
  above the list has "+ Add a guest" on the left and the order ("BY FIRST
  NAME ⌄") on the right — tapping that is **Sort**: first name, surname,
  household, or day guests then evening (9 Oct 2026; no separate sort
  button by the search); "Rename the
  day / evening" and "Add an event" sit at the foot of the list.
  **Rows (rounds 8–12):** initials, the name with "day" or "evening"
  after it in gold italic (a guest's *type* is the first event they're
  invited to — events come in date order — so no new column), a **gold
  star badge on the initials** for anyone with a role (canvas Round 15,
  option 1 — no role pill under the name any more; the role itself is on
  the card and in Filter › Bridal party; the laptop table keeps its Role
  column), and their answer as **one small
  round icon** on the right (canvas Round 14, option A: ✓ on ink coming,
  envelope on champagne invited, dashed envelope to invite, ✕ on grey
  can't come, dashed ? not yet day or evening — `AnswerIcon`), with a key
  under the list. The laptop table shows the icon with its word. No
  household, diet or "child" under the name any more — those are on the
  card, in Filter, and in Sort › Household. Sun/moon icons were tried and
  dropped (looked like light/dark mode); words for now. A letter index
  runs down the side when sorted by first name or surname. The laptop
  table matches: name with day/evening, Role, one RSVP column, then
  meal and diet for their own event, phone, email. Each row: initials,
  name, role pills, a dot per event (filled coming, dashed waiting, grey
  can't come), an arrow. Bridal party is a **filter**, grouped by role (the
  old tab is gone; `?tab=party` still opens on it). Laptops (`lg`) get a
  full table instead. Tapping anyone opens their **card**
  (`guest-card.tsx`: a sheet on phones, a right-hand panel on laptops) —
  text/call/email, then **Guest of** (Day / Evening) and one **RSVP** (To invite · Invited · Coming ·
  Can't come) as sliders, then **Role on
  the day** — their roles ticked, four common ones (Maid of honour,
  Bridesmaid, Best man, Groomsman), and "More" to open the rest plus "Your
  own" ("Less" folds it away) — then Details (Meal = the dish they picked;
  Allergies = what the kitchen must avoid) — no answer per event: `setGuestAnswerAction` sets all their
  RSVPs, `setGuestOfAction` moves them between day and evening keeping the
  answer. **Everything is edited on the card** (9 Oct 2026, no edit
  page): tap the name, household, phone, email, meal, dietary, notes or
  the child switch to change it in place (meal and diet live on their own
  event's RSVP); "Remove from the guest list" asks on the card. Saves go
  through `updateGuestAction` / `saveMealAction` and return an error
  message instead of redirecting. The old per-event RSVP page is gone. `/people/[id]` is
  now suppliers only — a guest's id there redirects to their card, and
  household/invitation links open the card. Adding a guest still uses the
  form (`/people/new`, `guest-form.tsx`), now laid out like the card: one
  **Full name** box (here and on the card; `splitName()` in
  `src/lib/names.ts` — last word is the surname, the rest the first name),
  Guest of slider, Role on the day (four common + More), then Details
  rows; household defaults to "Not in a household", "+ New household…"
  last (same order on the card). Search, filters and
  the open card are client state, not in the address; links can still use
  `?event=`, `?guest=`, `?view=households`. **What's remembered** (owner's
  call, 11 Oct 2026): the **sort** is a preference, kept on that phone until
  changed (localStorage); **search, filters, the numbers card and an open
  card** live in the address (`?q=`, `?f=`, `?show=`, `?of=`, `?guest=`),
  so Back from a household returns to them and tapping People starts fresh. **A guest can have several
  roles**: stored in the one `role_on_the_day` column joined with " · "
  (`rolesOf()` / `joinRoles()` in `src/lib/guest-roles.ts`), so no
  migration was needed; any role makes them `bridal_party`. RSVPs are
  recorded by the couple; guests answering via their own link is "guest
  access", still deliberately not built. **Suppliers** (`?tab=suppliers`,
  screens 12 and 13) — **rebuilt 12 Oct 2026** to canvas 2 "Suppliers ·
  Round 1", A + B (owner's pick), **shaped like the guest list**
  (`supplier-list.tsx`): a count card (All · Booked · Quote in · Asked,
  each shows just those), search and a **Filter** (always shown, the guest
  list's round button and "Show only" menu: any of the wedding's areas, then
  Still to pay · No phone or email · Not taken; pills to take off; `?f=`;
  Booked stays on the count card), "+ Add a supplier",
  then everyone **grouped by area** in the wedding's order (heading note
  "Booked" or "2 quotes · 1 asked"; within a group booked → quotes → asked →
  not taken). Rows: initials, business, contact person, quote, a stage icon
  (✓ ink booked · £ champagne quote in · dashed ? asked · ✕ grey not taken)
  and a key under the list. Tapping one opens the **supplier card**
  (`supplier-card.tsx`, a sheet / right panel like the guest card),
  **edited in place**: area link, business name (tap to rename), Call ·
  Email, **Where you're up to** slider, Money (Quote and Deposit paid tap
  to edit, the area's budget, this supplier's payments, "+ Add a payment"),
  Details (Area picker, Contact, Phone, Email, Contract link, Notes —
  `TextRow` and friends are now exported from `guest-card.tsx`), "Open the
  … page ›", Remove (asks first; their payments stay in Money). Saves go
  through `updateSupplierAction` (one field at a time, returns a message;
  `updateSupplierParts()` in `src/lib/db/suppliers.ts`). Search, card
  choice, filters and open card live in the address (`?q=`, `?show=`,
  `?f=`, `?supplier=`; old `?area=` links still work). **`/people/[id]` is now only a redirect** to the
  right card (guest or supplier); the area page's supplier links use it.
  Adding a supplier still uses the form (`/people/suppliers/new`). With
  nothing narrowing the list, **every area shows**, an empty one as a faded
  "Add a supplier" row (see Conventions, "An empty screen still shows its
  shape").
  **Two jobs, one record** (owner, 12 Oct 2026): the Suppliers list is the
  **address book** (everyone, every area, contact in two taps); the **area
  page** is where you **decide** (quotes, stages, payments). The **supplier
  card** is that supplier's own facts and opens **wherever you are**: on the
  area page its supplier rows, the "Supplier" tile and deposit rows open it
  in place (`SupplierCards` / `SupplierLink` in `supplier-cards.tsx`, card in
  `?supplier=`). The card is contact-first: no payment list — one line ("2
  payments · next £250 Wed 14 Oct ›" to the area page's `#payments`, or "+
  Add a payment"). Area headings on the Suppliers list open the area page.
  **Website** (12 Oct 2026, `0015_supplier_website.sql` — the owner pastes
  it into Supabase): a field on the add form and the card, and a **Website**
  button beside Call · Email ("ellierose.co.uk" gets https:// added). Until
  0015 is run, saves quietly leave the website out (`missingWebsite()` retry
  in `supplier-actions.ts`); editing it on the card says to run 0015.
  Categories in `src/lib/areas.ts` use the plan's starter-area ids.
  **Invitations page removed** (9 Oct 2026, owner's call): sending
  invitations is done by post, so it's a **Stationery** area job (that
  area and its "Send the invitations" to-do already exist), not tracking
  in the guest list. `/invitations` redirects to `/people`. The
  `invitations` table stays — RSVPs still hang off a household's row.
  **Adding a guest** asks "Guest of": the day or the evening; a day guest
  is put on that event and every later one, an evening guest on the
  evening only (`saveGuestAction`).
  **Answer statuses** (9 Oct 2026): **To invite** (`to_invite`, new in
  `0013_to_invite.sql`) → **Invited** (`pending`) → **Coming** / **Can't
  come**. New guests start at To invite and are moved on from their card
  (the "We've sent them" strip was taken out, owner's call). Until
  0013 is run, new guests go straight to Invited (`inviteGuestsToEvent`
  retries on error 22P02). Guests from before "Guest of" show "Day or
  evening?" and their card asks which (`setGuestOfAction`).
  **Household page** (`/people/household/[id]`, screen 9; canvas
  "Household · Round 1", A plus contact buttons, 9 Oct 2026): back arrow,
  and phone / email buttons top right (they reach the household's people —
  straight through if one has a number, a pick-list if several, hidden if
  none); the name as the italic title with "3 people · 1 child · day
  guests"; an address card (Copy, tap to change in place via
  `saveAddressAction`); then "Who's in it" as the guest list's own rows
  (`GuestRow`), each opening the guest card right on this page. Tap the
  name to rename it in place (`renameHouseholdAction`). "Add someone to
  this household" asks first: **Someone new** (the guest form with it
  picked, coming back after) or **Already on the list** (search, tap to
  move them in, leaving any household they were in). "Remove this
  household" is the old edit page. The
  separate dietary box is gone.
- **Plan** (`/plan`): **two views, owner's call 11 Oct 2026** — a corner
  switch **Calendar | List** (`CornerSwitch`, shared with People), the
  title, then two big buttons side by side: **Add a to-do** · **Add an
  appointment**. **Calendar** (the default; canvas "Plan · Calendar · Round
  1", option A; `agenda.tsx` + `calendar.tsx`): ‹ month › (anything still
  open from earlier folds in above the current month), a Monday-first grid with a dot per thing
  on each day (to-do ring, appointment gold, payment pale gold, done grey),
  today softly circled, the wedding in a gold ring; tap a day for its card (below).
  The month in view and the tapped day live in the
  address (`?month=`, `?day=`), so Back from a to-do lands on the same
  month and tapping Plan starts on today. Undated things are in a "No date yet" fold at the
  foot (a banner above the grid was tried and taken out, owner, 11 Oct 2026);
  the List has them on their own card.
  **Calendar round 2, built** (canvas 2 "Plan · Calendar · Round 2 · The
  month underneath", option B, owner's pick 11 Oct 2026): under the grid,
  **everything in the month** as one list in date order — no day headings,
  each row carries its date (owner's change to the mock). Tapping a day
  opens a **day card** (`DayCard` in `calendar.tsx`; a sheet on phones,
  pull down to close, a right-hand panel on laptops, like the guest card —
  `usePullToClose` is now shared in `src/components/`) with that day's
  things and **Add on this day**: a to-do or an appointment with the date
  filled in (`/plan/new?date=`, `/plan/appointments/new?date=`). No day is
  picked on arrival; `?day=` keeps the card open across Back.
  **List** (`?view=list`, `todo-list.tsx`): **just the to-dos** — no
  appointments or payments, which live on the Calendar — as a **glass card
  per month** ("October *2026*", "This month · 2"): Overdue first, then
  each month, then No date yet (`#no-date`), done folded at the foot; tick
  off in place. **By area is now a filter** on the List ("All areas ▾",
  `area-filter.tsx`, `&area=<key>` or `none`), not a view. Old links
  (`?as=list`, `?view=area`, `?view=todos`) land on the List. The old
  timeline list ("the road to the day": a gold line with a dot per month)
  was retired from Plan — kept in mind for The Day's run sheet
  (`docs/DESIGN.md`). Ticking off (or marking paid) shows an **Undo** note
  for 5s (`undo-toast.tsx`, raised by `tick-form.tsx`, mounted once in the
  `(app)` layout). Rows: to-dos (plain circle), **nudges** (dashed gold
  circle, italic: "Start looking at photographers · START NOW"),
  **appointments** (`0007_appointments.sql`, screen 21,
  `/plan/appointments/…`; calendar on champagne) and payments due (£ on
  champagne, tap to mark paid). A **nudge** is a to-do with `remind_at` and
  no `due_date` (`src/lib/plan.ts`: `isNudge`, `planDate`) — the to-do
  form's "Done by / Start around" switch — so no migration; its date
  passing means "start now", never overdue. The starter list includes
  nudges. The to-do form offers the wedding's own areas.
- **Money** (`/money`, screens 22–24; `0006_money.sql`): **rebuilt 12 Oct
  2026** to canvas 2 "Money · Round 4" (owner's pick: B for the budget, C
  for the schedule). Money moves **Budget → Agreed → Paid**, and the rest
  has a schedule. A corner switch **By area | By month** (`money-view.tsx`;
  `?view=month`, old `?tab=payments` links still land there). No sentences,
  figures and bars. **By area** (default, "The budget"): the whole wedding
  as three thin labelled bars (Budget, Agreed, Paid — `ThreeBars`), the next
  payment due, then each area with its own three bars and a short tag: "▲
  Over by £…" (agreed bar runs past the budget in rose stripes — never colour
  alone), "✓ All paid", "Not booked yet"; areas with nothing show "Nothing
  yet". **By month** ("Payments"): Paid so far · Still to pay (agreed −
  paid), Add a payment, a **column per month** from now to the wedding
  (first column = paid so far, dark; due months light; overdue counts in
  this month; scrolls sideways if long), then "Not scheduled yet" balances,
  the payments grouped by month with totals (tick £ to mark paid), No date
  yet, and Paid folded at the foot. "Agreed" is the UI word for what
  `src/lib/budget.ts` calls committed (committed = booked suppliers' quotes
  + payments not for a supplier; paid = supplier deposits + payments marked
  paid; area pages use it too). A laptop table view is for the laptop
  design pass, not a switch here (owner agreed).
- **Quick capture and inbox** (screens 35–36, `0008_notes.sql`): jot a
  thought and/or a link from anywhere — a glass pen button above the phone
  menu bar (not on the Hub, which has its own jot box), a button in the
  desktop sidebar, the Hub's "Your notes" card — at
  `/capture?from=…`. Every note lives on `/inbox` (unfiled count in the
  sidebar), titled **Your notes** and shown as a **wall of paper notes**
  (canvas 2, "Inbox · Sticky-note wall", option A, owner's pick 11 Oct
  2026; `note-wall.tsx`): two columns on a phone, three on a laptop, soft
  papers (ivory, champagne, blush, sage), a slight tilt and a strip of tape. Until there are four, faded blank notes
  fill the gaps ("+ A thought for later … Tap to jot", never saved; they open
  capture).
  Tap one and a panel comes up — File under an area, Make it a to-do, Edit,
  Remove (actions that return a message, `capture/actions.ts`). The Hub's
  "File it" opens that note's panel (`/inbox?note=<id>`). **Filing only tags
  a note** (owner, 11 Oct 2026): it stays on the wall with a gold area tag
  and shows in that area's Notes block too; its panel says "Filed under" and
  can change it or set it back to Not filed. No "Filed lately" list any more.
  **Make it a to-do** asks when (Done by · Start around · No date), keeps the
  note with a dark "To-do" tag (`notes.milestone_id`, `0014_note_todo.sql`;
  until that's run the note stays without the tag — never removed) whose panel row opens the
  to-do, and shows "Added to your plan · See it". A note still **to sort**
  = no area and not a to-do (`toSort()` in `src/lib/notes.ts`) — the Hub
  card, sidebar count and wall count use that. Images aren't in yet:
  they need Supabase Storage (a bucket plus storage policies).
- **Settings** (`/settings`, screen 37; a gear on the hub cover, and the
  foot of the desktop sidebar): the couple's names and date; every area
  with the plan's two switches (Planning / On the hub — turning planning
  off also hides the dot), rename, and up/down order; and who has a login,
  and "Your login" (who's signed in, Sign out).
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
- **The Day** (`/day`, screens 25, 27, 28; `0009_the_day.sql`): the view
  switch is a `CornerSwitch` (Run sheet · Seating · Transport). **Run
  sheet** = canvas 2 "The Day · Signature look", **option D** (owner's
  pick 11 Oct 2026): the order of service's white card with a gold border,
  the couple and the date at the top, the day in parts — split by the clock
  for now (morning < 12:00, afternoon < 18:00, evening), since nothing marks
  which moment is the ceremony; own part names would be a new column — and
  inside, the time on the left (`formatClock`, 24-hour), a gold thread with
  a dot per moment, the moment on the right. On the wedding day (UK time,
  `nowInLondon()`) the moment under way is marked **Now**. Print button kept
  (menus hide when printing); option B, the centred order of service, is
  earmarked for the printed copy and for guests later.
  **Seating** (`?tab=seating`: tables with seat counts, sit guests from an
  unseated list, "over" flagged; guests who declined everything are left
  out) and **Transport** (`?tab=transport`: each car/coach run and who's in
  it). Seats and passengers can only point at guests, tables and runs of
  the same wedding (composite foreign keys on `(id, wedding_id)`). The
  agenda's wedding-day line links here. Seating opens on the **floor plan**
  (screen 26, `floor-plan.tsx`, `0011_floor_plan.sql`): drag tables about a
  room (positions are % of the room, so it scales; never-moved tables sit in
  a grid), round or long, and seat people by tapping a name then a table.
  On a phone the room scrolls sideways rather than shrinking. The old cards
  are the **List** view (`?view=list`), where tables are renamed or removed.

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

**Start and end of a chat (11 Oct 2026).** Every cloud chat runs
`.claude/hooks/session-start.sh` first: it brings the copy up to date with
`main` (a chat can start from an old side branch — one did, 10 days behind),
installs packages, and has Claude open with a short catch-up
(`.claude/catch-up.md`). At the end the owner types **`/banana`** (or
`/wrapup`, the same thing): save, push, update these notes, report back.

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
plus `0002_create_wedding.sql` to `0015_supplier_website.sql`. **New migrations are run
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

## Sign-in (email first, 11 Oct 2026)

**Every wedding belongs to an email login from its first minute.** The front
door (`/sign-in`, "Welcome") is one box for the email, then a code from the
email (`src/components/email-code-form.tsx`, `src/app/sign-in/actions.ts`,
queries in `src/lib/db/auth.ts`). A new email gets an account
(`signInWithOtp`, `shouldCreateUser: true`) and goes on to setup; a known
one opens its wedding — nobody picks "log in" or "sign up". Codes, not
links: a link opens in Safari, not the home-screen app. You stay signed in on
a device until Sign out (Settings, and the foot of the Hub). The email box is
`type="text"` with the email keyboard, so iPhone text shortcuts work.

- **Emails go through Resend** (custom SMTP in Supabase: Authentication ›
  Emails › SMTP, host `smtp.resend.com`, port 465, user `resend`, password =
  the Resend key, which only the owner holds). Sender is Resend's test
  address `onboarding@resend.dev`, which **only delivers to the owner's own
  email** — nobody else (a partner, other couples) can sign in until the app
  has its **own web address** (domain), verified in Resend and set as the
  sender. Choosing the app's name/domain is the owner's open decision.
- Supabase templates **Magic Link**, **Confirm signup** and **Change Email
  Address** show `{{ .Token }}` (the code). Code length is Supabase's
  "Email OTP Length" (6 is the minimum).
- **The middleware** (`src/lib/supabase/middleware.ts`) sends anyone not
  signed in — anonymous sessions included — to `/sign-in`, and signed-in
  people away from it. Anonymous logins are no longer made; "Allow anonymous
  sign-ins" can be switched off in Supabase.
- **Why it changed (11 Oct 2026):** from 29 Sep visitors were signed in
  anonymously. One login failed to refresh, the middleware quietly made a new
  one, and the owner's wedding vanished from their phone (still in the
  database). It was relinked by hand in SQL (a `wedding_members` row), then
  every other test wedding and login was wiped, leaving one wedding and the
  owner's login. The 30 Sep rule "sign-in is the very last thing built" is
  retired — the owner chose to build it now.

**Home-screen app (7 Oct 2026).** `src/app/manifest.ts` and `appleWebApp` in
`layout.tsx` let it be added to a phone's home screen and open full screen.
On an iPhone the home-screen app keeps its own cookies, separate from the
browser, so it asks you to sign in once there too. Icons: the hub ring on
satin (`public/icon-*.png`, `src/app/icon.png`, `apple-icon.png`).

### Before real couples use it (owner's checklist, 11 Oct 2026)

Not legal advice — the UK list raised with the owner:
1. Own web address + Resend domain (so anyone can get a code).
2. Privacy policy and terms (couples enter their *guests'* details too).
3. Register with the ICO (data protection fee, about £50 a year).
4. Sign Supabase's and Vercel's data processing agreements (DPAs).
5. Allergies are health data (special category): keep them for catering only.
6. Let a couple export or delete their wedding.
7. Supabase paid plan (~$25/month): the free plan has no proper backups and
   pauses quiet projects.
8. Two-step login on the owner's Supabase, Vercel and GitHub accounts.

Data is in Supabase Postgres in Ireland, encrypted at rest and in transit;
access control is RLS. No column-level encryption is planned.

## Conventions

- **All database queries live in `src/lib/db/`.** Nothing else imports the
  Supabase client. This is what keeps a future backend split mechanical — don't
  scatter queries into components.
- **A screen's view lives in its web address; preferences in the browser**
  (owner's call, 11 Oct 2026, after a 30-minute timer was tried and
  dropped as non-standard). Things you're in the middle of — the calendar's
  month, search, filters, an open card — go in the address with
  `replaceQuery()` (`src/lib/url-state.ts`): it *replaces* the address, so
  Back goes to the previous screen and returning from an item restores the
  view; tapping the tab starts fresh. Choices you'd want every time (the
  guest list's sort) go in localStorage until changed.
  **The way back keeps the view too** (11 Oct 2026): `ViewMemory` (in the
  `(app)` layout) and `replaceQuery()` note each screen's last view for the
  visit (`src/lib/last-view.ts`), so a form's "‹ Plan" (`FormPage` →
  `BackLink`) returns to it. Plan's to-do and appointment forms also send a
  hidden `<ReturnTo>` so Save and Remove land there (`returnTo()` in
  `src/lib/return-to.ts`); other screens' saves can opt in the same way.
- **An empty screen still shows its shape** (owner, 12 Oct 2026: "it
  just doesn't show the structure of the page"). Never fill a screen with
  made-up data the couple has to delete; instead draw the real structure
  from what the wedding already has (its **areas**, the ring's dots) with
  faded **ghost rows** you tap to fill in — dashed circle with +, italic
  faded text, opening the add form already pointed at that area. Done on
  Suppliers (every area shows; an empty one says "To find" with an "Add a
  supplier" row, `/people/suppliers/new?category=…&from=suppliers`), and
  the notes wall's faded blank notes work the same way. Use it on any new
  screen, and fix older empty screens to match as they come up.
- **Dates are worded by the app, not the browser** (12 Oct 2026):
  `formatDayMonth`, `formatWeekdayDayMonth`, `formatMonthYear` and
  `formatLongDate` in `src/lib/dates.ts` spell month and day names out
  themselves. A phone and the server word them differently ("Wed, 14 Oct"
  vs "Wed 14 Oct", "Sep" vs "Sept"), which made cards drawn by both
  disagree. Don't use `toLocaleDateString` for anything a client component
  shows.
- **Server actions called from client code must not be able to throw into
  React** (9 Oct 2026): after a deploy, a page left open calls the old
  action, which no longer exists, and an uncaught error blanks the screen.
  Wrap such calls like `safely()` in `guest-card.tsx` and show a message.
  `src/app/(app)/error.tsx` is the safety net for anything else.
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
7. **Design pass, screen by screen** (agreed 7 Oct 2026, after the home
   screen was settled). Shared pieces first (page titles, cards, buttons,
   form fields), then in order: Plan, People, Money, The Day, area pages,
   inbox and capture, the forms. Each round: the owner looks on their phone
   and says what's off; big changes get options on the design canvas first,
   small ones are built and pushed straight away.
   **Done so far (7 Oct 2026):** the home screen; **area pages** (taken out
   of order — see "Current state"); the **guest list** (8 Oct, also out of
   order; People's other screens are still to do); a shared **type system** taken from the
   home screen (`docs/DESIGN.md`, "Type system" — use its classes on every
   screen); Fraunces now loads with its optical-size axis, as the canvas
   does; the Hub menu button is a **house** (owner's pick of twelve). **Plan**
   (10 Oct: calendar, list and By area). **Each tab gets its
   own signature picture** (owner's rule, 10 Oct — `docs/DESIGN.md`):
   Hub ring · People count card · Plan calendar · Money one big
   spent-vs-budget shape (built 12 Oct as three bars) · The Day hour-by-hour line. **Next
   up (12 Oct 2026): People's other screens** (suppliers, household, add a
   guest) — Plan, Money and The Day's run sheet are now settled.
   **Suppliers round 1 on canvas 2** (12 Oct 2026, page "Suppliers · Round
   1 · Like the guest list"): A the list mirroring the guest list (count
   card All · Booked · Quote in · Asked, search + Filter, grouped by area,
   rows with initials, quote and a status icon ✓ / £ / dashed ? / ✕, key
   underneath); B the supplier card (sheet like the guest card, edited in
   place: Call · Email · Website, status slider Asked · Quote in · Booked ·
   Not taken, Money: quote, deposit, area budget, payments; Details;
   "Open the Photos page ›") — would replace the supplier form page; C the
   alternative: a glass card per area still being decided with quotes side
   by side (under / ▲ over budget), then a plain Booked list. **Picked and
   built 12 Oct 2026: A + B** (see "Current state"). Next on People: the
   household page and the add-a-guest / add-a-supplier forms.
   **11 Oct 2026:** The Day's run sheet settled and built (option D, see
   "Current state"). **Money** is on canvas 2: round 1 ("Money · Signature
   look": A ledger, B menu card, C champagne glass — owner loved all three)
   and **round 2** ("Money · Round 2 · Simple first, detail on tap", the
   owner's rule: it's the screen with the most numbers, but not everyone
   likes numbers — a calm top layer, everything else one tap away): A the
   glass and one sentence + menu-card full numbers, B the sentence first +
   an area in full, C two glasses (booked, paid) + still to pay by month.
   The owner didn't love any (B closest; the glasses "a little too silly").
   **Round 3** ("Money · Round 3 · Calm, built on B", 11 Oct 2026): 1 B
   quieter (sentence, one thin line, plain rows with hairline bars), 2 one
   big number ("£6,750 left to spend", sentence under it), 3 three plain
   figures (Budget · Booked · Paid) then each area with a word ("On
   track", "Nearly full"…). Owner, 12 Oct: rethink from what a couple
   needs — money moves **Budget → Agreed → Paid**, plus a **schedule**
   (when the rest is due); bars work, **no wordy sentences**. **Round 4**
   ("Money · Round 4 · Budget, agreed, paid — and when"): A one bar per
   area (budget = the track, agreed light gold, paid dark gold inside it;
   over budget runs past a black tick in hatched rose + "▲ Over by £400"),
   B three thin bars per area (budget, agreed, paid), C the Payments tab: a
   column per month to the wedding (paid dark, due light) then what's due
   grouped by month. Overspend never by colour alone (validator: rose vs
   dark gold too close for colour-blind eyes). **Picked and built 12 Oct
   2026: B + C** as By area | By month (see "Current state"). **Laptop design has begun:** phone and
   laptop are designed separately but share colours, type and each tab's
   signature (owner, 11 Oct 2026). Canvas 2 "Laptop · The Hub": A centre
   stage, **B magazine spread** (top menu bar, huge names, an "At a glance"
   row of every tab's signature in miniature — the owner's favourite, not
   locked; would mean a top bar on every laptop screen), C planning desk.
   **Later (owner's to-do, 11 Oct 2026): vector versions of the title
   drawings** — get the full-size original from Canva (the app has a
   ~200px preview, enlarged), trace it into a vector (SVG) in the app's
   gold, swap it in, and keep the set in Figma.
   **Idea agreed (11 Oct 2026): a dancing couple on the home screen** —
   our own couple (not anyone's characters), faint gold line art either
   side of the hub ring, hands joined above it, showing softly through
   the glass; later a gentle draw-itself-in then sway, off for "reduce
   motion" (needs the vector version). **The couple choose the two
   dancers** — each picked separately by what they wear (suit, dress,
   trouser suit, jumpsuit…), never by gender labels, so same-sex, mixed
   and non-binary couples all see themselves; chosen in Setup and
   Settings (a new column on `weddings`). Mocked on canvas 2 ("Home ·
   Dancing couple": suit and dress, two dresses, two suits) at **50%
   strength**. **Animation: properly or not at all** (owner, 11 Oct
   2026) — a whole-picture sway was tried and rejected. The couple stay
   still until they can draw themselves in line by line (needs the vector
   version) or truly dance (an animator, in Rive). Open idea: a new home-screen app icon (offered options on
   the canvas, not started).
8. **Brainstorm assistant** (agreed 7 Oct 2026, after the design pass) — a
   chat screen that takes actions: "add Ellen Daniels to the guest list",
   asking for missing details one at a time. Decided so far:
   - It calls the same server actions / `src/lib/db/` queries as the forms,
     with the user's session, so RLS still guards it.
   - It **confirms before writing** (a card with Yes / Change) and never
     deletes on its own.
   - First version: add a guest, add a to-do, record a payment, answer RSVP
     questions ("who hasn't replied?"), file a note. More actions later.
   - Runs in a Vercel function with streaming; Anthropic SDK, Claude Opus
     5.5. Needs an `ANTHROPIC_API_KEY` in Vercel (owner to set up).
   - Costs a few pence per conversation; a per-wedding monthly cap is needed
     before other couples use it.
   - **Where it lives (owner's idea, 11 Oct 2026):** maybe on the home
     screen, near the "Your notes" card under the ring. Not decided.

### Open issues

- **Phone menu bar drift while scrolling** (reported 11 Oct 2026):
  **closed** — the owner says it no longer happens. No code change was
  made for it (none found in the history), so if it comes back: likely an
  iPhone repaint lag behind the glass blur; try giving the bar its own
  layer (`transform: translateZ(0)` / `will-change`) in `menu-bar.tsx`.

### Small fixes, 11–12 Oct 2026 (kept for reference)

- **Date boxes:** iPhone Safari gave them their own minimum width so they
  poked out of cards — fixed for every date box in `globals.css`. Empty
  ones say "Pick a date" (`DateInput` in `form-bits.tsx`), every one has a
  small calendar icon, and the to-do date box has its own title that
  follows the switch ("The date it's due" / "Roughly when to start",
  `WHEN_TITLE` in `src/lib/plan.ts`).
- **Tapping a row:** the iPhone's grey tap box is switched off app-wide;
  rows you open shade **edge to edge** while pressed (`.row-press` in
  `globals.css`; inside a card set `[--row-bleed:<card padding>]` and
  `overflow-hidden`). Hover looks only show on devices with a mouse
  (`hoverOnlyWhenSupported`), so nothing stays stuck after a tap.
- **App Store question** (owner asked, 11 Oct): staying a web app is right
  for now; if it goes to the App Store, wrap it with Capacitor and add
  phone-only extras (lock-screen reminders, camera) so Apple accepts it.
  React Native would only be worth it much later.

### Backlog (ideas parked by the owner)

- **"Start this month" on the Plan calendar** (parked 11 Oct 2026): a box
  above the grid listing that month's "start around" nudges, to help
  couples along. The owner likes the idea but not yet the look; it was
  taken out. Nudges still show on the List's month cards.
- **Show the work: portfolio and case study** (parked 12 Oct 2026). The
  dream is the App Store with a subscription; meanwhile the owner wants the
  app to open UX/UI opportunities. Agreed it's a good bet, not a
  guarantee. The plan when picked up:
  - **A case study is worth more than the app link**: the problem, rounds
    on the canvases (e.g. Money rounds 1–4), what was picked and why, the
    owner's rules ("simple first, detail on tap", overspend never by colour
    alone, dancers chosen by clothes not gender).
  - **Where:** own portfolio site (ideally on the app's own web address),
    LinkedIn posts as it goes (where chances usually come from), Behance /
    Dribbble for polished screens.
  - **Demo mode needed first:** a "look around" button into a made-up
    wedding with fake guests, since only the owner can sign in, and real
    guest details must never be public (fake names in screenshots too).
  - **Test with 3–5 real couples** and write it up. The biggest gap a UX
    reviewer will spot is that the only user so far is the owner.
  - Say openly it was designed by the owner and built with AI; that's a
    strength if the decisions can be explained.

### Design work so far (links)

All private to the owner; open with the Artifact tool's `read` action.

- **Design canvas 2** — **use this one for new work** (from 11 Oct 2026;
  the first canvas reached its 40-page limit): starts with the guest
  list's title drawings: https://claude.ai/artifact/K49dGyMgVvGpiSGNHx1aRB
- **Design canvas (the first, full)** — every home-screen round, the area
  page, Hub icons, guest list rounds 1–15, household, Plan rounds 1–4 and
  the calendar: https://claude.ai/artifact/2dHwsq5ix7zUYZcRCMKZAw
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

**Phone first (owner, 11 Oct 2026):** the design work so far is for the
phone app; laptop/desktop ("web") design has barely started and comes later.

**Phone and desktop are designed separately (30 Sep 2026).** Below 1024px:
floating glass menu bar at the bottom (every screen except forms —
`showsMenuBar()` in `src/lib/nav.ts`; add new non-form screens there). From 1024px (`lg`): `AppShell` puts a
sidebar on the left instead, and the home screen puts the ring on the left
with "coming up" in a column beside it. Both menus read `src/lib/nav.ts`.
The home screen no longer has a coloured cover: the ring sits on the ivory
page (round 15, 7 Oct 2026).

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
