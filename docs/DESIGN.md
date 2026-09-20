# Design system

The look of the app, and the pieces it's built from. Direction: **warm and
romantic** — cream paper, dusty rose, deep plum ink.

**See it running:** [`/design`](https://wedding-app-tau-dusky.vercel.app/design)
shows every colour, font and component on one page. It's the real components,
not pictures of them, so if that page looks right the screens will too.

## The idea in one line

Nothing is pure white and nothing is pure black. That single rule is what makes
it feel warm rather than like a banking app.

## Colour

Five families, each with a job:

| Family | Job |
|---|---|
| **Rose** | The primary colour — buttons, links, the thing you're meant to press |
| **Plum** | Text. Headings are `plum-800`, which is a very dark warm brown |
| **Sage** | Good news — attending, booked, done |
| **Gold** | Waiting on something — awaiting reply, in progress. Used sparingly |
| **Sand** | Everything quiet — page background, borders, captions |
| **Clay** | Declined, errors, delete buttons. A muted brick, not an alarm red |

There are also plain-English shortcuts for the ones used constantly:

- `bg-canvas` — the cream page background
- `bg-surface` — white cards sitting on it
- `text-ink` — normal text
- `text-ink-muted` — captions and hints
- `border-hairline` — the standard border

**Where they're defined:** `tailwind.config.ts`. That file is the only place
hex codes appear. To change the whole app's colour, change it there.

## Type

Two fonts, both loaded in `src/app/layout.tsx`:

- **Cormorant Garamond** — the romantic serif. Headings, names, dates. Used via
  `font-display`, and automatically on every `<h1>`, `<h2>` and `<h3>`.
- **DM Sans** — everything you read quickly. Buttons, labels, body text.

Heading sizes are `text-display-sm` through `text-display-xl`.

## The building blocks

All in `src/components/ui/`, all importable from one place:

```tsx
import { Button, Card, Field, Input } from "@/components/ui";
```

| Component | What it's for |
|---|---|
| `Button` | Four looks: `primary`, `secondary`, `ghost`, `danger`. Three sizes |
| `Card`, `CardHeader`, `CardBody`, `CardFooter` | A panel of related content |
| `Field` | A label, a control, and its hint or error — wired together properly |
| `Input`, `Textarea`, `Select` | The controls themselves |
| `Badge` | A small coloured label |
| `RsvpBadge`, `MilestoneBadge`, `SupplierBadge`, `ContactTypeBadge` | The database's status values, turned into readable words with consistent colours |
| `Avatar` | A circle with someone's initials |
| `PageHeader` | The title block every screen starts with |
| `EmptyState` | What a screen shows before there's anything on it |

### Two that are worth understanding

**The status badges** read straight from the types in `src/types/db.ts`. The
database stores `attending`; the badge shows "Attending" in sage green. Because
the mapping lives in one file, that guest looks identical on every screen, and
renaming the label is a one-line change.

**`Field`** takes a function rather than the control directly. That's so it can
hand the control its id and point it at the right message:

```tsx
<Field label="Email" hint="Only used to send their invitation.">
  {(props) => <Input {...props} type="email" />}
</Field>
```

Spread `props` and the label, the hint and the error are all connected — which
is what makes it work for someone using a screen reader. Pass `error` instead of
`hint` and the control turns red on its own; you don't set that separately.

## Rules worth keeping

- **One primary button per screen.** If everything is emphasised, nothing is.
- **Labels are always visible.** Never a placeholder on its own — people forget
  what the box was for the moment they start typing.
- **Empty states are not an afterthought.** They're the first thing a new couple
  sees. Each one says what the thing is and gives them the button to start.
- **No raw hex codes in screens.** Use the names. That's the whole point.

## Still to do

- The hub on `/design` is a rough sketch of the circle-with-dots dashboard, put
  there to react to rather than to build from.
- No dark mode. The direction is cream paper; a dark version would be a separate
  decision, not a toggle.
