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
import { DIETARY_NEEDS, joinNeeds, needsOf } from "@/lib/dietary";
import { addNote } from "@/lib/jobs";
import { findGroups, findGuests, findPayments, findSuppliers, findTodos, guestChoices, moneySummary, overview, seating, supplierChoices, thisWeek, type Overview } from "@/lib/lookups";
import { formatLongDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { AppointmentStepsBlock, Block, GuestStepsBlock, PaymentStepsBlock, Proposal, TodoStepsBlock } from "./blocks";

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
      "Start adding a guest. Call it straight away with the name and anything the couple already said (a diet, a household, a phone number); do NOT ask them anything first. The app then asks the couple the rest, one short step at a time on screen (day or evening, household, dietary needs, contact details, groups, where they're staying), and shows a card to confirm. Nothing is saved until they tap Yes. Use an existing household's id when one fits, or new_household to make one.",
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
        no_dietary_needs: { type: "boolean", description: "Set when the couple said they have no dietary needs" },
        no_household: { type: "boolean", description: "Set when the couple said they aren't in a household" },
        answer: {
          type: "string",
          enum: [...ANSWERS],
          description: "Only if the couple said so: to_invite (the default), pending (already invited), attending (already coming), declined",
        },
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
    description:
      "Start adding a to-do. Call it straight away with the title and anything the couple already said (a date, an area); do NOT ask them anything first. The app asks the rest on screen, one short step at a time (when, which area, anything to add), then shows a card to confirm. Nothing is saved until they tap Yes.",
    input_schema: {
      type: "object",
      properties: {
        title: str,
        due_date: date,
        area: { ...str, description: "An area key, or 'other'" },
        notes: str,
        no_date: { type: "boolean", description: "Set when the couple said it has no date yet" },
        no_area: { type: "boolean", description: "Set when the couple said it's no area in particular" },
      },
      required: ["title"],
    },
  },
  {
    name: "add_payment",
    description:
      "Start recording a payment. Call it straight away with what it's for and anything the couple already said (the amount, a supplier, a date, whether it's paid); do NOT ask them anything first. The app asks the rest on screen, one short step at a time (amount, still to pay or paid and when, who it's to), then shows a card to confirm. Nothing is saved until they tap Yes. Use find_suppliers for a supplier's id.",
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
        no_date: { type: "boolean", description: "Set when the couple said it has no date yet" },
        no_supplier: { type: "boolean", description: "Set when the couple said it isn't for a supplier or area in particular" },
      },
      required: ["description"],
    },
  },
  {
    name: "add_appointment",
    description:
      "Start adding an appointment (a fitting, a tasting, a venue visit). Call it straight away with what it is and anything the couple already said (the date, time, place, a supplier); do NOT ask them anything first. The app asks the rest on screen, one short step at a time, then shows a card to confirm. Nothing is saved until they tap Yes. Use find_suppliers for a supplier's id.",
    input_schema: {
      type: "object",
      properties: {
        title: str,
        date: date,
        time: { ...str, description: "24-hour, e.g. 14:30" },
        no_time: { type: "boolean", description: "Set when the couple said it has no set time (all day)" },
        location: str,
        supplier_id: str,
        area: { ...str, description: "An area key, or 'other'" },
        notes: str,
      },
      required: ["title"],
    },
  },
  {
    name: "find_todos",
    description:
      "Find to-dos by words in the title (open ones unless include_done), with their ids, due dates and areas. Use it before changing or ticking off a to-do. Not shown to the couple, so say what you found if it matters.",
    input_schema: { type: "object", properties: { text: str, include_done: { type: "boolean" } } },
  },
  {
    name: "find_payments",
    description:
      "Find payments by words in what they're for (still to pay unless include_paid), with their ids, amounts and due dates. Use it before marking one as paid. Not shown to the couple.",
    input_schema: { type: "object", properties: { text: str, include_paid: { type: "boolean" } } },
  },
  {
    name: "find_groups",
    description: "The couple's groups of guests (e.g. 'Staying at the pub'), with ids and how many are in each. Use it before adding someone to a group.",
    input_schema: { type: "object", properties: { name: str } },
  },
  {
    name: "move_guest",
    description:
      "Propose moving one guest to another household (use find_guests for their id, wedding_overview for household ids), or to a new household, or out of any. Shows a before-and-after card; nothing changes until Yes.",
    input_schema: {
      type: "object",
      properties: {
        guest_id: str,
        household_id: str,
        new_household: { ...str, description: "A new household's name, e.g. 'The Greens'" },
        no_household: { type: "boolean", description: "Take them out of their household" },
      },
      required: ["guest_id"],
    },
  },
  {
    name: "set_guest_of",
    description: "Propose changing a guest between day and evening (event ids from wedding_overview). Their RSVP answer stays. Shows a card; nothing changes until Yes.",
    input_schema: { type: "object", properties: { guest_id: str, event_id: str }, required: ["guest_id", "event_id"] },
  },
  {
    name: "set_guest_diet",
    description: `Propose changing a guest's dietary needs. Give the WHOLE new list, joined with " · " (use find_guests to see what they have now, and keep what stays). Standard names: ${DIETARY_NEEDS.map((n) => n.name).join(", ")}. Leave empty to clear. Shows a card; nothing changes until Yes.`,
    input_schema: { type: "object", properties: { guest_id: str, diet: str }, required: ["guest_id"] },
  },
  {
    name: "add_guest_to_group",
    description: "Propose adding a guest to one of the couple's groups (ids from find_groups). Shows a card; nothing changes until Yes. You can't take anyone out of a group.",
    input_schema: { type: "object", properties: { guest_id: str, group_id: str }, required: ["guest_id", "group_id"] },
  },
  {
    name: "set_todo_date",
    description: "Propose changing a to-do's date (ids from find_todos), or clearing it with no_date. Shows a card; nothing changes until Yes.",
    input_schema: { type: "object", properties: { todo_id: str, due_date: date, no_date: { type: "boolean" } }, required: ["todo_id"] },
  },
  {
    name: "tick_todo",
    description: "Propose ticking a to-do off as done (ids from find_todos). Shows a card; nothing changes until Yes.",
    input_schema: { type: "object", properties: { todo_id: str }, required: ["todo_id"] },
  },
  {
    name: "mark_payment_paid",
    description: "Propose marking a payment as paid (ids from find_payments), today unless paid_on is given. Shows a card; nothing changes until Yes.",
    input_schema: { type: "object", properties: { payment_id: str, paid_on: date }, required: ["payment_id"] },
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
const STEPS_STARTED = JSON.stringify({
  status:
    "The couple is now being asked the remaining details on screen, step by step (or goes straight to a card if you already had everything), and confirms with a card. Don't ask them anything yourself, don't list the details, and don't say it's added. Reply with at most a few words, or nothing.",
});
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

    case "add_guest": {
      const o = await overview();
      if (!o.ok) return fail(o.error);
      const step = await guestSteps(input, id, o);
      if ("error" in step) return fail(step.error);
      return { result: STEPS_STARTED, block: step };
    }

    case "add_todo": {
      const o = await overview();
      if (!o.ok) return fail(o.error);
      const step = todoSteps(input, id, o);
      if ("error" in step) return fail(step.error);
      return { result: STEPS_STARTED, block: step };
    }

    case "find_todos": {
      const r = await findTodos({ text: text(input.text) ?? undefined, includeDone: flag(input.include_done) });
      return r.ok ? { result: JSON.stringify({ count: r.count, todos: r.todos }) } : fail(r.error);
    }

    case "find_payments": {
      const r = await findPayments({ text: text(input.text) ?? undefined, includePaid: flag(input.include_paid) });
      return r.ok ? { result: JSON.stringify({ count: r.count, payments: r.payments }) } : fail(r.error);
    }

    case "find_groups": {
      const r = await findGroups({ name: text(input.name) ?? undefined });
      return r.ok ? { result: JSON.stringify({ groups: r.groups }) } : fail(r.error);
    }

    case "add_payment": {
      const o = await overview();
      if (!o.ok) return fail(o.error);
      const step = await paymentSteps(input, id, o);
      if ("error" in step) return fail(step.error);
      return { result: STEPS_STARTED, block: step };
    }

    case "add_appointment": {
      const o = await overview();
      if (!o.ok) return fail(o.error);
      const step = await appointmentSteps(input, id, o);
      if ("error" in step) return fail(step.error);
      return { result: STEPS_STARTED, block: step };
    }

    case "set_guest_answer":
    case "move_guest":
    case "set_guest_of":
    case "set_guest_diet":
    case "add_guest_to_group":
    case "set_todo_date":
    case "tick_todo":
    case "mark_payment_paid": {
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

// ── Steps for a new guest ───────────────────────────────────────────────

/** Checks what the AI knew about the guest, and gathers the choices the steps offer. */
async function guestSteps(input: Input, id: string, o: Overview): Promise<GuestStepsBlock | { error: string }> {
  const fullName = text(input.full_name);
  if (!fullName) return { error: "A guest needs a name." };
  const eventId = text(input.event_id);
  const event = eventId ? o.events.find((e) => e.id === eventId) : undefined;
  if (eventId && !event) return { error: "That event id isn't one of this wedding's." };
  const householdId = text(input.household_id);
  const household = householdId ? o.households.find((h) => h.id === householdId) : undefined;
  if (householdId && !household) return { error: "That household id isn't one of this wedding's." };
  const roles = Array.isArray(input.roles) ? input.roles.map(text).filter((r): r is string => !!r) : [];
  const choices = await guestChoices();
  return {
    type: "guest_steps",
    id,
    prefill: {
      fullName,
      eventId: event?.id ?? null,
      householdId: household?.id ?? null,
      newHousehold: household ? null : text(input.new_household),
      diet: needsOf(text(input.diet)),
      dietKnown: !!text(input.diet) || flag(input.no_dietary_needs) === true,
      noHousehold: !household && !text(input.new_household) && flag(input.no_household) === true,
      answer: oneOf(input.answer, ANSWERS) ?? "to_invite",
      phone: text(input.phone),
      email: text(input.email),
      roles,
      isChild: flag(input.is_child) ?? false,
      meal: text(input.meal),
      notes: text(input.notes),
    },
    options: {
      events: o.events.map((e) => ({ id: e.id, word: e.word })),
      households: o.households,
      groups: choices.ok ? choices.groups : [],
      stays: choices.ok ? choices.stays : [],
    },
  };
}

/** Same for a to-do: checks what was said, and passes on the areas to choose from. */
function todoSteps(input: Input, id: string, o: Overview): TodoStepsBlock | { error: string } {
  const title = text(input.title);
  if (!title) return { error: "A to-do needs a name." };
  const area = text(input.area);
  if (area && area !== "other" && !o.areas.some((a) => a.key === area)) return { error: `There's no area "${area}".` };
  const dueDate = day(input.due_date);
  return {
    type: "todo_steps",
    id,
    prefill: {
      title,
      dueDate,
      dateKnown: !!dueDate || flag(input.no_date) === true,
      area,
      areaKnown: !!area || flag(input.no_area) === true,
      notes: text(input.notes),
    },
    options: { areas: o.areas.map((a) => ({ key: a.key, label: a.label })), today: o.today, weddingDate: o.date },
  };
}

/** Same for a payment: what's known, and the suppliers and areas to choose from. */
async function paymentSteps(input: Input, id: string, o: Overview): Promise<PaymentStepsBlock | { error: string }> {
  const description = text(input.description);
  if (!description) return { error: "A payment needs to say what it's for." };
  const amount = typeof input.amount === "number" && Number.isFinite(input.amount) && input.amount >= 0 ? input.amount : null;
  const choices = await supplierChoices();
  const suppliers = choices.ok ? choices.suppliers : [];
  const supplierId = text(input.supplier_id);
  if (supplierId && !suppliers.some((s) => s.id === supplierId)) return { error: "That supplier id isn't one of this wedding's." };
  const area = text(input.area);
  if (area && area !== "other" && !o.areas.some((a) => a.key === area)) return { error: `There's no area "${area}".` };
  const paid = flag(input.paid) ?? false;
  const dueDate = day(input.due_date);
  return {
    type: "payment_steps",
    id,
    prefill: {
      description,
      amount,
      whenKnown: paid || !!dueDate || flag(input.no_date) === true,
      paid,
      dueDate: paid ? null : dueDate,
      paidOn: paid ? day(input.paid_on) : null,
      supplierId,
      area,
      whoKnown: !!supplierId || !!area || flag(input.no_supplier) === true,
      notes: text(input.notes),
    },
    options: { suppliers, areas: o.areas.map((a) => ({ key: a.key, label: a.label })), today: o.today, weddingDate: o.date },
  };
}

/** Same for an appointment. */
async function appointmentSteps(input: Input, id: string, o: Overview): Promise<AppointmentStepsBlock | { error: string }> {
  const title = text(input.title);
  if (!title) return { error: "An appointment needs a name." };
  const choices = await supplierChoices();
  const suppliers = choices.ok ? choices.suppliers : [];
  const supplierId = text(input.supplier_id);
  if (supplierId && !suppliers.some((s) => s.id === supplierId)) return { error: "That supplier id isn't one of this wedding's." };
  const area = text(input.area);
  if (area && area !== "other" && !o.areas.some((a) => a.key === area)) return { error: `There's no area "${area}".` };
  const time = text(input.time);
  return {
    type: "appointment_steps",
    id,
    prefill: {
      title,
      date: day(input.date),
      time: time && /^\d{1,2}:\d{2}$/.test(time) ? time.padStart(5, "0") : null,
      noTime: flag(input.no_time) === true,
      location: text(input.location),
      supplierId,
      area,
      notes: text(input.notes),
    },
    options: { suppliers, areas: o.areas.map((a) => ({ key: a.key, label: a.label })), today: o.today, weddingDate: o.date },
  };
}

// ── Confirm cards ───────────────────────────────────────────────────────

type Confirm = Extract<Block, { type: "confirm" }>;

async function proposalCard(name: string, input: Input, id: string, o: Overview): Promise<Confirm | { error: string }> {
  const areaLabel = (key: string | null) =>
    key ? (key === "other" ? "Other" : (o.areas.find((a) => a.key === key)?.label ?? null)) : null;
  const checkArea = (key: string | null) => (key && !areaLabel(key) ? `There's no area "${key}".` : null);

  // Changes to what's already there: a before-and-after card.
  if (["move_guest", "set_guest_of", "set_guest_diet", "add_guest_to_group"].includes(name)) {
    const guestId = text(input.guest_id);
    const found = guestId ? await findGuests({ id: guestId }) : null;
    const guest = found?.ok ? found.guests[0] : undefined;
    if (!guest) return { error: "That guest id isn't on this wedding's guest list." };
    const word = (w: string | null) => (w ? w.replace(/^\w/, (c) => c.toUpperCase()) : "Not on a list yet");

    if (name === "move_guest") {
      const householdId = text(input.household_id);
      const household = householdId ? o.households.find((h) => h.id === householdId) : undefined;
      if (householdId && !household) return { error: "That household id isn't one of this wedding's." };
      const fresh = household ? null : text(input.new_household);
      if (!household && !fresh && flag(input.no_household) !== true) return { error: "Say which household, a new one, or none." };
      const now = household?.name ?? (fresh ? `${fresh} (new)` : "Not in a household");
      return {
        type: "confirm",
        id,
        title: guest.name,
        action: "Move to another household",
        rows: [
          ["Was", guest.household ?? "Not in a household"],
          ["Now", now],
        ],
        yes: "Move them",
        proposal: { kind: "move_guest", input: { guestId: guest.id, householdId: household?.id ?? null, newHousehold: fresh } },
      };
    }

    if (name === "set_guest_of") {
      const eventId = text(input.event_id);
      const event = eventId ? o.events.find((e) => e.id === eventId) : undefined;
      if (!event) return { error: "That event id isn't one of this wedding's." };
      return {
        type: "confirm",
        id,
        title: guest.name,
        action: "Change day or evening",
        rows: [
          ["Was", word(guest.guestOf)],
          ["Now", word(event.word)],
          ["Their answer", "Stays as it is"],
        ],
        yes: "Change it",
        proposal: { kind: "set_guest_of", input: { guestId: guest.id, eventId: event.id } },
      };
    }

    if (name === "set_guest_diet") {
      if (!guest.guestOf) return { error: "They aren't on a list yet, so there's nowhere to put dietary needs." };
      const diet = joinNeeds(needsOf(text(input.diet)));
      return {
        type: "confirm",
        id,
        title: guest.name,
        action: "Change dietary needs",
        rows: [
          ["Was", guest.diet ?? "None"],
          ["Now", diet ?? "None"],
        ],
        yes: "Change it",
        proposal: { kind: "set_guest_diet", input: { guestId: guest.id, diet } },
      };
    }

    const groupId = text(input.group_id);
    const g = groupId ? await findGroups({ id: groupId }) : null;
    const group = g?.ok ? g.groups[0] : undefined;
    if (!group) return { error: "That group id isn't one of this wedding's." };
    return {
      type: "confirm",
      id,
      title: guest.name,
      action: "Add to a group",
      rows: [["Group", group.name]],
      yes: "Add them",
      proposal: { kind: "add_guest_to_group", input: { guestId: guest.id, groupId: group.id } },
    };
  }

  if (name === "set_todo_date" || name === "tick_todo") {
    const todoId = text(input.todo_id);
    const found = todoId ? await findTodos({ id: todoId }) : null;
    const todo = found?.ok ? found.todos[0] : undefined;
    if (!todo) return { error: "That to-do id isn't on this wedding's plan." };
    if (name === "tick_todo") {
      if (todo.done) return { error: "That one is already done." };
      return {
        type: "confirm",
        id,
        title: todo.title,
        action: "Tick off",
        rows: [["When", todo.due ? formatLongDate(todo.due) : "No date"]],
        yes: "Tick it off",
        proposal: { kind: "tick_todo", input: { todoId: todo.id } },
      };
    }
    const dueDate = day(input.due_date);
    if (!dueDate && flag(input.no_date) !== true) return { error: "Say the new date, or that it has none." };
    return {
      type: "confirm",
      id,
      title: todo.title,
      action: "Change the date",
      rows: [
        ["Was", todo.due ? formatLongDate(todo.due) : "No date"],
        ["Now", dueDate ? formatLongDate(dueDate) : "No date"],
      ],
      yes: "Change it",
      proposal: { kind: "set_todo_date", input: { todoId: todo.id, dueDate } },
    };
  }

  if (name === "mark_payment_paid") {
    const paymentId = text(input.payment_id);
    const found = paymentId ? await findPayments({ id: paymentId }) : null;
    const payment = found?.ok ? found.payments[0] : undefined;
    if (!payment) return { error: "That payment id isn't one of this wedding's." };
    if (payment.paidOn) return { error: "That one is already marked as paid." };
    const paidOn = day(input.paid_on);
    return {
      type: "confirm",
      id,
      title: payment.description,
      action: "Mark as paid",
      rows: [
        ["Amount", formatMoney(payment.amount)],
        ["Was", payment.due ? `Due ${formatLongDate(payment.due)}` : "Still to pay"],
        ["Now", paidOn ? `Paid ${formatLongDate(paidOn)}` : "Paid today"],
      ],
      yes: "Mark as paid",
      proposal: { kind: "mark_payment_paid", input: { paymentId: payment.id, paidOn } },
    };
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

  return { error: "That isn't something I can propose." };
}
