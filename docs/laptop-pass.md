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
| Plan › List | A numbers card beside the list (open to-dos, overdue, this month, no date, appointments to come), each figure a filter; the list keeps a readable width | the card stays in view as the list scrolls |
| Suppliers | Like the guest list (23 Oct 2026, owner): four tiles, one toolbar row, columns in a glass card — Stage and Area with icons, Price (quoted/agreed), Paid \| To go, Phone, Email | |
| Guest list | Five separate tiles (champagne total, white-glass answers, dashed Can't come); table columns near the name, no vertical lines, RSVP icon before its word, Phone and Household added; filter pills on the Filter row (23 Oct 2026, owner) | |
| Tab pages | People, Money, Plan calendar and the run sheet are 1640px wide with 48px sides (was 1368px, no side padding) | |
| Travel | Two columns: where people stay, and getting there and back | |
| Add an area | The Next bar is centred on the page, not on the screen | |
| Seating | The "dietary needs by table" list is a column per table (three, four from 1280px) |  |
| Hub | Under 1280px the two cards (Needs a push, This week) go under the ring instead of squeezing it; the ring was a few hundred pixels wide and its names overlapped | the Hub's look is unchanged from 1280px up |
| Money · By month | The month columns were squeezed beside the title switch; they now start below it | |
| Area pages | The two columns (next up + stages, and everything for the area) start at 1280px; below that, and with a card open, one column. At 1024px the left column was 270px wide and its words overlapped | |
| The Day · run sheet | The peeking sheets either side are clipped to the page (they ran under the menu) and left out while a card is open | |
| Guest list | The numbers strip keeps full words at 1280px (narrower total and Can't come boxes); the toolbar follows the table | |
| Money · By month | The search and Filter wrap in the left column instead of running over the payments | |
| Plan · Calendar | The big month (canvas 5 "Laptop · Round 21", A, owner's pick 23 Oct 2026): five number tiles (Overdue, To-dos open, Appointments, This month, No date; each opens the List narrowed), then the month across the page with each thing written in its day (time first for appointments, rose with "!" when overdue; three fit, then "+N more"); No date and Done are pills by the month's name, with Today and the +. No list under it. Phone layout until there's room beside an open card (`room-lg:`) | search and Filter on the calendar are still to come |
| A card open beside a list | New `room-md:` / `room-lg:` / `room-xl:` classes (tailwind.config.ts) count from the room the page really has: with a card open (440px) lists keep their phone layout until the screen is 440px wider. Fixes squashed names in Suppliers, the Plan numbers card, the guest table and its numbers card, and Money's two cards and four-across areas | open any card at 1024px and at 1440px |

Checked at 1440px and 1024px (and with a card open beside the list) with no sideways scroll. Settings' two area
columns only start at 1280px; below that the areas are one column.
