# Design foundations

The look the owner chose after nine rounds of exploration (Sept 2026). It
replaces the earlier "cream, dusty rose, plum ink" palette. The tokens below
live in `tailwind.config.ts`; the glass recipe and the small-caps label are
`.glass` and `.label` in `src/app/globals.css`.

**In one line:** an ivory wedding magazine on champagne satin — editorial
type, glass cards, and a frosted hub ring (settled 7 Oct 2026; see "The home
screen" below).

The prototypes the decisions came from are in the design canvas ("Home screen
directions", rounds 9 and 10: *Editorial + ring*, *Clear glass*).

## The home screen (7 Oct 2026)

Rounds 11 to 15 on the canvas settled the home screen, and it is built
(`cover.tsx`, `hub.tsx`, `this-month.tsx`). It replaces the floating glass
ring on a champagne cover described further down:

- **Layout from Dusty Blue (round 1), in our colours.** Names centred at
  the top; the ring sits straight on the ivory page, **no card around it**,
  grounded by a solid pale circle (`linen` at 70%) behind the buttons. White
  buttons, ink icons, white disc with the countdown in the middle. No ring
  line.
- **Type from Editorial (round 8).** 260 in thin Fraunces set tight;
  names in Fraunces italic; every small label in spaced capitals (THE
  WEDDING OF, DAYS TO GO, area names, due dates); jobs in Fraunces with their
  day number in `champagne-600`.
- **Glass cards below** (`.glass-card`): "coming up" and Inspo, straight on the paper
  (the soft glows behind them were taken out 12 Oct 2026 with the satin).
  **16 Oct 2026:** lighter and airier — a 0.5px edge (no thick white rim or
  inner highlight), 55% white, a soft wide shadow, and **no backdrop blur**
  (it left a seam across the screen on iPhones). Only floating things (menu
  bar, pen) are frosted.
- **Tab tops (16 Oct 2026, canvas 3 "Tab tops · Round 1", A):** one row —
  the title (Fraunces 32px) left, the view switch right; no back arrow, no
  title drawings.
- **Rows (16 Oct 2026):** to-dos, appointments and payments share one row —
  the date large on the left (`DateStamp`), title and a grey line, the mark
  on the right (tick / calendar / £).
- **Background: paper under a lamp** (canvas 2, "Background · Round 2 ·
  Not boring, not amateur", option A, owner's pick 12 Oct 2026) — one light
  source: near-white at the top of the screen warming to a deeper ivory
  (`#EFE5D5`) below and at the edges (`body::before` in `globals.css`). **16 Oct 2026:** the light is whiter at the
  top (from the canvas mock-ups) and the ground a touch lighter, `#EFE7DA`. A
  paper grain on top was tried and dropped the same day (owner: "doesn't
  feel right") — no texture. History: round 14's champagne
  satin (diagonal stripes) looked cheap; plain paper with a faint grain
  (round 1, option 1) looked like a white background; round 15's plain
  ivory looked flat. Rule from this: **light should look like it has one
  source** — no stripes, no blobs placed at random. Still on the canvas:
  B a warm oat ground with ivory cards, C a real photographed texture.
- What the owner rejected on the way: blue; stacking several "grounding"
  ideas at once (card + dark centre + ring line); solid white cards.
- Area names show under the buttons from tablet width up. On phones it's
  icons only: names were tried with 10 areas and looked too busy (owner's
  call, 7 Oct 2026).

## Type system (7 Oct 2026)

Taken from the home screen (canvas round 15, "Round 14 no. 3 with
Editorial's type") and defined once, in `src/app/globals.css`. Every screen
uses these classes rather than its own sizes — that's what stops screens
drifting apart.

| Class | Looks like | Use for |
|---|---|---|
| `.type-display` | Fraunces Light *italic*, tight | Names, page titles ("Frankie & Sam", "Flowers") — size set where used |
| `.label` | 12px capitals, 0.3em spacing, champagne | "THE WEDDING OF", card labels, capital-letter links |
| `.section-label` | The same, in stone | The heading above a card: "COMING UP", "SUPPLIERS" |
| `.type-item` | Fraunces 19px | A row's title in any list |
| `.type-meta` | 12px capitals, 0.2em spacing, stone | The line under a row: "DUE SAT 1 NOV" |
| `.type-figure` | Fraunces Light, tight | Numbers that matter: countdown, money, day of the month |

Body text and buttons are Geist. Nothing under 12px.

## Each tab has its own signature (10 Oct 2026)

The owner's rule, agreed when Plan became a calendar: **every tab gets one
signature picture**, so you know where you are at a glance, before reading
a word. Everything else stays shared — the ivory and champagne, the type
system above, the row marks, the corner switch — so the app still feels
like one thing while each screen has its own face.

| Tab | Signature | Status |
|---|---|---|
| Hub | The ring of areas | Done (7 Oct) |
| People | The big dark count card, and initials on every row | Done for the guest list (8–9 Oct) |
| Plan | The month calendar (what Plan opens on; the other view is a List of to-dos, a glass card per month) | Done (10–11 Oct) |
| Money | By area (canvas 2 "Money · Round 5", owner's pick 12 Oct: top of 3, list of 4): the whole wedding on a **glass card** — agreed of budget large, one thick bar, Paid · To pay · Still free — then each area as **a little glass card, two to a row** (12 Oct evening, owner's call; was menu-card rows): its icon and name, agreed large, "of £budget", one 8px bar on a linen track (agreed inside budget, paid inside that, stripes past a tick when over), a short word under it; tapping one brings up that area's money as a sheet from the bottom. The picked "All" tile on People's count cards is champagne glass (no outline). Was three thin bars per area (Round 4), and By month (canvas 2 "Money - Round 6", D): the month columns on a glass card with Still to pay and Paid so far, then a glass card per month listing its payments, a dashed No date yet card, Paid folded. Figures and bars, no sentences. Over budget = the agreed bar runs on in rose stripes plus "▲ Over by £…", never colour alone. Bars: budget `stone/25`, agreed `champagne-400/50`, paid `champagne-600` (canvas 2 "Money · Round 4", B + C) | Done (12 Oct) |
| Plan, day card | Tapping a day on the calendar brings up a card (sheet on phones, panel on laptops) with that day and "Add on this day"; the month is listed under the grid, each row carrying its date | Done (11 Oct) |
| The Day | The run sheet as the order of the day: a white card with a gold border, the couple and date, the day in parts, the time on the left and a gold thread with a dot per moment, Now on the day (canvas 2 option D, 11 Oct 2026); the floor plan for seating | Run sheet done (11 Oct) |

When designing a screen: find its tab's signature and make it the first
big thing on the screen. Don't borrow another tab's (no calendar on
Money, no ring on People).

## Settled

### Colour

Ivory is the paper, champagne is the detail, ink is the rare accent. Roughly
90 / 8 / 2 by area.

| Token | Hex | Use |
|---|---|---|
| `white` | `#FFFFFF` | Cards; highlights on glass |
| `ivory` | `#FBF9F5` | Page background, everywhere |
| `cream` | `#F4EFE7` | Secondary panels, pressed states |
| `linen` | `#E6E0D6` | Hairline dividers between rows |
| `champagne-100` | `#F1E7D4` | "Done" fills (e.g. venue booked) |
| `champagne-400` | `#B8914F` | Fine lines only: rules, dashed outlines. **Never text** — about 2.9:1 on ivory |
| `champagne-600` | `#8E6A2C` | Champagne text: small-caps labels, list numbers |
| `ink` | `#1E1B18` | Headlines and body text; the rare solid fill — kept for the main action (the round + by search on People, Plan's Add buttons); a picked count tile is champagne, not ink (12 Oct 2026) |
| `stone` | `#6B655E` | Secondary text: dates, counts |

On a photo, text and icons switch to `#FFFFFF` with a soft shadow. The app
should choose ink or white from the photo's brightness, not the user.

### Editorial essence

- **Type:** Fraunces Light for headlines and big numbers; Geist for everything
  else.
- **Labels:** small, widely letter-spaced capitals in `champagne-600`
  ("THIS MONTH", "ISSUE 01").
- **Structure:** hairline `champagne-400` rules and numbered lists (01, 02…),
  like a magazine contents page.
- **The cover:** a full-width photo at the top, the countdown as the cover
  line, the hub ring floating on it. With no photo, the cover is plain ivory.
- **Voice:** headlines read like a lead story — "The venue is booked. Next,
  the save-the-dates." — not like a task list.

### The hub ring

- Areas of the wedding sit as nodes on a ring around the countdown. It is the
  "everything at a glance" view, and a ring is a wedding symbol.
- No disc behind it: the ring floats directly on the photo or ivory. The line
  has a light edge and a dark edge so one always shows.
- It re-spaces for any number of areas (4 to 12 tested). A dashed `+` node
  adds one (Honeymoon, Transport, …).

### Glass

Starting point, from the *Clear glass* prototype:

- Fill: a gradient from 34% to 4% white.
- Edges: a bright 1–1.5px highlight on top, a faint dark edge underneath, a
  soft drop shadow.
- Behind: a light blur (about 8px) and **no colour boost**. Raising
  saturation made the glass turn orange on warm photos, so buttons no longer
  matched what was behind them (owner feedback, 27 Sept 2026). The glass
  should soften the photo, not recolour it.
- Icons on glass pick ink or white per button, from the brightness of what is
  behind it, and must reach at least 3:1 contrast (aim for 4.5:1). White
  icons on light champagne glass came out around 2:1 — too faint.

### Working default (parked, 29 Sept 2026)

The owner chose not to finalise the home screen yet. Build with this and
refine later — it is all tokens, so changing it is cheap:

- Glass on the **ring buttons** and a **floating menu bar** only.
- Champagne tint, cloudiness 20, blur 18px, edge shine 35, shadow 47,
  no colour boost (the owner's saved "version 2" in the Glass Lab).
- Icons: auto ink/white, regular weight.

## Still open

- **Final glass use.** The working default above stands until revisited.
- Motion: how the ring and glass move.
- Dark mode (an "evening" version was prototyped but not chosen).

## 13 Oct 2026 — what changed

- **One Filter everywhere**: the guest list's "FILTER" (sliders icon, "Show
  only" menu, champagne pill with a count when on, a pill per choice) is now
  the shared `FilterMenu` on Money, Plan's List and The Day too; its row can
  carry the screen's buttons on the right (Print and +).
- **The round black + on every add**: The Day, Your notes, Inspo too.
- **Black is for the main action only**: a guest's Coming and a supplier's
  Booked are gold (`champagne-600`) ticks at 26px, not black.
- **Adding shows tiles; a saved item shows a pill** (the area picker folds
  to "📷 Photos · Change", opens on tap, folds back once picked).
- **Hub, round 2–3**: one quiet glass pill, a gold pen in a ring and "Ask
  your assistant" in italic (13 Oct 2026; was "Jot something down") — never
  "AI", and nothing else under the ring; **This week** with big gold dates down the left; Your notes and Inspo
  as two tiles (a taped note, a picture collage).
- **Your assistant** (13 Oct 2026): full screen; "What can I do for you?" in
  Fraunces, the box in the middle, prompts grouped Ask · Do · Jot; once you
  ask, a conversation in **Geist** (the sans) with answer blocks drawn by the
  app (Fraunces only for big numbers and names) and confirm cards (Yes in ink,
  Change in white).
- **Guest card as a place card** (13 Oct 2026): cream card with an inset gold
  line, the table across the top, the name large in italic, role and "day
  guest" in gold, meal and allergy (rose), the answer stamped at an angle;
  round Text (ink) · Call · Email under it.
- **Overdue in rose**: on This week an overdue date is rose (month under it),
  with "Overdue" under the title — not a label squeezed into the date column.
- **Supplier card as a business card** (cream card, gold stage stamp, area
  tag, round Call · Email · Website), then Progress steps, one Money card,
  Documents, Contact.
- **Pop-ups in the middle** for small extra steps (adding a file), after the
  phone's own picker.
- Icon clashes are catalogued (icon audit) and parked; see `docs/backlog.md`.


## 14 Oct 2026 — what changed

- **A card of their own for each kind of person or thing**: a supplier has a
  business card, a **household an envelope**, a **guest a profile**.
- **Household envelope** (canvas 3 "Household · Round 3"): crisp white card
  with only a few sparse flecks (a grain all over was rejected), a fine gold
  double border; the name in calligraphy — **Pinyon Script**, the one place
  it's used (`font-script`) — and the address in Fraunces italic (the script
  alone wasn't legible enough). No stamp or postmark (tried, removed twice; last 21 Oct 2026): how the replies stand is the line under it, "2 of 3 responded". Tap it:
  it turns over (gold wax seal with the initial), the flap opens, the
  invitation slides out with the details; "reduce motion" skips the movement.
- **Guest profile** (canvas 3 "Guest card · Round 2", A, replacing the place
  card): initials in a large champagne circle on the left, name in italic on
  the right, then RSVP · Table · Meal across in a row, then flat Text ·
  Call · Email buttons.
- **Lists inside a page sit on a glass card** (household's "Who's in it": small
  initials, name, ›) — owner preferred it to the guest list's open rows there.
- **Groups**: a group card takes the numbers card's place on the guest list;
  "Email them" is the black main action; groups show as champagne pills on
  the guest card.

## 23 Oct 2026 — one set of rules for cards

Owner's pick after canvas 4 "Cards · Rounds 1–6". Every card that opens over a
page follows these; each keeps its own look where it says so. Not built yet:
to-do and payment first, then the rest one at a time.

**Two families** (owner's names): **Profile cards** — Supplier, Guest,
Household, Group, Money area. **Item cards** — To-do, Appointment, Payment,
Moment, Inspo idea, Decor item, Note. What each has today:
`docs/card-inventory.md`. Nothing may be dropped without the owner's say.

**Every card, top to bottom**
1. **The frame.** One shell (`CardSheet`), a small champagne label on the left
   and the ✕ on the right. A card with a list behind it also shows
   `‹ 2 of 9 ›` just left of the ✕ and cycles through the list you came
   from, in its order; swiping sideways does the same (the card follows the
   finger), with a one-time nudge the first time. On a laptop, up and down
   arrow keys. No list, no arrows.
2. **The signature.** Each card keeps its own look: the supplier's business
   card, the guest's profile, the household's envelope, a group's icon, the
   date stamp (to-do, appointment, payment), the cue card (moment), the
   picture (Inspo), the paper (note). A tappable area tag on a business card
   carries a ⌄ so it reads as a drop-down.
3. **The main action** is a black pill straight under it (Mark as done, Mark
   as paid, Add to my calendar, Email [name], Make it a to-do). Round
   Text · Call · Email on profile cards. Black is for this alone.
4. **What you tap, as pictures.** Tiles and pills for choices (meal, area,
   status), avatars, date tiles — out in the open, never a fold for one small
   fact. Long profile cards are fine for now; trim later.
5. **Only two folds, always last, in this order: History, then Details**
   (the plain typed facts: phone, email, notes, address). Moment's rarely
   changed Run sheet and Area also fold.
6. **If the card belongs to an area:** an outlined pill, "Open the [area]
   page ›", then a quiet underlined **Remove** (and any "undo the choice"
   link beside it, like "We didn't go with them") at the very foot.

Taps save at once, typing gets a small Save (unchanged). Supplier's separate
"What they do" is gone: the area tag does that job.

**Item cards in one order** (owner, 23 Oct 2026, canvas 4 "Cards · Rounds 7–9"):
signature, black action, **Area**, **Involved**, then this card's own parts
(With, Where, extras such as All payments, Menu, Drinks, Music, Run sheet),
**Notes**, the area pill, Remove. The shared parts always sit in the same two
slots; a part a card doesn't have isn't shown. Names are the same on every
card: "With" (a payment's supplier, a moment's person in charge), "Who's
paying" is Involved on a payment. **The stamp** is the one date; when the card
has a time it sits in a gold band at the foot of the same tile ("Round 9", A):
appointments "2pm" style, moments 24-hour. A to-do has no time unless added
(a quiet "+ Time"). Optional parts offered as a row of "+" chips at the foot
instead of always showing empty (idea only so far; owner called it fine, not
drawn).

**Item cards, 23 Oct 2026 (later the same day; owner):**
- **Area is a tag at the top right** of the signature, champagne with a ⌄, tap
  to change (a dashed "+ Area" if none), like the supplier's business card. So
  there's no Area section in the body; the order becomes signature, black
  action, the people rows, the card's own parts, Notes, then the foot pill
  "Open the [area] page ›" (that one opens the page; the tag changes it) and
  Remove.
- **Where** is the pin row from the proposed appointment card (a rounded card,
  gold pin circle, the place), on appointments and moments.
- **Two kinds of person.** **With** = suppliers (a payment's supplier, an
  appointment's who-you're-seeing, a to-do's tagged supplier). **Your side** =
  guests, family, "us": "Who's involved" (to-do, moment), "Who's coming"
  (appointment), "Who's paying" (payment). A moment's "In charge" stays
  "In charge" (it can be a guest, like the best man).

