# Design brief — full app

Paste the section below into Claude Design. It asks for the whole app, not just
the MVP, so the owner can walk through the complete thing before the build pass.

Host (couple) screens only — the guest-facing side is a separate pass.

---

## Brief

I'm designing a wedding planning app. It's a real, deployed Next.js app — the
database and hosting are already live, and the screens are the missing piece. I
want to see the **whole app** designed, not just the first release, so I can walk
through it end to end and judge whether the structure holds up.

### What it is

A planning tool for a couple getting married. One couple, one wedding, everything
in one place — the guest list, the suppliers, the money, the jobs still to do, and
the running order of the day itself. It's built to be sold to other couples later,
so nothing should be hard-coded to one wedding.

Mobile first. The realistic use is one of them on a phone, in bed, at 11pm,
chasing an RSVP or checking what the florist quoted. Desktop matters for the
heavier screens (seating, budget) but phone is the default.

### Who's using it

Two people who are not organised, are doing this alongside full-time jobs, and
are mildly stressed about it. They are not project managers and they will not
maintain a system. The app should feel like relief, not like admin. Anything that
looks like enterprise software has failed.

### Look and feel

**Warm and romantic.** That's the direction already chosen — please build it out
properly rather than reinterpreting it.

What I mean by it:

- Warm neutrals and a soft, slightly dusky palette. Candlelight rather than daylight.
- Real typographic care. A serif with some personality for headings is welcome;
  keep body text plainly readable.
- Generous space. Uncrowded. It should feel calm on a small screen.
- Photography and colour do the emotional work; the UI itself stays quiet.

What I don't want:

- Pastel baby-shower cliché, hearts, script fonts, doves, gold foil everywhere.
- Generic SaaS dashboard — grey cards, blue buttons, dense tables.
- Anything so decorative it's hard to read a phone number off it at speed.

It has to survive being useful. A guest list of 130 people is a table. Make the
table beautiful, don't pretend it isn't one.

### The structure — please follow this

Five tabs. That's the whole app.

| Tab | What it holds |
|---|---|
| **Hub** (home) | Key facts strip, the circle-of-dots area picker, what's due next |
| **People** | Three views on one list: Guests · Bridal party · Suppliers |
| **Plan** | Tasks and deadlines, with suggested starter tasks |
| **Money** | Budget, invoices, payments due |
| **The Day** | Run sheet, tables and seating, transport |

Plus four things that are **not** tabs:

1. **Area pages.** The wedding is divided into areas — flowers, cake, music,
   attire, food, photography, transport, venue, stationery. These are *not*
   separate pages with bespoke designs. There is **one templated area page**, and
   tapping a dot on the Hub opens it filtered to that area. It gathers everything
   tagged with that area: the tasks, the supplier, the cost, the notes, and the
   inspiration saved against it. Design this template once and show it filled
   with two different areas (Flowers and Transport) so I can see it flex. Couples
   can add
   their own areas, so the template must work for a name I haven't thought of.

2. **Brainstorm.** Reachable from every screen, not a destination. Two halves: a
   chat assistant that can actually do things ("add Priya to the bridal party",
   "what's left on flowers?"), and a quick capture for getting an idea down in
   four seconds without filing it. Capture covers a typed note, a pasted link and
   an image — they're the same gesture and should be the same control. Everything
   captured lands in one inbox and gets sorted into areas or turned into tasks
   later. Design the entry point, the open state, and the inbox.

3. **Inspo.** A visual grid of everything saved — images uploaded, links pasted,
   the dress someone spotted. Its **folders are the areas**, so a picture saved to
   Attire turns up on the Attire area page as well; the gallery is simply where
   you see all of it at once and browse for a feeling rather than look something
   up. Reachable from the Hub and from the capture control — not a sixth tab.
   Anything that doesn't belong to an area sits in Unsorted until it's filed, the
   same way notes do. This is the one screen where the images should be allowed to
   fill the frame and the interface should almost disappear.

4. **Settings**, in the account menu. Its most interesting job: switching whole
   areas off. A couple who aren't organising transport should be able to turn
   Transport off and have it vanish from the Hub, the task filters and the budget.
   Separately, some areas only ever get used for filing inspiration and shouldn't
   clutter the Hub, so being *in use* and *showing as a dot* need to be two
   different switches.

### The Hub, specifically

The central idea is **a circle with dots around it** — the wedding at the centre,
each area a dot around the edge. This is the app's signature screen and I care
most about getting it right. It should communicate progress at a glance: which
areas are healthy, which are behind, which haven't been started.

Please show me two or three genuinely different takes on this before settling,
including at least one that works properly on a narrow phone screen. If the
circle can't carry the information honestly, say so and show me what does.

### Screens to design

Design every one of these to the same standard. I want a complete walkthrough,
not a polished front and a sketchy back.

**Getting in**
1. Sign in / sign up
2. First-run setup — name the couple, set the date, pick which areas apply

**Hub**
3. Hub, wedding well underway
4. Hub, brand new and empty
5. An area page (Flowers — a booked supplier, tasks, cost, links)
6. The same area page template (Transport — barely started)

**People**
7. Guest list — households, RSVP status per event, search and filter
8. A single household, expanded — the people in it, addresses, dietaries
9. Add / edit a guest
10. Bridal party — who's who and what their job is on the day
11. Supplier list — category, booking status, cost
12. A single supplier — quote, deposit, contract, contact details, notes
13. Invitations — who's been sent one, who hasn't, RSVP chase list

**Plan**
14. Task list — grouped by area or by deadline, my choice of view
15. Suggested tasks — the app proposing a starter plan from the wedding date
16. A single task

**Money**
17. Budget overview — planned vs committed vs paid, broken down by area
18. Payments due — what's owed and when
19. An invoice / payment record

**The Day**
20. Run sheet — the hour-by-hour order of the day
21. Seating — a floor plan where tables get added, moved and filled with guests
22. Seating on a phone (this one is hard; I want to see your answer)
23. Transport — cars, pickups, who's in which vehicle

**Inspo**
24. Inspo gallery — everything saved, as a visual grid, browsable by folder
25. Inspo filtered to one folder (Dresses) — the real reason anyone opens this
26. Saving something — paste a link and get a preview card, or upload an image
27. A single saved item, opened large — its note, its folder, back to the source
28. Inspo, empty — and how you invite the first save

**Everywhere**
29. Brainstorm chat, open
30. Quick capture — note, link and image in one control
31. The capture inbox, with notes and unsorted images together
32. Settings, including the area toggles and which areas show on the Hub
33. Empty states, loading states, and one error state

### Data rules the designs must respect

These come from a database schema that's already built and reviewed. Designs
that contradict them can't be built.

- **Invitations go to a household; RSVPs come from individuals.** "The Smith
  Family" gets one envelope and one link; each of the four Smiths answers for
  themselves. The guest list needs to show both levels without becoming a mess.
- **RSVPs are per person, per event.** A wedding has several events — ceremony,
  reception, evening do, next-day brunch. Someone can be coming to the evening
  only. Any "is she coming?" display has to handle a partial yes.
- **Suppliers and guests are the same kind of record** underneath, distinguished
  by type, with suppliers carrying extra fields (company, category, booking
  status, quoted cost, deposit paid, contract). Same components should serve both
  where it makes sense.
- **Areas are a tag, not a page** — see above. A task, a supplier, a cost, a note
  and a saved image can all carry the same area tag, which is what makes the area
  page work.
- **Inspo folders *are* those areas** — not a second filing system. Saving a dress
  picture into Attire is exactly what makes it turn up on the Attire area page.
  Couples can add an area for anything, so the folder list is open-ended, but
  there is only ever one set of names in the app.
- **A guest is either an adult or a child** — a simple flag, no age brackets.
- **Meal choices are free text**, not a pick-list of set-menu options.
- **There's no RSVP deadline field**, so don't design anything that shows who's
  overdue against a deadline. Chase lists based on "not yet answered" are fine.
- **Tasks can only be assigned to someone with a login** — the two of them, or a
  planner. Not to any random contact.

If one of these rules is making a screen worse, tell me. Some are open questions
and I'd rather hear it now than after it's built.

### Sample data — please use it

Lorem ipsum hides problems. Use this throughout:

- **Frankie & Sam**, married 13 June 2027 at Hazel Gap Barn, Nottinghamshire
- 84 day guests, 130 in the evening, 9 children
- Budget £24,000; £8,600 committed, £3,150 paid
- Households with awkward shapes: a family of five, a single guest, a couple
  where only one can come, a guest with no email address
- Suppliers at different stages: photographer booked and deposit paid, florist
  quoted but not confirmed, band still being researched, caterer chasing a final
  headcount
- Names of varying lengths, including some that will break a tidy layout
- Saved inspiration in uneven shapes: a tall portrait dress photo, a wide table
  setting, a screenshot with text in it, a link to a florist's page with no decent
  preview image, and a handful sitting in Unsorted

### What I need out of this

1. **The design system first** — palette, type scale, spacing, and the components
   that keep recurring (buttons, inputs, the person row, the status pill, the
   card, the tab bar, the modal). Name the tokens. It'll be built in Tailwind, so
   a system that maps onto Tailwind config saves me work later.
2. **Then the screens**, in the order listed, phone and desktop.
3. **The states**, not just the happy path — empty, loading, error, and long
   content that overflows.
4. **A short written note on anything you changed** and why. I'd rather you push
   back on the structure than quietly work around it.

Build it in Tailwind-friendly terms — this becomes a Next.js 15 app with Tailwind,
so please stay within what that can express and avoid effects that'll be a fight
to implement.

Start with the design system and the Hub. Show me those before going further, so
I can react before you've built out thirty-three screens on the wrong foundation.
