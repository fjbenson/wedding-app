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
  "Through the day"; The Day › Filter › Schedule for, on the demo.
- Seating close-up: fill a chair, swap two, a top table; Share the plan in
  Mail on the iPhone.
- Juno: say "Juno" into the phone's dictation (Junia came out "junior").
- The assistant no longer jumping when the keyboard opens (fixed blind).

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
- **Per-person schedules** (hair and make-up for each bridesmaid): an "Only on
  their schedule" switch per moment so they stay off the main run sheet. One
  yes/no column, owner's OK first.
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

- Replace the hand-written types in `src/types/db.ts` with `npm run db:types`.
- Vercel no longer reports deploys back to GitHub (since Pro): the owner has
  to confirm a change is live.
- Notion is hand-kept and behind; offer to update it, never edit unasked.
