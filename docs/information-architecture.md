# Information architecture

What exists in the app, what it's called, and where it lives. Agreed with the
owner, Sept 2026. The design brief in `docs/design-brief.md` is built on this.

Scope here is the **host app** — the couple's side. The guest-facing surface is a
separate pass (see the note at the end).

---

## The organising idea

Three kinds of thing get confused when listing features, and separating them is
what makes the app small enough to build:

| Kind | Example | Where it goes |
|---|---|---|
| **Lists of things** you add to and edit | guests, suppliers, tasks, tables, payments | a tab |
| **Areas** of the wedding | flowers, cake, music, attire, transport | a *tag*, not a page |
| **Moments** in time | a fitting, a deadline, 3pm on the day | a timeline |

Only the first kind gets a tab.

**Areas are the key move.** "Flowers" looks like it needs a page, but what would
be on it? A supplier, a couple of tasks, a cost, some notes, a few pictures — all
of which already live in other lists. So flowers isn't a page, it's a label that
gathers rows from the lists you already have. One templated area page serves all
of them, and a couple adding "Fireworks" gets a working page for free.

Two rules follow from it:

> **Areas hold the planning. The Day holds the choreography.**
> Booking the cars and paying the deposit is the Transport area. Who's in car two
> at 1:15pm is The Day. Same for food, music, flowers — each is an area, and some
> also cast a shadow onto the day itself.

> **Merge things used at the same moment for the same purpose; separate things
> used at different moments.** Sharing a data shape is not a reason to share a
> screen. This is why every dated item shares one timeline, and why the run-up and
> the day do not.

---

## The map

```
HUB
├── Meta info — date, countdown, venue, headcount, budget left
└── Orb of areas — add and remove your own
    └── every area page holds the same six blocks:
        Info · Tasks · Supplier · Cost · Notes · Inspo

PEOPLE
├── Guest list — households, with RSVPs per person per event
│   └── Bridal party = a filtered view of it, plus each person's job on the day
├── Suppliers — category, booking status, quote, deposit, contract
└── Venue
    (the couple, a planner, anyone with a login → Settings, not here)

PLAN — the timeline of the run-up
├── Agenda — everything dated, on one timeline, with filters:
│      tasks due · appointments · payments due · the wedding day itself
├── List — tasks grouped by area, for working through
└── Suggested starter tasks, generated from the wedding date

MONEY
├── Budget — planned vs committed vs paid, broken down by area
├── Invoices
└── Payments due

THE DAY — the timeline of the day
├── Run sheet — hour by hour
├── Table arrangement
└── Transport on the day — cars, pickups, who travels with whom

NOT TABS
├── Area page — one template, opened by tapping a dot on the orb
├── Brainstorm — chat assistant + quick capture (note / link / image),
│      reachable from every screen, feeding one inbox
├── Inspo — the visual grid of everything saved; its folders ARE the areas
└── Settings — areas on/off, which areas show as a dot, who has a login
```

Five tabs, across the bottom on mobile, down the left on desktop.

---

## Decisions and the reasoning

**Bridal party is not a separate list.** They're guests who also have a job on the
day. One guest list, a role field, a filtered view. The schema already has
`bridal_party` as a contact type.

**Areas are rows, not code.** A starter set ships (venue, flowers, cake, music,
attire, photography, food, stationery, transport, hair & makeup) and couples add
or delete. There is no correct list, which is exactly why it can't be hard-coded —
and it's what makes the app work for someone else's wedding.

**"Info" on an area page stays generic.** A plain key-facts and notes block. The
moment it means *different fields for flowers than for cake*, the single template
collapses into fourteen bespoke pages.

**Three different dated things, one timeline.** A task is ticked off, an
appointment is attended, a payment is paid — genuinely different records, because
squeezing an appointment into a task loses its time, its place and who you're
meeting. But they all answer one question, *what's coming up*, so they share the
Agenda view and are separated by filter, not by screen.

**"Plan", not "Tasks".** A tab called Tasks can't comfortably hold a dress fitting
or an invoice deadline. Plan holds all three.

**Plan and The Day stay separate tabs.** Considered merging them into one
"Timelines" tab with a toggle, and rejected:

- Different scales and units — 18 months by the month, versus 14 hours by the
  five minutes. One component can't render both well.
- The Day also holds the table plan and transport logistics, which don't belong
  under a tab called Timelines. Merging would force seating out to its own tab,
  landing back at five with a worse name.
- Different moments and different audiences — the run-up is opened weekly for
  eighteen months by the couple; the run sheet is used once, by fifteen people,
  and gets printed and sent.
- They fill in opposite order. The Day sits near-empty for seventeen months while
  the run-up is full, then inverts in the last fortnight.

The continuity is real though, so the app says it in one tap: **the last entry on
the run-up timeline is the wedding day, and tapping it opens The Day.**

If a sixth tab is ever genuinely needed, this merge is the cheapest place to find
one. Not before.

**Inspo folders are the areas.** Not a second filing system. A dress saved to
Attire is what makes it appear on the Attire area page — one set of names across
the whole app.

**Settings separates two things:** whether an area is *in use* at all, and whether
it *shows as a dot*. Otherwise an area used only for filing inspiration would
clutter the orb.

---

## How many pages is that really?

The 38 screens in `docs/design-brief.md` are *designs to produce*, not *pages to
build*. Many are one page in a different state — the Hub full and empty, the area
template with two different areas, seating on desktop and on a phone.

| Kind | Count | Which |
|---|---|---|
| **Pages** — own URL | **15** | 1, 2, 3, 5, 8, 9, 13, 15, 16, 22, 25, 26, 29, 36, 37 |
| **Tabs** — a view inside a page | 5 | 11, 12, 18, 23, 28 |
| **Modals & overlays** — open over a page | 10 | 7, 10, 19, 20, 21, 24, 31, 32, 34, 35 |
| **States** — same view, different content | 8 | 4, 6, 14, 17, 27, 30, 33, 38 |

The fifteen:

```
/sign-in            1
/setup              2
/                   3   Hub
/area/[name]        5   one template, every area
/people             8   guests · bridal party · suppliers as tabs
/people/[household] 9
/people/[supplier]  13
/invitations        15
/plan               16  agenda · task list as tabs
/money              22  budget · payments due as tabs
/day/run-sheet      25
/day/seating        26
/inspo              29
/inbox              36
/settings           37
```

The area page is one route serving all nine areas. People is one page with three
tabs. Plan is one page with two views. The Day is two pages plus a transport tab.

**MVP is 7 of them:** sign in, setup, hub, people, household detail, supplier
detail, plan. Plus two modals — add/edit a guest, and a task — and one tab,
suppliers.

Two caveats so the number doesn't mislead:

- **Some are judgment calls.** Whether a task opens as a full page or slides up as
  a sheet is a design decision, not a fact. It moves items between the modal and
  page rows without changing the work much.
- **Pages aren't equal.** `/day/seating` is one page and is harder than the other
  fourteen put together — drag-and-drop tables, guests assigned to seats, and it
  has to survive a phone. `/sign-in` is an afternoon. Counting pages tells you the
  shape of the app, not the hours.

## What this needs that the schema doesn't have yet

All additive — new tables hanging off `weddings`, exactly as `docs/ERD.md`
promised. Nothing here changes an existing table's shape except where noted.

| Need | Shape |
|---|---|
| Areas as rows | `areas` — `wedding_id`, `key`, `label`, `enabled`, `show_on_hub`, `sort_order`. **Replaces `milestones.category`**, and every taggable row gains `area_id` |
| Appointments | `appointments` — date/time, location, `area_id`, `contact_id` (the supplier), notes |
| Money | `payments` / `budget_items`. `supplier_details` already carries `quoted_cost` and `deposit_paid`; invoices and a per-area budget need their own rows |
| Seating | `tables`, `seats` |
| Quick capture | `notes` — with a nullable `area_id` so unsorted items have somewhere to sit |
| Inspo | `inspo_items` — uploaded image or pasted link, nullable `area_id`, note |
| Bridal party roles | a `role_on_the_day` text column on `contacts` |

Music, attire, cake, flowers, food, photography and transport need **no new
tables at all**. They are areas.

---

## Not in this pass

**The guest-facing side.** Guests get the `invitations.token` link that already
exists in the schema — `/i/abc123` — with no login and no download: RSVP, day
info, gifting, their table. Guest *logins* (`wedding_members.role = 'guest'`) only
start earning their keep if guest-to-guest messaging ships.

**MVP is still contacts, timeline and RSVP.** Everything above is the destination.
The value of having it written down is that the five-tab shell can be built now,
with the unbuilt tabs visibly greyed out, so navigation never has to be
retrofitted around finished screens.
