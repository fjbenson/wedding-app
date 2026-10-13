/**
 * Lookups: plain server steps that read the wedding and answer one question
 * — who's coming, what's left to pay, what's on this week, who sits where,
 * which suppliers. Your assistant runs these to answer, and its answer
 * blocks are drawn from what they return (never retyped by the AI).
 *
 * Like the jobs (src/lib/jobs.ts), each finds the wedding itself
 * (`getCurrentWedding()`, the signed-in person's), so nothing calling one
 * can point it at someone else's. Row-level security still guards every
 * query. Each result carries a `link`: the screen that shows the same
 * thing, already filtered ("take me there").
 */
import { listAppointments } from "@/lib/db/appointments";
import { listAreas } from "@/lib/db/areas";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { getDay } from "@/lib/db/day";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { listSuppliers, type Supplier } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { areaName, areaOptions, type AreaOption } from "@/lib/areas";
import { moneyFor, paymentArea, unscheduledBalances } from "@/lib/budget";
import { daysUntil, todayISO } from "@/lib/dates";
import { rolesOf } from "@/lib/guest-roles";
import { planDate } from "@/lib/plan";
import { supplierStatusLabel } from "@/lib/supplier-status";
import type { Contact, RsvpStatus, SupplierStatus, WeddingEvent } from "@/types/db";

export type Lookup<T> = ({ ok: true } & T) | { ok: false; error: string };

const NO_WEDDING = { ok: false, error: "Your wedding couldn't be found." } as const;

/** How many rows a lookup sends back; the counts are always the full ones. */
const MAX_ROWS = 50;

const fullName = (c: Contact) => [c.first_name, c.last_name].filter(Boolean).join(" ");
const eventWord = (e: WeddingEvent) => e.name.replace(/^the\s+/i, "").toLowerCase();
const has = (text: string | null | undefined, words: string) =>
  (text ?? "").toLowerCase().includes(words.trim().toLowerCase());

function failed(message: string, error: unknown): { ok: false; error: string } {
  console.error(message, error);
  return { ok: false, error: "That couldn't be looked up just now." };
}

/** "/people?show=attending&f=dietary" — leaves out what isn't set. */
function href(path: string, params: Record<string, string | null | undefined>): string {
  const query = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
  return query ? `${path}?${query}` : path;
}

// ── The wedding at a glance ─────────────────────────────────────────────

export interface Overview {
  name: string;
  date: string | null;
  daysToGo: number | null;
  today: string;
  areas: AreaOption[];
  /** Day and evening (in date order): a guest is a guest of one of these. */
  events: { id: string; name: string; word: string }[];
  households: { id: string; name: string }[];
  guests: number;
  suppliers: number;
}

/** What the assistant needs to know before anything else: names, the date, the areas, the events. */
export async function overview(): Promise<Lookup<Overview>> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;
  try {
    const [areaRows, events, households, guests, suppliers] = await Promise.all([
      listAreas(wedding.id),
      listEvents(wedding.id),
      listHouseholds(wedding.id),
      listGuests(wedding.id),
      listSuppliers(wedding.id),
    ]);
    return {
      ok: true,
      name: wedding.name,
      date: wedding.wedding_date,
      daysToGo: wedding.wedding_date ? daysUntil(wedding.wedding_date) : null,
      today: todayISO(),
      areas: areaOptions(areaRows),
      events: events.map((e) => ({ id: e.id, name: e.name, word: eventWord(e) })),
      households: households.map((h) => ({ id: h.id, name: h.name })),
      guests: guests.length,
      suppliers: suppliers.length,
    };
  } catch (error) {
    return failed("overview failed", error);
  }
}

// ── Guests ──────────────────────────────────────────────────────────────

export interface GuestQuery {
  /** Part of a name: "Ellen", "Daniels". */
  name?: string;
  /** Their answer for their own event. */
  answer?: RsvpStatus;
  /** Guests of this event (day or evening), by id. */
  eventId?: string;
  bridalParty?: boolean;
  /** Anyone with a dietary need written down. */
  dietary?: boolean;
  /** Words in their meal or dietary needs: "vegetarian", "nut". */
  mentions?: string;
  children?: boolean;
  /** No household, or a household with no address yet. */
  noAddress?: boolean;
  /** Part of a household's name: "Latham". */
  household?: string;
}

export interface GuestLine {
  id: string;
  name: string;
  household: string | null;
  /** "day" / "evening", or null if not on any event yet. */
  guestOf: string | null;
  answer: RsvpStatus | null;
  roles: string[];
  meal: string | null;
  diet: string | null;
  child: boolean;
}

export async function findGuests(query: GuestQuery = {}): Promise<Lookup<{ count: number; guests: GuestLine[]; link: string }>> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;
  try {
    const [guests, households, events, rsvps] = await Promise.all([
      listGuests(wedding.id),
      listHouseholds(wedding.id),
      listEvents(wedding.id),
      listRsvps(wedding.id),
    ]);
    const household = new Map(households.map((h) => [h.id, h]));
    // Their own event is the first they're on (events come in date order),
    // and their answer is the one for it — as the guest list counts.
    const lines: GuestLine[] = guests.map((g) => {
      const theirs = rsvps.filter((r) => r.contact_id === g.id);
      const own = events.find((e) => theirs.some((r) => r.event_id === e.id));
      const answer = own ? theirs.find((r) => r.event_id === own.id) : undefined;
      return {
        id: g.id,
        name: fullName(g),
        household: g.household_id ? (household.get(g.household_id)?.name ?? null) : null,
        guestOf: own ? eventWord(own) : null,
        answer: answer?.status ?? null,
        roles: rolesOf(g),
        meal: theirs.find((r) => r.meal_choice)?.meal_choice ?? null,
        diet: theirs.find((r) => r.dietary_notes)?.dietary_notes ?? null,
        child: g.is_child,
      };
    });
    const ownEventId = new Map(
      guests.map((g) => [g.id, events.find((e) => rsvps.some((r) => r.contact_id === g.id && r.event_id === e.id))?.id]),
    );
    const addressed = (g: Contact) => {
      const h = g.household_id ? household.get(g.household_id) : undefined;
      return Boolean(h && (h.address_line1 || h.postcode));
    };
    const byId = new Map(guests.map((g) => [g.id, g]));

    const matched = lines.filter((line) => {
      const g = byId.get(line.id)!;
      if (query.name && !has(line.name, query.name)) return false;
      if (query.answer && line.answer !== query.answer) return false;
      if (query.eventId && ownEventId.get(line.id) !== query.eventId) return false;
      if (query.bridalParty && line.roles.length === 0) return false;
      if (query.dietary && !line.diet) return false;
      if (query.mentions && !has(line.meal, query.mentions) && !has(line.diet, query.mentions)) return false;
      if (query.children && !line.child) return false;
      if (query.noAddress && addressed(g)) return false;
      if (query.household && !has(line.household, query.household)) return false;
      return true;
    });
    matched.sort((a, b) => a.name.localeCompare(b.name));

    // The guest list, filtered the same way where it can be (its search is by name).
    const f = [query.bridalParty && "party", (query.dietary || query.mentions) && "dietary", query.children && "children", query.noAddress && "noaddress"]
      .filter(Boolean)
      .join(",");
    const link = href("/people", {
      q: query.name ?? null,
      show: query.answer ?? null,
      f: f || null,
      of: query.eventId ?? null,
    });
    return { ok: true, count: matched.length, guests: matched.slice(0, MAX_ROWS), link };
  } catch (error) {
    return failed("finding guests failed", error);
  }
}

// ── Money ───────────────────────────────────────────────────────────────

export interface MoneySummary {
  /** The whole wedding's, or the area's, if one was asked for. */
  area: { key: string; label: string } | null;
  budget: number | null;
  agreed: number;
  paid: number;
  toPay: number;
  /** Budget less agreed; below nought means over. */
  stillFree: number | null;
  /** Payments still to make, a total per month (overdue counts in this month). */
  months: { month: string; total: number; payments: number }[];
  /** The next few to pay, soonest first. */
  next: { id: string; description: string; amount: number; due: string; supplier: string | null; overdue: boolean }[];
  /** Booked suppliers whose balance has no payment set up yet. */
  noDateYet: { supplier: string; balance: number }[];
  link: string;
}

export async function moneySummary(query: { area?: string } = {}): Promise<Lookup<MoneySummary>> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;
  try {
    const [areaRows, suppliers, payments] = await Promise.all([
      listAreas(wedding.id),
      listSuppliers(wedding.id),
      listPayments(wedding.id),
    ]);
    const all = payments ?? [];
    const areas = areaOptions(areaRows);
    const key = query.area?.trim() || undefined;
    const row = key ? areaRows?.find((a) => a.key === key) : undefined;
    if (key && !row && !areas.some((a) => a.key === key) && key !== "other") {
      return { ok: false, error: "That area wasn't found." };
    }

    const budget = key ? (row?.budget ?? null) : (wedding.budget ?? null);
    const money = moneyFor(key, suppliers, all, budget);
    const inArea = (s: Supplier) => !key || s.supplier_details?.category === key;
    const today = todayISO();
    const thisMonth = today.slice(0, 7);

    const due = all
      .filter((p) => !p.paid_on && p.due_date && (!key || paymentArea(p, suppliers) === key))
      .sort((a, b) => a.due_date!.localeCompare(b.due_date!));
    const months = new Map<string, { total: number; payments: number }>();
    for (const p of due) {
      const month = p.due_date! < today ? thisMonth : p.due_date!.slice(0, 7);
      const m = months.get(month) ?? { total: 0, payments: 0 };
      months.set(month, { total: m.total + p.amount, payments: m.payments + 1 });
    }
    const supplierName = (id: string | null) => {
      const s = suppliers.find((x) => x.id === id);
      return s ? (s.supplier_details?.company_name ?? fullName(s)) : null;
    };

    return {
      ok: true,
      area: key ? { key, label: areaName(key, areas) ?? key } : null,
      budget: money.budget,
      agreed: money.committed,
      paid: money.paid,
      toPay: Math.max(money.committed - money.paid, 0),
      stillFree: money.budget !== null ? money.budget - money.committed : null,
      months: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, m]) => ({ month, ...m })),
      next: due.slice(0, 3).map((p) => ({
        id: p.id,
        description: p.description,
        amount: p.amount,
        due: p.due_date!,
        supplier: supplierName(p.contact_id),
        overdue: p.due_date! < today,
      })),
      noDateYet: unscheduledBalances(suppliers.filter(inArea), all).map((b) => ({
        supplier: b.supplier.supplier_details?.company_name ?? fullName(b.supplier),
        balance: b.balance,
      })),
      link: href("/money", { view: "month", area: key ?? null }),
    };
  } catch (error) {
    return failed("money summary failed", error);
  }
}

// ── This week ───────────────────────────────────────────────────────────

export interface WeekItem {
  id: string;
  kind: "todo" | "payment" | "appointment";
  date: string;
  title: string;
  /** "2:30pm" for an appointment, the amount for a payment. */
  time?: string | null;
  amount?: number;
  overdue: boolean;
  link: string;
}

/** As the Hub's This week: due by Sunday plus anything overdue; undated to-dos never. */
export async function thisWeek(): Promise<Lookup<{ from: string; to: string; items: WeekItem[]; next: WeekItem | null; link: string }>> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;
  try {
    const [milestones, appointments, payments] = await Promise.all([
      listMilestones(wedding.id),
      listAppointments(wedding.id),
      listPayments(wedding.id),
    ]);
    const today = todayISO();
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const monday = d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 6);
    const sunday = d.toISOString().slice(0, 10);

    const all: (WeekItem & { order: number })[] = [
      ...milestones
        .filter((m) => m.status === "todo" || m.status === "in_progress")
        .flatMap((m) => {
          const date = planDate(m);
          return date
            ? [{ id: m.id, kind: "todo" as const, date, title: m.title, overdue: date < today && !!m.due_date, link: `/plan/${m.id}`, order: 2 }]
            : [];
        }),
      ...(appointments ?? [])
        .filter((a) => a.on_date >= today)
        .map((a) => ({
          id: a.id, kind: "appointment" as const, date: a.on_date, title: a.title, time: a.at_time,
          overdue: false, link: `/plan/appointments/${a.id}`, order: 0,
        })),
      ...(payments ?? [])
        .filter((p) => !p.paid_on && p.due_date)
        .map((p) => ({
          id: p.id, kind: "payment" as const, date: p.due_date!, title: p.description, amount: p.amount,
          overdue: p.due_date! < today, link: `/money/payments/${p.id}`, order: 1,
        })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

    const strip = ({ order: _order, ...item }: WeekItem & { order: number }): WeekItem => item;
    const next = all.find((e) => e.date > sunday);
    return {
      ok: true,
      from: monday,
      to: sunday,
      items: all.filter((e) => e.date <= sunday).map(strip),
      next: next ? strip(next) : null,
      link: "/",
    };
  } catch (error) {
    return failed("this week failed", error);
  }
}

// ── Seating ─────────────────────────────────────────────────────────────

export interface TableLine {
  id: string;
  name: string;
  seats: number;
  shape: "round" | "long";
  guests: { id: string; name: string }[];
}

/** Every table and who's at it, or the ones whose name matches; plus who's still to seat. */
export async function seating(query: { table?: string } = {}): Promise<Lookup<{ tables: TableLine[]; unseated: number; link: string }>> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;
  try {
    const [day, guests, rsvps] = await Promise.all([getDay(wedding.id), listGuests(wedding.id), listRsvps(wedding.id)]);
    if (!day) return { ok: false, error: "Seating isn't set up yet." };
    const byId = new Map(guests.map((g) => [g.id, g]));
    const tables = day.tables
      .filter((t) => !query.table || has(t.name, query.table))
      .map((t) => ({
        id: t.id,
        name: t.name,
        seats: t.capacity,
        shape: t.shape ?? "round",
        guests: day.seats
          .filter((s) => s.table_id === t.id)
          .map((s) => byId.get(s.contact_id))
          .filter((g): g is Contact => !!g)
          .map((g) => ({ id: g.id, name: fullName(g) })),
      }));
    // As The Day counts them: guests who declined everything aren't seated.
    const seated = new Set(day.seats.map((s) => s.contact_id));
    const unseated = guests.filter((g) => {
      const theirs = rsvps.filter((r) => r.contact_id === g.id);
      return !seated.has(g.id) && !(theirs.length > 0 && theirs.every((r) => r.status === "declined"));
    }).length;
    return { ok: true, tables, unseated, link: "/day?tab=seating" };
  } catch (error) {
    return failed("seating failed", error);
  }
}

// ── Suppliers ───────────────────────────────────────────────────────────

export interface SupplierLine {
  id: string;
  name: string;
  contact: string | null;
  area: string | null;
  stage: SupplierStatus;
  stageLabel: string;
  quote: number | null;
  depositPaid: number | null;
  phone: string | null;
  email: string | null;
}

export async function findSuppliers(
  query: { area?: string; stage?: SupplierStatus; name?: string } = {},
): Promise<Lookup<{ count: number; suppliers: SupplierLine[]; budget: number | null; link: string }>> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;
  try {
    const [suppliers, areaRows] = await Promise.all([listSuppliers(wedding.id), listAreas(wedding.id)]);
    const areas = areaOptions(areaRows);
    const lines = suppliers
      .map((s): SupplierLine => {
        const d = s.supplier_details;
        return {
          id: s.id,
          name: d?.company_name ?? fullName(s),
          contact: d?.company_name ? fullName(s) || null : null,
          area: areaName(d?.category ?? null, areas),
          stage: d?.status === "researching" ? "enquired" : (d?.status ?? "enquired"),
          stageLabel: supplierStatusLabel(d?.status ?? "enquired"),
          quote: d?.quoted_cost === null || d?.quoted_cost === undefined ? null : Number(d.quoted_cost),
          depositPaid: d?.deposit_paid === null || d?.deposit_paid === undefined ? null : Number(d.deposit_paid),
          phone: s.phone,
          email: s.email,
        };
      })
      .filter((line, i) => {
        const s = suppliers[i];
        if (query.area && (s.supplier_details?.category ?? "other") !== query.area) return false;
        if (query.stage && line.stage !== query.stage) return false;
        if (query.name && !has(line.name, query.name) && !has(line.contact, query.name)) return false;
        return true;
      });
    const budget = query.area ? (areaRows?.find((a) => a.key === query.area)?.budget ?? null) : null;
    return {
      ok: true,
      count: lines.length,
      suppliers: lines.slice(0, MAX_ROWS),
      budget: budget === null ? null : Number(budget),
      link: href("/people", { tab: "suppliers", f: query.area ?? null, q: query.name ?? null }),
    };
  } catch (error) {
    return failed("finding suppliers failed", error);
  }
}
