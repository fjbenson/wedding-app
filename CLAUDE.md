# Wedding App — context for Claude

> **Rule one, above everything else (owner, 13 Oct 2026): protecting the
> couples' and their guests' data comes first, every time, without fail.**
> Before building anything, ask what it does with people's details: who can
> see them, where they're sent, how long they're kept. If a feature and the
> data's safety pull in different directions, the data wins — raise it with
> the owner rather than choosing quietly.

A wedding planning app (working name **Rondé**), built to serve other couples,
not just one. The owner is new to development — explain things plainly, avoid
jargon where a normal word will do, and keep answers short unless asked to go
deeper. Phone first; laptop designed separately, sharing colours and type.

## Where things are written down

| File | What's in it |
|---|---|
| `CLAUDE.md` (this) | How we work, and how the app is **now** |
| `docs/app-today.md` | Every screen as built now, with the owner's picks and dates |
| `docs/backlog.md` | Parked ideas, open decisions, checks waiting on the owner |
| `docs/history.md` | Archive of the old notes (to 20 Oct 2026): every round, pick and U-turn. Out of date in places — don't add to it |
| `docs/DESIGN.md` | The look: palette, type system, glass, the Hub |
| `docs/information-architecture.md` | The agreed map: five tabs, 38 screens (20 Sep 2026) |
| `docs/ERD.md` | The data model explained |
| `docs/launch-checklist.md` | What must happen before real couples use it |
| `docs/design-links.md` | Every design canvas and lab |

**The app's map** (artifact, rebuilt 19 Oct 2026):
https://claude.ai/artifact/GfcFVHZX4vuf1Ykzdk1i5B. **Anything new goes on the
map before it's built**; if it fits no tab or the area page, stop and decide
with the owner. No new tabs without the owner.

**Keep this file short.** Record what's true now, with the date of a decision
and the owner's reason in a few words. Don't log every round here: when a
thing changes, replace its line. Parked ideas go in `docs/backlog.md`.

**Notion** (https://app.notion.com/p/WEDDING-APP-3e13db5a9d15818891a3e37ab0800186)
holds the owner's hand-kept notes and the BLAST framework (Blueprint · Link ·
Architect · Style · Trigger; B, L and A are done, S and T in progress). It
lags behind: trust this repo over it, and offer to update it — never unasked.

## What Claude decides alone (owner, 15 Oct 2026; changed 23 Oct 2026)

Rule one still comes first. The line is whether the owner would *see* it.

- **Just do it, tell the owner after in a line:** what they'd never see —
  tidying code, speed, fixing a crash or a typo.
- **Explain first, wait for the owner's OK:** anything that changes how a
  screen looks or behaves, even a small spacing fix — bringing older screens
  into line with settled patterns and `docs/DESIGN.md`, small odd-ones-out,
  new pieces that follow a pattern that already exists. After the OK, build it
  and the owner checks on their phone.
- **Always the owner's call:** anything about people's data (who sees it,
  where it goes, how long it's kept); **any database change**; anything that
  costs money; new tabs or big changes to how the app is organised; the Hub's
  look, the brand and the name; choosing between design options (mock them on
  canvas 5 first).

## How we work (owner, 20 Oct 2026, from reading three chats)

- **Short replies:** about 100 words, plain words; more only when asked.
- **One thing at a time** (owner, 24 Oct 2026): give one next step or one
  question, never a list of things to check or pick from.
- **Mock up first, without being asked,** for anything new or any layout
  change (canvas 5, options to pick from). Fixes and small tweaks go straight in.
- **Sleep on database changes.** Write the migration and explain it, but run
  it only once the owner has seen the design working, or in a later chat —
  not minutes after picking a mock-up (four bits went unused in two days:
  lists, music_played, run_sheet_groups, the typed dish).
- **One topic per chat.** A new idea mid-chat goes in `docs/backlog.md`; suggest
  a fresh chat for it rather than building it there.
- **Screen changes: typecheck, build, push, and the owner looks on their
  phone** (owner, 21 Oct 2026: starting the private copy takes minutes; their
  phone takes 30 seconds). `/check` (`.claude/skills/check/SKILL.md`) only
  when the owner asks. **`/status`** gives the owner five lines on where
  things stand — use it when they ask what's next.

## Shipping

- **No pull requests** (owner, 29 Sep 2026): push straight to `main` with
  `git push origin HEAD:main` (allowed in `.claude/settings.json`), and to
  the chat's own branch. Before every push, `npm run typecheck` and
  `npm run build` must pass. Gather small changes into one push.
- **Vercel** builds `main` about a minute later; a failed build leaves the
  last good version live. Live at https://wedding-app-tau-dusky.vercel.app.
  Since the move to Pro (12 Oct 2026) Vercel no longer reports back to
  GitHub, so **ask the owner to check on their phone** (or vercel.com ›
  Deployments) before saying a change is live. `claude/…` branches don't
  build on Vercel (`vercel.json`).
- **Start of a chat:** `.claude/hooks/session-start.sh` brings the copy up to
  date with `main`, installs packages and points at `.claude/catch-up.md`.
  **End:** the owner types `/banana` (or `/wrapup`): save, push, update these
  notes, report back.
- Tell the owner in plain words what changed once it's pushed.

## Architecture (decided, don't relitigate)

| Piece | Role |
|---|---|
| Next.js 15 | Screens and server logic in one codebase |
| Vercel | Hosts it (Pro plan, Fluid compute, Dublin `dub1`) |
| Supabase | Postgres, Auth, Storage (Ireland, `eu-west-1`) |
| Anthropic API | Juno, the assistant (`claude-opus-5-5`) |
| Resend | Sign-in code emails (custom SMTP in Supabase) |

There is deliberately **no separate backend**. The one real future gap is
scheduled/background work (reminders, long assistant runs): add a worker
(likely Railway) as a third piece, without restructuring the others. Vercel
and Supabase sit in the same region; if one moves, move the other.

## Data and the database

- Schema in `supabase/migrations/0001_init.sql` … `0037_todo_time.sql`,
  **all run** on the live project (**wedding-app**, `hfyuvtrglkdpqvtkzohb`).
- The Supabase connector is set up, so Claude can run migrations — but
  **always says in plain words what a change does and waits for the owner's
  OK**, and **never deletes data** unless the owner asks for exactly that.
  Read-only queries need no OK.
- **`weddings` is the tenant**; everything carries `wedding_id`. Access is via
  `wedding_members` (its `role` enum already has `guest`, so guest access is
  new rows and policies, never a rebuild). **Row-level security is the real
  access control** (`is_wedding_member()`, `is_wedding_host()`); app checks are
  a convenience. Link tables are tied to `(id, wedding_id)` on both sides so
  nothing can point at another wedding's rows.
- Households are separate from contacts (invitations go to a household, RSVPs
  come from people). RSVPs are per person per event (day / evening).
  Suppliers extend contacts via `supplier_details`. Creating a wedding goes
  through the `create_wedding()` function.
- Several values are stored as text joined with " · " (a guest's roles,
  dietary needs) — no migration needed to add one.
- **`supabase/tests/rls_isolation.sql`** proves one couple can't read or write
  another's data. **Re-run it whenever RLS policies change and add every new
  table to it** (how to run it: the top of that file).
- Types in `src/types/db.ts` are hand-written; replacing them with
  `npm run db:types` is still to do.

## Sign-in and the demo

- **Email first** (11 Oct 2026): one box for the email, then a 6-digit code
  (codes, not links — a link opens Safari, not the home-screen app). A new
  email gets an account and goes to `/setup`. The middleware sends anyone
  not signed in to `/sign-in`. Files: `src/components/email-code-form.tsx`,
  `src/app/sign-in/actions.ts`, `src/lib/db/auth.ts`.
- Emails send from Resend's test address, which **only reaches the owner's
  own email** — nobody else can sign in until the app has its own web address
  verified in Resend.
- Home-screen app: `src/app/manifest.ts`, `appleWebApp` in `layout.tsx`.
- **Demo wedding** "Olivia & Theo" (12 Jun 2027), on the owner's login beside
  their real one: ~79 guests, suppliers at every stage, money, plan, run
  sheet (and the Bridesmaids and Groomsmen sheets), menu, drinks, seating,
  travel, decor, stationery sendings, timeline. All made up
  (07700 900xxx phones, @example.com), safe to screenshot. Switch in Settings ›
  Your weddings (`wedding` cookie). Reset by re-running
  `supabase/seed/demo-wedding.sql` — ask the owner first; keep it in step when
  adding features.

## Before real couples use it

The owner's ten-step launch checklist (web address first, then privacy,
ICO, data agreements, backups, two-step login, test couples, the App Store)
is in **`docs/launch-checklist.md`**. Only the Vercel half of item 7 is done.

## Conventions

### Code

- **All database queries live in `src/lib/db/`.** Nothing else imports the
  Supabase client (the browser uploads, `inspo-upload.ts` and
  `files-upload.ts`, live there too).
- **A screen's view lives in its web address; preferences in the browser.**
  Search, filters, the month, an open card go in the address with
  `replaceQuery()` (`src/lib/url-state.ts`) — **use `{ sync: true }` when
  opening or closing a card**, or `useSearchParams()` never hears it. Choices
  you'd want every time (a list's View) go in localStorage. `ViewMemory` and
  `src/lib/last-view.ts` make a form's back link return to the same view.
- **Server actions called from client code must never throw into React**
  (an old page calling a removed action blanks the screen): wrap them like
  `safely()` in `guest-card.tsx` and return a message. `(app)/error.tsx` is
  the safety net.
- **Never import plain values from a `"use client"` file into a server one**
  — it passes typecheck and build and crashes live. Put shared values in a
  plain file.
- Jobs the forms and Juno share live in `src/lib/jobs.ts` (plain inputs,
  return `{ ok, … }`, find the wedding themselves).
- **Dates are worded by the app** (`src/lib/dates.ts`), never
  `toLocaleDateString`, so phone and server agree. **Times** (owner, 20 Oct
  2026): the run sheet and what's printed for suppliers (moments, the menu,
  drinks) use the 24-hour clock (`formatClock`, "13:30"); everything else —
  appointments, journeys, lists — reads "2pm" (`formatTime`).
- **Amounts get commas as you type**: `MoneyInput` / `withCommas()`.
- New non-form screens go in `showsMenuBar()` (`src/lib/nav.ts`).
- Match the surrounding code; comments say why, often with the owner's date.

### Design patterns (settled; follow them on anything new)

See `docs/DESIGN.md` for the look itself (ivory and champagne on lamp-lit
paper, Fraunces, light glass cards, the frosted hub ring).

- **Every tab has the same bones:** a one-row top (title left at 32px, the
  view switch `CornerSwitch` right; no back arrow, no title drawings), a
  numbers card where KPIs help (`NumbersCard`; not on the run sheet), a search
  with the **round black + (40px, `AddButton`)** at its end, then **View** on
  the left and **Filter** on the right.
- **Filter** is one list of rows that each open their values in place, with
  counts; on phones a sheet from the bottom with "Show N …"
  (`FilterMenu` with `expandable`). Picks combine. Every tab can be narrowed
  to an area, and the area page's links land on that.
- **Black (ink) is for the main action only.** Picked tiles are white glass
  or champagne, never black.
- **Look at something in a card; add something on a full screen** (16 Oct
  2026). Things open as a card over the page (`CardSheet`; `plan-cards.tsx`
  mounted once in the `(app)` layout, set by `CardLink`), edited in place:
  **taps save at once, typing gets a small Save**. Where a tab can add more
  than one kind of thing, the + opens a choice (`AddMenu`) first.
- **One row for to-dos, appointments and payments:** the date large on the
  left (`DateStamp`), title and one short grey line (`RowLine`: at most two
  facts — a status only if off or finished, then when, then who; the area
  only when there's no one), the mark on the right.
- **Text · Call · Email** are round buttons with their word under
  (`RoundActions`); a missing one is a faded dashed circle that goes to where
  it's typed in.
- **Forms:** the name large, picture tiles over drop-downs (`visual-form.tsx`),
  Save always in reach (`SubmitBar`) with Cancel on its left; when editing,
  Save only rises once something changed, and neither leaves the form. A saved
  item shows a tile choice as a pill ("Change ⌄").
- **An area pick is labelled "Area"** (add "(optional)" only where it is), tiles open, and "No area" takes it off (owner, 23 Oct 2026: not Folder, File it under, Towards or "Leave it…"). "What they do" on suppliers is the job, a different thing.
- **Every area picker ends with "Other"**, then "+ Add an area" (the ring's
  three steps, `AreaSteps`).
- **An empty screen still shows its shape:** faded ghost rows from the
  wedding's real areas, never made-up data.
- **A fold's grey line shows at most two things** (a Details fold: first two of
  name, number, email…; owner, 23 Oct 2026).
- **One fold open at a time** inside a card or the area page's "Everything
for…" (`FoldAccordion`, anything marked `data-accordion`; owner, 23 Oct 2026).
- **Search boxes show a small x at the end once something's typed**
  (`SearchClear`; owner, 23 Oct 2026).
- **Say less:** no explanatory sentences; an empty section is just its add.
- **Never colour alone** for meaning (overspend is rose stripes plus
  "▲ Over by £…").
- Phones: 16px side margin (`--gutter`), no text under 12px, inputs 16px+
  (no iPhone zoom), check at 320px, 393px and desktop. Laptops (from `lg`):
  the menu down the left like a magazine's contents (`side-bar.tsx`, 280px;
  what's in it: `docs/app-today.md`), pages beside it. **Cards sit beside the list** on a laptop
  (CardSheet's `beside`, `useBeside`; guest, household, group, supplier and
  plan cards): no dimming, the page steps aside 440px, another row swaps the
  card (canvas 4 "Laptop · Round 9", 1, 21 Oct 2026).

## The app today

Five tabs — **Hub · People · Plan · Money · The Day** — plus area pages, Juno, Your notes, Inspo, Settings and Where things stand. Screen by screen, as built, with the owner's picks and dates: **`docs/app-today.md`** — read the part for the screen you're touching before changing it, and keep it up to date.

## Next up

**Laptop (23 Oct 2026):** every screen is laid out for laptops
(`docs/laptop-pass.md`). The owner has looked over the Hub, side menu, People
(guests and suppliers) — done 23 Oct 2026. **Plan's calendar** is now the big
month (canvas 5 "Laptop · Round 21", A, 23 Oct 2026); search, Filter and the
day card beside are done (23 Oct 2026). **Plan's List** is now a board of
months on a laptop, with the calendar's four tiles above (canvas 5 "Laptop ·
Round 26", B, 24 Oct 2026; drag a to-do to another month). Next: Money, then
The Day; forms (and our own date/time pickers)
after the tabs. Tab pages are 1640px wide with 48px sides. For columns where a
card can open beside them, use `room-md:` / `room-lg:` / `room-xl:`
(tailwind.config.ts) instead of `lg:` / `xl:`: they count the room left once
the 440px card is open.

From the audit of 20 Oct 2026 (agreed with the owner: notes tidied first):

1. **Polish over new features** for a week or two: the checks in
   `docs/backlog.md`, then the loose ends there.
2. **The launch checklist**, starting with the web address.
3. **3–5 real couples** trying it — so far the owner is the only user.
4. **Mock-up first** for anything bigger than a tweak (about 30 built things
   were taken back out in the first month).

When building resumes, the 20 Oct chat suggested: the Food & drink full-screen add and drink
guide; **invitations** — the address export, then guest links for RSVPs (the
owner sees invitations as a big pain point); weddings abroad.

## Design work

New rounds go on **design canvas 5**:
https://claude.ai/artifact/W994vwmvDYocB3XsxBcqDS (open with the Artifact
tool's `read`; a canvas holds 40 pages, then start the next). Older canvases
and the Glass, Taste and Name Labs: **`docs/design-links.md`**.
