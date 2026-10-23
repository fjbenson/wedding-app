# Laptop pass (23 Oct 2026)

The owner asked for every desktop screen to get the mobile look and feel, laid
out for a laptop, kept responsive (no pixel-perfect widths), and to be done
without stopping to ask. Everything is behind `lg:` (1024px and up), so phones
don't change; no database, data or new tabs. Each page was photographed on the
private copy at 1440px (`CHECK_WIDTH=1440 node scripts/check/shoot.cjs …`,
`bash scripts/check/rebuild.sh` after a change) before it was pushed.

Rule used: tab pages use the full width; pages that read like paper (menu,
forms) are narrow and centred with their tools beside them; the rest are two
columns, summary on one side and the lists on the other.

| Page | What changed | Look at |
|---|---|---|
| Settings | Two columns: the wedding, who has a login, your login down the left; the areas beside them in two columns | the areas rows still read cleanly at 1024px |
| The budget | A wider form: the whole-wedding box kept at a sensible width, the areas' shares in two columns | the over/under line still sits above the columns |
| Your notes | The wall is wider, four columns on a big screen (three from 1024px) | |
| Where things stand | Wider, three columns of cards from 1280px (two from 1024px) | |
| Decor pack list | Two columns: before the day on the left, set up at the venue and after the day on the right | a very long "before" list beside a short right side |
| The menu | The paper on the left, Copy for the caterer / Print / Who you're feeding stacked beside it (they stay in view). Also fixed the clipped "Copy for the caterer" label | |
| Drinks | The drink groups side by side under the numbers card | |
