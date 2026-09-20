# How we build this

Replaces the BLAST framework, which was dropped on 20 Sep 2026. BLAST wasn't
wrong, it was too coarse: one box called "Architect" and one called "Style" is
what let every database decision get made before any design decision.

## The one principle

**Nothing is real until someone can use it.**

It's possible to spend a long time on schemas, design systems, hosting and docs
and still have an app that does nothing. That's the failure mode everything
below is arranged to avoid.

## The five stages

### 1. Sharpen
One sentence: who it's for, and the single job it does. Then name the **core
loop** — the thing a person does over and over. Here: *add a guest, record
whether they're coming.*

Write down what you're **not** building.

*Don't: open a code editor.*

### 2. Shape
Only the decisions that are **expensive to reverse**. The test:

> If I got this wrong, would I have to migrate real data or rewrite the app?

Yes → decide now. No → defer it.

**Expensive:** who logs in, multi-tenant or not, the domain structure
(households separate from people, RSVPs per event), hosting.

**Cheap:** every field, every colour, every component.

*Don't: design screens, or write a full schema. Just the shape.*

### 3. Slice
Pick **one** journey — the core loop — and design just that.

*Don't: design all the screens. Don't build a component library.*

### 4. Ship the slice
Build that journey end to end. Real auth, real database, deployed, working on a
phone. This should come much earlier than feels comfortable — it's the only
honest test of whether the shape was right, while changing it is still cheap.

*Don't: build anything the slice doesn't need.*

### 5. Widen, then harden
Repeat slice by slice: design → add the fields it needs → build → ship.

The schema and the component library **grow out of this**. They're never built
up front. By the third or fourth slice there's a design system, assembled from
parts that earned their place.

Harden last: error states, loading states, tests, accessibility, performance.
Only worth it once the shape has stopped moving.

## The two rules that actually matter

1. **Shape early, fields late.** Domain structure is a fact about weddings.
   Fields are a consequence of screens.
2. **Vertical slices, not horizontal layers.** Never "all the database, then
   all the design, then all the screens." One complete journey at a time.

## Where design fits

**Diverge in the mockup. Converge in the code.**

A mockup has no database, no auth and no build time, so everything looks free.
That's not a flaw — it's what makes mockups good at exploring. It's also why a
mockup will always drift towards the ideal app rather than the next one.

- **Claude Design** — mood, visual language, and the genuinely hard or novel
  screens where options are worth having. Output is **inspiration, not a spec.**
  Nobody builds it as drawn.
- **Claude Code** — everything else, and all refinement. Iterate against the
  real thing: real data, real phone, real constraints.

This works here because the preview loop is about two minutes — push a branch,
get a link, open it on a phone. Fast enough that iterating in code isn't the
slow option.

The bonus: **in code, scope creep is visible.** Asking for a seating plan gets
the answer "that's a new table, a drag-and-drop interface and a week." A mockup
never has to have that conversation.

## Web and mobile

**Responsive web first, and probably for a long time.** One codebase, instant
updates, no app store review.

Go native only for something the browser can't do — push notifications are the
likely one here, eventually. The cheap middle step is a **PWA**: the same web
app, installable to the home screen, about a day's work and no second codebase.

If native ever happens, React Native / Expo shares the most with this stack.
