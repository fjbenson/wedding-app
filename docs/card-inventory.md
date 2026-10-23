# Card inventory (23 Oct 2026)

Everything each card has **today**, read from the code, set against canvas 4
"Cards · Round 3". Made so nothing is lost by accident when the cards are
brought into line. ✅ drawn in Round 3 · ⚠️ not drawn, needs a home before
building · ➖ fine as it is.

## Supplier (`supplier-card.tsx`)
- ✅ Business card: name, area tag, stage stamp, Call · Email · Website (missing ones dashed)
- ✅ Progress steps (tap a step; Paid comes from Money)
- ✅ Money: agreed figure, deposit paid
- ⚠️ **Quote** figure (editable) — Round 3 shows only Agreed / Deposit
- ⚠️ "N payments ›" link and "+ Add a payment"
- ✅ Documents (private files) · ✅ Contact person, phone, email, website, notes · ⚠️ Contract link (goes in Details)
- ⚠️ **Decor from them** (`SupplierDecor`)
- ⚠️ **"What they do"** (move to another area)
- ⚠️ **"We didn't go with them" / Bring them back**
- ✅ History · ✅ Open the area page · ✅ Remove

## Guest (`guest-card.tsx`)
- ✅ Household link at the top · ✅ Profile (tap a figure, its row opens) · ✅ Text · Call · Email
- ✅ RSVP (slider; steps option parked in the backlog) · ⚠️ **Day / evening ("Guest of")**, in Details
- ✅ Meal tiles · ⚠️ **Drinks tiles** · ⚠️ **Dietary editor** (allergies marked)
- ✅ Table · ⚠️ **Travel** (where they sleep, journeys)
- ✅ Role · ⚠️ **Their own role** · ⚠️ **Groups** (join, leave, open one)
- ✅ History (incl. sendings for someone with no household) · ✅ Details (household, phone, email, notes)
- ⚠️ **"In the plan"** (`GuestPlanSection`: to-dos they're involved in) · ✅ Remove

## Household (`household-view.tsx`)
- ✅ Envelope (tap = change name and address; copy icon on the address) · ✅ "2 of 3 responded"
- ✅ Text · Call · Email (asks who if several) · ✅ Guests list + Add someone
- ✅ History with save the date / invitation / thank-you at the top
- ⚠️ **Details** (name, address) — in Round 3 only through tapping the envelope · ✅ Remove

## Group (`guest-groups.tsx`) — not drawn in Round 3
- ⚠️ Name, counts, Email them · Text · Edit, Guests list, Add to group, History
- ⚠️ Remove lives inside Edit ("Remove this group") — keep it consistent with the rule

## Money area (`money/area-cards.tsx`)
- ➖ Only the top changes. Round 3 drew a stripped version: the real card also has
  per-guest cost, "What it comes to" (food prices, Change the prices ›), a payments list
  inside each booked supplier card, quote comparison, "+ Add a payment" and Set a budget.
  **None of these move.**

## To-do (`plan-card-body.tsx`)
- ✅ Mark as done · ✅ Title (edit in place) · ✅ When · ✅ Area · ✅ Involved · ✅ Notes · ✅ Remove

## Appointment — not drawn in Round 3
- ⚠️ Title, When (date), **Time (with clear)**, Area, Involved, **Where**, **With** (supplier),
  Notes, **Add to my calendar** (.ics, Google, Outlook), Remove

## Payment
- ✅ Mark as paid (shows "Paid 3 Jun") · ✅ Amount · ✅ Due / Paid on · ✅ Area · ✅ Who's paying · ✅ To · ✅ Notes · ✅ Remove
- ⚠️ **"All payments to [supplier]"** (paid and to come, around a Today marker)

## Moment
- ✅ Title · ✅ When · Where · In charge · Music · Notes · Area · Run sheet (Move to / Copy to)
- ⚠️ **Menu and Drinks served here** (food moments only) · ⚠️ **Music link**
- ⚠️ **Send it** today is "Email [name]" or "Email it", plus **"Copy it"** — Round 3 drew one button
- ✅ Remove

## Not changing
No database, no data, no new fields. This is layout only.
