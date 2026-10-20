# Backlog

Ideas the owner has parked, decisions still open, and loose ends. Built work
is in `CLAUDE.md` ("The app today"); the full story of each idea (dates,
canvas rounds, quotes) is in `docs/history.md`. When something here is built,
move it to `CLAUDE.md` in a line or two and take it off this list.

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

## Phone audit, 20 Oct 2026

Every phone screen checked on a private copy with the demo wedding (393px).
Fixed the same day: Add to history (old `/timeline` redirect; now
`/history/new`), New household's crash, the typed dish dropped, guest counts
all "still expected", deposits in By month's Paid list, times (24-hour on the
run sheet only), picked tiles gold not black, one + on the Decor pages,
Settings / Where things stand / Your notes / Inspo's empty page in line,
journey times, wrapped table names, New area's ideas. Still open:

- **The floating pen covers the right edge** of a list while it's at the top
  (the A–Z letters, a row's tick or £, the last table on the floor plan).
  Moving or shrinking the pen is a look change: the owner's call.
- Food & drink's "Everything for…" has 11 lines (Guests and Dietary needs
  overlap) — could merge, owner's call.
- The note panel (Your notes) still uses its older list of actions.
- Settings' The wedding card still has an always-on black Save.
- Juno still reads the old typed dishes if asked (`lookups.ts`), and its
  lookups don't know the meal tiles yet (rule one: owner's call).
- **Demo gaps**: no menu, drinks or extra run sheets in `demo-wedding.sql`.
- **Not covered**: a real iPhone (keyboard, Safari's pickers), the laptop,
  Juno's answers (needs the key).

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
  Store later (Capacitor wrap).

## Design decisions still open

Each would be an added column, not a rebuild:

- Meal choices are free text (one menu for everyone was the owner's call).
- No RSVP deadline, so nothing shows who's overdue replying.
- To-dos assign only to people with a login (guests can be tagged as
  "involved" instead).

## Tech loose ends

- Run sheets: the area page's "In The Day ›" opens the main sheet only, so a
  moment on another sheet isn't in it; the demo seed (`demo-wedding.sql`)
  doesn't make the extra sheets yet. The old group tags on moments
  (`run_sheet_groups`, 0034) are left unused.

- Replace the hand-written types in `src/types/db.ts` with `npm run db:types`.
- Vercel no longer reports deploys back to GitHub (since Pro): the owner has
  to confirm a change is live.
- Notion is hand-kept and behind; offer to update it, never edit unasked.
