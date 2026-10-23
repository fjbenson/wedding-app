# The app today

Moved out of `CLAUDE.md` on 23 Oct 2026 so every chat doesn't have to read it. Read the part for the screen you're working on. When a screen changes, replace its line here (the date and the owner's reason, in a few words).

Five tabs — **Hub · People · Plan · Money · The Day** — plus area pages,
Juno, Your notes, Inspo, Settings and Where things stand.

- **Hub** (`/`): the couple's names, the **hub ring** (its dots are the
  wedding's areas, its heart the days to go, opening **Where things stand**
  `/standing`; the + adds an area in three steps), **"Ask Juno"**, **This
  week** (due by Sunday plus overdue, ticked off in place), and tiles for
  Your notes and Inspo. On a laptop (canvas 4 "Laptop · Round 8", C, 21 Oct
  2026): a bigger ring (it grows with the screen) whose buttons sit on the edge of
  a faint circle (pulled up a little so it doesn't sit low), finer icon lines,
  each with its name in small grey capitals and **no stage marks**: a corner badge
  like a guest's "Coming" — quoted a pale £, booked a gold tick, ready a gold
  heart on a champagne button (none for Ideas or Paid),
  hover says the stage (owner, 23 Oct
  2026: dots and lines felt like a tech pipeline — "this is a wedding"; also
  tried and dropped: spokes, filling bubbles, three soft states, canvas 4
  Rounds 14–15; `src/lib/hub-stages.ts`),
  and a column on the right (Round 13, C, 23 Oct 2026: "a bit more fun"), each
  card only as tall as what's in it: **Inspo & notes** (the three latest pictures
  as a mood board, the latest note taped over its corner; `hub-board.tsx`), This
  week, then **Needs a push** as pills (area + next step; where it stands on
  hover). Notes and Inspo are in the sidebar too. The Hub's look is the owner's call.
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
  answer icon (on a laptop, from 23 Oct 2026: five separate tiles — total (champagne), Coming · Yet to respond ·
  To invite (they add up to it; white glass, each with its answer icon), and
  Can't come dashed and faint, canvas 5 Round 18 A; then columns — Event (was "Guest of"; italic words: champagne Day, grey
  Evening), RSVP (its icon, then the word; 23 Oct 2026, so it isn't read as Meal's), Meal (Adult /
  Child), Dietary tags (allergies marked, a narrow column), Table, no vertical lines (23 Oct 2026), columns kept near the name; the Table is faint when grouped by table. Was: hairlines between
  who / food / seat; Round 9, 1b). **Tap a heading to sort** (again to flip, a
  third time to go back); the View button then says "Dietary ↑" and picking a View
  clears it; the Guest heading says what the rows are grouped by. On a laptop
  View | Filter sit left, search and + right; narrow windows scroll sideways.
  The View menu is Order · Group by (incl. Bridal party, Dietary needs) · Sent
  (21 Oct 2026; Age group went). Opening a guest, household or group closes the
  card already open. Can't-come folded at the foot. The **guest card** (`guest-card.tsx`)
  has a profile top (name beside the picture, dietary needs under the roles; RSVP · Table ·
  Meal as three boxes, owner 23 Oct 2026, canvas 5 "Guest card · Round 4", D1; tap a
  figure and its row below opens), Text · Call · Email,
  the **RSVP always on view** (it changes most) as **one question at a time**
  (owner, 23 Oct 2026, canvas 5 "Guest card · Round 3", C; no step circles): not
  invited → "Has their invitation been sent?" (Yes, it's gone); invited → "What did
  they say?" (Coming / Can't come, "Not invited yet" to undo); answered → the picked answer holds a
  beat, then the question shrinks up into the RSVP box (a soft glow; the badge pops; a
  fade with reduced motion) and goes; a badge on the picture says it (gold tick or
  grey cross), and tapping the RSVP box asks again with their answer picked in
  champagne and a ✕ to close (canvas 5 "Guest card · Round 6", D). Then **folded rows, each with a gold icon and
  a line of what's set** (all drawn like History; canvas 5 "Guest card · Round 5", B) (owner, 21 Oct 2026, canvas 4 "Guest card · Round 1", A):
  FOOD & DRINK (meal and drinks tiles, dietary) · SEATING & TRAVEL · ROLE &
  GROUPS · HISTORY · DETAILS (Guest of, household, phone, email, notes), then in
  the plan. Day or evening hardly ever changes, so it's in Details until a guest
  has none, when it shows up top. A guest's meal is only the
  Adult / Child / No meal tile (owner, 20 Oct 2026: the typed dish was
  dropped — one menu for everyone; old `rsvps.meal_choice` values stay in the
  database, unshown). Every guest count is **everyone still expected**
  (can't-comes left out), as the numbers card has it. **Households** open as an
  envelope card (no stamp; "2 of 3 responded" under it, name and address higher,
  a copy icon on the address); **groups** as a card with Email them / Text (the
  couple's own app, everyone in Bcc). Both: a Guests list with the table's initials
  circle and RSVP word-then-icon, an "Add someone" line, and **one History** (a
  household's save the date / invitation / thank-you sit at the top of it; a
  group's is its emails and texts plus calls and notes — `timeline_entries.group_id`
  already existed, no migration). RSVP steps: To invite → Invited ("Yet to respond")
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
  bottom (22 Oct 2026, canvas 4 "Money · Round 6", 2): a **Budget / Booked /
  Paid** panel of three bars on one scale (quotes never counted), a **Next
  step** card (set a budget → add a quote → choose or book → mark paid / add
  the balance), then **a card per booked supplier** with its payments inside
  (deposit last; quotes as dashed "not counted" rows, or compared); the month
  columns and payments by month; the budget page with
  "Share it out for us"; money towards it and bills family are paying.
- **The Day** (`/day`): the **run sheet** as an order of service, with three
  piece tiles — **Seating** (floor plan on a dot grid, round / long / top
  tables, a table close-up with saved chairs, dietary marks, seat a group or
  household, Send to the venue as a PDF; **on a laptop** (canvas 4 "Laptop ·
  Round 11", A, 21 Oct 2026) one header row, a white board filling the screen
  that zooms (pinch / ctrl + scroll / ± buttons) and pans (drag the paper) with
  tables allowed outside the original room (0036, positions −300–400% of it),
  and a control panel right: add a table (drag a shape on), still to seat (drag
  a name onto a table or one chair; groups onto a table), the tables;
  `floor-plan-panel.tsx`), **Travel** (where everyone sleeps,
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
