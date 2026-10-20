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

## What Claude decides alone (owner, 15 Oct 2026)

The owner delegates. Rule one above still comes first.

- **Just do it, tell the owner after:** bringing older screens and forms
  into line with settled patterns and `docs/DESIGN.md`; the backlog's small
  odd-ones-out; fixes, tidying, speed.
- **Build it, then the owner checks on their phone:** new pieces that
  follow a pattern that already exists (e.g. groups on Seating, the
  assistant writing a group email).
- **Always the owner's call:** anything about people's data (who sees it,
  where it goes, how long it's kept); any database change; anything that
  costs money; new tabs or big changes to how the app is organised; the
  Hub's look, the brand and the name; choosing between design options.

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
- **Hub** (`/`): names, hub ring (its heart — the days to go, "DAYS TO GO ›"
  since 16 Oct 2026, owner; the "How it's going ›" line under it is gone —
  opens **Where things stand**, `/standing`, 13 Oct 2026; see Backlog), then under the ring (canvas 2, "Home ·
  Round 2 · Calm under the ring", option B, owner's pick 13 Oct 2026; was
  "Home · Under the ring" B): one quiet glass pill, the assistant's gold pen
  mark and **"Ask your assistant"** in italics (canvas 2 "Hub · How to reach
  the assistant", A, owner's pick 13 Oct 2026 — says assistant, never "AI";
  the Hub stays the most beautiful screen, so no line of examples under it),
  opening **Your assistant** full screen (`AssistantSheet`; "Your assistant ·
  Round 3 · Opening it", A's centred "What can I do for you?" and box, with —
  since 17 Oct 2026, owner: the grouped rows looked messy — **one flat set
  of five pills with a small icon each** under it (who hasn't replied,
  what's left to pay, what's on this week, add a guest, a thought for later; `PROMPTS` in `assistant-sheet.tsx`); a
  conversation once you ask) — then **This week** on one glass card
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
  icon's name is stored in `areas.icon` (`0016_area_icon.sql`; Attire's
  default is a **dress**, and a **suit** is in the search — both drawn for us
  in Lucide's style, `src/lib/clothes-icons.ts`, since Lucide has neither;
  16 Oct 2026, owner: "a t-shirt doesn't feel right"; until it's
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
  planning). Then the **five stages** — **Ideas · Quotes · Booked · Paid ·
  Ready** (`src/lib/area-stage.ts`; renamed 16 Oct 2026 from Dream · Compare ·
  Book · Pay · Ready, owner: Dream and Compare read alike — now each is named
  after what ticks it): Ideas = an Inspo picture or key facts; Quotes = a
  supplier at "Quote in"; Booked = a supplier booked; Paid = booked and
  nothing left owing; Ready = the couple's tap. "We're doing this ourselves"
  (`areas.diy`) skips Quotes and Booked. Then **the tabs, filtered to
  this area** (canvas 2 "Area page · Made of the tabs", option A, owner's
  pick 12 Oct 2026 — so the page reads as People, Plan and Money for one
  area): four sections, each headed like its tab with **that tab's icon from
  the menu bar** (People, Plan, Money, The Day; "Just for [area]" uses the
  area's own icon — owner, 12 Oct 2026, in place of the title drawings, and
  no line of explanation under each heading) and an "In People › / In Plan › / In
  Money ›" link to the tab filtered to the area. **Suppliers** (headed
  "People" until 16 Oct 2026, owner; its suppliers:
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
  **Tidied 16 Oct 2026** (owner: "go ahead"): the empty cover is shorter
  (220px until there are pictures, 300px after) and its camera circle is
  gone — the soft tiles and "Save an idea" both open the save form; spaced
  capitals only on section names ("PEOPLE", "KEY FACTS") — "In People ›",
  "+ Add a supplier", "1 other", "Set it ›" are sentence case; supplier
  rows show initials with the stage badge (`StageIcon`, as on the Suppliers
  list) and the stage in words under the name, so long names fit.
  **Later on 16 Oct 2026 (owner):** the last section is "**Attire notes**"
  (the area's name + "notes"), not "Just for Attire"; the icon beside the
  name has **no black pen badge** any more (it read as "save an idea"; a tap
  still changes the icon).
  **Section headings, 16 Oct 2026 (owner):** "In People ›" / "In Plan ›" /
  "In Money ›" are gone. Each heading now has the **round black +** on its
  right (`AddButton`; People → add a supplier, Plan → the To-do |
  Appointment form, Money → a payment, The Day → a moment, Just for … → a
  note) and the **heading itself** (icon, name, ›) opens the tab narrowed to
  the area. The "+ Add …" lines at the foot of the cards went with it
  (Transport's "+ Add a car or coach" stays). A section with nothing in it
  is just its heading and +, no empty card.
  **Rebuilt 17 Oct 2026** (canvas 3 "Area page · Round 5", **B + A**, owner's
  pick: "B is fab because you can zoom back to stage 1"). Top to bottom: the
  cover (name, and **the page's one black +** — `AddMenu`: a supplier, a
  to-do, an appointment, a payment, a moment, an idea, a note — the black +
  on every section is gone); a white **Next up** card worked out from the
  stage (save a first idea → get a quote from … → pick between your N quotes
  / book … → pay … by … → anything left to sort? → "All sorted. Ready to
  dance."), with "Then: …" the next to-do or appointment; the **five stages
  down a gold line** (`<details name="area-stages">`, so opening one closes
  the others; the current one opens, a tick for done, dashed for to come):
  Ideas (pictures + key facts, `#ideas`), Quotes (who's quoted / in touch, +
  Add a supplier, DIY), Booked (the booked supplier, or the quotes chart),
  Paid (what's still to pay), Ready (We're ready); then **"Everything for
  [area]"** — one card of lines (Suppliers · Guests for Food/Stationery ·
  Plan · Money · The Day · notes), each a one-line summary that opens in
  place with "+ Add …" and "In Plan ›" at its foot (`Everything` in
  `area-view.tsx`). Links to `#payments`, `#notes`… open the right part
  (`open-on-hash.tsx`). **One rule for each stage's grey line** (owner,
  19 Oct 2026: "all the subtext is different"): what it holds in a few
  words, "Not yet" when empty — Ideas "4 ideas" (or "Key facts"), Quotes "2
  quotes" (or "1 in touch"), Booked the name, Paid "£1,200 to go" / "All
  paid", Ready "Ready". **Quotes keeps every quote, the booked one too**
  (owner: still good to see them once one's booked). The earlier sections
  below are kept for reference.
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
  ring is its picture. Sharp vector versions are a to-do. **Replaced 16 Oct 2026** (canvas 3
  "Tab tops · Round 1", option A, owner's pick): every tab's top is now
  **one row** — the title at 32px on the left, the view switch on the right
  (`CornerSwitch` floats right, `PageTitle` sits beside it), **no back
  arrow** (the menu bar's house goes home) and **no title drawings** (owner:
  out of place in a modern app; the PNGs stay in `public/illustrations/`).
  Inspo, Your notes and Settings titles are 32px to match. **Guest list
  design settled 8 Oct 2026** (canvas "Guest list · Round 2"):
  `guest-browser.tsx`. **Reworked 9 Oct 2026** (canvas "Guest list ·
  Rounds 3–7"): no event switch any more. The card is a big **Guests** tile (champagne when picked; was dark until 12 Oct 2026)
  with **three small numbers** beside it — Coming · Invited · To invite, the
  furthest step first like Suppliers (owner, 17 Oct 2026; it was four, which
  felt messy). **The big number is everyone still expected** (those three
  added up), so people who can't come aren't in it (no line about them on the card —
  it looked off, owner 17 Oct 2026; **View › RSVP** shows them under "Can't
  come", and the list itself still shows everyone, can't-come faded with
  their ✕). The big number is large (64px, 50px from 100 guests up) — every one is a button
  that shows just those people. **The card counts whatever the filters
  leave**, by each guest's answer for their own event. Then search with a
  **Filter** button that drops down a small menu (Day guests · Evening
  guests, then Bridal party · Dietary needs · Children · No address yet,
  any mix); with filters on, the button goes dark with a count and each
  filter shows as a pill to take off (on their own line). Search has a round black + (add a guest) at its end; the line under it has
  Filter on the left and the order ("BY FIRST NAME ⌄") on the right — tapping that is **Sort**: first name, surname,
  household, **group** (16 Oct 2026: under each group's name, A–Z, someone
  in two groups shows under both, the heading opens the group, then "Not in
  a group"), or **event** (day guests then evening; 9 Oct 2026; no separate sort
  button by the search); at the foot of the list one **"Edit events"** link
  (16 Oct 2026, owner; was "Rename the day · Rename the evening · Add an
  event") opens a card listing each event — tap its name to rename, Where,
  Remove (asks; its answers go too) — and "+ Add an event" (`edit-events.tsx`).
  **Rows (rounds 8–12):** initials, the name with "day" or "evening"
  after it in gold italic (a guest's *type* is the first event they're
  invited to — events come in date order — so no new column), a **gold
  star badge on the initials** for anyone with a role (canvas Round 15,
  option 1 — no role pill under the name any more; the role itself is on
  the card and in Filter › Bridal party; the laptop table keeps its Role
  column), and their answer as **one small
  round icon** on the right (canvas Round 14, option A: ✓ on gold coming — ink until 13 Oct 2026, when it was made gold and 26px so it doesn't compete with the black + —
  envelope on champagne invited, dashed envelope to invite, ✕ on grey
  can't come, dashed ? not yet day or evening — `AnswerIcon`; **16 Oct 2026**: 22px, Invited a solid gold ring, To invite a dashed gold one, Can't come a darker grey, so none fade into the page; and **no chevron** at the row's end — owner), with a key
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
  "day guest", then three figures across — Answer · Table (`guestSeating()`
  in `src/lib/db/day.ts`; each figure scrolls to its row since 19 Oct 2026) · Meal — and
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
  Booked stays on the count card; **since 17 Oct 2026 like the guest
  list's**: one list of rows — Area · Stage (In touch · Quote in · Booked ·
  Not taken) · Money (Still to pay) · Contact (No phone or email) — each
  opening its values, a sheet on phones with "Show N suppliers"; the count
  card's tiles are the Stage filter (`stage:booked` in `?f=`; old `?show=`
  and `nottaken` links still work) and count whatever the other filters
  leave; the All number is the guest list's size, 64px; View has Order ·
  Name and Group by · Area · Stage; every heading folds, Not taken starts
  folded),
  then everyone **grouped by area, A–Z** with Other last (owner, 17 Oct
  2026: Venue first felt wrong) (heading shows a
  count, "1 supplier" / "0 suppliers", like the guest list; within a group booked → quotes → asked →
  not taken). **Rows are phone-book entries** (Suppliers round 2, A, 12 Oct
  2026): initials with the **stage as a badge** on them (✓ gold booked, ink until 13 Oct 2026 · £
  champagne quote in · dashed ? asked · ✕ grey not taken — `StageIcon`
  with `badge`, like a guest's role star), the business and the contact
  person, then round **Call** and **Email** buttons on the right; no quote
  on the row. A missing phone or email shows as a **faded dashed button**
  that opens the card with that box ready to type in (`editField` →
  `TextRow startEditing`). A key under the list. **View** (like the guest
  list's, on the left with Filter on the right since 17 Oct 2026; was Sort): By area (default) or Name, A–Z
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
  more. **A missing phone or email shows on the card too** (16 Oct 2026,
  owner): a faded dashed Call / Email button, like the list's, that scrolls
  to that box in Contact ready to type. Before that, from 12 Oct 2026, it was **the add-a-supplier form itself, filled in** (`SupplierForm`
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
  **The numbers card never changes shape** (owner, 17 Oct 2026: "for any
  filter now, we don't want to change the UI"): the same card — All · Coming ·
  Invited · Can't come, with its home count — whatever is on; filters, a day
  or evening, a group only change its numbers. (The 14 Oct "card for every
  filter" summary card, its tally and "Add up by" switch are gone;
  `guest-summary.tsx` keeps only the types and `CopyButton`.) **The list does
  the breaking down**: Filter › Dietary needs, then View › Dietary needs reads
  "Vegetarian · 5 guests", "Vegan · 3 guests"… (details below). One thing
  sits under the card when the list is about diets: **Copy the list for the
  caterer**.
  **Sort became "View" (17 Oct 2026, owner):** one pick sets how the rows
  are grouped and, for two of them, the filter behind it. The menu has three
  small headings — **Order** (First name, Surname), **Group by** (Household,
  Group, Event, **RSVP**, **Age group**, **Table**, **Staying**, Meal choice)
  and **Show only** (Bridal party, Dietary needs) — **Bridal party**
  switches the Bridal party filter on (grouped by role) and **Dietary needs**
  the Dietary needs filter (grouped by need); First name, Surname, Household,
  Group, Event and Meal choice just group. The filter shows as a pill, can be
  taken off, and others can be added from Filter (day/evening, children…);
  switching view takes off the filter the last view added. Views that filter
  aren't remembered on the phone (the filter wouldn't be); the others are.
  **View sits on the left, Filter on the right** (owner: View is the bigger
  choice); the button is a list icon (same weight and colour as Filter's) and the current view's name ("☰ Household ⌄"). The numbers card (All ·
  Coming · Invited · Can't come) is unchanged.
  **Filter is one list of things to filter by** (17 Oct 2026, owner picked
  option A on canvas 3 "Guest list · Filter reimagined"; it replaced the
  Show only / Groups / Narrow to mix, which felt higgledy-piggledy): rows
  **Event · Group · Role on the day · Dietary needs · Meal choice · Age ·
  Address**, each opening its own values with counts; tick several within a row (any
  of them), rows combine (Bridesmaid + Vegetarian = vegetarian bridesmaids). Role and
  Dietary start with an "Any" line (the Bridal party / Dietary needs filter);
  ticking a value turns Any off, ticking Any clears the values. A row shows "2 picked".
  Group stays one at a time (closes the menu). Specific picks live in the
  address (`?s=diet:Vegetarian|role:Bridesmaid`), the numbers card follows.
  The big Guests tile reads the number, then "39 households" (no repeated
  "guests"). Option B (chips under the search) wasn't picked.
  **People who can't come** sit at the foot of the list in a **folded "Can't
  come" group** (open it with its chevron), so the list agrees with the
  Guests number; search and View › RSVP still show them in place.
  **Every heading folds** (a chevron on its right, in the phone list and the
  laptop table; open by default, not remembered). The one thing kept on the
  card is **Copy the list for the caterer**, shown when the list is about
  diets. Filters always combine; No address and groups show the headline
  only. A group's own **Filter › Groups** keeps a summary card titled with
  its name and a pill to take it off.
  Filters stay under the card; on phones **Filter opens
  as a sheet from the bottom** with "Show N guests" (owner, 14 Oct 2026:
  the growing card pushed the dropdown away; moving search and Filter above
  the card was tried and dropped — it split Sort from its list).
  **Dietary needs are picked from a list** (14 Oct 2026; `src/lib/dietary.ts`,
  `DietaryPicker`): Vegetarian, Vegan, Pescatarian, Gluten-free, Dairy-free,
  Nut, Shellfish and Egg allergy, Halal, Kosher — typing finds them ("veggie",
  "coeliac"), "+ Add '…'" only when nothing matches, and a couple's own are
  offered to other guests. Stored in `rsvps.dietary_notes` joined with " · "
  like roles (no migration). On the guest card ("Dietary") and Add a guest.
  **A group opens as a card up from the bottom** (17 Oct 2026, owner: like a
  household, not filtering the page): tapping a group's heading in Sort ›
  Group (or a group pill on a guest's card) opens `GroupSheet`
  (`guest-groups.tsx`, `?groupcard=`): name, "8 people · 6 coming · 2
  invited", Email them · Text · Edit, then "Who's in it" (each opens their
  card on top). **Filter › Groups** still narrows the list to that group
  (one at a time, `?group=`), with a normal summary card and a pill to take
  it off.
  **Groups of guests** (14 Oct 2026; canvas 3 "Groups · Round 1", all
  three screens, owner's pick; `0019_guest_groups.sql`, run 14 Oct 2026
  with the owner's OK): people who belong together — "The football lot",
  "Staying at the pub". A guest is in **one household** (where the post
  goes) and **any number of groups** (no address). Tables `guest_groups`
  and `guest_group_members` (both tied to `(id, wedding_id)`, so a group
  can't hold another wedding's guest; RLS like contacts; in
  `rls_isolation.sql`). Queries `src/lib/db/groups.ts`, actions
  `group-actions.ts` (return messages), screens `guest-groups.tsx`:
  **Filter › Groups** on the guest list (one at a time, `?group=`) swaps the
  numbers card for a **group card** — name, "8 people · 6 coming · 2
  invited", **Email them** (black) · Text · Edit (rename / remove; people
  stay). **Email them** opens a sheet: who, anyone with no email ("Add it"
  opens their card), subject filled in, optional message, **Open in my
  email** (mailto with everyone in **Bcc** — the app never sends or stores
  it), "Copy the addresses instead"; **Text** the same (warns a group text
  shows everyone's number). The **guest card's Groups** part (here and on
  the household page): pills (tap to show that group, ✕ to take them out),
  "+ Add to a group" with the others and a new-group box. **Groups on
  Seating** (15 Oct 2026): on the floor plan, "Not seated yet" starts with
  a dashed pill per group with people still to seat ("Football lot 4");
  tap it (its people light up), then a table, and they're all sat there
  (`seatGroup` in `floor-plan.tsx`; groups load only on the Seating tab).
  **"Ask your assistant to write it"** (15 Oct 2026) under the message box
  in the email / text sheet: type what it's about, a draft fills the box to
  change (`draftGroupMessage` in `src/lib/assistant/draft.ts`, one
  non-streaming call, effort low; `draftGroupMessageAction`). Only the
  couple's names, the date, the group's name and what they typed go to
  Anthropic — never the guests' names, emails or numbers; the sheet says so.
  Still to come: the app sending it itself (needs its own web address). Demo: "Football lot" became a group,
  and Rob, Ollie and Dev got households; "Staying at the pub" has 8.
  **Invitations page removed** (9 Oct 2026, owner's call): sending
  invitations is done by post, so it's a **Stationery** area job (that
  area and its "Send the invitations" to-do already exist), not tracking
  in the guest list. `/invitations` redirects to `/people`. The
  `invitations` table stays — RSVPs still hang off a household's row.
  **Adding a guest** asks "Guest of": the day or the evening; a day guest
  is put on that event and every later one, an evening guest on the
  evening only (`saveGuestAction`).
  **Answer statuses** (9 Oct 2026): **To invite** (`to_invite`, new in
  `0013_to_invite.sql`) → **Invited** (`pending`; **shown as "Yet to
  respond"** since 19 Oct 2026, owner: clearer) → **Coming** / **Can't
  come**. New guests start at To invite and are moved on from their card
  (the "We've sent them" strip was taken out, owner's call). Until
  0013 is run, new guests go straight to Invited (`inviteGuestsToEvent`
  retries on error 22P02). Guests from before "Guest of" show "Day or
  evening?" and their card asks which (`setGuestOfAction`).
  **Household card** (screen 9) — **since 16 Oct 2026 a card over the guest
  list like a guest's** (owner): `?household=<id>` on `/people`
  (`HouseholdSheet` in `household-view.tsx`, sharing the guest card's frame,
  `CardSheet` in `guest-card.tsx`); opened from Sort › Household headings
  and the guest card's household name; old `/people/household/[id]` links
  redirect there. Name and address are **Details rows like the guest
  card's** (icon, label, value; tap to change; Copy beside the address).
  **Topped by an envelope** (`household-envelope.tsx`): the front only —
  the name in calligraphy (Pinyon Script, `font-script`, loaded in
  `layout.tsx` for this alone), the address in plain italic, a gold double
  border on white card — with a gold **postmark** in the corner saying how
  replies stand ("Replied 1 of 3", "All coming", "Invite not sent"). **It no
  longer turns over or opens** (owner, 16 Oct 2026: the invitation inside was
  for the guest, not the couple, and only repeated the Guests list a tap
  away; the turning envelope of 14 Oct and canvas 3 "Invitation · Round 1"
  were dropped). Then "3 people · 1 child · day guests", round **Text · Call ·
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
  **Less flat, 16 Oct 2026** (owner: "quite flat"): the month (‹ name ›,
  the +, the grid; a "7 months to the wedding" line was tried and taken out —
  the Hub counts down) sits on a **glass card**;
  **today is a solid gold disc** with white numerals; days with something on
  them are darker than empty ones; the to-do circle and appointment mark
  are a size up; the month's list sits straight on the page under a hairline
  (a second card competed with the calendar's — owner asked; no gold rule),
  with "still open from before" just above it.
  **Then, later on 16 Oct 2026 (owner):** the black + left the month card
  for the key's row under it (key left, + right, like Guests' search row),
  so ‹ the month › sits centred on the card; "Undated" left the key's row
  for the foot of the list — a heading like the month's and Done's
  ("UNDATED · 6 items"), and since the same day a **fold that opens in place
  like Done** (owner: one opened a pop-up, the other expanded).
  **Then (owner's list, 16 Oct 2026):** the list has a heading like Done's
  — the month's name left, the count right ("OCTOBER · 4", "DONE · 1"), no
  divider; "3 undated" is now quiet stone text "Undated ›" beside the
  key. **Every row's line is one pattern** (owner, 16 Oct 2026): the date
  first in **bold gold** ("20 Oct · Flowers"); overdue turns the date rose
  with "· Overdue" after it ("15 Oct · Overdue"); an appointment adds its day
  and time after the date ("24 Oct · Sat 2pm · Ashcombe Barn"). No "By".
  **Replaced the same day by one row for all three** (owner: the Hub's
  This week, Plan and Money rows were three styles): **the date large on
  the left** (`DateStamp`, `src/components/date-stamp.tsx` — the day in gold,
  month under; rose overdue, grey done, ink "Today"; "–" / "No date"), then
  the title and a grey line (to-do: "Overdue" + area; appointment: "Sat 2pm ·
  where · with …"; payment: "Overdue" / "Paid 3 Oct" + who) and the amount,
  then **the mark on the right**: tick circle (to-do), little calendar
  (appointment), £ circle (payment; `PaymentRow`, `src/components/
  payment-row.tsx`, with Undo). No chevrons. **The grey line is one rule
  everywhere** (owner, 16 Oct 2026; `RowLine`, `src/components/row-line.tsx`):
  **short, at most two facts** (owner, later 16 Oct 2026 — no kind word,
  the mark on the right says it): a status only if off or finished
  ("Overdue" in rose, Done, Been, Paid 3 Oct), then an appointment's day and
  time, then who it's with or paid to — **the area only when there's no
  one** (and left off where the list is already one area). "Fri 10am · Wild
  & Gather", "Overdue · Flowers", "Wild & Gather". Used by `MilestoneRow`,
  `AppointmentRow`, Money's By month, area pages' payments, and the Hub's
  This week (weekday under the date there). The tab's top (back arrow, corner switch, title + drawing) is
  the shared pattern on every tab — left as is.
  Counts say "4 items" / "1 item" (a bare number didn't say what it
  counted); row dividers in Plan's lists are darker (`border-ink/[0.12]`
  rather than linen), within the page margins (full width tried and taken
  back), with one above the first row too; pages with the floating pen end 160px clear
  (`pb-40`, was `pb-28`) so the last row can scroll out from under it.
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
  **List rebuilt 16 Oct 2026 (owner: "it's a mess"), shaped like the guest
  list** (`plan-list.tsx`): a **search box with the round black + at its
  end** ("Find a to-do or appointment", `&q=`), then **View** left (Date · Area, grouped
  with headings · A–Z; kept on the phone, `plan-list-sort`; since 17 Oct 2026,
  was Sort on the right) and **Filter** right (Show
  To-dos · Appointments `&show=`, When `&when=`, Area `&area=`), a quiet count ("5 to do · 2 appointments"), then **to-dos
  and appointments in one list** on a glass card (search finds both); done
  to-dos and been appointments in a Done fold. The To-dos | Appointments
  switch and the big "23 *to do*" are gone; old `&kind=appointments` links
  open Show › Appointments. `todo-list.tsx` was removed.
  **Before that,** the List (`?view=list`, `todo-list.tsx`) was **what's left to do**, one
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
  week before the day), area tiles, and notes always open; appointments: the
  name as free text, the date card (quick picks — where suggestions help
  most), the time (the phone's own picker), **then the area, then Where and
  who** — "With" lists only that area's suppliers once one's picked (all of
  them if it has none). **16 Oct 2026, owner:** the name ideas and time
  quick taps were taken out (on the add form and the appointment card), and
  the area moved above Where and who.
- **Everything opens as a card** (16 Oct 2026, owner: "look at something
  in a card, add something new on a full screen" — "makes all the tabs feel
  really cohesive"). To-dos, appointments, payments, run sheet moments and
  Inspo ideas open as a **card over the page** wherever they're tapped
  (Plan, the Hub's This week, area pages, Money, The Day, Inspo and the
  inbox's pictures, a note's "See it", the assistant's answers):
  `plan-cards.tsx`, mounted once in the `(app)` layout; `?todo=` /
  `?appointment=` / `?payment=` / `?moment=` / `?idea=` in the address, set
  by `CardLink` (`src/components/card-link.tsx`; keeps the real href for
  long-press; `onOpen` runs too, so the assistant closes itself). Guests,
  households and suppliers already had cards; a journey's Travel card
  (`?open=run:<id>`) now edits its own details too (the area page links
  there). **Edited in place like the guest card** — the owner's rule,
  16 Oct 2026: *taps save at once, typing gets a small Save*
  (`plan-card-body.tsx`: `TodoBody`, `AppointmentBody`, `PaymentBody`,
  `MomentBody`, `IdeaBody`, plus `TitleEditor`, `TimeCard`). One action
  saves a field: `updatePlanFieldsAction` in `plan/card-actions.ts` (named
  fields per kind only); `removePlanCardAction` removes. `DateCard` takes
  `clearable={false}` where a date is required. **Opening and closing must
  use `replaceQuery(…, { sync: true })`** (16 Oct 2026 bug: plain
  `replaceQuery` hands Next.js the current history entry, which marks the
  change as its own, so `useSearchParams()` never heard it — an Inspo
  picture did nothing on tap and its card wouldn't close). Card frame: `CardSheet`,
  `src/components/card-sheet.tsx`. The old full edit pages still work for
  old links.
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
  balances (faded rows, tap to add with a date); Paid folded at the foot (like Plan's Done since 17 Oct 2026).
  **17 Oct 2026 (owner):** both views read the same under the top card —
  a search with the round black + at its end (`money-search.tsx`, `?q=`;
  By area finds areas and suppliers, By month payments; the top card
  ignores it), then Filter. Food & drink shows **£… a head** (agreed, or
  the budget until something's agreed, ÷ everyone still expected —
  `expectedGuests()` in `src/lib/area-guests.ts`; only the count reaches
  Money) on its card and money sheet. Quote comparison options are on
  canvas 3 "Money · Comparing quotes" (A side by side, B against the budget
  line, C pick one, then book). **Built 17 Oct 2026 as B with A's tap**
  (owner): `QuoteCompare` (`src/components/quote-compare.tsx`) — a bar per
  quote, cheapest first, a black line at what's left of the area's budget
  (budget − agreed), over runs on in rose stripes with "▲ Over by £…".
  Shown when an area has two or more quotes in and no one booked: on the
  area page's Suppliers (a tap opens the supplier card in place) and in
  Money's area sheet (a tap opens the area page with that card).
  **Later 17 Oct 2026 (owner):** By month's payments sit on **one card**
  with a heading per month inside it ("NOVEMBER 2026 · £600", like Plan's
  list) instead of a card per month; an area's money sheet lists To pay and
  Paid with the same `PaymentRow`s on a card. The laptop budget table was
  taken back out (owner skipped it).
  **Who's paying** (17 Oct 2026, owner's OK; `0022_contributions.sql`, run
  the same day): money coming in — who (typed, e.g. "Us", "Mum and Dad";
  matching guests come up to tap, linking `contact_id`, optional), how much,
  Promised · Arrived (`received_on`), towards an area or the whole wedding.
  Money's + › "Money towards it" (`/money/contributions/new`, `[id]` to
  change; `contribution-form.tsx`, `contribution-actions.ts`,
  `src/lib/db/contributions.ts`); listed under the budget page
  (`/money/budget#paying`, `budget/paying.tsx`); the top card on By area
  shows "Money towards it £… · £… arrived" (follows the area filter). Not
  given to the assistant. In `rls_isolation.sql`.
  **Who's paying a bill** (17 Oct 2026, owner's OK; `0023_payment_payers.sql`,
  run the same day): family paying a supplier themselves — guests tagged on
  a payment like "Who's involved" on a to-do (`InvolvedKind` gains
  `"payment"`, `src/lib/db/involved.ts`; `InvolvedPart` with label "Who's
  paying" and "Us" while nobody's tagged, on the payment's card; "Us /
  + Someone else" on a new payment, `PeoplePicker`, `tagGuests`). Nobody
  tagged = the couple. Money's top card: "Bills family are paying £…"; the
  budget page's Who's paying lists them under "Bills they're paying". "Agreed" is the UI word for what
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
  papers (ivory, champagne, blush, sage), a slight tilt and a strip of tape.
  **Each note's paper and tilt come from its id** (16 Oct 2026, owner: in
  turn they read as pairs down the columns) — looks random, stays the same,
  never the same as either of the two before it (`papersFor()`). Until there are four, faded blank notes
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
  out) and **Travel** (`?tab=travel`; was Transport, old links land there —
  **built 15 Oct 2026**, canvas 3 "Travel · First version", owner's pick
  after "Travel · Round 1" was judged likely to grow like the guest list:
  it answers two questions only, *where is everyone sleeping* and *how is
  everyone getting there and back*; `travel.tsx`, `travel-actions.ts`,
  `src/lib/db/stays.ts`, `0020_travel.sql`, run 15 Oct 2026 with the owner's
  OK). Two figures (staying over · have a lift), **Staying** (each place
  with faces and a count; + adds one) and **Getting there and back** (each
  journey = a `transport_runs` row: time, from → to, how many aboard), each
  with a dashed "still to sort" card (staying, not sure where · no lift
  yet). Places, journeys and the two lists open as cards (`?open=stay:<id>`,
  `run:<id>`, `unsure`, `nolift`, `stay:new`); add people by search with the
  unsorted ones first. A guest has `staying` ('yes' / 'no' / null),
  `stay_id` (removing a place leaves them "not sure where") and `own_way`.
  The **guest card** has a Travel part (`guest-travel.tsx`). Left out on
  purpose until a couple asks: the map, nights, rooms, booking codes,
  vehicle types, texting times, hotels as suppliers (all on canvas 3
  "Travel · Round 1"). Editing a journey is done on its Travel card. Seats and passengers can only point at guests, tables and runs of
  the same wedding (composite foreign keys on `(id, wedding_id)`). The
  agenda's wedding-day line links here. Seating opens on the **floor plan**
  (screen 26, `floor-plan.tsx`, `0011_floor_plan.sql`): drag tables about a
  room (positions are % of the room, so it scales; never-moved tables sit in
  a grid), round or long, and seat people by tapping a name then a table.
  Adding a table has a **Round | Long** choice, Round to start (12 Oct 2026).
  A real top table shape (chairs on one side) was built 19 Oct 2026 — below.
  On a phone the room scrolls sideways rather than shrinking. The old cards
  are the **List** view (`?view=list`), where tables are renamed or removed.
  **The phone floor plan, 19 Oct 2026** (canvas 3 "Seating · Round 1 · The
  phone", **B**, owner's pick): the room stays a map with seat dots round
  each table — **a rose dot is a seat whose guest has a dietary need** (the
  number badge was taken off; owner asked to keep the dots). **Tapping a
  table opens it close up** (`table-view.tsx`, a `CardSheet`): the table
  large, initials in the seats (rose ring and the need written under anyone
  with one), free seats as a dashed + that opens "Who sits here?" (search,
  unseated guests), ‹ › or a swipe to the next table, "Sitting here" with ✕,
  Round | Long. **The chair is saved** (owner's OK, 19 Oct 2026;
  `0025_seat_number.sql`, run the same day: `seats.seat_no`, one guest per
  chair per table): tap a free chair and pick who sits in it ("Who sits in
  chair 3?", then on to the next free one); tap someone, then another chair,
  to move them or swap the two. `arrangeSeats()` (`src/lib/seating.ts`)
  draws chairs for both the map's dots and the close-up; guests with no
  chair (seated from the map, the List or the guest card) fill the free ones
  in name order, and the first chair chosen at a table saves everyone's drawn
  chair first (`pinSeats`, `seatGuestAt` in `src/lib/db/day.ts`,
  `seatAtAction`) so nobody jumps. **Tables snap to the room's dots**
  (owner, 19 Oct 2026): a 20 × 15 grid of square cells (`GRID_X`, `GRID_Y`
  and `defaultSpot()` in `src/lib/seating.ts`), the dots drawn in % so they scale with the room;
  arrow keys move one dot; tables placed before stay put until moved.
  **Three shapes: Round · Long · Top table** (owner's OK, 19 Oct 2026;
  `0026_top_table.sql`, run the same day, adds `'top'` to
  `seating_tables.shape`): a top table's chairs are all on one side — dots
  behind it on the map (so its people face the room), one upright row of
  chairs in the close-up ("Facing the room"). Long and top close-ups are as
  tall as their chairs need (`ROW` px each). The demo's Top table is one
  now. **Groups and households sit down together** (owner, 19 Oct
  2026): households of two or more join the groups' dashed pills under "Not
  seated yet" on the map (a house icon; tap it, then a table), and in the
  close-up "Who sits in chair N?" starts with "A whole group, in the free
  chairs" — a tap fills the free chairs in turn and says how many didn't fit
  (`seatManyAt` in `floor-plan.tsx`). People are then arranged by tap-to-move;
  dragging between chairs was offered, not built. The old panel under the plan is gone. Options A (pinch to zoom) and
  C (tables as cards) weren't picked. `DietLine` moved to
  `src/components/diet-line.tsx`.
  **17 Oct 2026, canvas 3 "The Day · Round 1", A (owner's pick): every view
  has the other tabs' bones** — a numbers card (`NumbersCard`,
  `src/components/numbers-card.tsx`: a big white tile and three figures),
  search with the round black + at its end, then View / Filter.
  Run sheet: Moments (first–last time) · Morning · Afternoon · Evening;
  "Find a moment" (`?q=`, `UrlSearch`, `src/components/url-search.tsx`,
  shared with Money) + Add a moment; Filter (area) with Print on its right.
  Seating: Seated (of N coming) · To seat · Tables · Seats free; "Find a
  guest or table" answers where someone's sitting (`seating-search.tsx`);
  the + opens **a full-screen New table** (`/day/tables/new`, name, seats,
  Round | Long; `addTableAndBackAction`) — the inline add form is gone; View
  (`ViewMenu`, `src/components/view-menu.tsx`) is Floor plan · List.
  Travel: Have a lift (of N coming) · No lift yet › · Staying over · Not
  sure where ›; "Find a guest" shows where they sleep and their lift; the +
  asks A place to stay (`?open=stay:new`) · A journey. Its section headings
  lost their own black +. Travel's open card now follows the address
  (`useSearchParams`, closing with `replaceQuery(…, { sync: true })`).
  **New journey** (`/day/transport/new`, `TransportForm` in `day-forms.tsx`,
  17 Oct 2026): the vehicle large with **picture tiles** that name it in a
  tap (Coach · Minibus · Wedding car · Taxi · A lift · On foot), the time
  card (quick-time chips taken out, like appointments), From → To, **Who's
  going** (`PeoplePicker`, everyone coming; saved as passengers after the
  journey, `saveTransportRun` now returns the id), notes folded.

- **The menu and Drinks** (18 Oct 2026; canvas 3 "Food & drink · Round 1",
  owner picked A + C; `0024_menu_and_drinks.sql`, run 18 Oct 2026 with the
  owner's OK). On the **Food & drink** area page, two more lines in
  "Everything for Food & drink" (`food` in `area-view.tsx`, `FoodSummary`):
  **The menu** → `/menu` (`menu-editor.tsx`): the menu as a printed card —
  couple, date, then courses (Canapés, Wedding breakfast, Evening…, each
  with a time, a note and "evening guests join") and their dishes, tagged
  V · VG · GF with an optional "Vegetarians: …" line; tap to change, "+ Add
  a dish" under each course, the black + adds a course; **Copy for the
  caterer** and **Print the menu**. **One menu for everyone** (owner: a
  choice of dish is the edge case, so no per-guest picking; a guest's meal
  stays free text). **Drinks** → `/drinks` (`drinks-editor.tsx`): numbers
  card (bottles, to order, ordered, not decided), grouped Fizz · Wine · Beer
  and spirits · Soft and hot, each with how much, when, who supplies it; the
  circle on the right moves it on (to order → ordered → delivered). Tables
  `menu_courses`, `menu_dishes` (tied to `(id, wedding_id)`), `drinks`; RLS
  like groups, in `rls_isolation.sql` (passes against a scratch database
  with all 24 migrations); queries `src/lib/db/menu.ts`, actions
  `menu/actions.ts` (return messages). No guest details in them, and the
  assistant isn't given them. The demo wedding has the canvas examples.
  **Not built yet:** adding on its own full screen (it's a small form on the
  same screen for now — the owner's "adding is a full screen" rule),
  suggested drink quantities ("a rough guide"), the menu's times showing on
  the run sheet, showing the printed card on the area page itself (offered:
  the owner hadn't seen it as it's one tap inside the line).

- **Decor, its own special area** (19 Oct 2026; canvas 3 "Decor · Round 2 ·
  Its own area", owner's pick — it replaced the 18 Oct plan of a Decor list
  inside every area; `0027_decor.sql`, run 19 Oct 2026 with the owner's OK).
  Decor is an area like any other (a dot on the ring; "Decor" is a starter
  area and the first idea in the ring's +), but its page (`isDecorArea()` in
  `src/lib/decor.ts`: key `decor`, `decorations` or `styling`) shows **its
  things** in place of the five stages: a numbers card (Things · Still to
  get · Got it · Packed), then the things **grouped by where they go**
  (Ceremony, Arrival and entrance, The tables… or the couple's own place;
  `PLACES`), each row how many, the name, where it's from and who from, and
  a circle that a tap moves on (still to get → got it → packed → given back
  for borrowed or hired). Next up comes from the things (`decorNextUp()`).
  A tap opens **the thing's card** (`?thing=`, `ThingCard` in
  `decor/decor-things.tsx`, edited in place): where it's at, Own · Borrowed ·
  Hired · Bought · Made, where it goes, how many, **from** (a guest or
  supplier picked from the list, or a typed name), collect and give-back
  dates, **who sets it up** (guests and suppliers, `decor_helpers`, plus
  typed names), notes. Adding is a full screen (`/decor/new`,
  `decor-form.tsx`, `?back=` the Decor page or the pack list). **The Day ›
  Decor** (`/day/decor`, `PackList`): the same things as the day's pack list
  — Before the day (to get or collect, by date), Set up at the venue (each
  place, its things, the helpers' initials), After the day (what goes back,
  to whom; the circle marks it given back). **The Day is one day with its
  pieces** (canvas 3 "The Day · Round 2", option 1, owner's pick, built
  19 Oct 2026; `day/day-pieces.tsx`): the Run sheet · Seating · Travel
  switch is gone; the run sheet ("The Day") has **"Pieces of the day"** under
  its numbers — three white tiles, Seating · Travel · Decor, each an icon
  and one fact (`PieceTiles`); a piece opened has a champagne **"The Day ›"**
  pill above its title (`DayPill`, no back arrow) and **"Also in the day"**
  pills at its foot (`AlsoInTheDay`: The whole day and the other two). Owner's calls: people picked from
  the list, no price (money stays in Money), no photos yet. Nobody is told,
  and the assistant isn't given any of it. Tables `decor_items`,
  `decor_helpers` (tied to `(id, wedding_id)`; RLS like groups; in
  `rls_isolation.sql`, which passes with all 27 migrations); queries
  `src/lib/db/decor.ts`, actions `decor/actions.ts` (the card's return
  messages). **The word is "items"** (owner, 19 Oct 2026, over pieces,
  details or bits and bobs: "Items", "Add an item", "Start your decor
  list"); the code still says things (`ThingCard`, `?thing=`). The demo
  wedding has a Decor area (the owner's own, leaf icon) with 20 items, lent
  from suppliers, family or a typed friend, 11 with helpers (also in
  `demo-wedding.sql`). **Guests don't tend to lend things** (owner, 19 Oct
  2026): the From list puts suppliers first, then "Someone else (type a
  name)", then "Family and friends on the guest list" (`FromSelect`); a
  guest card's "Lending: …" line was dropped as not worth it.

- **Stationery, its own special area** (19 Oct 2026; canvas 3 "Comms ·
  Stationery" and "Sent · Round 1", B — agreed with the owner; **no database
  change**: a sending is a `timeline_entries` row of kind `save_the_date` /
  `invitation` / `thank_you` with `how` and the household, or the guest when
  they're in no household). Like Decor, its area page (`isStationeryArea()`
  in `src/lib/stationery.ts`: key `stationery` or `invitations`) swaps the
  five stages for **What you send** (`WhatYouSend` in `area-view.tsx`): Save
  the date · Invitation · Thank-you, each "31 of 43 households", a bar, how it
  went ("Posted and emailed") and "12 to send ›"; the thank-you is faded
  until after the day. Next up comes from them (`stationeryNextUp()`). A line
  opens the **guest list's View › Sent** (`/people?view=invitation`; also in
  the View menu under "Sent"): a card with the count, the bar and **Send to
  the 12**, then guests under "Not sent yet · 12 households" and "Sent". Send
  opens **`SendSheet`** (`src/components/send-sheet.tsx`): How (Email · Post ·
  By hand · Text, with how many can be reached each way), who (ticked, untick
  any), anyone with no email/address (tap to open their card); Email/Text open
  the couple's own app (Bcc) then **"Did it go?" → "Yes, mark 8 as sent"**;
  Post/By hand ask the day and mark. **Marking an invitation moves those
  guests from To invite to Yet to respond.** Follows the guest list's filters
  (so "just the evening guests" works). **Sent to them** on the household card
  (and a guest card with no household; `sent-to-them.tsx`): the three, a gold
  tick with "Posted 3 Mar" or dashed — tap to say how (today), or take it off
  (answers stay). Entries show on the household's timeline too, and **on Stationery's own area timeline** (19 Oct 2026, owner kept area timelines): gathered into one line each, "Posted to 12 households" (`groupSendings` in `loadTimeline`; taken off from a household's card). Queries
  `src/lib/db/stationery.ts`, actions `stationery/actions.ts`. Nothing is sent
  by the app; the assistant isn't given it. **Not built:** gifts and
  thank-you notes (needs a small gifts table — owner's OK first), "Did it
  go?" after a group email, extra sendings of the couple's own ("+").

- **Children, properly** (19 Oct 2026; canvas 3 "Children · Round 1", **C**,
  owner's pick; `0033_children_meals.sql`, run the same day with the owner's
  OK). Every guest has a **meal** — Adult · Child's · No meal (a baby) — and
  **Drinks** — Alcohol · Soft drinks only (`contacts.meal_kind`,
  `no_alcohol`), because both decide what the caterer charges. Picture tiles
  (`MealPicker`, `src/components/meal-picker.tsx`) on the guest card
  (`MealRow`, saves on each tap) and on Add a guest. A child's or baby's meal
  starts them on soft drinks; change it after. **`is_child` follows the meal**
  (true for anything but an adult meal) so every old filter, count and
  assistant lookup still works; `src/lib/meals.ts` holds the helpers
  (`mealKindOf`, `mealCounts`, `mealCost`). Food & drink's page shows adult /
  child's / no meal, drinking vs soft bars, and **What it comes to**
  (`food-costs.tsx`): the caterer's price a head typed once (`areas.price_adult`
  / `price_child` / `price_drinks`) × who's coming, moving by itself when a
  guest changes. The caterer copy lists the meal and drinks counts. Only counts
  and prices are used; no guest details. **Not built:** the cost in Money's
  area card, a Filter › Meal/Drinks on the guest list, the assistant knowing
  the new fields (it still sets "is_child", which maps to a child's meal).

- **Food & drink through the day, and a schedule for each group** (19 Oct
  2026; canvas 3 "Food & drink · Round 2", **A + C**, owner's pick;
  `0034_food_moments_and_schedules.sql`, run the same day with the owner's OK).
  **A:** a course of the menu or a drink can be **served at a run sheet
  moment** (`menu_courses.moment_id`, `drinks.moment_id`). On a moment's card
  (any moment in the Food & drink area, or one with food linked) there are
  **Menu** and **Drinks** lines: tap a course or drink to serve it here, or
  "+ A course for [moment]" (named and timed like it); `setMomentFoodAction`,
  `linkFoodToMoment`. Food & drink's "Everything for…" line is now **Through
  the day**: its moments in time order, each with the dishes, drinks and chips
  for how many ("64 adult · 9 child's", "58 drinking · 17 soft" —
  `src/lib/area-food.ts`; a course for the evening guests too counts everyone
  coming, drinks before 18:00 the day guests). The menu page and Drinks list
  are unchanged; the demo's "Wedding breakfast" course was linked to its
  moment. `menu_dishes.for_children` is in the database for a children's menu
  but **not used yet**. **C:** a moment can be **for one or more groups of
  guests** (`run_sheet_groups`, tied to `(id, wedding_id)` both sides, RLS like
  groups, in `rls_isolation.sql`, which passes with all 34 migrations; a
  **For** line on the moment's card, `setMomentGroupsAction`). The run sheet's
  Filter gets **Whose schedule** (`?group=`): that group's moments in full, the
  day's others faded (hidden when printed), a header with the group's name,
  **Print it** and **Email it to [group]** (their own email, Bcc, the schedule
  written in; `send-schedule.tsx`). **A group's schedule works from groups**
  (owner: groups, not roles) — make a "Bridesmaids" group. Area and group
  filters combine, so Food & drink, Music and Photos each have a printable
  schedule too. **Not built:** tagging groups on the Add a moment form (only on
  the card), Music/Photos-specific chips.

- **Search across the whole wedding** (19 Oct 2026; owner: "search the
  word easels and it finds it all across the app"; owner picked **inside
  Your assistant** over a Hub button or a menu-bar button). Typing two or
  more letters in the assistant's box ("Search, jot or ask…") shows matches
  straight away under it, grouped (Guests · Suppliers · Plan · Money · The
  Day · Decor · Notes · Areas · Inspo · Food & drink); a tap opens
  the thing in its card or page and closes the assistant; **Send still asks
  the assistant**. No AI and nothing leaves the app: `searchWedding()` in
  `src/lib/db/search.ts` runs ilike queries as the signed-in person (RLS),
  six per kind, over guests (names, role, notes; "Jo Hale" across first and
  last name), households, groups, suppliers (business name), to-dos,
  appointments, payments, moments (incl. music), decor, notes (tick-box
  and bullet marks stripped), areas (name, key facts), Inspo, the menu, drinks, tables
  and places to stay — not addresses, phones or emails. `searchAction` in
  `search/actions.ts`; results in `components/assistant/search-results.tsx`.
  Works the same in the laptop top bar's assistant.

- **A moment's card, rebuilt** (19 Oct 2026; canvas 3 "Moment · Round 1",
  owner picked **B's cue card on top with C's lines underneath**): the cue
  card is the moment at a glance — the time large in gold, what happens
  (tap to rename), "where · who's in charge" in italics, its area as a tag,
  and the song as a chip (tap to play). Under it one line each — **When ·
  Where · In charge · Music · Notes · Area** — showing what's there or "Add
  …" in gold, each opening in place (`Fold` in `plan-card-body.tsx`).
  **One person in charge** (owner: "who" was ambiguous; "In charge" over
  Assigned to / Responsible), picked from the suppliers first, then
  "Someone else (type a name)", then guests (`FromSelect`;
  `run_sheet_items.contact_id`, `0031_moment_in_charge.sql`, run the same
  day with the owner's OK, tied to `(id, wedding_id)`, in `rls_isolation.sql`; the
  typed `who` stays for anyone else). **Played by and Presses play were
  dropped** (owner: it's whoever's in charge); 0030's columns stay unused.
  Music is A song | A playlist as a switch above the name, then the link.
  The run sheet and area pages show the in-charge name (`withInCharge()` in
  `src/lib/music.ts`); the band/DJ copy says "In charge: …". **The add form
  follows the card** (`RunSheetForm`): what happens with one-tap ideas, the
  time, where and in charge, then folded: a song or playlist (open from the
  Music area), notes, an area. Demo moments are put in their suppliers'
  charge (also in `demo-wedding.sql`).
  **The Music page's rows** (owner, 19 Oct 2026: "very, very busy"): just
  the moment's name and its song (music note), nothing else. **"Copy the
  music list" was taken out** (owner: the church, the venue and the DJ each
  need their own); instead **a moment's card has "Send it"** (`SendMoment`
  in `plan-card-body.tsx`): "Email The Velvet Notes" opens the couple's own
  email to the in-charge person's address (loaded with the card,
  `inChargeEmail`) with the time, date, place, song, link and notes
  written in, or "Email it" when there's no address; "Copy it" beside. The
  app sends and keeps nothing (so it can't know it was sent). **The Sound check
  list lives under the Music page's notes only** (it showed twice): "Start a
  sound check list" makes a note of tick-boxes filed under Music and sits
  there until a note starting "Sound check" exists.

- **Small follow-ups** (20 Oct 2026; Claude, under the delegation, no database
  change). **Money's Food & drink card** now has **What it comes to** (the
  caterer's prices × who's coming, `foodCost` in `AreaDetail`, from
  `areaGuestFacts` + `mealCost`; "Change the prices ›" opens the area page).
  **Guest list Filter** gets a **Meal and drinks** row — Child's meal · No
  meal · Soft drinks only (`childmeal`, `nomeal`, `soft` in `GuestFilter`;
  combine with the others like any filter). **Add a moment** has a folded
  "Put it on a group's schedule" (new moments only; `group_id` fields, saved
  through `setMomentGroups`; `saveRunSheetItem` now returns the id). **"Did
  it go?" after a group email or text**: after "Open in my email / Messages"
  the sheet asks; "Yes, note it" writes a `timeline_entries` row (kind email /
  message, `how`, the group, the day, "subject · 8 people" — never the message
  or who was in it that day), and the group card lists them under **Sent to
  them** (✕ takes one off; `logGroupMessageAction`, `groupMessagesAction`,
  `removeGroupMessageAction`). **Left for the owner:** the assistant knowing
  the meal fields (a guest's meal would go to Anthropic: rule one), and the
  Food & drink full-screen add / drink quantity guide (not done yet).
- **More than one run sheet** (20 Oct 2026; canvas 3 "Run sheets · Round 1",
  the owner's idea after "Schedule for": a bridesmaids' morning is too detailed
  for the main sheet; **`0035_run_sheets.sql` written, NOT YET RUN — waiting on
  the owner's OK**). "The day" is the main sheet (a moment with no `sheet_id`);
  **`run_sheets`** (name, optional `group_id` so it can be emailed, `sort_order`;
  tied to `(id, wedding_id)`, RLS like groups, in `rls_isolation.sql`, which
  passes with all 35 migrations) holds the others — Bridesmaids, Groomsmen, the
  photographer's list. Each moment is on **one** sheet; **Move to / Copy to** on
  a moment's card (**Run sheet** line, `moveMomentAction`; a copy is its own
  moment, `copyMoments`). On The Day a **picker** where the page says what it
  shows (`sheet-picker.tsx`, a sheet from the bottom with each sheet's count and
  "+ New run sheet"; `?sheet=<id>`); search, the black + (adds to the sheet
  showing), Area filter, Print all work on the showing sheet; a sheet tied to a
  group gets **Email it to [group]** (Bcc, from the couple's own email);
  **New run sheet** and **Edit run sheet** are full screens (`/day/sheets/new`,
  `/day/sheets/[id]`, `sheet-form.tsx`: name with ideas, optional group, and on a
  new one a blank start or copies of some of The day's moments; Remove asks and
  takes its moments with it). Queries `src/lib/db/run-sheets.ts` (empty until
  0035 is run). **The groups' schedules of 0034 are replaced:** the "Schedule
  for" filter and the "For" line / group picker on moments are gone; the
  migration turns each group that has tagged moments into a sheet of its name
  tied to it and **moves** those moments onto it (a moment for two groups moves
  to the first and is copied to the other), leaving the old tags unused. The
  area page's "In The Day ›" opens the main sheet only, so a moment that is only
  on another sheet isn't in it (not fixed). The demo seed isn't updated.
- **Money's and Plan's Filter are the same** (20 Oct 2026, owner: "do the same
  for Money and Plan"): rows that open in place, a sheet on phones with "Show
  N areas / payments / items" (`expandable` on `FilterMenu`). **Schedule for
  now filters** (owner: it only faded the rest), then became run sheets (next
  entry up).
- **The Day's Filter is like the guest list's** (20 Oct 2026, owner): rows —
  **Area** and **Schedule for** (a group: the bridesmaids, the groomsmen) —
  each opening its own values in place; on a phone a sheet from the bottom
  with "Show N moments", a menu on laptops; a pick keeps it open so the two
  combine (`expandable` on `FilterMenu`, `router.replace`; Money and Plan's
  List keep the plain menu). "Whose schedule" is now "Schedule for".
- **The Day's run sheet has no numbers card** (20 Oct 2026, owner: it doesn't
  need KPIs like the guest list). The top is now the three piece tiles
  (Seating · Travel · Decor), the search and Filter, then the order of the
  day; the tiles stay because they're the way into those pieces. Seating and
  Travel keep their own numbers cards.
- **Timeline folded on cards** (20 Oct 2026, owner: it took most of the first
  screen of a supplier's card). On the supplier, guest and household cards the
  timeline is **one folded line** — "Timeline · Next: Venue balance · 12 May"
  (the soonest thing to come, else "Last: Call · 18 Sep") — that opens in
  place, with "+ Add to history" at its foot (`folded` on `Timeline`). On the
  supplier card it moved **after Contact**. The area page's line and a
  payment's "All payments to …" are unchanged. The **Today** marker is a dot
  on the vertical line with its words beside it (no rules across the page).
- **The timeline** (19 Oct 2026; canvas 3 "History · Round 2" and
  "Timeline · Round 3", owner: "bloody LOVE IT"; `0032_timeline.sql`, run the
  same day with the owner's OK). It grew out of "comms" (owner: everything
  said and sent, with anyone): rather than a sixth tab, **every supplier,
  guest and household card, and every area page, has a Timeline** —
  everything with them, past and to come, newest first: **Coming up** (to
  pay, to do, to go to; dashed marks) above a black **Today** line, then what
  happened (filled marks), five then "N earlier ›"; chips **All · Comms ·
  Money · Plan · Files**; one mark per kind (phone / people / envelope /
  speech bubble / pen for comms, £, the to-do circle, the little calendar, a
  gold tick for a stage, a page for a file). Only comms is new data
  (`timeline_entries`: kind call · meeting · email · message · note ·
  save_the_date · invitation · thank_you · stage, the date, a line about what
  was said, `how` for sendings, tied to a contact, household, group or area —
  composite keys, RLS like groups, in `rls_isolation.sql`); payments, to-dos,
  appointments and files are only read and put in order (`loadTimeline()` in
  `src/lib/db/timeline.ts`, `buildTimeline()` in `src/lib/timeline.ts`). The
  app writes **"Quote in · £…" / "Booked" / "Not booked after all"** itself
  when a supplier's stage changes (`logStage`, in `updateSupplierAction` and
  `unbookSupplierAction`; earlier stages have no date, so they don't show).
  **Add to history** is a full screen (`/timeline/new?with=supplier:<id>|
  guest:<id>|household:<id>|area:<key>&back=…`, `entry-form.tsx`): Call ·
  Meeting · Email · Message · Note tiles, the date (today), what was said on a
  slip of paper, and **"Anything to do?"** — to-dos saved with
  `milestones.timeline_entry_id`, shown as pills under the call and in Plan.
  Tap an entry for "Take this off the timeline". Where: the supplier card
  (after Progress), the guest card (after In the plan: their entries, to-dos
  and appointments they're on, bills they're paying), the household card
  (after Guests: its own and its people's), the area page's "Everything for…"
  (a **Timeline** line: the area's and its suppliers'), and a payment's card
  (**All payments to …**, money only). `Timeline` in
  `src/components/timeline.tsx` (loads through `timelineAction`). Nothing is
  sent anywhere and the assistant isn't given it. Demo: calls, meetings and
  stages with Wild & Gather, Petal & Stem, Ashcombe Barn and Paper & Post
  Co., and a to-do from the florist call (also in `demo-wedding.sql`).
  **Next (agreed, not built):** Stationery as its own special area (like
  Decor) running **Save the date · Invitation · Thank-you**, each with how many
  households have had it; the guest list's View › Invitation (Not sent / Sent,
  canvas 3 "Sent · Round 1", B); **"Did it go?"** after every "Open in my
  email" (keeping the subject, who and when, never the message) writing an
  email entry; then thank-yous, which need a small gifts table (owner's OK
  first). Comms stays a thread on every card, no tab, until a guest portal
  brings messages in.

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
(a grain was tried and dropped; **16 Oct 2026** the light became the canvas
mock-ups' white top; then, same day, the light stops sooner over a warm
ivory ground `#efe7da` and glass cards are a touch whiter with a firmer
shadow — owner: all-white made the cards stop popping). **Glass cards made lighter, 16 Oct 2026** (owner: "the thick white
border on the top… lighter and airy"): `.glass-card`, `CARD` and the People
count / summary / group cards now have a 0.5px edge (no white border plus
inner highlight), 55% white, a softer wider shadow, and **no backdrop blur**
(a hard seam ran across the screen under every row of cards on the iPhone;
only the floating menu bar and pen, `.glass`, keep a blur). The Hub's
ring dots are left as they were. (canvas 2 "Background · Round 2", option A; `body::before` in
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
plus `0002_create_wedding.sql` to `0034_food_moments_and_schedules.sql`. **New migrations are run
by hand** in the Supabase SQL editor — the owner has to paste them in.
**Since 12 Oct 2026 the Supabase connector is set up** (project
**wedding-app**, id `hfyuvtrglkdpqvtkzohb`, eu-west-1), so Claude can check
and apply migrations itself — **but always says in plain words what a
database change does and waits for the owner's OK before running it, and
never deletes data unless the owner asks for exactly that.** Looking (read-
only queries) needs no OK. **All migrations 0001–0034 are now in** (0034 food served at moments and a schedule per group, and 0033 a meal and drinks for every guest, run 19 Oct 2026 with the owner's OK; 0032 the timeline, run 19 Oct 2026 with the owner's OK; 0031 who's in charge of a moment, 0030 how music is played, 0029 lists, 0028 music on moments and 0027 Decor, run 19 Oct 2026 with the owner's OK; 0026 the top table shape and 0025 the chair a guest sits in, run 19 Oct 2026 with the owner's OK; 0022 money towards it and 0023 who's paying a bill, run 17 Oct 2026; 0024 the menu and drinks, run 18 Oct 2026, all with the owner's OK) (12 Oct
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
guests in 43 households, two groups (day and evening, every answer, meals, diets, a
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
- **Pick what to add first, then its form** (owner, 16 Oct 2026). Where a
  tab can add more than one kind of thing, the round black + opens a small
  card of choices (`AddMenu`, `src/components/add-menu.tsx`): Guests → a
  guest · a household · a group · a part of the day — **each its own full
  screen** (owner, 16 Oct 2026: *adding is a full screen, a card is for what
  already exists*): `/people/households/new` (name large, address, "Who lives
  there" — tick people already on the list, they move in; then its card
  opens; `saveNewHouseholdAction`) and `/people/groups/new` (name with
  one-tap ideas, "Who's in it"; then the list shows that group;
  `saveNewGroupAction`), sharing `PeoplePicker` (`people-picker.tsx`);
  Plan (calendar, List, area pages) → a to-do · an appointment; Money → a
  payment · a budget (`add-choices.tsx`). The To-do | Appointment and
  Payment | Budget switches on the add forms are gone; their pages are
  titled "New to-do", "New appointment", "New payment", "Set a budget".
  A tab with one kind of thing (Suppliers, Inspo, notes) keeps a plain +.
- **Text · Call · Email are round buttons with their word underneath, on
  every card** (owner, 17 Oct 2026: the household's version was the best and
  the guest and group cards had diverged): `RoundAction` / `RoundActions`
  in `src/components/round-actions.tsx` — ink-filled for the main one, outline
  for the rest, 52px, centred with a gap. Guest card (Text · Call · Email),
  group card (Email · Text · Edit), supplier card (Call · Email · Website) and
  the household card use it; use it for any new card.
  **A missing one is never hidden** (owner, 19 Oct 2026): `RoundAction
  missing` draws a faded dashed circle that goes to where it's typed in —
  on the guest card it scrolls to Phone or Email with the box open
  (`TextRow editSignal`); on a household, where nobody has one, to its
  Guests; the supplier card already did this.
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
  count cards' big **All** tile is never black when picked — since 16 Oct
  2026 **white glass with the number in gold** (`.glass-tile-on` /
  `.glass-tile` in `globals.css`; canvas 3 "Guest list · The All tile", B,
  owner's pick: the champagne glass of 12 Oct read as beige on the warmer
  ground, and white sits well with the white search box).
- **A form's Save stays in reach** (owner, 12 Oct 2026: a date was
  changed and never saved because Save was below the fold): `SubmitBar` in
  `form-bits.tsx` keeps the main button at the foot of the screen while the
  form scrolls, then it settles at the end of the form. On the to-do,
  appointment, payment, budget, guest and supplier forms; use it on new ones.
  **Every form has a Cancel on the left of its main button** (owner,
  17 Oct 2026): adding leaves without saving (goes back a screen); editing
  puts the form back as before (below).
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
  back if the name matches), then picks it, without leaving the form. On every area
  picker since 15 Oct 2026: to-do, appointment, payment, supplier form and
  card, capture, Inspo save, and note filing (the notes panel's "File under"
  is now a pill opening the tiles; a tap files it).
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
   `calendar.tsx`). **Next up (end of the 19 Oct 2026 last chat):** built this
   chat — **Stationery as its own area** (What you send, View › Sent on the
   guest list, Send then "Did it go?", Sent to them on household cards, its
   timeline), **children properly** (meal + drinks tiles, caterer's prices and
   cost; 0033), **food and drink through the day** and **a schedule for each
   group** (courses and drinks served at moments, Whose schedule filter with
   print and email; 0034), demo groups, moments and sendings. The owner checks
   on the phone: the Stationery page, View › Invitation, a household card's
   Sent to them, a guest card's meal and drinks, the Food & drink page's
   "What it comes to" and "Through the day", and The Day › Filter › Whose
   schedule on the demo. **Suggested next:** gifts and thank-yous (needs a small
   gifts table: owner's OK first), then the assistant's name, then the small
   follow-ups (groups on the Add a moment form, the food cost on Money's card,
   a guest-list filter by meal or drinks, the assistant knowing the new meal
   fields, "Did it go?" after a group email). Not started from the feedback
   list: 7 the assistant's name, 18 weddings abroad, 19 paper templates. Backlog
   added: Travel as a map with a Play timeline; invitations as a supplier, an
   address export and a possible print-and-post partner. **Earlier next-up (end
   of the 19 Oct 2026 late chat):** built this
   chat — notes with bullets and tick-boxes (lists folded in), and **the
   timeline** on every supplier, guest and household card, area page and
   payment card (0032 run). The owner checks on the phone: the demo's Wild &
   Gather card, the Flowers area's Timeline line, and Add to history with a
   to-do. Then, agreed: **Stationery as its own area** (Save the date ·
   Invitation · Thank-you), the guest list's View › Invitation, and "Did it
   go?" after every email (canvas 3 "Sent · Round 1", "History · Round 2");
   thank-yous need a gifts table (owner's OK first). Still open: whether to
   keep the word "Timeline" or "History".
   **Earlier next-up (end of the 19 Oct 2026 chat):** built this chat —
   the owner's feedback list (19 items, Backlog "Feedback list"), "Invited"
   now reads "Yet to respond", dietary needs on Seating and in the venue
   plan, tap-the-top on guest and household cards (+ a Table drop-down),
   dashed Text/Call/Email when missing, Food & drink's Dietary needs line,
   **Seating on the phone rebuilt** (canvas 3 "Seating · Round 1", B: the
   table close-up, saved chairs 0025, snap to the grid, top tables 0026,
   seat a whole group or household), and **Send to the venue** (PDF +
   email). The owner tries on the phone: the close-up (fill a chair, swap
   two), a top table's tall close-up, and Share the plan in Mail on the
   iPhone. Suggested next: "Add to calendar" on appointments (feedback 3, no
   database change), going back a stage on area pages (1), then children
   properly (10, needs options and a database change) or venue numbers (12,
   parked). Earlier, Decor and The Day's tiles (below) are still agreed.
   **Next up (end of the 18 Oct 2026 chat) — decor, The Day, desktop:**
   built this chat: the menu and Drinks (above). Agreed but **not built**:
   **"Decor"** — the owner's little bits and bobs (chairs, candles, the easel
   for the seating plan, the guest book pen…). Canvas 3 "Decor · Round 1".
   Decided: **a "Decor" list inside every area page** (a line in "Everything
   for …", shown once it has something; layout A, a simple list grouped
   Still to get · Got it · Packed, each with quantity, where it's from — own,
   borrowed, hired, bought, made — dates to collect and give back, who sets
   it up) **plus one list across all areas on The Day** as a pack list
   (canvas C: before the day · set up at the venue · after the day). The
   owner's working name is **Decor** ("go with decor for now"; it isn't all
   decor — cake knife, pens — so "Decor & extras" or "Bits & bobs" are the
   fallbacks; avoid "Supplies", it clashes with Suppliers). **Decor is NOT an
   area of its own** (a starter area was added then taken out again the same
   day). Needs a new table (an item row pointing at an area) — **explain and
   wait for the owner's OK before running it.** **The Day tab hierarchy**
   (canvas 3 "The Day · Round 2"): the run sheet is the whole day, Seating ·
   Travel · Decor are its pieces — the owner likes **option 1** (three small
   tiles under the numbers card, each with one fact), not built; a piece
   opened shows a "The Day ›" pill above its title (no back arrow).
   **Desktop, begun 18 Oct 2026.** Round 1 (canvas 3 "Laptop · Round 1 ·
   The frame") built a folding sidebar; the owner then found side tabs "a
   bit TOO modern… this is about weddings and love", so **round 2** (canvas
   3 "Laptop · Round 2 · The ring as the star") went back to **tabs along
   the top** and made the ring the Hub's star. **Picked and built: 3 with
   the names on the left** (like canvas 2's magazine spread). **Built:**
   `top-bar.tsx` (laptops only, sticky: "The wedding of" on the Hub, the
   couple's names elsewhere; the five tabs in a glass pill; Notes with its
   count, Inspo, the assistant's pen — `AssistantSheet variant="bar"`, not
   on the Hub — and Settings); `sidebar.tsx` is gone. The **laptop Hub**
   (`page.tsx`, `cover.tsx`): names huge on the left (each on its own line,
   the & in gold), the date, the "Ask your assistant" pill; the ring large on
   the right; This week beside the notes / Inspo tiles; then **At a glance**
   (`at-a-glance.tsx`): People · Plan · Money · The Day cards using Where
   things stand's figures (`loadStanding()` in `src/lib/standing-data.ts`,
   shared with `/standing`). Phones unchanged. **Cards stay as pop-ups
   from the right** (owner, 18 Oct 2026): a "list left, card beside it"
   version (the card docked, the list moving left) was built and taken back
   out the same day — "it worked better as it was… so that it doesn't move
   the content anywhere". **Tabs that use the width** (canvas 3 "Laptop ·
   Round 3 · A tab that uses the width (Money)", owner picked **C**, 18 Oct
   2026 — the pattern for People, Plan and The Day next): **Money built** —
   the page is 1328px wide like the top bar; By area puts the budget card and
   a "When it's due" month chart (`MonthChart` / `monthColumns()` in
   `money-view.tsx`, shared with By month; a column opens By month on that
   month) side by side, search and Filter on one row, the area cards four
   across; By month puts the chart and search on the left (sticky) and the
   payments beside them. Phones unchanged. **People, Plan and The Day
   built the same way** (canvas 3 "Laptop · Round 4", owner's go 18 Oct
   2026): People — the numbers card beside a new **Who's coming** card
   (`WhoComing` in `guest-browser.tsx`: day / evening / children bars, top
   dietary needs, Copy for the caterer; laptops only), search · View ·
   Filter on one row, the table across 1328px. Plan's calendar — the
   calendar on the left (sticky, taller days), the month's list, Undated and
   Done beside it; the List stays a 4xl column. The Day's run sheet — the
   numbers card beside **Seating** and **Travel** tiles (`PieceTile`,
   `pieces()` in `day-view.tsx`; Decor left off until it's built), then the
   order of the day **kept long and thin like paper, centred** (owner).
   Seating and Travel keep their old width. Earlier note:
   **Desktop version** (the owner wants to start thinking about it): from
   canvas 2 "Laptop · The Hub" (11 Oct 2026), option B magazine spread was
   the favourite; proposed order — settle the frame (top bar or sidebar, page
   width), then two panes side by side (list left, open card right), then
   Hub, People, Plan, Money, The Day. Money's laptop budget table stays out.
   More feedback from the owner's phone user testing was mentioned but not
   yet shared. **Earlier next-up (end of the 16 Oct 2026 evening chat):**
   built this chat — the household envelope front-only with a postmark and
   the household as a card; Add menus (pick what to add, then a full
   screen); everything opens as a card, edited in place; Plan's List like
   the guest list; area stages renamed (Ideas · Quotes · Booked · Paid ·
   Ready); "Edit events" card; Sort › Group; the shorter grey line under
   rows. **Guests on to-dos and appointments — built 16 Oct 2026 (late),
   owner's OK; `0021_involved.sql`, run the same day:** link tables
   `milestone_guests` / `appointment_guests` (tied to `(id, wedding_id)` both
   sides, RLS like groups, in `rls_isolation.sql`); queries
   `src/lib/db/involved.ts`; a **Who's involved** part on the to-do and
   appointment cards (`plan/involved.tsx`, pills, ✕, "+ Add a guest" search,
   taps save; `setInvolvedAction`) and folded on the add forms (`PeoplePicker`,
   `tag-guests.ts`); small initials at a row's end (`RowPeople` +
   `RowPeopleProvider`, `src/components/row-people.tsx`, on Plan, area pages
   and the Hub's This week); **In the plan** on the guest card
   (`guest-plan.tsx`). Nobody is told; the assistant isn't given the tags.
   **Run sheet moments can have no area** (16 Oct 2026, owner): `AreaTiles`
   takes `optional` — "" is no area, Other is stored as "other", a "No area"
   link takes the choice off, and a saved moment with none shows a dashed "No
   area · Add one" pill. On the moment form ("Area (optional)") and its card.
   No database change; the ring is untouched. **Before that, the 15–16 Oct 2026 chat:** built this
   chat — delegation agreed (top of these notes); the four plain forms made
   visual; groups on Seating; the assistant writes group messages; area page
   tidy + a black + per section; 16px side margins; Plan calendar on a card
   with a month list; **one row for to-dos, appointments and payments**
   (date left, mark right); **tab tops in one row** (no back arrow, no
   drawings); lighter background and glass cards. The owner checks on the
   phone: Money's area cards (is the seam under each row gone? if not, try
   the shadows), The Day's title beside its 3-way switch, Money's By month
   rows. Then: the other tabs' lists against the same eye (People rows, The
   Day), the title drawing question for Your notes / Inspo / Settings is now
   moot (no drawings), and the backlog.
   **Earlier next-up (end of the 14 Oct 2026 afternoon chat):**
   built this chat — the household **envelope**, the guest card's **profile**
   (canvas 3 round 2, A), and **groups of guests** with emailing / texting a
   group (0019 run). The owner tries them on the phone (the envelope's turn,
   and whether Mail opens with everyone in Bcc). Then: the four forms still
   in the old plain style (car or coach, day/evening event, Inspo save, jot a
   note — the owner wants to look at them first); "Ask your assistant to
   write it" in the group email sheet; groups on Seating.
   **Earlier next-up (end of the 14 Oct 2026 naming chat):** no code
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
   - **Jobs done a step at a time** (17 Oct 2026, owner; canvas 3 "Your
     assistant · Steps in the chat"): `add_guest` and `add_todo` don't ask
     questions in words. They start steps **inside the chat**: a card rises
     where the message box is, with a step marker, one question and Back ·
     Skip · Next ("Skip the rest and review"); each answer becomes a message,
     a skipped step a faded "Skipped". Shared frame `steps-flow.tsx` (a
     `Flow` per job); `guest-steps.tsx`, `todo-steps.tsx`. **Guest** steps:
     day or evening (only if the wedding has both), household (a drop-down,
     "New household…"), dietary needs, contact details (phone + email),
     anything else (groups, where they're staying — only if any exist).
     **To-do** steps: when, which area, anything to add. Whatever the
     assistant already heard is answered for you; **if a guest's day/evening,
     household and diet are all known (or a to-do's date and area), the
     questions are skipped** and it goes straight to the check card (contact,
     groups and notes are only ever optional). The tool takes
     `no_dietary_needs` / `no_household` / `no_date` / `no_area` so "none"
     counts as known. The check card lists every line (tap one to change it)
     and a guest's **Invitation** (To invite unless told otherwise; or
     Invited / Coming / Can't come, set in place), then Cancel · Add; **Yes
     saves** (`confirmProposalAction`; `addGuest` also takes `groupIds`,
     `stayId`, `answer`, checks groups and stays belong to the wedding and,
     if a later part fails, still adds the guest and says so). The steps run
     on the phone with **no further calls to the AI**; their choices (groups,
     places to stay, areas) go to the screen only, never back to Anthropic
     (`guestChoices()` in `lookups.ts`). A payment still uses the confirm
     card; stepping payments and appointments is next. Role, child and meal
     aren't steps yet.
     **Payments and appointments too** (17 Oct 2026; `payment-steps.tsx`,
     `appointment-steps.tsx`, shared bits in `steps-bits.tsx`): **payment** —
     how much, still to pay or already paid (and when), who it's to (a
     supplier drop-down, whose area it takes; or no supplier and an area);
     straight to the check card once the amount and paid-or-not are known,
     and Yes stays off until there's an amount (`Flow.missing`).
     **Appointment** (a new job, `addAppointment`) — the day, the time, where
     and who with, the area; straight to the check card once the day and time
     (or "no set time") are known; the supplier's area is used if none is
     picked. Suppliers for the drop-downs come from `supplierChoices()`
     (to the screen only, never to Anthropic).
   - **Changing things that exist** (17 Oct 2026, owner: "move Anna from X
     household to Y"): seven more tools, each a **before-and-after confirm
     card** (Was / Now, Yes), nothing changes until Yes, nothing is ever
     deleted: `move_guest` (to another household, a new one, or none),
     `set_guest_of` (day ↔ evening, answer stays), `set_guest_diet` (the
     whole new list), `add_guest_to_group` (add only — it can't take anyone
     out), `set_todo_date`, `tick_todo`, `mark_payment_paid`. They find the
     thing first with `find_guests` / `find_todos` / `find_payments` /
     `find_groups` (`lookups.ts`; each returns ids and a few lines, and **the
     matching to-do titles, payment descriptions and group names go to
     Anthropic to answer, like the guest and money lookups — same privacy
     list entry**). Jobs in `jobs.ts` (`moveGuest`, `setGuestOf` — the card's
     day/evening action delegates to it — `setGuestDiet`, `addGuestToGroup`,
     `setTodoDate`, `tickTodo`, `markPaymentPaid`) check the thing belongs to
     this wedding before touching it. Not yet: renaming, changing a
     supplier or appointment, un-ticking, taking out of a group, un-paying.
   - **The general look-up** (17 Oct 2026, owner: "surely we don't have to
     hand code everything"): `look_up` (`src/lib/lookup-general.ts`) reads
     **any of 12 collections** — guests, households, groups, suppliers,
     to-dos, appointments, payments, the run sheet (`moments`), tables,
     stays, journeys, events — with filters (`is`, `contains`, `before`,
     `after`, `empty`…), `count_by` and `sum` (the app counts and adds up, not
     the AI), and shows a generic list/tally card (`lookup` block). It
     **replaced `find_todos` / `find_payments` / `find_groups`**; the five
     visual lookups (guests, money, this week, seating, suppliers) stay for
     now. **What it can read is the list in that file** (rule one): never
     notes, files, Inspo, addresses, or a guest's phone/email (only "has
     one"); a supplier's phone, email and website are included. To add a
     collection or field, edit that file only. **Direction agreed with the
     owner:** a small set of general tools (look up · add · change a
     detail · note · take me to…) with a short description per kind of
     thing, and specific tools only where rules need protecting (household,
     day/evening, invitation status). **Still to do:** the general "change a
     detail", the general "add", "take me to…", and a 30-question test of
     what it answers (before/after). Not tested against the live database
     yet.
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

- **Feedback list, 19 Oct 2026** (owner; parked, not designed yet):
  1. ~~**Going back a stage on an area page**~~ — **built 19 Oct 2026**:
     a quiet ↶ line in each done stage (`StepBack` in `area-view.tsx`):
     Booked has "Not booked after all" per booked supplier
     (`unbookSupplierAction`: back to Quote in, or In touch with no quote;
     payments untouched), and "We need a supplier after all" when doing it
     ourselves; Paid lists what's paid ("Paid · tap a tick to undo", the
     `PaymentRow` gold tick); Ready keeps "Not ready after all".
  2. ~~**Area pages link to the dietary needs**~~ — **built 19 Oct 2026**:
     Food & drink's "Everything for…" has a **Dietary needs** line (who and
     what, in rose) with "In the guest list ›" → `/people?f=dietary&view=diet`
     (the guest list on View › Dietary needs; `?view=diet` is new).
  3. ~~**Add an appointment to the phone's own calendar**~~ — **built
     19 Oct 2026**: "Add to my calendar" at the foot of an appointment's
     card opens `/plan/appointments/[id]/calendar` (`route.ts`, an .ics
     file from `appointmentIcs()` in `src/lib/ics.ts`: UK time, an hour
     long, all day with no time, "With …" and notes in the description).
     Nothing is sent anywhere; the phone adds it if the couple say so.
     **Which calendar** (owner, 19 Oct 2026: the iPhone file went to a
     default calendar the owner couldn't find): the button now opens a choice —
     iPhone or Mac calendar (the .ics, into the default calendar: Settings ›
     Calendar › Default Calendar), **Google Calendar**, **Outlook**
     (Outlook.com) and **Outlook for work or school**
     (`googleCalendarUrl()`, `outlookCalendarUrl()` in `src/lib/ics.ts`; Google uses the `/r/eventedit` address, as the `render` one lost the event after Google sign-in; the choice is a pop-up in the middle (owner, 19 Oct 2026), and its iPhone line says to tap Add to Calendar at the bottom of the iPhone's own screen, then the calendar — its blue tick does nothing and can't be changed from the app).
     The web ones open the couple's own account with the event filled in —
     the title, place, "With …" and notes go to Google or Microsoft only when
     they tap it (the owner asked for it). No live calendar feed.
  4. ~~**Tapping the top …**~~ — **built 19 Oct 2026**: the profile's
     Answer, Table, Meal and the allergies line scroll to their row with a
     soft glow (`jumpTo()`, `src/lib/jump-to.ts`); the guest card's Details
     has a new **Table** drop-down (`TableRow`, `setGuestTableAction` in
     `day/actions.ts`; `guestSeating()` in `src/lib/db/day.ts` replaced
     `tableNames()`); the household envelope goes to its name and address,
     the line under it to Guests. Original note: **Tapping the top of a guest profile or household card goes to the
     field to change it** (also "make profile summaries clickable") — e.g.
     tap Table at the top, it scrolls down to a Table drop-down in Details
     to change it. Same for Answer, Meal, and the household's figures.
  5. ~~**"Father of the groom" missing as a role**~~ — **built 19 Oct
     2026** (owner: all four): Mother / Father of the bride, Mother / Father
     of the groom, beside "Parent of the couple" (`GUEST_ROLES`).
  6. ~~**Music**~~ — **built 19 Oct 2026** (owner's OK;
     `0028_moment_music.sql`, run the same day: `run_sheet_items.music`,
     `music_url`): a moment's card has a **Music** part — Song, and the link
     shown as a tappable **"Play on Spotify"** (YouTube, Apple Music… by
     `musicSource()` in `src/lib/music.ts`; "Change" to paste another;
     owner: the raw address was ugly and couldn't be tapped); the new/edit
     moment form has "Add a song" (open when added from the Music area);
     the run sheet shows the song under a moment with a music note. **Music
     lives in The Day** (owner, 19 Oct 2026: two sections, "The music" and
     The Day, was one too many): on the Music area page, its **The Day**
     part holds the area's moments plus every moment with a song, each with
     its song, and **Copy for the band or DJ** (`DaySection` with
     `musicFor`). Links get https:// added; nothing is sent anywhere.
     **How it's played** (owner, 19 Oct 2026: "the main thing with music is
     the technology"; `0030_moment_music_how.sql`, run the same day with the owner's
     OK: `music_kind` song | playlist, `music_played` band | dj | venue |
     device, `music_who`): on a moment's card and form — A song | A
     playlist, **Played by** Band · DJ · Venue speakers · Our phone or
     laptop, **Presses play**. The Music page's rows show how it's played and
     the moment's own area when it isn't Music ("Cake" — moments keep their
     area; the Music page gathers every moment with music); the copy for the
     band or DJ includes them. **Sound check**: "Start a sound check list"
     on the Music page makes a ready-made list filed under Music (offline
     playlists, a charged backup phone, aux cable or speaker, test at the
     venue, a mic for the speeches, the venue's sound contact —
     `SOUND_CHECK` in `src/lib/music.ts`, `startSoundCheckAction`), then it
     shows there as a list. Labels in `PLAYED_BY`, `musicTitle()`. The demo wedding has songs on six moments (also in
     `demo-wedding.sql`).
  7. ~~**Give the assistant a name**~~ — **done 20 Oct 2026: Juno** (owner's
     pick from Arlo, Juno, Remi, Noa, Sage; the Roman goddess of marriage, a
     quiet nod, no pun; modern, short, for anyone). It replaces "Your
     assistant" in what people read: the Hub pill "Ask Juno", the panel's
     heading, its errors, the search box's "Press send to ask Juno", the group
     message "Ask Juno to write it", and the assistant's instructions (it's
     Juno, and says so if asked). The 13 Oct rule "no made-up human name" is
     retired. Still to check: say "Juno" into the phone's dictation (an earlier
     name, Junia, came out "junior"). The canvases still say "Your planner" /
     "Your assistant".
  8. ~~**Lists**~~ — **folded into notes, 19 Oct 2026** (owner: canvas 3
     "Notes · Round 1", option **A**, one box with a little toolbar, "as long
     as you have the functionality to create a bullet list or a checklist";
     no tagging of kinds). **Lists are NOT Decor** (Decor is detailed per
     item; a list is lines to tick). **A note is now words, bullets and
     tick-boxes mixed**: `NoteEditor` (`src/components/note-editor.tsx`,
     one line per box, a Bullet / Tick-box toolbar, Enter carries the mark
     on, Backspace on an empty marked line takes the mark off) on the jot
     page, the notes panel's edit and an area page's notes. Stored as plain
     text in `notes.body`: `- ` a bullet, `[ ] ` / `[x] ` a tick-box
     (`parseNote`, `writeNote`, `toggleLine`, `tickCount` in
     `src/lib/note-lines.ts`). **Ticks are tapped in place** wherever a
     note shows (`TickableNote`, `rich-text.tsx`'s `onToggle`; saves through
     `saveInboxNoteAction`); the wall shows the boxes and "1 of 4 ticked".
     The separate lists (the wall's list papers, `/lists/new`, `ListCard`,
     `src/lib/db/lists.ts`) were taken out; `/lists/new` redirects to the
     jot page. **The `lists` / `list_items` tables (0029) stay as a backup**
     — their one list (the demo's Sound check) was copied into a note with
     the owner's OK. Photos inside a note wait on storage.
  9. ~~**Money's important numbers**~~ — **built 19 Oct 2026**
     (`money-figures.tsx`, the top card and an area's money sheet): with
     nothing agreed or paid it leads with the **budget** ("No budget yet"
     when none) and "Nothing agreed yet"; after that, **agreed** large,
     then Paid · **To go** (was "To pay") · Still free / Over budget.
     Original note (from talking to couples): once
     suppliers are booked it's **agreed · paid · to go** (paid + to go =
     agreed); before that, the **budget** matters most. Money's top card
     should lead with whichever fits where the couple is.
  10. **Children, properly** — the yes/no child tick isn't enough. In
      practice it's two things: **adult or child meal**, and **alcohol or
      not** (a teenager can have the child meal and drink, or the other way
      round). Maybe an age or age group, or those two settings per guest.
      Ties to "Children are a yes/no flag" under Design decisions still
      open. Needs thinking, and a database change.
  11. **Food & drink as a bigger section** — so much happens through the
      day (canapés, breakfast, evening food, drinks, cake…). The menu and
      Drinks (18 Oct) are a start.
  12. **Send to the venue — built 19 Oct 2026** (`send-to-venue.tsx`, a
      "Send to the venue" link on Seating's View row): a card with **Share
      the plan** (phones: the phone's share sheet with a PDF attached and the
      table in the message — `navigator.share` with files), **Open in my
      email** (the table written in; mailto can't attach), **Download the
      PDF**, Copy the table, and a preview. The PDF (`jspdf`, loaded only
      when needed): page 1 the room as the floor plan has it, then each
      table, its guests chair by chair, dietary needs in rose. The app sends
      nothing itself. **Venue numbers parked by the owner (19 Oct 2026):**
      the plan agreed was an optional "venue's table number" per table (a
      small column), a nudge until all are matched, and the venue's own
      floor plan uploaded beside (or under) the room; the sent plan would
      then lead with the venue's numbers. Original note:
      **Venue table numbers** — venues have their own table numbers; the
      couple's table names mean nothing to them (it went wrong at one
      wedding). Add a venue number beside each table's name, a nudge
      ("check the numbers with your venue"), and **Send the table plan to
      the venue** (a PDF by email — opening the couple's own email first,
      like groups; guests' names go to the venue, so rule one).
  13. **Invitations** — maybe design them in the app. A **Send** button
      beside Text · Call · Email on the guest / household card, posting
      the invitation to them (a print-and-post service — costs money and
      sends addresses out: the owner's call). Ties to "From talking to
      couples" 1 below.
  14. **What's been sent to whom** — a tracker (save the date, invitation,
      thank-you…), and **after the wedding** as a whole: thank-you notes
      must be really easy (who gave what, who's been thanked).
  15. ~~**Suppliers' last stage: giving things back**~~ — **settled 19 Oct
      2026** (owner took Claude's suggestion): Decor stays the one place
      (Given back, return dates, the pack list's After the day); a
      supplier's card shows **"Decor from them"** — what they lend or hire
      out and when it goes back (`SupplierDecor`, `listDecorFrom()`), each
      opening its card on The Day › Decor. No supplier stage after Booked.
      Original note: after the wedding,
      what was borrowed or hired (decor and the like) goes back; a stage
      after Booked, or Decor's "dates to give back", organised for after
      the day.
  16. **Schedules for groups** — beside the whole day's run sheet, a
      schedule for one group: the bridesmaids' morning (hair and make-up
      slots, who's when), the groomsmen's, and so on. Could build on groups
      of guests and run sheet moments (a moment tagged with a group or
      people, then "the bridesmaids' morning" is the run sheet narrowed to
      them, printable or sent to them).
  17. **Built 19 Oct 2026 (the plan part):** a rose badge on each table
      with how many have a need, a mark on unseated names, needs under each
      name in a picked table and in the List, and a **Dietary needs by
      table** card under Seating with **Copy for the venue** (`DietLine` in
      `src/components/diet-line.tsx`, `DietaryByTable` in `day-view.tsx`). The PDF to the
      venue waits on item 12. Original note:
      **Dietary needs on the seating plan — "really, really important"**
      (owner). Make it obvious on the floor plan and the list which seats
      have a dietary need (a mark on the guest's initials, a count per
      table, the need itself on tap), and **highlight them on the plan sent
      to the venue** (item 12): each table with its guests' needs written
      next to them. Allergies are health data (checklist item 5): fine for
      the venue's catering, nothing more.
  18. **Weddings abroad** (owner's question). Today the app assumes the UK:
      money in £ only, the run sheet's "Now" on UK time (`nowInLondon()`),
      "Share it out for us" uses a UK split, Travel has places to stay and
      journeys but no flights. A wedding abroad would want: **flights** (who's
      on which flight, landing times, who needs a lift from the airport —
      fits Travel's "getting there and back"), the wedding's own time zone,
      perhaps a second currency for suppliers abroad, and things like
      passports or legal paperwork as to-dos. Flight details are guests'
      personal details: rule one.
      **Owner's idea:** ask in Setup (and Settings) **where the wedding
      is**. Two different things: **where the couple are from** and **where
      the wedding is** — a UK couple marrying in France (a destination
      wedding: flights, two currencies, guests travelling) is not a French
      couple marrying at home (just a different country: euros, French time,
      French customs). The app adjusts to the pair: same country = as today
      (UK first, other countries later); different = destination extras
      switch on (flights, airport lifts, time zone, second currency,
      paperwork). Would be a new column or two on `weddings`.
  19. **Resources: paper templates** — a place for printable things for the
      day: a table crossword, "draw your own face" sheets, table games,
      signs, menus, place cards, invitations perhaps. Couples pick one, fill
      in their names and date, and print it. Where it lives is open (not a
      new tab without the owner's OK — maybe Inspo, the Stationery area, or
      The Day's pieces beside Decor). **Could be sold** (premium templates;
      ties to the business model — costs money, so the owner's call).
      Note: the app can make a PDF on the phone; the menu card already
      prints.
      **Where it could go (talked through with the owner, 20 Oct 2026, not
      decided):** one library of templates, reached from two places — a line in
      **Stationery's** "Everything for…" and a fourth **piece of The Day**
      beside Seating, Travel and Decor (table games, signs and place cards are
      for the day; save the dates are Stationery). Not Inspo (that's for
      saved pictures) and not a new tab. Build the free version first and
      leave room for paid ones later (money: the owner's call). Next step if
      picked up: mock the library, one filled-in template and the print
      preview on canvas 3.

- **Finding suppliers: advertising or a local list?** (talked through with the
  owner, 20 Oct 2026; **conclusion: not needed now — only if couples ask**).
  Advertising or paid placement cuts against the couples-pay model (the app
  stays on the couple's side) and is hard to undo once couples notice, so
  it's off the table until there are real users. A pulled directory of local
  or online suppliers is costly and fragile (scraping is a licensing
  problem; Google Places and the like cost money per search and go stale; a
  list of every florist isn't what couples need). Only the area and town
  would leave the app, never anything about guests, but a new service still
  needs the owner's OK. **If couples ask:** a quiet **"Where to look"** card
  on an area with no suppliers yet (ready-made searches and directories for
  that area and the venue's town, nothing stored or sold, opens only on a
  tap) and the **venue's preferred-suppliers list** (pasted or uploaded
  once, shown in the matching areas). Later still, couples recommending
  suppliers to each other needs consent and a privacy policy first. Test
  with 3–5 real couples before building any of it.
- **Gifts and thank-yous** (parked by the owner, 20 Oct 2026: "not sure on
  this yet"). Options are on canvas 3 "Gifts · Round 1": **A** a Gifts list
  as a View on the guest list (To thank first, then Thanked; round tick),
  **B** thank-yous one household at a time (who, what they gave, how you'll
  thank them, "Thanked. Next one"), plus where it shows (Stationery's
  Thank-you line "19 of 31 thanked"; a Gift line on the household / guest
  card with the Sent-to-them marks) and a full-screen "New gift" (kind: gift
  · money · voucher · experience; who from; arrived; optional amount; already
  thanked). **Needs one new table, `gifts`** (owner's OK first; RLS like
  groups, in `rls_isolation.sql`; no assistant access, nothing sent
  anywhere). Open questions: A, B or both; whether money and vouchers carry
  an amount (kept apart from Money's budget); gifts only, or also thanking
  people for helping. Thank-you sendings already exist (Stationery,
  `timeline_entries` kind `thank_you`). Not started.
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
  asked for the app's map ("Wedding App Map":
  https://claude.ai/artifact/GfcFVHZX4vuf1Ykzdk1i5B) and what doesn't line
  up. **Rebuilt 19 Oct 2026** (owner: "slightly losing sight of all the
  stuff"): the five tabs with their views, cards and add screens, what cuts
  across, and where each backlog idea would live, marked built / agreed /
  idea. **Agreed habit: anything new goes on the map before it's built**;
  if it fits no tab or the area page, stop and decide with the owner. Done the same day: payments off the Plan calendar, appointments in
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
  2. **Page titles**: Inspo and Settings now use the tabs' 40px display
     title (15 Oct 2026). Still no title drawing on Your notes, Inspo or
     Settings — new artwork, so the owner's call (options could be made in
     Canva like the others).
  3. ~~**Inspo's folders**~~ — chips now go champagne when picked, not
     black (15 Oct 2026, black is for the main action). Switching them to
     the shared Filter instead is still open if the owner prefers.
  4. ~~**Forms in the old plain style**~~ — done 15 Oct 2026 (Claude, under
     the new delegation): the journey (car or coach), day/evening event,
     Inspo save and jot a note now use the visual pieces — name large with
     one-tap ideas (`Ideas` in `visual-form.tsx`), glass cards, area tiles
     (with "Leave it unsorted / to sort later"), notes folded. The jot page
     writes on a slip of paper like the notes wall (`capture-form.tsx`).
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
  2. **Email a group of guests** — **first version built 14 Oct 2026**
     (Groups of guests, under People: opens your own email with everyone
     in Bcc). Original note: e.g. everyone staying at the pub, the
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
  13 Oct 2026, then **replaced 14 Oct 2026 by a social-style profile**
  (canvas 3 "Guest card · Round 2", A; households got the envelope). No
  photos yet.
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
- **Travel as a map you can play** (owner's idea, 19 Oct 2026, parked, not
  designed): a **map plus a timeline with a Play button** on Travel, so you
  press play and watch exactly who's moving where through the day — coaches
  and cars along their routes, guests' dots moving from where they're staying
  to the venue and home again, with a scrubber to stop at any time ("5pm: who
  is still at the pub?"). Builds on the Journeys idea below (a tiny map per
  journey, a List | Map switch) and on Travel's data (`transport_runs` with
  times and from → to, passengers, `stays`). Needs: a map service (account and
  key; costs money past a free allowance), places turned into points on the
  map, and each journey's start and end time (it has a start time only).
  **Rule one before it's built:** a map service would be sent guests' places
  to stay and addresses, so that's the owner's call (and a privacy list entry)
  — a version that shows only journeys and named places (the pub, the
  church), never a guest's home address, avoids it. Dots for people should be
  initials, never children's names. Mock on canvas 3 first.
- **Invitations: a supplier, then maybe a service** (owner and Claude, 19 Oct
  2026, parked). **Decided:** the designer or printer is **a supplier in the
  Stationery area like any other** (quote, booked, payments, contract and
  proofs as files, timeline); the app does not become the printer, and
  "What you send" stays the couple's own tracking of who's had what. **Small
  steps, not built:** an **address export** for a stationer or printer (a
  spreadsheet or address-label sheet of every household, in place of today's
  "copy the addresses"); nothing leaves the app except to the couple.
  **Later, the owner's call:** a **"Send these for me"** button handing the
  ticked households to a print-and-post partner (couple picks the partner,
  addresses go only when they press send; could earn a referral fee, fits the
  couples-pay model), or full design, print and post inside the app (biggest
  job: payments, refunds, returned post). **Rule one before either:** a
  service is sent guests' names and home addresses, so it needs the owner's
  OK, a signed data processing agreement and a privacy-policy line; it also
  costs money (printing and postage), which is the owner's call.
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

- **Design canvas 3** — from 14 Oct 2026 (Seating · Round 1 · The phone, 19 Oct 2026 — B built; Household rounds 1–3, the
  envelope; Guest card round 2, the profile; Groups round 1 — built; **Tab tops · Round 1**, 16 Oct 2026: A one row (title + switch), B a gold line above the title, C no title, switch centred — **A picked and built**): https://claude.ai/artifact/TiZtToD5m6cEKxfu8PYbLL
- **Design canvas 2** — from 11 Oct 2026; **full** (its 40th page,
  "Name · Rondé", was added 14 Oct 2026); new rounds go on canvas 3: https://claude.ai/artifact/K49dGyMgVvGpiSGNHx1aRB
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
is under 12px. **Side margin (16 Oct 2026, owner: "not utilising the full width"):**
16px on phones (iOS's own), 20px from 640px up, set once as `--gutter` in
`globals.css`; things that run edge to edge use `-mx-[var(--gutter)]`
(never a fixed `-mx-5`). Glass cards' inner padding is 16px (`px-4`). Check changes at 320px, 393px (iPhone 15) and desktop widths.

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
