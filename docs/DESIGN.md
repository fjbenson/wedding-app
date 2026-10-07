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
- **Glass cards below** (`.glass-card`): "coming up" and Inspo, over soft
  champagne glows the page puts behind them so the glass shows.
- **Background: champagne satin** (round 14, no. 4) — a still diagonal
  satin gradient behind every screen (`body::before` in `globals.css`), a warm champagne circle (`#EADCC6`)
  behind the ring. Round 15's plain ivory looked flat on the phone.
- What the owner rejected on the way: blue; stacking several "grounding"
  ideas at once (card + dark centre + ring line); solid white cards.
- Area names show under the buttons from tablet width up. On phones it's
  icons only: names were tried with 10 areas and looked too busy (owner's
  call, 7 Oct 2026).

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
| `ink` | `#1E1B18` | Headlines and body text; the rare solid fill (selected area, primary button) |
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
