/**
 * The general look-up (17 Oct 2026, owner: "surely we don't have to hand
 * code everything"): ONE read-only tool for any part of the wedding, in place
 * of a tool per question. The assistant names a collection (guests,
 * appointments, payments…), narrows it with filters, and can ask for counts
 * by a field or a total; the app does the filtering, counting and adding up,
 * so the assistant never does sums in its head.
 *
 * What's readable is a short list, written down here (rule one: people's
 * details). Each collection lists its fields; nothing outside the list can be
 * asked for. Never included: notes, files, Inspo, addresses, and guests'
 * phone numbers and emails (only whether they have one). A supplier's phone,
 * email and website are included, since "what's the florist's number?" is a
 * normal question.
 *
 * Like every lookup it finds the wedding itself (`getCurrentWedding()`) and
 * row-level security still guards each query.
 */
import { listAppointments } from "@/lib/db/appointments";
import { listAreas } from "@/lib/db/areas";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { getDay } from "@/lib/db/day";
import { listGroups } from "@/lib/db/groups";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { listStays } from "@/lib/db/stays";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { areaName, areaOptions, type AreaOption } from "@/lib/areas";
import { todayISO } from "@/lib/dates";
import { rolesOf } from "@/lib/guest-roles";
import { needsOf } from "@/lib/dietary";
import { supplierStatusLabel } from "@/lib/supplier-status";
import type { Contact, WeddingEvent } from "@/types/db";

type Value = string | number | boolean | string[] | null;
export type Row = Record<string, Value>;
type Kind = "text" | "number" | "date" | "yesno" | "list";

interface Collection {
  about: string;
  fields: Record<string, { kind: Kind; hint?: string }>;
  /** Fields the plain `text` search looks in. */
  search: string[];
  /** How a row reads in the list under an answer. */
  primary: string;
  secondary: string[];
  link: string;
  load(ctx: Ctx): Promise<Row[]>;
}

interface Ctx {
  weddingId: string;
  today: string;
  areas: AreaOption[];
}

const fullName = (c: Contact) => [c.first_name, c.last_name].filter(Boolean).join(" ");
const eventWord = (e: WeddingEvent) => e.name.replace(/^the\s+/i, "").toLowerCase();
const ANSWER_WORD = { to_invite: "to invite", pending: "yet to respond", attending: "coming", declined: "can't come" } as const;
const clock = (t: string | null | undefined) => (t ? String(t).slice(0, 5) : null);

const COLLECTIONS: Record<string, Collection> = {
  guests: {
    about: "Everyone on the guest list (not suppliers).",
    fields: {
      name: { kind: "text" },
      household: { kind: "text" },
      guest_of: { kind: "text", hint: "day or evening" },
      answer: { kind: "text", hint: "to invite, yet to respond, coming or can't come" },
      roles: { kind: "list", hint: "bridesmaid, best man…" },
      meal: { kind: "text" },
      dietary: { kind: "list", hint: "dietary needs, e.g. Vegan, Nut allergy" },
      child: { kind: "yesno" },
      groups: { kind: "list" },
      staying: { kind: "text", hint: "the place they're staying, or 'no'; empty if not asked" },
      own_way: { kind: "yesno", hint: "making their own way there" },
      table: { kind: "text" },
      has_address: { kind: "yesno", hint: "their household has an address" },
      has_phone: { kind: "yesno" },
      has_email: { kind: "yesno" },
    },
    search: ["name", "household"],
    primary: "name",
    secondary: ["guest_of", "answer"],
    link: "/people",
    async load({ weddingId }) {
      const [guests, households, events, rsvps, groups, stays, day] = await Promise.all([
        listGuests(weddingId),
        listHouseholds(weddingId),
        listEvents(weddingId),
        listRsvps(weddingId),
        listGroups(weddingId),
        listStays(weddingId),
        getDay(weddingId),
      ]);
      const household = new Map(households.map((h) => [h.id, h]));
      const stayName = new Map(stays.map((s) => [s.id, s.name]));
      const table = new Map((day?.tables ?? []).map((t) => [t.id, t.name]));
      const seat = new Map((day?.seats ?? []).map((s) => [s.contact_id, table.get(s.table_id) ?? null]));
      return guests.map((g) => {
        const theirs = rsvps.filter((r) => r.contact_id === g.id);
        const own = events.find((e) => theirs.some((r) => r.event_id === e.id));
        const answer = own ? theirs.find((r) => r.event_id === own.id) : undefined;
        const h = g.household_id ? household.get(g.household_id) : undefined;
        return {
          id: g.id,
          name: fullName(g),
          household: h?.name ?? null,
          guest_of: own ? eventWord(own) : null,
          answer: answer ? ANSWER_WORD[answer.status] : null,
          roles: rolesOf(g),
          meal: theirs.find((r) => r.meal_choice)?.meal_choice ?? null,
          dietary: needsOf(theirs.find((r) => r.dietary_notes)?.dietary_notes),
          child: g.is_child,
          groups: groups.filter((x) => x.members.includes(g.id)).map((x) => x.name),
          staying: g.staying === "yes" ? (g.stay_id ? (stayName.get(g.stay_id) ?? "yes") : "yes, place not sure") : (g.staying ?? null),
          own_way: Boolean(g.own_way),
          table: seat.get(g.id) ?? null,
          has_address: Boolean(h && (h.address_line1 || h.postcode)),
          has_phone: Boolean(g.phone),
          has_email: Boolean(g.email),
        };
      });
    },
  },

  households: {
    about: "Households (where an invitation goes) and how many people are in each.",
    fields: { name: { kind: "text" }, people: { kind: "number" }, children: { kind: "number" }, has_address: { kind: "yesno" } },
    search: ["name"],
    primary: "name",
    secondary: ["people"],
    link: "/people?sort=household",
    async load({ weddingId }) {
      const [households, guests] = await Promise.all([listHouseholds(weddingId), listGuests(weddingId)]);
      return households.map((h) => {
        const inside = guests.filter((g) => g.household_id === h.id);
        return {
          id: h.id,
          name: h.name,
          people: inside.length,
          children: inside.filter((g) => g.is_child).length,
          has_address: Boolean(h.address_line1 || h.postcode),
        };
      });
    },
  },

  groups: {
    about: "Groups of guests, like 'Staying at the pub'.",
    fields: { name: { kind: "text" }, people: { kind: "number" } },
    search: ["name"],
    primary: "name",
    secondary: ["people"],
    link: "/people",
    async load({ weddingId }) {
      return (await listGroups(weddingId)).map((g) => ({ id: g.id, name: g.name, people: g.members.length }));
    },
  },

  suppliers: {
    about: "Suppliers, with their stage, quote and contact details.",
    fields: {
      name: { kind: "text" },
      contact_person: { kind: "text" },
      area: { kind: "text" },
      stage: { kind: "text", hint: "in touch, quote in, booked or not taken" },
      quote: { kind: "number", hint: "pounds" },
      deposit_paid: { kind: "number", hint: "pounds" },
      phone: { kind: "text" },
      email: { kind: "text" },
      website: { kind: "text" },
    },
    search: ["name", "contact_person"],
    primary: "name",
    secondary: ["area", "stage"],
    link: "/people?tab=suppliers",
    async load({ weddingId, areas }) {
      return (await listSuppliers(weddingId)).map((s) => ({
        id: s.id,
        name: s.supplier_details?.company_name ?? fullName(s),
        contact_person: s.supplier_details?.company_name ? fullName(s) : null,
        area: areaName(s.supplier_details?.category ?? null, areas),
        stage: s.supplier_details ? supplierStatusLabel(s.supplier_details.status).toLowerCase() : null,
        quote: s.supplier_details?.quoted_cost ?? null,
        deposit_paid: s.supplier_details?.deposit_paid ?? null,
        phone: s.phone,
        email: s.email,
        website: s.supplier_details?.website ?? null,
      }));
    },
  },

  todos: {
    about: "To-dos on the plan.",
    fields: {
      title: { kind: "text" },
      due: { kind: "date" },
      area: { kind: "text" },
      done: { kind: "yesno" },
      overdue: { kind: "yesno", hint: "not done and past its date" },
    },
    search: ["title"],
    primary: "title",
    secondary: ["due", "area"],
    link: "/plan?view=list",
    async load({ weddingId, areas, today }) {
      return (await listMilestones(weddingId)).map((m) => ({
        id: m.id,
        title: m.title,
        due: m.due_date,
        area: areaName(m.category, areas),
        done: m.status === "done",
        overdue: m.status !== "done" && !!m.due_date && m.due_date < today,
      }));
    },
  },

  appointments: {
    about: "Appointments: fittings, tastings, venue visits.",
    fields: {
      title: { kind: "text" },
      date: { kind: "date" },
      time: { kind: "text", hint: "24-hour, e.g. 14:30; empty if no set time" },
      location: { kind: "text" },
      area: { kind: "text" },
      with: { kind: "text", hint: "the supplier" },
      been: { kind: "yesno", hint: "the date has passed" },
    },
    search: ["title", "location", "with"],
    primary: "title",
    secondary: ["date", "time"],
    link: "/plan?view=list&show=appointments",
    async load({ weddingId, areas, today }) {
      const [appointments, suppliers] = await Promise.all([listAppointments(weddingId), listSuppliers(weddingId)]);
      const name = new Map(suppliers.map((s) => [s.id, s.supplier_details?.company_name ?? fullName(s)]));
      return (appointments ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        date: a.on_date,
        time: clock(a.at_time),
        location: a.location,
        area: areaName(a.area_key, areas),
        with: a.contact_id ? (name.get(a.contact_id) ?? null) : null,
        been: a.on_date < today,
      }));
    },
  },

  payments: {
    about: "Payments: still to pay or paid.",
    fields: {
      description: { kind: "text" },
      amount: { kind: "number", hint: "pounds" },
      due: { kind: "date" },
      paid: { kind: "yesno" },
      paid_on: { kind: "date" },
      to: { kind: "text", hint: "the supplier" },
      area: { kind: "text" },
      overdue: { kind: "yesno", hint: "not paid and past its date" },
    },
    search: ["description", "to"],
    primary: "description",
    secondary: ["amount", "due"],
    link: "/money?view=month",
    async load({ weddingId, areas, today }) {
      const [payments, suppliers] = await Promise.all([listPayments(weddingId), listSuppliers(weddingId)]);
      const by = new Map(suppliers.map((s) => [s.id, s]));
      return (payments ?? []).map((p) => {
        const s = p.contact_id ? by.get(p.contact_id) : undefined;
        return {
          id: p.id,
          description: p.description,
          amount: p.amount,
          due: p.due_date,
          paid: !!p.paid_on,
          paid_on: p.paid_on,
          to: s ? (s.supplier_details?.company_name ?? fullName(s)) : null,
          area: areaName(p.area_key ?? s?.supplier_details?.category ?? null, areas),
          overdue: !p.paid_on && !!p.due_date && p.due_date < today,
        };
      });
    },
  },

  moments: {
    about: "The run sheet: what happens on the wedding day and when.",
    fields: { time: { kind: "text", hint: "24-hour" }, what: { kind: "text" }, where: { kind: "text" }, who: { kind: "text" }, area: { kind: "text" } },
    search: ["what", "where", "who"],
    primary: "what",
    secondary: ["time", "where"],
    link: "/day",
    async load({ weddingId, areas }) {
      return ((await getDay(weddingId))?.runSheet ?? []).map((m) => ({
        id: m.id,
        time: clock(m.at_time),
        what: m.title,
        where: m.location,
        who: m.who,
        area: areaName(m.area_key ?? null, areas),
      }));
    },
  },

  tables: {
    about: "Seating tables and how full they are.",
    fields: { name: { kind: "text" }, seats: { kind: "number" }, seated: { kind: "number" }, space_left: { kind: "number" } },
    search: ["name"],
    primary: "name",
    secondary: ["seated", "seats"],
    link: "/day?tab=seating",
    async load({ weddingId }) {
      const day = await getDay(weddingId);
      return (day?.tables ?? []).map((t) => {
        const seated = (day?.seats ?? []).filter((s) => s.table_id === t.id).length;
        return { id: t.id, name: t.name, seats: t.capacity, seated, space_left: t.capacity - seated };
      });
    },
  },

  stays: {
    about: "Places guests are staying, and how many are staying in each.",
    fields: { name: { kind: "text" }, people: { kind: "number" } },
    search: ["name"],
    primary: "name",
    secondary: ["people"],
    link: "/day?tab=travel",
    async load({ weddingId }) {
      const [stays, guests] = await Promise.all([listStays(weddingId), listGuests(weddingId)]);
      return stays.map((s) => ({ id: s.id, name: s.name, people: guests.filter((g) => g.stay_id === s.id).length }));
    },
  },

  journeys: {
    about: "Cars and coaches on the day: when, from where, to where, how many aboard.",
    fields: { time: { kind: "text" }, vehicle: { kind: "text" }, from: { kind: "text" }, to: { kind: "text" }, aboard: { kind: "number" } },
    search: ["vehicle", "from", "to"],
    primary: "vehicle",
    secondary: ["time", "to"],
    link: "/day?tab=travel",
    async load({ weddingId }) {
      const day = await getDay(weddingId);
      return (day?.runs ?? []).map((r) => ({
        id: r.id,
        time: clock(r.at_time),
        vehicle: r.vehicle,
        from: r.from_place,
        to: r.to_place,
        aboard: (day?.passengers ?? []).filter((p) => p.run_id === r.id).length,
      }));
    },
  },

  events: {
    about: "The day and evening events, with how many guests are on each and how many are coming.",
    fields: { name: { kind: "text" }, where: { kind: "text" }, guests: { kind: "number" }, coming: { kind: "number" } },
    search: ["name"],
    primary: "name",
    secondary: ["guests", "coming"],
    link: "/people",
    async load({ weddingId }) {
      const [events, rsvps] = await Promise.all([listEvents(weddingId), listRsvps(weddingId)]);
      return events.map((e) => {
        const on = rsvps.filter((r) => r.event_id === e.id);
        return { id: e.id, name: e.name, where: e.location, guests: on.length, coming: on.filter((r) => r.status === "attending").length };
      });
    },
  },
};

export const COLLECTION_NAMES = Object.keys(COLLECTIONS);

/** What the tool's description tells the assistant about each collection. */
export function collectionGuide(): string {
  return COLLECTION_NAMES.map((name) => {
    const c = COLLECTIONS[name];
    const fields = Object.entries(c.fields)
      .map(([f, d]) => `${f} (${d.kind}${d.hint ? `: ${d.hint}` : ""})`)
      .join(", ");
    return `- ${name}: ${c.about} Fields: ${fields}.`;
  }).join("\n");
}

// ── The look-up ─────────────────────────────────────────────────────────

const OPS = ["is", "is_not", "contains", "before", "after", "empty", "not_empty"] as const;
export type Op = (typeof OPS)[number];
export const FILTER_OPS: readonly Op[] = OPS;

export interface Filter {
  field: string;
  op: Op;
  value?: string | number | boolean | null;
}

export interface LookUpQuery {
  collection: string;
  /** Words to find in the collection's name-like fields. */
  text?: string;
  filters?: Filter[];
  /** A field to count the matches by ("meal", "area", "answer"). */
  count_by?: string;
  /** A number field to add up over the matches ("amount", "quote"). */
  sum?: string;
  sort_by?: string;
  descending?: boolean;
  limit?: number;
}

export interface LookUpResult {
  ok: true;
  collection: string;
  /** How many matched, in all. */
  total: number;
  rows: Row[];
  counts?: { value: string; count: number }[];
  sum?: { field: string; total: number };
  /** The screen that shows the same thing. */
  link: string;
  /** How a row reads in the list under an answer. */
  display: { primary: string; secondary: string[] };
}

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

function matches(row: Row, filter: Filter, kind: Kind): boolean {
  const cell = row[filter.field];
  const want = filter.value;
  const empty = cell === null || cell === undefined || cell === "" || (Array.isArray(cell) && cell.length === 0);
  switch (filter.op) {
    case "empty":
      return empty;
    case "not_empty":
      return !empty;
    case "is":
    case "is_not": {
      let hit: boolean;
      if (kind === "yesno") hit = cell === (want === true || norm(want) === "true" || norm(want) === "yes");
      else if (kind === "list") hit = Array.isArray(cell) && cell.some((x) => norm(x) === norm(want));
      else if (kind === "number") hit = Number(cell) === Number(want);
      else hit = norm(cell) === norm(want);
      return filter.op === "is" ? hit : !hit;
    }
    case "contains":
      return Array.isArray(cell) ? cell.some((x) => norm(x).includes(norm(want))) : norm(cell).includes(norm(want));
    case "before":
    case "after": {
      if (empty) return false;
      const a = kind === "number" ? Number(cell) : String(cell);
      const b = kind === "number" ? Number(want) : String(want);
      return filter.op === "before" ? a < b : a > b;
    }
  }
}

export async function lookUp(query: LookUpQuery): Promise<LookUpResult | { ok: false; error: string }> {
  const collection = COLLECTIONS[query.collection];
  if (!collection) return { ok: false, error: `There's no "${query.collection}". Use one of: ${COLLECTION_NAMES.join(", ")}.` };
  const valid = Object.keys(collection.fields);
  const check = (field: string | undefined) => (field && !valid.includes(field) ? `"${field}" isn't a field of ${query.collection}. Fields: ${valid.join(", ")}.` : null);
  for (const f of query.filters ?? []) {
    const bad = check(f.field) ?? (OPS.includes(f.op) ? null : `"${f.op}" isn't a filter. Use one of: ${OPS.join(", ")}.`);
    if (bad) return { ok: false, error: bad };
  }
  const bad = check(query.count_by) ?? check(query.sort_by);
  if (bad) return { ok: false, error: bad };
  if (query.sum && collection.fields[query.sum]?.kind !== "number") return { ok: false, error: `"${query.sum}" isn't a number field of ${query.collection}.` };

  const wedding = await getCurrentWedding();
  if (!wedding) return { ok: false, error: "Your wedding couldn't be found." };
  try {
    const areas = areaOptions(await listAreas(wedding.id));
    let rows = await collection.load({ weddingId: wedding.id, today: todayISO(), areas });

    if (query.text) {
      const words = norm(query.text);
      rows = rows.filter((r) => collection.search.some((f) => norm(r[f]).includes(words)));
    }
    for (const f of query.filters ?? []) rows = rows.filter((r) => matches(r, f, collection.fields[f.field].kind));

    const result: LookUpResult = {
      ok: true,
      collection: query.collection,
      total: rows.length,
      rows: [],
      link: collection.link,
      display: { primary: collection.primary, secondary: collection.secondary },
    };

    if (query.count_by) {
      const tally = new Map<string, number>();
      for (const r of rows) {
        const cell = r[query.count_by];
        const values = Array.isArray(cell) ? (cell.length > 0 ? cell : ["(none)"]) : [cell === null || cell === "" ? "(none)" : String(cell)];
        for (const v of values) tally.set(v, (tally.get(v) ?? 0) + 1);
      }
      result.counts = [...tally.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    }
    if (query.sum) {
      result.sum = { field: query.sum, total: Math.round(rows.reduce((t, r) => t + (Number(r[query.sum!]) || 0), 0) * 100) / 100 };
    }

    // In date or time order where there's one, else by name.
    const order = query.sort_by ?? ["date", "due", "time", "name", collection.primary].find((f) => f in collection.fields) ?? collection.primary;
    rows.sort((a, b) => {
      const x = a[order];
      const y = b[order];
      if (x === y) return 0;
      if (x === null || x === undefined || x === "") return 1;
      if (y === null || y === undefined || y === "") return -1;
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return query.descending ? -c : c;
    });
    result.rows = rows.slice(0, Math.min(Math.max(query.limit ?? 20, 1), 50));
    return result;
  } catch (error) {
    console.error("look up failed", error);
    return { ok: false, error: "That couldn't be looked up just now." };
  }
}

