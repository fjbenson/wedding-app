# Design brief — for Claude Design

Paste this in, along with a link to the repo.

**This asks for two screens, not the whole app.** Sign in and contacts — enough
to add a real guest and see them saved. The rest of the app comes in later
rounds, once this one is built and working. There's a note at the end on what's
coming, so nothing gets designed into a corner.

**Repo:** `fjbenson/wedding-app`
**The look, running:** https://wedding-app-tau-dusky.vercel.app/design

---

## What it is

A wedding planning app. Built for one couple first, but intended to serve other
couples later — so nothing should be hard-coded to a particular wedding.

This first version is **host-only**: the couple planning the wedding are the
only people who log in. Guests don't have accounts yet.

## The feel

**Warm and romantic.** Cream paper, dusty rose, deep plum ink, with sage and
gold as quiet accents.

One rule holds the whole thing together: **nothing is pure white and nothing is
pure black.** That's what stops it feeling like a banking app.

It should feel calm. Planning a wedding is already stressful — the app should
not add to it. Err towards space and quiet over density and dashboards.

### Colours

| | Role | Key value |
|---|---|---|
| **Rose** | Primary — buttons, links, the thing to press | `#CB705A` |
| **Plum** | Text. Headings are the darkest | `#42272E` |
| **Sage** | Good news — attending, booked, done | `#6E8862` |
| **Gold** | Waiting — awaiting reply, in progress | `#C89740` |
| **Sand** | Quiet — borders, captions, muted text | `#A08B7B` |
| **Clay** | Declined, errors, delete | `#B4453F` |

Page background is cream `#FDF6F0`. Cards on top of it are white `#FFFFFF`.

Full ramps (50–900 for each) are in `tailwind.config.ts` in the repo.

### Type

- **Cormorant Garamond** — headings, names, dates. The romantic half.
- **DM Sans** — everything read quickly: buttons, labels, body text.

### Please keep

The colours and the fonts. They're settled and the owner has approved them.

### Please ignore

There are already some components in the repo (buttons, cards, form fields).
**They were built before any screen was designed, so treat them as disposable.**
Don't design around them, don't try to match them, and don't feel obliged to
reuse them. If a screen needs something different, design the different thing —
it'll be built to match.

**Don't produce a component library as a deliverable.** Screens are what's
wanted. The reusable parts will be pulled out of the finished screens afterwards.

---

## The two screens

### 1. Sign in

The couple signing in. Email-based, through Supabase Auth.

Open question worth a view on: magic link (emailed one-tap link, no password to
forget) versus email and password. Design whichever you think suits — or both,
and the owner picks.

This is the first thing anyone sees, so it carries the most first-impression
weight of any screen here.

### 2. Contacts

Everyone involved. Four kinds, which may or may not deserve separating:
**guests**, **suppliers**, **bridal party**, **venue**.

Per person: first and last name, email, phone, free-text notes, and a
child/adult flag.

**Households matter here.** People are grouped into households ("The Smith
Family") because invitations go to a household — one envelope — while RSVPs come
from each person individually. A household has a name and a postal address. How
to show that grouping without it feeling like a spreadsheet is the interesting
problem on this screen.

Suppliers carry extra fields: company name, category, a status
(researching → enquired → booked → cancelled), quoted cost, deposit paid, and a
link to a contract.

Expect a few hundred people at most. Needs to work well on a phone — this is
the screen most likely to be used standing in a venue.

## Coming in later rounds — context only, don't design these yet

Listed so nothing above gets designed into a corner. These are the next slices,
each designed when its turn comes.

**The dashboard — a circle-with-dots hub.** The signature screen and the most
open question in the whole app: a central circle with dots around it, each dot
an area of the wedding. Worth knowing it's coming, because contacts will
eventually be reached from it.

**Timeline.** A to-do list running over a year or more, with due dates and
statuses.

**RSVP.** The structural thing to know: an RSVP is one person's answer to one
*event*. A wedding has several — the ceremony, the evening reception — and
people are invited to different ones, so the same guest can be attending the
evening but not the day. That's how weddings actually work, so contacts
shouldn't assume one answer per guest.

Later still, and further off: a chatbot, guest logins, guest-to-guest
messaging, seating plans, a gift registry, photo uploads.

## About the database

The database exists and is **completely empty** — no data, no users. Adding a
field to it right now costs minutes.

So treat it as flexible, not as a constraint. **If a design needs something,
ask for it.** Adding a column is cheap and it will be added.

What exists today, for reference:

- **People:** first and last name, email, phone, free-text notes, child/adult
  flag, and which of the four kinds they are
- **Households:** a name and a postal address
- **Suppliers:** company name, category, status, quoted cost, deposit paid,
  contract link

Things that would need adding, none of them difficult, if a design wants them:
an RSVP deadline, a set list of meal choices, a budget, age bands for children.

The one thing that is **not** flexible is the *shape* — everything belongs to a
wedding, households are separate from the people in them, and RSVPs are per
person per event. Those are facts about how weddings work rather than choices,
and designs should fit them.

## Constraints

- **Phones are not an afterthought.** The owner checks this on a phone. Both
  screens need a phone design, not just a desktop one squeezed down.
- **No dark mode.** Deliberate — the direction is cream paper.

## What comes back

Designs for the two screens above, at phone and desktop width. Links or
screenshots both work.

Those get handed to Claude Code, which builds them for real against the
existing Supabase database — real sign in, real saved data, deployed. Once
that's working, the next slice gets designed.
