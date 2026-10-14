/**
 * Your assistant's tools: what it may look up, and what it may propose.
 *
 * Lookups run at once (src/lib/lookups.ts) and most also send an answer
 * block to the panel. Changes never run here: they come back as a confirm
 * card, and only the couple's Yes saves them (`confirmProposalAction`, which
 * calls the same jobs as the forms). Saving a note is the one exception —
 * it's what the jot box always did, and it removes nothing.
 *
 * No tool takes a wedding: every lookup and job finds the signed-in
 * person's own. Inputs come from the AI, so each is checked here before use.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { DIETARY_NEEDS } from "@/lib/dietary";
import { addNote } from "@/lib/jobs";
import { findGuests, findSuppliers, moneySummary, overview, seating, thisWeek, type Overview } from "@/lib/lookups";
import { formatLongDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Block, Proposal } from "./blocks";

type Tool = Anthropic.Beta.BetaTool;

const str = { type: "string" } as const;
const date = { type: "string", description: "yyyy-mm-dd" } as const;
const ANSWERS = ["to_invite", "pending", "attending", "declined"] as const;
const STAGES = ["enquired", "quoted", "booked", "cancelled"] as const;

export const TOOLS: Tool[] = [
  {
    name: "wedding_overview",
    description:
      "The couple's names, wedding date, days to go, today's date, their areas (key and name), their events (day and evening, with ids) and households (with ids), and how many guests and suppliers. Call this first whenever you need an id or an area key.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "find_guests",
    description:
      "Find guests and count them. All filters are optional and combine. 'answer' is their RSVP for their own event: to_invite, pending (invited, no reply yet), attending (coming), declined (can't come). 'mentions' searches their meal choice and dietary needs (e.g. 'vegetarian', 'nut'). The panel shows the guests under your reply, so don't list them in words.",
    input_schema: {
      type: "object",
      properties: {
        name: { ...str, description: "Part of a name" },
        answer: { type: "string", enum: [...ANSWERS] },
        event_id: { ...str, description: "Guests of this event (from wedding_overview)" },
        bridal_party: { type: "boolean" },
        dietary: { type: "boolean", description: "Anyone with a dietary need written down" },
        mentions: str,
        children: { type: "boolean" },
        no_address: { type: "boolean" },
        household: { ...str, description: "Part of a household's name" },
        title: { ...str, description: "A short heading for the list, e.g. 'Vegetarian guests'" },
      },
    },
  },
  {
    name: "money_summary",
    description:
      "The money for the whole wedding, or for one area: budget, agreed (booked suppliers' quotes plus other payments), paid, still to pay, still free (negative = over budget), what's due each month, the next three payments, and booked balances with no payment set up. The panel shows it under your reply.",
    input_schema: { type: "object", properties: { area: { ...str, description: "An area key from wedding_overview" } } },
  },
  {
    name: "this_week",
    description:
      "This week's to-dos, payments and appointments (Monday to Sunday), anything overdue, and the next thing after the week. The panel shows it under your reply.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "seating",
    description: "The tables and who's sat at each, or just tables whose name matches; and how many guests are still to seat.",
    input_schema: { type: "object", properties: { table: { ...str, description: "Part of a table's name" } } },
  },
  {
    name: "find_suppliers",
    description:
      "Suppliers, optionally by area key, stage (enquired = in touch, quoted = quote in, booked, cancelled = not taken) or name; with quotes, deposits and contact details, plus the area's budget. The panel shows them under your reply.",
    input_schema: {
      type: "object",
      properties: {
        area: str,
        stage: { type: "string", enum: [...STAGES] },
        name: str,
        title: { ...str, description: "A short heading, e.g. 'Photographers'" },
      },
    },
  },
  {
    name: "add_guest",
    description:
      "Propose adding a guest. Shows the couple a card; nothing is saved until they tap Yes. Ask first if you don't know whether they're a day or evening guest (when the wedding has both). Use an existing household's id when one fits, or new_household to make one.",
    input_schema: {
      type: "object",
      properties: {
        full_name: str,
        event_id: { ...str, description: "The event they're a guest of (from wedding_overview)" },
        household_id: str,
        new_household: { ...str, description: "A new household's name, e.g. 'The Lathams'" },
        roles: { type: "array", items: str, description: "Roles on the day, e.g. Bridesmaid" },
        email: str,
        phone: str,
        is_child: { type: "boolean" },
        meal: str,
        diet: { ...str, description: `Dietary needs, joined with " · ", using these names where they fit: ${DIETARY_NEEDS.map((n) => n.name).join(", ")}. Anything else in their own words.` },
        notes: str,
      },
      required: ["full_name"],
    },
  },
  {
    name: "set_guest_answer",
    description: "Propose changing one guest's RSVP (use find_guests for their id). Shows a card; nothing is saved until Yes.",
    input_schema: {
      type: "object",
      properties: { guest_id: str, answer: { type: "string", enum: [...ANSWERS] } },
      required: ["guest_id", "answer"],
    },
  },
  {
    name: "add_todo",
    description: "Propose a to-do for the plan. Shows a card; nothing is saved until Yes.",
    input_schema: {
      type: "object",
      properties: { title: str, due_date: date, area: { ...str, description: "An area key, or 'other'" }, notes: str },
      required: ["title"],
    },
  },
  {
    name: "add_payment",
    description:
      "Propose recording a payment — still to pay with a due date, or already paid. Use find_suppliers for a supplier's id. Shows a card; nothing is saved until Yes.",
    input_schema: {
      type: "object",
      properties: {
        description: { ...str, description: "What it's for, e.g. 'Photographer deposit'" },
        amount: { type: "number", description: "In pounds" },
        supplier_id: str,
        area: str,
        due_date: date,
        paid: { type: "boolean" },
        paid_on: date,
        notes: str,
      },
      required: ["description", "amount"],
    },
  },
  {
    name: "save_note",
    description:
      "Save a thought to the couple's notes, straight away. Use it when their message is a note to self or a reminder rather than a question or a request — e.g. 'ring the florist about peonies'. Keep their words; tidy only capitals and obvious typos.",
    input_schema: {
      type: "object",
      properties: { body: str, url: str, area: { ...str, description: "An area key, if it clearly belongs to one" } },
      required: ["body"],
    },
  },
];

// ── Checking what the AI sent ──────────────────────────────────────────

type Input = Record<string, unknown>;
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null);
const flag = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);
const day = (v: unknown): string | null => {
  const s = text(v);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};
const oneOf = <T extends string>(v: unknown, options: readonly T[]): T | undefined =>
  options.includes(v as T) ? (v as T) : undefined;

const ANSWER_WORD: Record<(typeof ANSWERS)[number], string> = {
  to_invite: "To invite",
  pending: "Invited",
  attending: "Coming",
  declined: "Can't come",
};

export interface ToolOutcome {
  /** What the AI reads back (JSON). */
  result: string;
  isError?: boolean;
  /** What the panel draws. */
  block?: Block;
}

const fail = (message: string): ToolOutcome => ({ result: JSON.stringify({ error: message }), isError: true });
const WAITING = JSON.stringify({
  status: "Shown to the couple as a card. Nothing is saved until they tap Yes; you'll hear if they do. Don't say it's done.",
});

/** Runs one tool call. `id` is the tool call's own, so a card can only be saved once. */
export async function runTool(name: string, input: Input, id: string): Promise<ToolOutcome> {
  switch (name) {
    case "wedding_overview": {
      const r = await overview();
      return r.ok ? { result: JSON.stringify(r) } : fail(r.error);
    }

    case "find_guests": {
      const r = await findGuests({
        name: text(input.name) ?? undefined,
        answer: oneOf(input.answer, ANSWERS),
        eventId: text(input.event_id) ?? undefined,
        bridalParty: flag(input.bridal_party),
        dietary: flag(input.dietary),
        mentions: text(input.mentions) ?? undefined,
        children: flag(input.children),
        noAddress: flag(input.no_address),
        household: text(input.household) ?? undefined,
      });
      if (!r.ok) return fail(r.error);
      return {
        result: JSON.stringify({ count: r.count, guests: r.guests, shownUnderYourReply: true }),
        block: { type: "guests", title: text(input.title) ?? "Guests", count: r.count, guests: r.guests, link: r.link },
      };
    }

    case "money_summary": {
      const r = await moneySummary({ area: text(input.area) ?? undefined });
      if (!r.ok) return fail(r.error);
      const { ok: _ok, ...summary } = r;
      return { result: JSON.stringify({ ...summary, shownUnderYourReply: true }), block: { type: "money", summary } };
    }

    case "this_week": {
      const r = await thisWeek();
      if (!r.ok) return fail(r.error);
      return {
        result: JSON.stringify({ from: r.from, to: r.to, items: r.items, next: r.next, shownUnderYourReply: true }),
        block: { type: "week", from: r.from, to: r.to, items: r.items, link: r.link },
      };
    }

    case "seating": {
      const r = await seating({ table: text(input.table) ?? undefined });
      if (!r.ok) return fail(r.error);
      return {
        result: JSON.stringify({ tables: r.tables, unseated: r.unseated, shownUnderYourReply: true }),
        block: { type: "seating", tables: r.tables, unseated: r.unseated, link: r.link },
      };
    }

    case "find_suppliers": {
      const r = await findSuppliers({
        area: text(input.area) ?? undefined,
        stage: oneOf(input.stage, STAGES),
        name: text(input.name) ?? undefined,
      });
      if (!r.ok) return fail(r.error);
      return {
        result: JSON.stringify({ count: r.count, suppliers: r.suppliers, budget: r.budget, shownUnderYourReply: true }),
        block: { type: "suppliers", title: text(input.title) ?? "Suppliers", count: r.count, suppliers: r.suppliers, budget: r.budget, link: r.link },
      };
    }

    case "save_note": {
      const body = text(input.body);
      const url = text(input.url);
      const r = await addNote({ body, url, area: text(input.area) });
      if (!r.ok) return fail(r.error);
      return { result: JSON.stringify({ saved: true }), block: { type: "note", body, url } };
    }

    case "add_guest":
    case "set_guest_answer":
    case "add_todo":
    case "add_payment": {
      const o = await overview();
      if (!o.ok) return fail(o.error);
      const card = await proposalCard(name, input, id, o);
      if ("error" in card) return fail(card.error);
      return { result: WAITING, block: card };
    }

    default:
      return fail(`There's no tool called ${name}.`);
  }
}

// ── Confirm cards ───────────────────────────────────────────────────────

type Confirm = Extract<Block, { type: "confirm" }>;

async function proposalCard(name: string, input: Input, id: string, o: Overview): Promise<Confirm | { error: string }> {
  const areaLabel = (key: string | null) =>
    key ? (key === "other" ? "Other" : (o.areas.find((a) => a.key === key)?.label ?? null)) : null;
  const checkArea = (key: string | null) => (key && !areaLabel(key) ? `There's no area "${key}".` : null);

  if (name === "add_guest") {
    const fullName = text(input.full_name);
    if (!fullName) return { error: "A guest needs a name." };
    const eventId = text(input.event_id);
    const event = eventId ? o.events.find((e) => e.id === eventId) : undefined;
    if (eventId && !event) return { error: "That event id isn't one of this wedding's." };
    const householdId = text(input.household_id);
    const household = householdId ? o.households.find((h) => h.id === householdId) : undefined;
    if (householdId && !household) return { error: "That household id isn't one of this wedding's." };
    const newHousehold = text(input.new_household);
    const roles = Array.isArray(input.roles) ? input.roles.map(text).filter((r): r is string => !!r) : [];
    const proposal: Proposal = {
      kind: "add_guest",
      input: {
        fullName,
        householdId: household?.id ?? null,
        newHousehold: household ? null : newHousehold,
        eventId: event?.id ?? null,
        roles,
        email: text(input.email),
        phone: text(input.phone),
        isChild: flag(input.is_child) ?? false,
        meal: text(input.meal),
        diet: text(input.diet),
        notes: text(input.notes),
      },
    };
    const p = proposal.input;
    const rows: [string, string][] = [];
    rows.push(["Household", household?.name ?? (newHousehold ? `${newHousehold} (new)` : "Not in a household")]);
    if (o.events.length) rows.push(["Guest of", event ? event.word.replace(/^\w/, (c) => c.toUpperCase()) : "Not on a list yet"]);
    if (roles.length) rows.push(["Role", roles.join(" · ")]);
    if (p.meal) rows.push(["Meal", p.meal]);
    if (p.diet) rows.push(["Dietary", p.diet]);
    if (p.phone) rows.push(["Phone", p.phone]);
    if (p.email) rows.push(["Email", p.email]);
    if (p.isChild) rows.push(["Child", "Yes"]);
    if (p.notes) rows.push(["Notes", p.notes]);
    if (event) rows.push(["RSVP", "To invite"]);
    return { type: "confirm", id, title: fullName, action: "Add to the guest list", rows, yes: "Add them", proposal };
  }

  if (name === "set_guest_answer") {
    const guestId = text(input.guest_id);
    const status = oneOf(input.answer, ANSWERS);
    if (!guestId || !status) return { error: "Needs a guest id and an answer." };
    const found = await findGuests({ id: guestId });
    const guest = found.ok ? found.guests[0] : undefined;
    if (!guest) return { error: "That guest id isn't on this wedding's guest list." };
    return {
      type: "confirm",
      id,
      title: guest.name,
      action: "Change their RSVP",
      rows: [
        ["Was", guest.answer ? ANSWER_WORD[guest.answer] : "Not on a list yet"],
        ["Now", ANSWER_WORD[status]],
      ],
      yes: "Change it",
      proposal: { kind: "set_guest_answer", input: { guestId, status } },
    };
  }

  if (name === "add_todo") {
    const title = text(input.title);
    if (!title) return { error: "A to-do needs a name." };
    const area = text(input.area);
    const bad = checkArea(area);
    if (bad) return { error: bad };
    const dueDate = day(input.due_date);
    const rows: [string, string][] = [
      ["When", dueDate ? formatLongDate(dueDate) : "No date yet"],
      ["Area", areaLabel(area) ?? "Other"],
    ];
    const notes = text(input.notes);
    if (notes) rows.push(["Notes", notes]);
    return {
      type: "confirm",
      id,
      title,
      action: "Add to the plan",
      rows,
      yes: "Add it",
      proposal: { kind: "add_todo", input: { title, dueDate, area, notes } },
    };
  }

  // add_payment
  const description = text(input.description);
  const amount = typeof input.amount === "number" && Number.isFinite(input.amount) && input.amount >= 0 ? input.amount : null;
  if (!description || amount === null) return { error: "A payment needs what it's for and an amount." };
  const area = text(input.area);
  const bad = checkArea(area);
  if (bad) return { error: bad };
  const supplierId = text(input.supplier_id);
  let supplierName: string | null = null;
  if (supplierId) {
    const s = await findSuppliers();
    supplierName = s.ok ? (s.suppliers.find((x) => x.id === supplierId)?.name ?? null) : null;
    if (!supplierName) return { error: "That supplier id isn't one of this wedding's suppliers." };
  }
  const paid = flag(input.paid) ?? false;
  const dueDate = day(input.due_date);
  const paidOn = day(input.paid_on);
  const rows: [string, string][] = [["Amount", formatMoney(amount)]];
  if (supplierName) rows.push(["To", supplierName]);
  if (area) rows.push(["Area", areaLabel(area)!]);
  rows.push(paid ? ["Paid", paidOn ? formatLongDate(paidOn) : "Today"] : ["Due", dueDate ? formatLongDate(dueDate) : "No date yet"]);
  const notes = text(input.notes);
  if (notes) rows.push(["Notes", notes]);
  return {
    type: "confirm",
    id,
    title: description,
    action: paid ? "Record as paid" : "Add to what's due",
    rows,
    yes: "Record it",
    proposal: {
      kind: "add_payment",
      input: { description, amount, supplierId, area, dueDate: paid ? null : dueDate, paid, paidOn: paid ? paidOn : null, notes },
    },
  };
}
