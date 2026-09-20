# Design brief — for Claude Design

Paste this in, along with a link to the repo. It covers the look, what each
screen has to do, and what the database can actually provide.

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

## The five screens

### 1. Sign in

The couple signing in. Email-based, through Supabase Auth.

Open question worth a view on: magic link (emailed one-tap link, no password to
forget) versus email and password. Design whichever you think suits — or both,
and the owner picks.

This is the first thing anyone sees, so it carries the most first-impression
weight of any screen here.

### 2. Dashboard — the hub

**The signature screen, and the most open.** The concept from the owner's notes:
a central circle with dots around it, each dot an area of the wedding — venue,
flowers, cake, music, photos, guests.

Things it could show: how many days to go, what's due next, how RSVPs are
tracking, what needs attention.

Everything about this is up for grabs — whether the dots are navigation or
status, what sits in the middle, what happens when you tap one. The rough
version currently in the repo is a placeholder, not a proposal. Feel free to
ignore it entirely.

### 3. Contacts

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

### 4. Timeline

The to-do list, over months. Each item has a title, a longer description, a
category, a due date, an optional reminder date, and a status
(**to do → in progress → done**, or **skipped**).

Items can be assigned to one of the people with a login.

Worth a view on: is this a list, a calendar, or something more like a road
stretching towards the day? Wedding planning runs over a year or more, so
whatever it is has to make "nothing due for three months, then everything at
once" readable.

### 5. RSVP

**The structure that matters:** an RSVP is one person's answer to one *event*.
A wedding has several events — the ceremony, the evening reception — and people
are invited to different ones. So the same guest can be attending the evening
but not the day.

Each RSVP has a status (**awaiting reply / attending / can't make it**), a meal
choice, and dietary notes.

The screen needs to show the overall picture — how many replied, how many
haven't — and let the couple record replies as they come in by phone, text or
in person. Most replies will be relayed verbally, not submitted by the guest.

Showing "one person, several events, different answers" without it becoming a
grid of checkboxes is the hard part.

---

## What the database can't do yet

Worth knowing so the designs don't promise things that can't be built. Each is
an added field rather than a rebuild, so if a design genuinely needs one, say so
and it can be added.

- **No RSVP deadline.** Nothing can show who's overdue to reply.
- **Meal choices are free text.** There's no set menu to pick from, so no
  "42 chose the chicken" without adding one.
- **No budget.** Only a cost per supplier — no overall budget or spend total.
- **Milestones assign only to people with a login**, not to any contact.
- **Children are a yes/no flag.** No age bands for catering.

## Constraints

- **Phones are not an afterthought.** The owner checks this on a phone. Every
  screen needs a phone design, not just a desktop one squeezed down.
- **No dark mode.** Deliberate — the direction is cream paper.
- **Not in this version:** chatbot, guest logins, guest-to-guest messaging,
  seating plans, gift registry, photo uploads, inspiration boards. All planned
  eventually, so don't design them in, but don't design something they couldn't
  later slot into.

## What comes back

Screen designs, at phone and desktop width, for the five screens above. Links
or screenshots both work.

Those get handed to Claude Code, which builds them for real against the existing
Supabase database. Components get pulled out of the finished designs at that
point — not before.
