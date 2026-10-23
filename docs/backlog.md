# Backlog

Ideas the owner has parked, decisions still open, and loose ends. Built work
is in `docs/app-today.md`; the full story of each idea (dates,
canvas rounds, quotes) is in `docs/history.md`. When something here is built,
move it to `docs/app-today.md` in a line or two and take it off this list.

**Rule one applies to everything here:** an idea that sends guests' details
anywhere, changes the database or costs money is the owner's call.

## Checks waiting on the owner's phone

From the last few chats, not yet confirmed:

- Stationery: the area page, View › Sent on the guest list, a household's
  Sent to them.
- A guest card's meal and drinks; Food & drink's "What it comes to" and
  "Through the day"; The Day's run sheet picker (Bridesmaids, Groomsmen) on
  the demo.
- Seating close-up: fill a chair, swap two, a top table; Share the plan in
  Mail on the iPhone.
- Run sheets: the picker, the Bridesmaids sheet and its email button, New run
  sheet, a moment's Move to / Copy to; the folded timeline on cards.
- Juno: say "Juno" into the phone's dictation (Junia came out "junior").
- The assistant no longer jumping when the keyboard opens (fixed blind).
- 21 Oct 2026, built but not seen rendered: the round Juno button beside the
  menu bar (also at 320px), the area page's row of five stage circles (names
  fit at 320px?) and one-icon Next up card, the supplier card's four-step
  Progress, "In The Day ›" opening the right run sheet, the note panel as a
  standard card, Settings' Save rising on change.
- 21 Oct 2026, later: Add an idea › Inspo opening (the sheet was clipped),
  Back and Save landing on Ideas, the pale band under Save gone on every
  form, Payment's "Paid £X of £Y".
- 21 Oct 2026, evening: the area page in its new order (Round 4, A), the
  Notes and Inspo tiles opening Ideas, the note rows (icon, first line,
  "Note · date", tap to edit). Tick lists are now ticked inside the note,
  not on the area page.
- 21 Oct 2026, laptop (built blind — the private copy couldn't start, Docker's
  downloads were refused): the Hub ring (five dots under each name, fainter
  circle) and Needs a push; an area page (a big stage card left, a slim Next
  up, panel right — Decor and Stationery too); People (the number card with
  Coming · Yet to respond · To invite beside the total, Can't come apart, the
  icons, the table's Guest of / Answer / Meal / Dietary / Table, a card
  beside the list that closes on a second tap); The Day (the pieces as pills,
  the sheets going round with ‹ ›, Filter / Print / + by the sheet); History
  (past only). Compare each with canvas 4 and say what's off.

- 21 Oct 2026, later (built, not seen on a screen): the guest table (RSVP
  icon on the right, italic Day / Evening, heading sorts, narrow-window scroll,
  column widths), the new View menu, the group and household cards (History,
  Add someone, subtitle figures, envelope without the stamp), and the **new
  guest card** (RSVP always up, folded rows by job, Accommodation / Transport,
  Details). Open question: the guest card now looks plain — icon circles on the
  rows and richer summary lines (the app's marks) were suggested; not mocked up.

## Phone audit, 20 Oct 2026

Every phone screen checked on a private copy with the demo wedding (393px).
Fixed the same day: Add to history (old `/timeline` redirect; now
`/history/new`), New household's crash, the typed dish dropped, guest counts
all "still expected", deposits in By month's Paid list, times (24-hour on the
run sheet only), picked tiles gold not black, one + on the Decor pages,
Settings / Where things stand / Your notes / Inspo's empty page in line,
journey times, wrapped table names, New area's ideas. Still open:

- Juno still reads the old typed dishes if asked (`lookups.ts`), and its
  lookups don't know the meal tiles yet (rule one: owner's call).
- **Not covered**: a real iPhone (keyboard, Safari's pickers), the laptop,
  Juno's answers (needs the key).

## Laptop audit, 20 Oct 2026

**Picked 21 Oct 2026 (canvas 4 "Laptop · Round 9", three kinds of page):**
lists keep the list in view with the card opening beside it on a click, and
closing (1); with no card open, the guest list shows its details in columns
(1b); area pages in two columns (2); the run sheet as a carousel of sheets
(3b, the pick); 3c (sheets side by side on one clock) liked, kept for later.
Seating and Travel later. All of it built on 21 Oct 2026. **Lesson: the
mock-ups didn't survive the build (the Hub, People, The Day, the area page
each needed a second go) — photograph on the private copy before pushing; when
Docker is refused, say so and compare against the mock-up line by line.**
Suppliers in columns would want a mock first. The guest list's "how the
guests add up" went through three layouts on canvas 4 (People, Rounds 1–3); a
split bar was dropped — a visual for it is still unsolved.

Every main screen at 1440px on the private copy (`CHECK_WIDTH=1440`). The
tabs (People, Plan's calendar, Money, The Day's run sheet) use the width;
almost everything else is still the phone layout in a narrow column.

- ~~**The Hub**~~ — done 20 Oct 2026: the sidebar came back as a magazine
  contents (canvas 4, G) and the Hub is one calm screen. Not in it yet: G's
  jot box inside the Your notes card (the notes tile shows instead).
- **Phone-width pages (about 320px wide) in the middle of the screen:** every
  area page (Venue, Food & drink, Stationery, Decor…), Seating (the floor plan
  is small — the screen that most needs the width), Travel, the Decor pack
  list, the menu, Drinks, Your notes, Where things stand, the budget page.
- **Odd widths:** Inspo sits left of centre; Settings is a narrow column on the
  left; Plan's List is a medium column. One rule needed: tabs 1328px, a page
  that reads like paper (the run sheet, the menu) narrow and centred, the rest
  two columns.
- **Forms** (Add a guest, New to-do, New payment, Add a moment) are a narrow
  column with the Save bar under — fine, but could be two columns (the name
  and main choices left, details right).
- **The Day:** the controls row spreads Print to the far right, away from
  Filter; the three piece tiles are small on the left.
- Not checked: cards opening from the right, Juno's panel, hover states.

## Juno (the assistant)

- **Still to build:** a general "change a detail" and "add" tool, "take me
  to…", suggested next-step pills, Compare (quotes side by side), reading a
  photo of a quote or invoice.
- **Still to test:** the general look-up against the live database; a
  30-question test of what it answers; its tools in `rls_isolation.sql`
  terms (another wedding's ids return nothing).
- **Waiting on the owner (rule one):** letting Juno see the new meal and
  drinks fields (a guest's meal would go to Anthropic); a per-wedding monthly
  spending cap and auto-reload before other couples use it.
- Not given to Juno on purpose: notes, files, Inspo, addresses, guests'
  phones and emails, money towards it, the timeline, decor, menu and drinks,
  who's involved.

## Parked ideas

- **Seating, loose ends** (21 Oct 2026, built blind — check on the laptop): long
  and top tables' chairs don't sit on the dots (round ones do); diagonal chairs
  on a round table fall between dots; the guest search was dropped from the
  laptop plan (still on phone and List).
- **Run sheets side by side on one clock** (canvas 4 "Laptop · Round 9", 3c):
  every sheet in its own column against the hours; liked, kept for later.
- **Search on the laptop run sheet** was left out to match the mock-up; say if
  it's missed.
- **Vercel sometimes slow to pick up a push** (21 Oct 2026, twice, 10+ minutes;
  see Tech loose ends).

- **Pick-up and return** as a step for hired or borrowed things (decor, cars,
  attire): collect before, give back after. Not on every supplier (owner,
  21 Oct 2026: think about it). Two Juno entries now on the Hub (the pill and
  the round button); hide the button there if it's too much.

- **The guest portal** (owner, 20 Oct 2026: "one thing we haven't thought
  about yet"). The first time anyone but the couple sees the app. The database
  is ready for it (`wedding_members.role` has `guest`; new rows and policies,
  no rebuild). Smallest first: **1 RSVP online** — a private link per
  household: yes/no per person, day or evening, dietary needs, landing in the
  guest list (the owner's biggest pain point, invitations and chasing);
  **2 information** — timings, venue, travel and stays, dress code, gifts,
  FAQs; **3 their own bits** — their table, their coach, a group's run sheet;
  **4 later** — photos after the day, guests messaging each other. **Rule
  one, the owner's calls:** a guest sees only their own household (never
  others' details, allergies or the budget); how they get in (a private link
  is easiest but works for anyone it's forwarded to; an email code is safer
  but needs the app's own web address, launch checklist item 1); what they
  may change (their answer, dietary needs, contact details); the privacy
  policy covers guests. **Suggested start:** RSVP by private link plus an
  information page, in its own chat, mocked on canvas 3 first (what a guest
  sees, and what the couple see as replies come in). Goes on the app's map
  before it's built.
- **Gifts and thank-yous** (owner: "not sure on this yet"). Canvas 3 "Gifts ·
  Round 1": A a Gifts view on the guest list, B thank-yous one household at a
  time, plus a full-screen New gift. Needs a `gifts` table (owner's OK).
  Open: A, B or both; amounts on money and vouchers; thanking helpers too.
- **Weddings abroad.** Ask in Setup where the couple are from and where the
  wedding is; same country = as today, different = flights, airport lifts,
  the wedding's time zone, a second currency, paperwork. New columns on
  `weddings`. Flight details are guests' personal details.
- **Paper templates** (table games, signs, place cards…). One library,
  reached from Stationery's "Everything for…" and as a fourth piece of The
  Day. Free first; paid ones are the owner's call. Mock on canvas 3 first.
- **Venue table numbers** — a venue's own number beside each table, a nudge
  until matched, the venue's floor plan uploaded; the sent plan leads with
  their numbers. Small column; parked by the owner.
- **Invitations** — the designer or printer is a Stationery supplier like any
  other (decided). Not built: an address export (spreadsheet or label sheet).
  Owner's call later: a print-and-post partner, or design and post in the
  app (sends addresses out and costs money).
- **Travel as a map you can play** — journeys moving through the day with a
  scrubber. Needs a map service (account, key, cost). Show only journeys and
  named places, never a guest's home address. Builds on **Journeys** (the
  day's journeys down a gold thread, a tiny map each, List | Map).
- **Reminders and notifications** — badges in the app first (no new
  services); notifications outside it need push keys, a service worker and a
  scheduled job; Settings › Reminders to choose.
- **Finding suppliers** — not needed unless couples ask. Then: a "Where to
  look" card on an empty area, and the venue's preferred-suppliers list. No
  advertising (it cuts against couples paying).
- **Files:** one place for every file (People › Files), files on payments and
  area pages, Juno reading a file.
- **Food & drink:** adding courses and drinks on a full screen (the "adding is
  a full screen" rule), a rough guide to drink quantities, a children's menu
  (`menu_dishes.for_children` exists, unused), the printed menu on the area
  page.
- **"Start this month"** — that month's nudges above the Plan calendar; the
  owner likes the idea, not yet the look.
- **Dancing couple on the Hub** — the couple choose two dancers by what they
  wear, never by gender; faint gold line art; animated properly or not at all.
  Needs vector art. A new home-screen icon was offered, not started.
- **Public demo mode** ("Look around" on sign-in) — for the portfolio; needs
  a fresh copy per visitor or saves switched off.
- **Portfolio and case study** — the canvases' rounds and the owner's rules,
  a demo mode first, then 3–5 real couples.

## Design tidy-ups

- **Icons as a set** (audit: https://claude.ai/artifact/SCHsvUpFJ6YdGBMb1EKqSY):
  one set of status marks across guests, suppliers and Plan, new pictures for
  Invited and household, one shared icon file with two weights and three
  sizes, then swap in screen by screen. Parked by the owner.
- **Two places for one thing:** areas are added from the ring's + but renamed
  and reordered in Settings; day and evening events are set up at the foot of
  the guest list.
- **Card audit (owner, 23 Oct 2026):** the cards need a shared system, not one
  look. Family 1 (profiles): Area, Guest, Household, Group, Supplier, Money
  area. Family 2 (things with a date): Money payment, Plan to-do, Plan
  appointment, The Day moment. For each: the top, what's folded, where the
  main action sits, how it closes, phone vs laptop. Output: a one-page set of
  rules in `docs/DESIGN.md`, then the odd ones out brought into line. Run it
  in a fresh chat.
  **Where it stands (23 Oct 2026, canvas 4 "Cards · Rounds 1–6"; checklist in
  `docs/card-inventory.md`; nothing built):** Profile cards (Supplier, Guest,
  Household, Group, Money area) and Item cards (To-do, Appointment, Payment,
  Moment, Inspo idea, Decor item, Note). Every card: same shell; label left,
  ✕ right; its own signature piece stays (business card, profile, envelope,
  date stamp, picture); the main action is a black pill under it; what you
  tap often stays out as tiles and pills, only History and Details fold
  (Details always last; no fold for one small fact); an area pill "Open the
  [area] page ›" then a quiet Remove at the foot. Cycling: `‹ 2 of 9 ›` in the
  top row, plus swipe with a one-time nudge, through the list you came from.
  Settled: rules are in `docs/DESIGN.md` (23 Oct 2026); the supplier's "What they do" is
  dropped; the guest card stays long for now. Next: build To-do and Payment
  first, owner checks on phone, then the rest one at a time.
- **Supplier card (canvas 4 "Supplier card · Round 1", 23 Oct 2026), waiting
  on the owner's pick:** A tidied, B with Contact folded (Claude's pick), C
  everything folded; D/E (tap a stage, its part opens, as on area pages; a
  button inside moves the supplier on). Do after the audit so it follows the rules.
- **Guest card RSVP slider (owner, 23 Oct 2026):** split it like the laptop
  guest numbers: To invite › Yet to respond › Coming together, then a gap and
  Can't come on its own, since it's not a step in the invited-to-coming flow.
  Mock up on canvas 4 first. Fresh chat. **Option (same day):** show it as
  steps like a supplier's Progress (To invite › Invited › Coming, ticks as
  reached, tap a step to move on) with Can't come as a small separate link;
  it would replace the slider. RSVPs are per event, so it shows the guest's own.
- **A time on a to-do (owner, 23 Oct 2026):** an optional `+ Time` on the
  stamp ("6 Nov", "2pm"), so reminders can say when. `milestones.remind_at`
  (timestamptz) may hold it with no database change; check first. Any database
  change is the owner's call.
- **Journeys: stages across the app (owner, 23 Oct 2026, to think about
  later):** areas (Ideas › Quote › Book › Pay › Ready), suppliers (In touch ›
  Quote in › Booked › Paid), guests (To invite › Invited › Coming, Can't come
  apart) and any others. For each: what each stage means, what action moves it
  on (by hand or by something the app sees, like a payment or an RSVP), how to
  go back, and what the card shows at each stage. Aim for one logic that
  reads the same everywhere. Related: the guest RSVP as steps (above).
- **Tag a supplier on a to-do (owner, 23 Oct 2026):** "With" on a to-do ("ring
  the cake place"). The involved links (`milestone_guests`) point at contacts,
  and suppliers are contacts, so likely no new columns: widen the picker from
  guests to suppliers too. It also puts the to-do on that supplier's History.
  About people's details, so the owner's call before building. A Where on a
  to-do would need a new column (not wanted yet).
- A supplier's card could show their next appointment.
- Inspo's folder chips could use the shared Filter.
- Canvases still say "Your planner" / "Your assistant" (now Juno).

## The name and the business

- **Working name Rondé** (French for round, and a circle dance; "Everything
  sorted. Ready to dance."). To do: friend test, UK trademark search, a web
  address (ronde.app or similar), App Store title. The owner's naming rules
  and ruled-out names are in `docs/history.md`.
- **Business model:** paid by couples (one-off, ~£30–50 a wedding), not
  suppliers. A free trial with 3–5 couples → Stripe on the website → App
  Store later (Capacitor wrap). **App Store is non-negotiable** (owner, 20 Oct
  2026): do it after the first test and before charging strangers. Open to
  check then: Apple's account cost, their payment rules (in-app purchase vs
  Stripe on the website), and review ("just a website" gets rejected, so it
  needs some native features such as reminders).

## Design decisions still open

Each would be an added column, not a rebuild:

- Meal choices are free text (one menu for everyone was the owner's call).
- No RSVP deadline, so nothing shows who's overdue replying.
- To-dos assign only to people with a login (guests can be tagged as
  "involved" instead).

## Tech loose ends

- **Vercel slow to pick up pushes** (21 Oct 2026): two pushes to main in a
  row didn't show in Deployments for 10+ minutes (the first came through on
  its own; the second was started by hand, Create Deployment › main). The
  GitHub link shows "Connected Sep 20". If it keeps happening: Settings ›
  Git, disconnect and reconnect the repo; check vercel-status.com.

- Run sheets: the old group tags on moments (`run_sheet_groups`, 0034) are left unused.

- Replace the hand-written types in `src/types/db.ts` with `npm run db:types`.
- Vercel no longer reports deploys back to GitHub (since Pro): the owner has
  to confirm a change is live.
- Notion is hand-kept and behind; offer to update it, never edit unasked.
