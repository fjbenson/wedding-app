# Wedding App — context for Claude

> **Rule one, above everything else (owner, 13 Oct 2026): protecting the
> couples' and their guests' data comes first, every time, without fail.**
> Before building anything, ask what it does with people's details: who can
> see them, where they're sent, how long they're kept. If a feature and the
> data's safety pull in different directions, the data wins — raise it with
> the owner rather than choosing quietly.

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
- **Hub** (`/`): names, hub ring (its heart — the days to go, "How it's
  going ›" — opens **Where things stand**, `/standing`, 13 Oct 2026; see
  Backlog), then under the ring (canvas 2, "Home ·
  Round 2 · Calm under the ring", option B, owner's pick 13 Oct 2026; was
  "Home · Under the ring" B): one quiet glass pill, the assistant's gold pen
  mark and **"Ask your assistant"** in italics (canvas 2 "Hub · How to reach
  the assistant", A, owner's pick 13 Oct 2026 — says assistant, never "AI";
  the Hub stays the most beautiful screen, so no line of examples under it),
  opening **Your assistant** full screen (`AssistantSheet`; "Your assistant ·
  Round 3 · Opening it", A's centred "What can I do for you?" and box with
  B's prompts grouped **Ask · Do · Jot** under it; a conversation once you
  ask) — then **This week** on one glass card
  (`this-week.tsx`; owner, 13 Oct 2026, replacing "Your top three": a week
  has an end you can reach): everything due by Sunday plus anything overdue,
  ticked off right there (to-dos done, payments paid, Undo note, the row
  slides away); appointments show but need no tick; undated to-dos never
  show; laid out by day (13 Oct 2026, owner: "shout about the days"): the card's header gives the week's dates ("12–18 Oct"), each day a big gold date with its weekday down the left (today in ink, "Today"), several things on one day share it, the tick at the row's right; overdue things come first, each with its date on the left in rose (month under it, not the weekday) and "Overdue · To pay" under the title (owner, 13 Oct 2026); up to five, then "And N more ›" and "The plan ›"; when it's clear, "✓
  *Nothing more this week.*" and "Next up: … ›",
  then **Your notes and Inspo as two tiles side by side** (canvas 2 "Home ·
  Round 3", option A, owner's pick 13 Oct 2026; `hub-tiles.tsx`): the
  latest note to sort on a taped scrap of paper ("3 to sort ›"), and the four
  latest pictures as a little collage ("24 ideas ›"); soft blank squares
  before there are pictures (`home-notes.tsx` is gone). All on glass cards (design
  settled 7 Oct 2026, round 15 — see `docs/DESIGN.md`). The ring's dots are the
  wedding's own **areas** (`areas` table, `0003_areas.sql`). Each dot opens
  its **area page** (`/area/[key]`, screens 5–6): key facts
  (`areas.details`, `0005_area_details.sql`), cost, to-dos and suppliers
  tagged with that area, and "take off the hub" / "not planning this". The
  ring's + opens `/area/new` (screen 7) — **three steps since 12 Oct 2026**
  (canvas 2 "Area · Add in three steps"; `area-steps.tsx`): 1 the name (tap
  a taken-off area to bring it back, or an idea), 2 **its icon**, already
  guessed from the name, with a search ("lights" finds the bulb) over a
  shortlist of Lucide icons with search words (`src/lib/area-icons.ts`; add
  a line there to offer another), 3 a budget or Skip; then its page. The
  icon's name is stored in `areas.icon` (`0016_area_icon.sql`; until it's
  run the icon is quietly left out — **run 12 Oct 2026**) and `areaIcon(key,
  icon)` draws it. The step marker is circles joined by a line that fills
  gold, ticks when done, "2 of 3" on the right (canvas 2 "Area · The step
  marker", B).
  **Changing it later**: the icon sits beside the name on the area page;
  tap it for a card with the same search (`IconPicker` in
  `src/components/icon-picker.tsx`, `area-icon.tsx`, `setAreaIconAction`),
  and a tap saves.
  **Area page design settled 7 Oct 2026** (canvas "Area page · Round 4 ·
  One template"): one template, same pieces in the same order for every
  area. A photo-collage cover from the area's Inspo folder (soft-colour
  tiles and a camera until photos exist; tapping it opens the folder, and
  `/inspo/[id]` steps through with ‹ ›; "⋯" holds take-off-hub / stop
  planning). Then the **five stages** — Dream · Compare · Book · Pay ·
  Ready (`src/lib/area-stage.ts`): the first four tick themselves from
  what's recorded, Ready is a button; "we're doing this ourselves"
  (`areas.diy`) skips Compare and Book. Then **the tabs, filtered to
  this area** (canvas 2 "Area page · Made of the tabs", option A, owner's
  pick 12 Oct 2026 — so the page reads as People, Plan and Money for one
  area): four sections, each headed like its tab with **that tab's icon from
  the menu bar** (People, Plan, Money, The Day; "Just for [area]" uses the
  area's own icon — owner, 12 Oct 2026, in place of the title drawings, and
  no line of explanation under each heading) and an "In People › / In Plan › / In
  Money ›" link to the tab filtered to the area. **People** (its suppliers:
  quotes until one's booked, then the rest fold away), **Plan** (to-dos and
  appointments in one list by date, done and been folded), **Money**
  (agreed of budget, `BudgetBar` from `src/components/budget-bar.tsx`,
  Paid · To pay · Still free, then the payment schedule), and **Just for
  [area]** (key facts via `?edit=facts`, notes — "- " lines become bullets,
  `rich-text.tsx` — and a line to its Inspo pictures). Adds sit at the foot
  of each card. **Say less** (owner, 12 Oct 2026: "so much copy"): an empty
  section is just its "+ Add …" — no "No one yet…" / "Nothing to pay yet…"
  sentences; "We're doing this ourselves" moved to the cover's ⋯ menu (only
  "We need a supplier after all" shows in People once chosen). The old tiles (supplier, to pay, next appointment) folded
  into those sections; a booked supplier's call/email is on their card.
  **Facts from the guest list** (canvas 2 "Area page · Facts from the guest
  list", option B, owner's pick 12 Oct 2026; `src/lib/area-guests.ts`,
  `GuestsSection` in `area-view.tsx`): three areas get a fifth section after
  People, worked out from the guest list each time (nothing stored twice).
  **Food & drink** (key `food`, or `catering`): Guests · "Who you're
  feeding" — day / evening / children coming, a bar per meal choice plus
  "Not picked", the dietary needs, and **Copy the list for [caterer]**
  (`catererText()`, `CopyText` in `src/components/copy-text.tsx`).
  **Stationery**: Guests · "Who you're sending to" — households, invited, to
  invite, the ones with no address yet, and **Copy every address for the
  envelopes**. **Transport**: "On the day" with the pocket watch — each car
  or coach from The Day, and day guests coming without a lift. Every figure
  opens the guest list (or The Day) already filtered. Supplier stages (12 Oct 2026): **In touch → Quote in →
  Booked** (booked last); **Not taken** isn't a stage — a quiet "We didn't go
  with them" / "Bring them back" on the supplier card (`SUPPLIER_STAGES` vs
  `SUPPLIER_STATUSES` in `src/lib/supplier-status.ts`)
  (`0012_area_stages.sql` adds `quoted`, `areas.diy`, `areas.ready`).
  **The Day on every area page** (owner, 12 Oct 2026; `DaySection` in
  `area-view.tsx`, after Money, `#day`): the area's run sheet moments in
  time order, "+ Add a moment" (`/day/run-sheet/new?area=<key>&from=area`,
  Save comes back) and "In The Day ›" (the run sheet narrowed with
  `/day?area=<key>`, same Filter as Plan and Money; the card's label
  says "The order of the day · Photos", so it can be printed for that
  supplier). Moments carry `run_sheet_items.area_key`
  (`0017_run_sheet_area.sql`, run 12 Oct 2026); the moment form is now
  visual (what happens large, time card, area tiles, where and who, notes).
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
  Rounds 3–7"): no event switch any more. The card is a big **All** (champagne when picked; was dark until 12 Oct 2026)
  with the breakdown beside it (Coming · Invited · Can't come, each with
  an arrow; To invite guests count only in All) — every one is a button
  that shows just those people. **The card counts whatever the filters
  leave**, by each guest's answer for their own event. Then search with a
  **Filter** button that drops down a small menu (Day guests · Evening
  guests, then Bridal party · Dietary needs · Children · No address yet,
  any mix); with filters on, the button goes dark with a count and each
  filter shows as a pill to take off (on their own line). Search has a round black + (add a guest) at its end; the line under it has
  Filter on the left and the order ("BY FIRST NAME ⌄") on the right — tapping that is **Sort**: first name, surname,
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
  round icon** on the right (canvas Round 14, option A: ✓ on gold coming — ink until 13 Oct 2026, when it was made gold and 26px so it doesn't compete with the black + —
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
  **since 14 Oct 2026 topped by a social-style profile** (`Profile`;
  canvas 3 "Guest card · Round 2", A — households got the envelope, so a
  person gets a profile; it replaced the 13 Oct place card): initials large
  on the left (a photo could go there later — optional, never children,
  privacy list), the name in italics on the right (tap to rename), role and
  "day guest", then three figures across — Answer · Table (`tableNames()`
  in `src/lib/db/day.ts`; "None yet" links to Seating) · Meal — and
  allergies in rose; then flat Text · Call · Email buttons, then **Guest of** (Day / Evening) and one **RSVP** (To invite · Invited · Coming ·
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
  each shows just those), search with a round black **+** (add a supplier) at its end, then a
  **Filter** (always shown, plain words and the guest list's "Show only" menu: any of the wedding's areas, then
  Still to pay · No phone or email · Not taken; pills to take off; `?f=`;
  Booked stays on the count card),
  then everyone **grouped by area** in the wedding's order (heading shows a
  count, "1 supplier" / "0 suppliers", like the guest list; within a group booked → quotes → asked →
  not taken). **Rows are phone-book entries** (Suppliers round 2, A, 12 Oct
  2026): initials with the **stage as a badge** on them (✓ gold booked, ink until 13 Oct 2026 · £
  champagne quote in · dashed ? asked · ✕ grey not taken — `StageIcon`
  with `badge`, like a guest's role star), the business and the contact
  person, then round **Call** and **Email** buttons on the right; no quote
  on the row. A missing phone or email shows as a **faded dashed button**
  that opens the card with that box ready to type in (`editField` →
  `TextRow startEditing`). A key under the list. **Sort** (like the guest
  list, on the Filter line): By area (default) or Name, A–Z
  (one plain list like the guest list, no letter dividers; a leading "The" ignored); kept on the phone
  (`supplier-list-sort` in localStorage). Tapping one opens the **supplier card**
  (`supplier-card.tsx`, a sheet / right panel like the guest card) — **since
  13 Oct 2026 a business card** (canvas 2 "Suppliers · Round 3", A, owner:
  "business card baby you nailed it"): a cream card with the stage stamped
  in gold ("Booked ✓"), the area as a tag top right (tap to move them — the
  area tiles open under it), the name large (tap to rename), the person and
  website, round Call (ink) · Email · Website; then **Progress** (In touch →
  Quote in → Booked as steps on a gold line, tap one to set it), **Money**
  (Quote and Deposit paid, tap to change; a bar of what's paid incl. paid
  payments; "£… to go"; the area's budget; **Next payment** opening Money By
  month for that area, or "+ Add a payment"), **Documents**, **Contact**
  (contact person, phone, email, website, notes — `TextRow`s). Every part
  saves on its own (`updateSupplierAction`); the card isn't a form any
  more. Before that, from 12 Oct 2026, it was **the add-a-supplier form itself, filled in** (`SupplierForm`
  with `supplier`; owner: the card looked nothing like the form): name,
  Call · Email · Website, What they do tiles, Where you're up to tiles,
  Money (+ area budget and payments line), How to reach them, More; Cancel /
  Save changes rise once something's changed (`saveSupplierCardAction`, only
  what was sent is changed); "We didn't go with them" saves at once. The
  older description, kept for reference — area link, business name (tap to rename), Call ·
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
  Adding a supplier uses the form (`/people/suppliers/new`), **made lighter
  12 Oct 2026** (owner: "one massive form… feels quite heavy"): the name
  large like a title, **What they do** as picture tiles of the wedding's
  areas (their ring icons, `areaIcon()`), **Where you're up to** as four
  tiles with the list's stage icons (`StageIcon`, exported from
  `supplier-list.tsx`), then short glass cards — Money (£ Quote · £ Deposit
  paid side by side) and **How to reach them** (icon lines: contact, phone,
  email, website) — and contract link and notes folded under "Add a
  contract link or notes". Big boxes need `!text-[…]` because
  `globals.css` keeps inputs at 16px+ (no iPhone zoom). With
  nothing narrowing the list, **every area shows**, an empty one as a faded
  "Add a supplier" row (see Conventions, "An empty screen still shows its
  shape").
  **Two jobs, one record** (owner, 12 Oct 2026): the Suppliers list is the
  **address book** (everyone, every area, contact in two taps); the **area
  page** is where you **decide** (quotes, stages, payments). The **supplier
  card** is that supplier's own facts and opens **wherever you are**: on the
  area page its supplier rows and deposit rows open it
  in place (`SupplierCards` / `SupplierLink` in `supplier-cards.tsx`, card in
  `?supplier=`). The card is contact-first: no payment list — one line ("2
  payments · next £250 Wed 14 Oct ›" to the area page's `#payments`, or "+
  Add a payment"). Area headings on the Suppliers list open the area page.
  **Website** (12 Oct 2026, `0015_supplier_website.sql`, run): a field on the add form and the card, and a **Website**
  button beside Call · Email ("ellierose.co.uk" gets https:// added). Until
  0015 is run, saves quietly leave the website out (`missingWebsite()` retry
  in `supplier-actions.ts`); editing it on the card says to run 0015.
  **Files on the supplier card** (13 Oct 2026; canvas 2 "Files · Round 1",
  A, with round 2's option C for adding; `0018_files.sql`, run 13 Oct 2026
  with the owner's OK): a **Documents** part (`supplier-files.tsx`) listing
  their contract, quotes, invoices and receipts — tap to open (hour-long
  signed link), ✕ to remove (asks). **"+ Add a file"** opens the phone's own
  menu (Photo Library · Take Photo · Choose File), then a small **pop-up in
  the middle**: the file, **What is it?** tiles (guessed from the name),
  "We've signed it" for a contract, **Save the file**. Uploads go straight
  from the phone to the private `files` bucket under `<wedding id>/…`
  (`src/lib/db/files-upload.ts`, the second browser-side query; 20 MB, PDF,
  photos, Word); rows in `files` (`src/lib/db/files.ts`,
  `files/actions.ts`, which return messages). A removed supplier's files
  stay, with no supplier. Still to come: **B**, one place for every file
  (People › Files, grouped by area, Filter and +), files on payments and
  area pages, and **C**, the assistant reading a file.
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
  **Household page** (`/people/household/[id]`, screen 9): **since 14 Oct
  2026 topped by an envelope** (canvas 3 "Household · Round 3 · Turn it
  over", owner's pick; `household-envelope.tsx`): crisp white card with a
  few flecks and a gold double border, the name in calligraphy (Pinyon
  Script, `font-script`, loaded in `layout.tsx` for this alone) and the
  address in plain italic. Tap it: it turns over (wax seal with the
  initial), the flap opens and **the invitation** slides out — first names,
  "to the day · date", each person's answer (tap one for their card), and
  Name / Address rows with Change, Copy (`renameHouseholdAction`,
  `saveAddressAction`); "Put it back" reverses it; reduce motion skips the
  movement. Then "3 people · 1 child · day guests", round **Text · Call ·
  Email** (they reach the household's people — straight through if one has
  a number, a pick-list if several, hidden if none), then "Who's in it" on
  a glass card (small initials, name, ›; owner preferred it to the guest
  list's rows), each opening the guest card right on this page. The **edit page is gone**; "Remove this household" at the
  foot asks first (`removeHouseholdAction`). A "Sent · date" mark waits on
  invitation tracking (Backlog, "From talking to couples"). "Add someone to
  this household" asks first: **Someone new** (the guest form with it
  picked, coming back after) or **Already on the list** (search, tap to
  move them in, leaving any household they were in).
- **Plan** (`/plan`): **two views, owner's call 11 Oct 2026** — a corner
  switch **Calendar | List** (`CornerSwitch`, shared with People), the
  title, then **one round black +** (owner, 12 Oct 2026, like People's;
  the two big Add buttons are gone) opening **one form with a To-do |
  Appointment switch** (`plan-add-form.tsx` via `plan-add-page.tsx`;
  `/plan/new` starts as a to-do, `/plan/appointments/new` as an appointment;
  an appointment adds time, where and who, and name ideas; what's typed stays
  when switching; editing still uses `milestone-form.tsx` /
  `appointment-form.tsx`). On the List, a **To-dos | Appointments** switch
  sits left of the + (`&kind=appointments`): appointments coming up in date
  order with This month / Next 3 months and area filters, been ones folded.
  Money now has the same: one + with a Payment | Budget switch (13 Oct 2026). **Calendar** (the default; canvas "Plan · Calendar · Round
  1", option A; `agenda.tsx` + `calendar.tsx`): ‹ month › (anything still
  open from earlier folds in above the current month), a Monday-first grid with a mark per thing
  on each day (to-do a solid white circle, appointment a little gold
  calendar, done things no mark; up to two then "+1"; **no payments** —
  owner, 12 Oct 2026: Plan is what you do or go to, Money is what you pay,
  and Money's By month is the payments' calendar),
  today softly circled, the wedding in a gold ring; tap a day for its card (below).
  The month in view and the tapped day live in the
  address (`?month=`, `?day=`), so Back from a to-do lands on the same
  month and tapping Plan starts on today. Undated to-dos: a cream line under the month ("3 to-dos have no date
  yet ›", 12 Oct 2026) opens a **"No date yet" card**, the day card without
  a day (`?day=undated`, Add a to-do) — was a fold at the
  foot (a banner above the grid was tried and taken out, owner, 11 Oct 2026);
  the List has them on their own card.
  **Calendar header and list, 12 Oct 2026 (owner):** ‹ the month › on the
  left at 22px (tried at 30px beside the +; too close to the page title), the
  **black +** on the right (the + lives here on the calendar, beside the To-dos |
  Appointments switch on the List). The key's row ends with a small
  **"6 undated ›"** pill (calendar-off icon) opening the Undated card — the
  cream banner at the foot is gone. Under the grid, done things sit in a
  **Done** fold at the foot of the month, and a ticked row **slides away**
  (`tick-away` in `globals.css`, added by `TickForm`) before reappearing there.
  **Calendar round 2, built** (canvas 2 "Plan · Calendar · Round 2 · The
  month underneath", option B, owner's pick 11 Oct 2026): under the grid,
  **everything in the month** as one list in date order — no day headings,
  each row carries its date (owner's change to the mock), and no heading
  over it ("All of October · 2 things" taken out, 12 Oct 2026). Tapping a day
  opens a **day card** (`DayCard` in `calendar.tsx`; a sheet on phones,
  pull down to close, a right-hand panel on laptops, like the guest card —
  `usePullToClose` is now shared in `src/components/`) with that day's
  things and **Add on this day**: a to-do or an appointment with the date
  filled in (`/plan/new?date=`, `/plan/appointments/new?date=`). No day is
  picked on arrival; `?day=` keeps the card open across Back.
  **List** (`?view=list`, `todo-list.tsx`) — **what's left to do**, one
  long checklist of **to-dos only** (owner, 12 Oct 2026: the Calendar is the
  diary — *when* is everything — the List the checklist; appointments live on
  the Calendar, the Hub and area pages). "23 *to do*" at the top, then
  one **Filter** under the heading (13 Oct 2026, the shared `FilterMenu` in
  `src/components/filter-menu.tsx`, like the guest list's) holding **When**
  (`&when=overdue|month|soon|none`: Overdue · This month · Next 3 months · No
  date) and **Area** (`&area=<key>` or `none`), a pill per choice; one glass card, overdue first, then
  soonest, then no date (each row's date in its grey line, "No date" when
  none); done folded at the foot. No month headings any more. Old links
  (`?as=list`, `?view=area`, `?view=todos`) land on the List. The old
  timeline list ("the road to the day": a gold line with a dot per month)
  was retired from Plan — kept in mind for The Day's run sheet
  (`docs/DESIGN.md`). Ticking off (or marking paid) shows an **Undo** note
  for 5s (`undo-toast.tsx`, raised by `tick-form.tsx`, mounted once in the
  `(app)` layout). Rows: to-dos (plain circle), **nudges** (dashed gold
  circle, italic: "Start looking at photographers · START NOW"),
  **appointments** (`0007_appointments.sql`, screen 21,
  `/plan/appointments/…`; calendar on champagne). Payments were on the
  calendar too until 12 Oct 2026; now only in Money and the Hub's coming up. A **nudge** is a to-do with `remind_at` and
  no `due_date` (`src/lib/plan.ts`: `isNudge`, `planDate`) — the to-do
  form's old "Done by / Start around" switch (taken out 12 Oct 2026, owner: one kind of
  to-do — every to-do just has a date, the starter list's "Start looking
  at…" ones included, and saving an old nudge makes it ordinary; the nudge
  display stays only for any old rows, and there are none in the live
  database) — so no migration; its date passing meant "start now", never
  overdue. **The to-do and appointment forms were made visual** (12 Oct 2026,
  owner: "like add a supplier… super satisfying to fill in"), built from
  shared pieces in `src/components/visual-form.tsx` (`TITLE_INPUT`, `Tiles`,
  `areaTiles`, `DateCard`, `Line`, `CARD`, `Folded`): the name large (24px,
  under the page title — owner, 12 Oct 2026); **to-dos simplified the same
  day**: the name, then an optional **date card** (the day written out large,
  ✕ to take it off, quick picks — shown only while there's no date — that wrap onto two
  lines rather than scroll sideways: next week, next month, in 3 months, 6 months / a month / the
  week before the day), area tiles, and notes always open; appointments offer one-tap name ideas (Venue visit, Dress
  fitting…), the date card, a time card with quick taps (10:00…18:00), a
  Where and who card (picking a supplier picks their area), then the area as
  picture tiles ending in Other; notes folded under "Add notes".
- **Money** (`/money`, screens 22–24; `0006_money.sql`): **rebuilt 12 Oct
  2026** to canvas 2 "Money · Round 4" (owner's pick: B for the budget, C
  for the schedule). Money moves **Budget → Agreed → Paid**, and the rest
  has a schedule. A corner switch **By area | By month** (`money-view.tsx`;
  `?view=month`, old `?tab=payments` links still land there). **An area filter**
  (12 Oct 2026; since 13 Oct the shared **Filter** — `FilterMenu`, like the
  guest list's — on the row with the round black +, `&area=<key>` or `none`) narrows either view to one area: the top card is that area's
  money, By month only its payments; the switch keeps the filter. The area
  page's "In Money ›" opens By month filtered. Rule: **every tab can be
  narrowed to an area, and the area page's links land on that.** No sentences,
  figures and bars. **By area** (default, "The budget"; **Round 5, 12 Oct
  2026**: owner picked the top of option 3 and the list of option 4): the
  whole wedding on a glass card (agreed of budget large, one thick bar —
  `BudgetBar` — then Paid · To pay · Still free; **tapping the card opens
  the budget page**, `/money/budget`, `budget-form.tsx`: the whole budget large,
  then each area's share with a running "£… left to share" and **Share it out
  for us**, which fills the empty areas from what's left by a typical UK split
  (`TYPICAL_SHARE`, rounded to £50) — a starting point, saved only on Save.
  Agreed and Paid are never typed: they add up from suppliers and payments), then
  straight into **By area** (the "Next to pay" row was taken out, owner, 12
  Oct 2026; no heading since 13 Oct 2026 — Filter on the left, the round black +
  on the right, opening **one add page with a Payment | Budget switch**,
  `money-add-page.tsx`: By area's + starts on Budget — the whole wedding or one
  area, the amount large, saving opens that area's money card — By month's on
  Payment; the explanation of Agreed/Paid folded under "What do these mean?"), then **each area as a little glass card, two to a row**
  (owner, 12 Oct 2026 evening, "fab-u-lous"; `area-cards.tsx`): its ring icon
  and name, agreed large, "of £budget", one bar (none when there's no budget
  or spend) and a short tag: "▲ Over by £…" (agreed bar runs past the budget
  in rose stripes — never colour alone), "✓ All paid", "£… to go", "Not
  booked yet"; Other with nothing shows "Nothing yet". **Tapping a card brings
  up that area's money from the bottom** (a right panel on laptops; `?open=`;
  owner: simple first, detail on tap — it no longer leaves for the area
  page): the same figures as the top card (`MoneyFigures`,
  `money-figures.tsx`), its suppliers with stage badges and quotes, To pay
  (soonest first, undated balances faded), + Add a payment for that area,
  Paid, then "Open the … page ›" and "Change the budget ›". **Laptop idea
  (owner, agreed):** the phone stays high level; the laptop's budget can go to
  town — a spreadsheet-like table (Budget · Quotes · Agreed · Paid · To pay ·
  Over/under, sortable, budgets typed in cells, export). For the laptop pass. **By month** ("Payments"; **Round 6, option D, owner's pick 12 Oct
  2026**): a glass card with Still to pay (large) · Paid so far and the
  **column per month** from now to the wedding inside it (first column =
  paid so far, dark; due months light; overdue counts in this month;
  scrolls sideways if long); then "What's due" with a round black + (add a
  payment); then a **glass card per month** ("October *2026*", total, "2
  payments") listing its payments (tick £ to mark paid). **Tap a column to
  see just that month** (12 Oct 2026; `?month=2026-10`, or `paid` for the
  Paid column): other columns fade, a "Just October 2026 ✕" pill clears it,
  as does tapping the column again; **The payment form** (`payment-form.tsx`) was made visual
  too (12 Oct 2026, same pieces): what it's for, large, with one-tap names
  (Deposit · Instalment · Balance take the supplier's name in front, then
  Wedding rings, Giving notice…); the amount as one big £ figure; **Still to
  pay · Already paid** as tiles, then the due date card (quick picks) or the
  day it was paid; who it's to (picking a supplier picks their area); area
  tiles; notes folded. then a dashed **No
  date yet** card holding undated payments and unscheduled supplier
  balances (faded rows, tap to add with a date); Paid folded at the foot. "Agreed" is the UI word for what
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
  **Make it a to-do** offers an optional date, keeps the
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
  Adding a table has a **Round | Long** choice, Round to start (12 Oct 2026).
  A "top table" is just a long table by that name (the demo's); a real top
  table option (seats on one side, at the head) was offered, not built.
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
**Check the deploy actually went live** (12 Oct 2026: a forms update failed
on Vercel while building fine locally, and the owner saw no change). **Since the
move to Pro (12 Oct 2026) Vercel no longer reports back to GitHub** — the
status check below comes back empty even when the change is live, so ask
the owner to look on their phone (or at vercel.com › Deployments) instead. After
pushing, look at Vercel's verdict on the commit:
`gh api repos/fjbenson/wedding-app/commits/<sha>/statuses --jq '.[] | "\(.context) \(.state) \(.description)"'`
— wait for `success` before saying it's live. The build logs need the
owner's Vercel login (the deployment page on vercel.com).
**Vercel is on the Pro plan since 12 Oct 2026** (owner upgraded: the
free plan is for non-commercial use, and its build limit kept stopping
changes reaching the owner's phone), so the limit below no longer bites.
History: **Vercel's free plan builds at most 100 updates a day** (12 Oct 2026: ~95 in
24 hours stopped the payment form going live; Vercel silently skipped the
pushes). Every push to `main` *and* every push to a side branch counts. So:
Claude's side branches (`claude/…`) no longer build on Vercel at all
(`git.deploymentEnabled` in `vercel.json`), so only `main` counts; still,
gather small changes into one push. If a push gets no Vercel status at all, the limit is
the likely cause — the next push after it resets (or "Redeploy" on
vercel.com) brings everything live at once.

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
still open. **Background (12 Oct 2026):** the satin stripes were replaced by
**paper under a lamp** — one light from the top of the screen, no grain
(a grain was tried and dropped) (canvas 2 "Background · Round 2", option A; `body::before` in
`globals.css`); the Hub's and area pages' gold glows were taken out. B (oat
ground) and C (real texture) wait on the canvas.
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
plus `0002_create_wedding.sql` to `0018_files.sql`. **New migrations are run
by hand** in the Supabase SQL editor — the owner has to paste them in.
**Since 12 Oct 2026 the Supabase connector is set up** (project
**wedding-app**, id `hfyuvtrglkdpqvtkzohb`, eu-west-1), so Claude can check
and apply migrations itself — **but always says in plain words what a
database change does and waits for the owner's OK before running it, and
never deletes data unless the owner asks for exactly that.** Looking (read-
only queries) needs no OK. **All migrations 0001–0018 are now in** (0018, files, run 13 Oct 2026) (12 Oct
2026: 0011, the floor plan, was missing — Claude ran it with the owner's OK).
The "until 0xxx is run" fallbacks below are kept for new projects. Until
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
  sender. **Working name: Rondé** (14 Oct 2026, see "The name" under
  Backlog); the web address waits on the checks listed there.
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

**Demo wedding (12 Oct 2026).** "Olivia & Theo", 12 Jun 2027, in the live
database beside the owner's real wedding and on the owner's login: 79
guests in 41 households (day and evening, every answer, meals, diets, a
bridal party), 16 suppliers at every stage, budgets per area (venue over),
payments, 28 to-dos, 8 appointments, a run sheet, a floor plan, transport and
notes. All made up (phones in Ofcom's 07700 900xxx drama range, emails
@example.com), so safe to screenshot. Open it from **Settings › Your
weddings** (shown only with more than one); the pick is remembered on that
device in the `wedding` cookie (`getCurrentWedding()`; with no pick it's
the first wedding made, so the demo never takes over). **Reset it** by
running `supabase/seed/demo-wedding.sql` again (it deletes and rebuilds only
that demo; ask the owner first). No Inspo pictures yet. A **public demo
mode** ("Look around" on the sign-in page, no email) is the agreed next
step for the portfolio, not built: needs a fresh copy per visitor or saves
switched off.

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
   (Vercel Pro, needed for commercial use: done 12 Oct 2026.)
8. Two-step login on the owner's Supabase, Vercel and GitHub accounts
   (and the Claude Console, which holds the assistant's key).
9. **Your assistant sends data to Anthropic** (added 13 Oct 2026, owner's
   OK): to answer, the guest, money and plan details a question needs go to
   Anthropic's API. The privacy policy must say so; sign Anthropic's DPA
   too (as item 4); keep the assistant's lookups to what a question needs
   (they never send notes, files or addresses today).

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
- **Black (ink) is for the main action** (owner, 12 Oct 2026: the primary
  button should be the loudest thing on the page). **The round black + is one
  size everywhere: 40px** (`AddButton`, `src/components/add-button.tsx`;
  owner, 12 Oct 2026, taken from Money's By month) — Guests, Suppliers,
  Plan (calendar and List), Money (both views). A search box beside it is
  40px tall too. Use `AddButton` for any new one. On Guests and Suppliers
  the Add is a **round black + at the end of the search row** (find or add
  — the moment you search and they're not there); the row under it is how
  the list is shown: **Filter** (plain words; champagne pill "Filter · 2"
  when on, menu opens to the left) on the left, **Sort** on the right
  (canvas 2 "People · Fewer boxes" led here: too many boxed things). The
  count cards' big **All** tile is champagne, not black, when picked — as
  **champagne glass** since 12 Oct 2026 (`.glass-tile-on` / `.glass-tile` in
  `globals.css`; owner: the gold outline felt clunky).
- **A form's Save stays in reach** (owner, 12 Oct 2026: a date was
  changed and never saved because Save was below the fold): `SubmitBar` in
  `form-bits.tsx` keeps the main button at the foot of the screen while the
  form scrolls, then it settles at the end of the form. On the to-do,
  appointment, payment, budget, guest and supplier forms; use it on new ones.
  Editing says "Save changes". **When editing it only rises into view once something is
  changed** (`whenChanged`; it compares the form with how it opened, so
  putting it back hides it again) — owner, 12 Oct 2026: just looking at a
  to-do shouldn't show a big Save. It comes with a **Cancel** beside it.
  **Neither leaves the form** (owner, 12 Oct 2026): Cancel puts the form back
  how it opened (`ResetBoundary` in `FormPage` redraws it; the supplier card
  redraws itself), and an edit's Save lands back on the same form
  (`stayAfterSave()` in `src/lib/return-to.ts` adds `?saved=`), freshly
  loaded, with a short "Saved" note. Adding still goes back to the list. Edit forms using it: to-do,
  appointment, payment, budget, run sheet moment, car or coach, day/evening
  event, household.
- **An empty screen still shows its shape** (owner, 12 Oct 2026: "it
  just doesn't show the structure of the page"). Never fill a screen with
  made-up data the couple has to delete; instead draw the real structure
  from what the wedding already has (its **areas**, the ring's dots) with
  faded **ghost rows** you tap to fill in — dashed circle with +, italic
  faded text, opening the add form already pointed at that area. Done on
  Suppliers (every area shows; an empty one says "0 suppliers" with an "Add a
  supplier" row, `/people/suppliers/new?category=…&from=suppliers`), and
  the notes wall's faded blank notes work the same way. Use it on any new
  screen, and fix older empty screens to match as they come up.
- **Every area picker ends with "Other"** (owner, 12 Oct 2026: "always
  have that other option"). Stored as the key `other` (`areaName()` names
  it); for to-dos the old blank "No particular area" is now labelled Other
  (still null). Pickers: supplier form/card, to-do, appointment and payment
  (which keep their blank "—", meaning "follow the supplier"), capture,
  note filing, Inspo folders (an Other chip when it has anything). Lists
  gather no-area and `other` together as Other: the Plan list's area filter
  ("Other" = none or other), Money's leftover row, the Suppliers groups.
  There's no Other **budget** (budgets live on the areas table).
  **Then a dashed "+ Add an area" tile** (owner, 12 Oct 2026): `AreaTiles`
  in `visual-form.tsx` opens **the same three steps as the ring's +**
  (`AreaSteps` with `sheet`, full screen over the form, no form of its own),
  saves through `quickAddAreaAction` (`area/actions.ts`; brings an old one
  back if the name matches), then picks it, without leaving the form. On the to-do,
  appointment, payment and add-a-supplier forms so far; still to do on the
  supplier card, capture, note filing and Inspo.
- **Adding shows the tiles; a saved item shows the choice as a pill**
  (owner, 13 Oct 2026: a form has two lives — filling it in, then an item
  you look at — and the area grid "takes up way too much space" once it's
  chosen). `AreaTiles` takes `folded`: the picked area as one small pill
  (its icon, name, "Change ⌄"), tapping it opens the tiles. On the edit
  forms of to-dos, appointments, payments, run sheet moments and the
  supplier card. Other tile pickers on saved items (supplier stage, Paid
  yet?) can follow the same rule.
- **Amounts get a comma every thousand as you type** (owner, 12 Oct
  2026): use `MoneyInput` (`src/components/money-input.tsx`) or
  `withCommas()` (`src/lib/money.ts`) for any money box — supplier form and
  card, payments, budgets. `parseMoney` reads the commas back.
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
- **Never import plain values (lists, helper functions) from a `"use client"`
  file into a server one** (12 Oct 2026: Plan's List crashed live with
  "Something went wrong" — `asWhen()` lived in `when-filter.tsx`). Typecheck
  and build both pass; it only fails when the page runs. Put shared values in
  a plain file (like `plan/when.ts`) and import them from both sides.
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
   spent-vs-budget shape (built 12 Oct as three bars) · The Day hour-by-hour line. **Calendar marks picked and built
   (12 Oct 2026, canvas 2 "Plan · Calendar · The to-do mark"): a to-do is a
   solid white circle (the list's tick circle, filled), an appointment a
   little gold calendar, done things no mark; two per day then "+1" (`Mark` in
   `calendar.tsx`). **Next up (end of the 14 Oct 2026 naming chat):** no code
   changed; the app has a **working name, Rondé** (Backlog, "The name"). The
   owner looks at canvas 2's "Name · Rondé" page and picks an icon (A twirl ·
   B accent · C ronde), tries the name on five friends, and runs the UK
   trademark search and a web-address check. Then the items below.
   **Earlier next-up (end of the 13 Oct 2026 late chat):** the owner
   tries **Where things stand** (`/standing`, built this chat) on the demo
   wedding and says if any figure looks off; still to check on an iPhone
   that the assistant no longer jumps; then the plan below.
   **Earlier next-up (end of the 13 Oct 2026 evening chat):** Your assistant
   version 1 is **built and live** (step 8) and the owner loves it; its new
   skills are **parked** by the owner (ideas listed in step 8). First, the
   owner checks on an iPhone that the assistant no longer jumps when the
   keyboard opens or a message is sent (fixed blind — the keyboard can't be
   tested here). Then back to the design pass: the forms still in the older
   plain style (below), the Seating screen, Journeys. Open: the owner's OK
   on Anthropic's DPA when real couples come; a look at Claude Console ›
   Usage for what a chat costs. **Earlier:** build "Your assistant", version 1
   — see step 8 for the plan. **Earlier next-up (end of the 12 Oct 2026 late chat):** the Money
   budget's turn is done for now — area cards two to a row, an area's money
   card from the bottom, tappable month columns; the owner loves them. Next:
   the forms still
   in the older plain style (car or coach, day/evening event, Inspo save,
   jot a note; household edit) — bring them into line with the visual forms;
   then The Day's Seating, then Journeys (backlog) and capture. Ideas waiting:
   Money's one + with a Budget | Payment switch; renaming an area by tapping
   its name on its page. Plan, People, Money (rounds 5 and 6), The
   Day's run sheet and the to-do / appointment / payment forms are settled.
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
   built 12 Oct 2026: A + B** (see "Current state"). The household page
   (Round 1, 9 Oct) and the add-a-guest form (laid out like the card) were
   already done — People's design pass is complete.
   **"People · Fewer boxes"** on canvas 2 (12 Oct 2026; owner: "containers
   and containers"): 1 flat search, 2 numbers off their card, 3 Add in the
   title row. The owner chose instead to move Add (a round black + at the end
   of search) and pair Filter with Sort on the row under it — built. A
   flatter search (1) is the next thing to try if it still feels boxy.
   **Suppliers round 2 on canvas 2** (12 Oct 2026, page "Suppliers · Round
   2 · A phone book"): the owner sees the list as a phone book — call and
   email from the row, the stage visible, full details on tap (different
   from the guest list's job, same building blocks). A by area, stage as a
   badge on the initials (like the guests' role star), round Call and Email
   buttons on every row (hidden when missing), key underneath; B A to Z with
   letter headings, the area in gold italic beside each name and a letter
   index; C like A but the stage as a word under the name. **Picked and
   built 12 Oct 2026: A, trimmed** — owner: the list needn't show the quote
   or number, just quick Call / Email and the stage.
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
8. **"Your assistant"** — **version 1 built 13 Oct 2026** (agreed 7 Oct 2026 as "Brainstorm"; named
   "Your planner" 13 Oct 2026, **renamed "Your assistant" by the owner 13 Oct
   2026: the couple are the planners — it just does the smaller jobs, so they
   stay in charge**; the canvas pages still say "Your planner"): a calm, organised friend — short,
   warm, British, never pushy, always checks first, no made-up human name) — a
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
     **Idea (13 Oct 2026): the Hub's jot box doubles as the assistant** —
     type "Add Amy Latham, vegan, Latham household" and it offers to do it
     instead of saving a note; one box for thoughts, pictures and jobs.
   - **What it's for (owner, 13 Oct 2026):** 1 **answering** ("how many
     guests are vegetarian?") with a "take me there" link that opens the
     right screen already filtered; 2 **doing** (add a guest, record a
     payment…). Also raised, in suggested order after those: 3 **messy
     stuff into data** (paste a guest list from WhatsApp or a spreadsheet,
     a photo of a quote or invoice → guests, supplier, payments — the
     biggest admin saver); 4 **writing** (invitation wording, RSVP chasers,
     supplier emails, thank-yous — ties to the group-emails backlog);
     5 **advice** against their own date and budget; 6 **spotting
     problems** (no meal choice, over budget, a balance due Friday — on
     opening at first; sent reminders need the background worker);
     7 **helping decide** (compare quotes against the budget). First
     version: 1 + 2 + take-me-there links.
   - **Keeping each wedding's data separate (owner asked, 13 Oct 2026):**
     it runs on the server as the signed-in person (no master key), so RLS
     applies to every query; its actions have **no wedding setting** — the
     server fills in `getCurrentWedding()`; only named actions, no SQL; a
     Yes on a confirm card for every change, no deletes; text in notes or
     files is data, never instructions; add its actions to
     `supabase/tests/rls_isolation.sql`.
   - **Design round 1 on canvas 2** ("Your planner · Round 1", 13 Oct 2026):
     one front door — the Hub pill and the floating pen become **"Jot or
     ask…"**, opening one panel; replies are short with **answer cards**
     ("12 vegetarian guests · See them ›") and **confirm cards** (Add her /
     Change); a plain thought is still saved as a note; three ways to
     introduce it: "Your assistant" (owner's pick; was "Your planner"), "Ask", or named with the app.
     Before building: an Anthropic key in Vercel, privacy-list entry (guest
     details go to the AI to answer), a spending cap; and clean versions of
     the few save steps it needs (today's take a form and redirect).
   - **Answers you can see** (canvas 2 "Your planner · Round 2", owner
     "absolutely love it", 13 Oct 2026): replies are a line of text plus an
     **answer block** drawn by the app with its own components and real
     data — never retyped by the AI: Guests (a big gold number + the guest
     list's rows, "Open in the guest list ›"), Money (still to pay, the
     month columns, next three payments), a Table (round table, initials in
     seats), This week (the Hub's day list, tickable), Compare (supplier
     business cards side by side against the budget). Plus confirm cards
     for changes and suggested next steps as tap-able pills.
   - **Build plan (for the next chat):**
     1. ~~Owner: an Anthropic API key~~ — **done 13 Oct 2026**: Claude
        Console (separate from the owner's Claude subscription), key
        `wedding-app` in the Default workspace, no expiry, prepaid credit
        with auto-reload **off** (the credit is the cap for now), saved in
        Vercel as a sensitive `ANTHROPIC_API_KEY` for Production and
        Preview. **Still open:** the owner's OK to add "guest details go to
        the AI to answer" to the privacy list (asked, not yet answered);
        a per-wedding monthly cap and auto-reload before other couples use
        it; a yearly new key then.
     2. ~~Clean actions~~ — **done 13 Oct 2026**: `src/lib/jobs.ts` —
        `addGuest`, `setGuestAnswer`, `addTodo`, `addPayment`, `addNote`.
        Plain inputs, no FormData or redirects, return `{ ok, … }` or
        `{ ok: false, error, detail }`; each finds the wedding itself
        (`getCurrentWedding()`). The add forms (guest, to-do, payment,
        capture) and the guest card's answer now go through them; edits
        still use their own actions. Add new jobs here.
     3. ~~Reading tools~~ — **done 13 Oct 2026**: `src/lib/lookups.ts` —
        `overview` (names, date, areas, events and households with their
        ids), `findGuests` (name, answer, day/evening, bridal party,
        dietary, words in meal or diet, children, no address, household),
        `moneySummary` (whole wedding or one area: budget, agreed, paid, to
        pay, by month, next three, balances with no date), `thisWeek` (as
        the Hub's), `seating`, `findSuppliers`. Each finds the wedding
        itself and returns a `link` to the screen already filtered. Not yet
        used by any screen — the assistant's route will be the first.
     4. ~~A route~~ — **done 13 Oct 2026**: `src/app/api/assistant/route.ts`
        (Anthropic SDK, `claude-opus-5-5`, effort low, streaming, up to 8
        tool steps a turn, server-side refusal fallback, `drop_block` so a
        trimmed or next-day conversation degrades instead of failing).
        Instructions (`RULES`) set the voice: brief, British, never pushy,
        never says a change is done before Yes, saves a plain thought with
        `save_note`. Tools in `src/lib/assistant/tools.ts`: lookups run at
        once and send an answer block; `add_guest`, `set_guest_answer`,
        `add_todo`, `add_payment` only make a **confirm card** (ids checked
        against the wedding); the Yes calls `confirmProposalAction`
        (`src/app/(app)/assistant/actions.ts`), which runs the jobs. Stream
        format and blocks: `src/lib/assistant/blocks.ts`. Usage is logged
        ("assistant usage") in Vercel's logs.
     5. ~~The panel~~ — **done 13 Oct 2026**: `src/components/assistant/
        assistant-sheet.tsx` (the Hub's "Jot or ask…" pill and the floating
        pen on the other tabs, `capture-button.tsx`; a sheet on phones, a
        right panel on laptops; three starter questions; words first, then
        the blocks from `answer-blocks.tsx` — guests, money, this week,
        seating, suppliers, a saved note; confirm cards with Yes / Change;
        if the assistant can't answer, "Save it as a note" / "Try again";
        a camera button to Inspo). The conversation lasts while the page is
        open. Not yet: suggested next-step pills, Compare (side-by-side
        quotes), photos of quotes, the desktop sidebar's capture button.
     6. Tests: the assistant's tools in `supabase/tests/rls_isolation.sql`
        terms (another wedding's ids return nothing); try it on the demo
        wedding first.
   - **How it acts (agreed with the owner, 13 Oct 2026):** never raw changes
     to the data — a short list of named actions, the same ones the forms
     use (add a guest, set an RSVP, add a to-do…), so it follows the same
     rules (day guests also on the evening, names split, households made)
     and only ever touches its own wedding. A new skill is mostly a short
     description of an action that already exists.

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

- **The name: working name Rondé** (owner, 14 Oct 2026, after two long
  rounds). *Ronde* is French for **round** (the hub ring, the signature
  circle) and *une ronde* is a **circle dance** (the dancing couple); said
  "ron-DAY", it lands on the big day. The feeling it carries is the brand's:
  **"Everything sorted. Ready to dance."** (the owner's 💃) — confident,
  calm, then a flash of joy. Line under the name: *Ready to dance.* Mocked
  on canvas 2 "Name · Rondé" (wordmark, three icons, sign-in, "All sorted.
  Time to dance."). Still to do: friend test (what it brings to mind, how
  they'd spell it — a faint "affair" echo comes from *rendezvous* and the
  old play *La Ronde*), UK trademark search, web address (ronde.app or
  similar; é can't go in it), App Store title like "Rondé: Wedding Planner".
  The owner's rules for any name: sings wedding and "you're your own
  planner"; dynamic, not past tense (that's Hitched); sounds like the app
  looks (elegant, satisfying, no puns); for everyone (no church, aisle,
  bride/groom, drink, "boss"); no negative reading; passes the phone test
  (dictation types it right — "Junia" came out "junior", "Ordia" "oh
  dear"); ideally ours alone. **Never:** confetti or anything built on it.
  Taken or ruled out: Aisle (well-funded US AI wedding planner), Wedmin (an
  app and a UK company), Weddingly, Cordia, Ordina, Concora, Simora.
  Near misses kept: Cordia (the sound), Dovetail (the picture), Valsa
  (Portuguese for waltz), Moonring (but echoes Mooncup).
- **Business model** (talked through 14 Oct 2026): Hitched, Bridebook,
  Zola are free because suppliers pay them; this app is **paid by couples**
  (a one-off price per wedding, ~£30–50, may suit better than monthly),
  which keeps it on the couple's side. Order: a free trial with 3–5
  couples → charge on the website (Stripe) → App Store later (Capacitor
  wrap; Apple keeps 15%). Suppliers could come later only if a couple's
  details reach one solely when the couple sends them.

- **From the information-architecture review (12 Oct 2026)** — the owner
  asked for the app's map ("Wedding App Map", a sitemap:
  https://claude.ai/artifact/GfcFVHZX4vuf1Ykzdk1i5B) and what doesn't line
  up. Done the same day: payments off the Plan calendar, appointments in
  Plan's List, Money's area filter, guest facts on area pages. Still open:
  - ~~**Your notes and Inspo are two homes for one thing**~~ — settled
    13 Oct 2026 (owner): they stay two things — notes are quick words, Inspo
    the pictures — with **one front door** (the jot sheet takes words, a
    link or a photo, each landing in the right place) and shown together
    where it helps (an area page's "Just for …").
  - Areas are added from the ring's + but renamed / reordered in Settings
    (two places for one thing).
  - Day and evening events are set up at the foot of the guest list, though
    they're really about the day.
  - A supplier's card could show their next appointment as well as payments.

- **Odd ones out (13 Oct 2026)** — owner asked for mismatches like Money's
  old area drop-down (now the shared `FilterMenu`, `src/components/
  filter-menu.tsx`, on Money, Plan's List and The Day). Parked for later:
  1. ~~**Add buttons**~~ — done 13 Oct 2026: The Day's run sheet (+ with a
     40px Print beside it) and Transport, Your notes and Inspo (title row)
     now use the round black + (`AddButton`).
  2. **Page titles**: Your notes has no title drawing; Inspo and Settings
     use a smaller plain title (34px) and no drawing — use `PageTitle`.
  3. **Inspo's folders**: area chips that go black when picked; everywhere
     else is the champagne Filter. Owner to choose: the Filter, or keep chips
     but champagne.
  4. **Forms in the old plain style**: car or coach, day/evening event,
     Inspo save, jot a note, household edit (also in Next steps).
  5. **Two places for one thing**: areas added from the ring's + but renamed
     / reordered in Settings; day/evening events set up at the foot of the
     guest list (also in the IA review list below).
- **Iconography as a set** (owner, 13 Oct 2026: "think more about
  iconography in general in our design system"). Done so far: a guest's
  Coming and a supplier's Booked are gold (`champagne-600`), not black, and
  26px rather than 30px, so they don't compete with the round black + (black
  stays for the main action). **Icon audit** (13 Oct 2026, everything in
  use and where it clashes): https://claude.ai/artifact/SCHsvUpFJ6YdGBMb1EKqSY
  — one icon with several jobs (Mail = Invited / Email / Stationery; House =
  Hub / household; Clock = The Day / a time), near-twins (three calendars,
  three pens, three people icons), three sets of status marks, nine stroke
  weights, typed ▲ ✓ ✕ › as icons, raster title drawings. **The fix, parked
  by the owner:**
  1. Agree the rules on a canvas page "Icons" (owner): one set of status
     marks for guests, suppliers and Plan (done gold tick · in hand pale
     fill · not yet dashed · dropped grey cross); new pictures for Invited
     and household (2–3 options each).
  2. One shared icon file (like `AddButton`): two weights (1.6 alone, 2.2 in
     small circles), three sizes (16 / 20 / 24); screens ask for "the date
     icon" rather than picking their own.
  3. Swap in screen by screen: status marks first, then the clashes, then
     ▲ ✓ ✕ › as real icons. Write the rules into `docs/DESIGN.md`.
  4. Vector title drawings (needs the Canva originals; already a to-do).
- **From talking to couples (13 Oct 2026)** — the owner's first user
  research. Parked, not designed yet:
  1. **Invitations got messy** — couples sending *digital* invitations by
     email lost track of who'd been sent one. Note: the Invitations page
     was removed on 9 Oct on the idea that invites go by post; this says
     many go by email, so tracking "sent" matters again. The guest list's
     To invite → Invited answer is the start; ideas: send the invitation
     from the app (then "sent" is recorded by itself), or a quick "mark
     these as sent" for a picked group, and a "who hasn't been sent one"
     view.
  2. **Email a group of guests** — e.g. everyone staying at the pub, the
     evening guests, the bridal party. Builds on the guest list's Filter
     (pick a group, then "Email these people"). Sending from the app needs
     the app's own web address verified in Resend (checklist item 1) and
     care with guests' emails (privacy list); a first version could just
     open the phone's email with everyone in Bcc, or copy the addresses.
  3. **Accommodation** isn't in the app at all — where guests are staying
     (the pub, a hotel block, at home). The owner sees it as one thing with
     transport: **how guests get there and where they stay**. Ties into
     **Journeys** below (a stay is a place on the map; "who needs a lift
     from the pub").
  4. **Everything about a guest belongs on their guest card** — so the card
     needs a "Getting there and staying" part (their accommodation, their
     lift), and those become guest list filters ("Staying at the pub"),
     which then feed 2. Would need new tables (places to stay, and who's
     staying where) hanging off `weddings` — additive, no rebuild.
- ~~**"Where things stand"**~~ — **built 13 Oct 2026** (canvas 2 "Where
  things stand · Round 2", option 1 + a cream line, owner's pick): the heart
  of the hub ring ("How it's going ›") opens `/standing`. A cream line
  ("34 things done so far · to-dos · payments · suppliers booked"), then a
  glass card each for People · Money · Plan · The Day · Areas: what's done
  as a big gold figure and a bar, what needs you (dashed "!", over budget a
  rose ▲), and the rest of what's done folded at the foot. Every line opens
  the screen filtered. Figures in `src/lib/where-things-stand.ts`, worked
  out each time, nothing stored. Not yet: the assistant opening it ("how are
  we doing?"); a "Lately" list would need booked/ready dates (no column yet).
- **A card of their own for guests** (owner, 13 Oct 2026: suppliers got a
  business card, what for guests?). Canvas 2 "Guest card · Round 1 · A card
  of their own": **A** a place card (table at the top, name large, role and
  day, meal and allergies, a "Coming" stamp — Claude's suggestion), **B** an
  addressed envelope (household address, RSVP as a postmark), **C** a
  keepsake polaroid with an optional photo. Same card body under each
  (Guest of, RSVP, Role, Details, Contact). Photos, if built: optional,
  initials by default, private bucket like Inspo, **never for children**,
  and on the privacy list. **Owner's pick: A, the place card** — built
  13 Oct 2026 (see People). No photos yet.
- **Reminders and notifications** (owner, 13 Oct 2026: "not something we
  thought about yet"). Two different things:
  1. **Badges inside the app** (no new services): a small count where
     something needs you — e.g. on the Plan tab and the Hub's This week for
     overdue things ("1 overdue"); possibly the home-screen app icon's own
     badge (iPhones allow it for a home-screen app once notifications are
     allowed). Colour: the rose already used for overspend, used sparingly —
     never alarming red everywhere.
  2. **Notifications outside the app**: "today: florist deposit £250",
     "tomorrow 2pm: venue visit", maybe a Monday "your week". On iPhone,
     web-app notifications only work for the **home-screen app** and need the
     person's permission; they need push keys, a service worker, and
     **something that runs on a schedule** to send them — a daily Vercel Cron
     job may be enough before the separate background worker (Architecture).
     Email is the other route (needs the app's own web address, checklist
     item 1).
  3. **Settings › Reminders**: on/off per kind (to-dos, payments,
     appointments, the weekly summary), when (on the day / the day before /
     a week before), quiet hours, by notification or email. Couples should
     choose; default gentle.
  Badges (1) could be built any time; notifications (2–3) need the
  scheduling piece. "Your assistant" can later write the weekly summary.
- **Journeys** (The Day's Transport, renamed; parked 12 Oct 2026, owner's
  "fun idea"): canvas 2 "The Day · Journeys". Owner's pick: **B** — the
  day's journeys down a gold thread in time order, a tiny map on each card,
  a List | Map switch, "71 guests · 6 without a lift" and a dashed card for
  those six — with **C**'s journey page (route on the map, vehicle as
  picture tiles: Coach · Minibus · Vintage car · Limo · Taxi · On foot), but
  **guests as initial circles** (like the guest list's) filling the seats,
  not squares. Needs: a map service (Google Maps or Mapbox: account + key;
  guests' addresses go to it, so add it to the privacy list) and a vehicle
  type column on `transport_runs`. B works without the map, so it can come
  first.
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

- **Design canvas 3** — from 14 Oct 2026 (Household rounds 1–3, the
  envelope; Guest card round 2, the profile; Groups round 1 — groups of
  guests, e.g. "Staying at the pub", and emailing a group, not built yet): https://claude.ai/artifact/TiZtToD5m6cEKxfu8PYbLL
- **Design canvas 2** — from 11 Oct 2026; **now full too** (its 40th page,
  "Name · Rondé", was added 14 Oct 2026), so **start a canvas 3** (a new
  Design artifact) for the next round: https://claude.ai/artifact/K49dGyMgVvGpiSGNHx1aRB
- **Name Lab** — a this-or-that game for the name (`results` collection;
  not played yet): https://claude.ai/artifact/DAfW9wxPmNQLQEtGhgqZPP
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
**Speed, round 2 (12 Oct 2026; owner: tapping a page "takes a while").**
Supabase's logs showed the database answering in 10–100ms and pages already
asking in parallel, so the wait is the trip to Vercel itself. Now: the menu
bar and sidebar links **fetch each tab in full ahead of time** (`prefetch`),
the phone **keeps screens for a short while** (`staleTimes` in
`next.config.ts`: 30s for ones it visited, 60s for ones fetched ahead —
any save clears it, so your own changes show at once; a partner's edits can
take up to a minute), and Vercel's **Fluid compute** is on (`vercel.json`)
so fewer taps wait for a server to wake up.

### Design decisions still open

Raised with the owner and deliberately deferred to the screen that needs them —
each is an added column, not a rebuild:

- **Meal choices** are free text; there's no list of set-menu options to pick from
- **No RSVP deadline** field, so nothing can show who's overdue
- **No budget** beyond per-supplier cost; a real budget view needs a new table
- **Milestones assign only to people with a login**, not to any contact
- **Children are a yes/no flag**, with no age tiers for catering
