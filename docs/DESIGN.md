# Design foundations

The look the owner chose after nine rounds of exploration (Sept 2026). It
replaces the earlier "cream, dusty rose, plum ink" palette, which still lives
in `tailwind.config.ts` until the design system is rebuilt from this file.

**In one line:** an ivory wedding magazine, with the ring floating on the cover
in clear glass.

The prototypes the decisions came from are in the design canvas ("Home screen
directions", rounds 9 and 10: *Editorial + ring*, *Clear glass*).

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
- Behind: a light blur (about 6px) with raised brightness and saturation, so
  the photo shows through like a glass bead.
- Icons switch between ink and white with the background, like text.

## Still open

- **Where glass is used, and how much.** Being explored in the Glass Lab
  (ring only? everything over the photo? menu bar? slide-up panels?), along
  with clarity, blur, edge strength and tint.
- Motion: how the ring and glass move.
- Dark mode (an "evening" version was prototyped but not chosen).
