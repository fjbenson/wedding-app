/**
 * Where things stand (canvas 2 "Where things stand · Round 2", option 1,
 * owner's pick 13 Oct 2026): the whole wedding at a glance, opened from the
 * heart of the hub ring. One card per tab, each with what's done (a big
 * figure and a bar), then what needs you, then the rest of what's done
 * folded at its foot — "what's been achieved counts as well" (owner).
 *
 * Worked out from what the wedding already has each time; nothing is
 * stored twice. Every line links to the screen that shows it, filtered.
 */
import { areaStage } from "@/lib/area-stage";
import { areaGuestFacts } from "@/lib/area-guests";
import { moneyFor, paymentArea, unscheduledBalances } from "@/lib/budget";
import { formatDayMonth, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { isNudge, planDate } from "@/lib/plan";
import { rolesOf } from "@/lib/guest-roles";
import type { Supplier } from "@/lib/db/suppliers";
import type {
  Appointment,
  AreaRow,
  Contact,
  Household,
  Milestone,
  Payment,
  Rsvp,
  Seat,
  SeatingTable,
  RunSheetItem,
  TransportPassenger,
  TransportRun,
  WeddingEvent,
} from "@/types/db";

export interface Line {
  text: string;
  /** The number in the line, set bold: "27" in "27 haven't replied". */
  figure?: string;
  href: string;
  /** Over budget: shown with ▲ in rose, never by colour alone. */
  over?: boolean;
}

export interface Section {
  key: "people" | "money" | "plan" | "day" | "areas";
  title: string;
  link: { label: string; href: string };
  /** The headline: what's done, large, and how far along, as a share for the bar. */
  progress: { figure: string; words: string; share: number | null };
  needs: Line[];
  done: Line[];
}

export interface Standing {
  sections: Section[];
  /** For the cream line at the top. */
  doneSoFar: { total: number; todos: number; payments: number; booked: number };
  needCount: number;
}

const share = (part: number, whole: number) => (whole > 0 ? Math.min(part / whole, 1) : null);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const num = (v: number | string | null | undefined) => Number(v ?? 0) || 0;

export function whereThingsStand(data: {
  budget: number | null;
  areas: AreaRow[];
  guests: Contact[];
  households: Household[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  suppliers: Supplier[];
  payments: Payment[];
  milestones: Milestone[];
  appointments: Appointment[];
  ideas: Map<string, number> | null;
  day: {
    runSheet: RunSheetItem[];
    tables: SeatingTable[];
    seats: Seat[];
    runs: TransportRun[];
    passengers: TransportPassenger[];
  } | null;
}): Standing {
  const today = todayISO();
  const { guests, events, rsvps, suppliers, payments, milestones } = data;

  // ── People ────────────────────────────────────────────────────────────
  // A guest's own event is the first they're on, and their answer is the one
  // for it — as the guest list counts.
  const answers = new Map<string, Rsvp[]>();
  for (const r of rsvps) answers.set(r.contact_id, [...(answers.get(r.contact_id) ?? []), r]);
  const own = (g: Contact) => {
    const theirs = answers.get(g.id) ?? [];
    for (const e of events) {
      const r = theirs.find((x) => x.event_id === e.id);
      if (r) return r;
    }
    return null;
  };
  const status = (g: Contact) => own(g)?.status ?? "to_invite";
  const coming = guests.filter((g) => status(g) === "attending");
  const declined = guests.filter((g) => status(g) === "declined").length;
  const waiting = guests.filter((g) => status(g) === "pending").length;
  const toInvite = guests.filter((g) => status(g) === "to_invite").length;
  const expected = guests.length - declined;
  const withGuests = data.households.filter((h) => guests.some((g) => g.household_id === h.id));
  const noAddress = withGuests.filter((h) => !(h.address_line1 || h.postcode)).length;
  const party = guests.filter((g) => rolesOf(g).length > 0);

  const people: Section = {
    key: "people",
    title: "People",
    link: { label: "In People", href: "/people" },
    progress: guests.length
      ? // Everyone still expected, as the guest list counts them (owner, 20 Oct 2026): can't-comes aren't in it.
        { figure: String(coming.length), words: `of ${expected} coming`, share: share(coming.length, expected) }
      : { figure: "0", words: "guests on the list", share: null },
    needs: [],
    done: [],
  };
  if (guests.length === 0) people.needs.push({ text: "Add your guests", href: "/people/new?from=people" });
  if (toInvite) people.needs.push({ figure: String(toInvite), text: "still to invite", href: "/people?show=to_invite" });
  if (waiting) people.needs.push({ figure: String(waiting), text: waiting === 1 ? "hasn't replied" : "haven't replied", href: "/people?show=pending" });
  if (noAddress) people.needs.push({ figure: String(noAddress), text: noAddress === 1 ? "household with no address" : "households with no address", href: "/people?f=noaddress" });
  if (declined) people.done.push({ figure: String(declined), text: "can't come", href: "/people?show=declined" });
  if (guests.length && !toInvite) people.done.push({ text: "Everyone invited", href: "/people" });
  if (party.length && party.every((g) => status(g) === "attending")) people.done.push({ text: "Bridal party all coming", href: "/people?f=party" });
  if (withGuests.length && !noAddress) people.done.push({ text: "Every household has an address", href: "/people?view=households" });

  // ── Money ─────────────────────────────────────────────────────────────
  const whole = moneyFor(undefined, suppliers, payments, data.budget);
  const live = data.areas.filter((a) => a.enabled);
  const over = live
    .map((a) => ({ area: a, m: moneyFor(a.key, suppliers, payments, a.budget ?? null) }))
    .filter(({ m }) => m.budget !== null && m.budget > 0 && m.committed > m.budget);
  const withinBudget = live.filter((a) => {
    const m = moneyFor(a.key, suppliers, payments, a.budget ?? null);
    return m.budget !== null && m.budget > 0 && m.committed > 0 && m.committed <= m.budget;
  }).length;
  const unpaid = payments.filter((p) => !p.paid_on && p.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!));
  const overdue = unpaid.filter((p) => p.due_date! < today);
  const fortnight = new Date(`${today}T00:00:00Z`);
  fortnight.setUTCDate(fortnight.getUTCDate() + 14);
  const soon = unpaid.find((p) => p.due_date! >= today && p.due_date! <= fortnight.toISOString().slice(0, 10));
  const noDate = unscheduledBalances(suppliers, payments).length + payments.filter((p) => !p.paid_on && !p.due_date).length;
  const paidCount = payments.filter((p) => p.paid_on).length + suppliers.filter((s) => num(s.supplier_details?.deposit_paid) > 0).length;

  const money: Section = {
    key: "money",
    title: "Money",
    link: { label: "In Money", href: "/money" },
    progress: whole.committed > 0
      ? { figure: formatMoney(whole.paid), words: `paid of ${formatMoney(whole.committed)} agreed`, share: share(whole.paid, whole.committed) }
      : { figure: formatMoney(whole.paid), words: "paid so far", share: null },
    needs: [],
    done: [],
  };
  if (!whole.budget) money.needs.push({ text: "No budget set yet", href: "/money/budget" });
  if (overdue.length) {
    money.needs.push({
      figure: formatMoney(overdue.reduce((sum, p) => sum + num(p.amount), 0)),
      text: overdue.length === 1 ? `overdue · ${overdue[0].description}` : `overdue · ${overdue.length} payments`,
      href: "/money?view=month",
    });
  }
  if (soon) money.needs.push({ figure: formatMoney(num(soon.amount)), text: `due ${formatDayMonth(soon.due_date!)} · ${soon.description}`, href: "/money?view=month" });
  for (const { area, m } of over) {
    money.needs.push({ text: `${area.label} over by`, figure: formatMoney(m.committed - (m.budget ?? 0)), href: `/money?open=${encodeURIComponent(area.key)}`, over: true });
  }
  if (noDate) money.needs.push({ figure: String(noDate), text: noDate === 1 ? "payment with no date yet" : "payments with no date yet", href: "/money?view=month" });
  if (paidCount) money.done.push({ text: plural(paidCount, "payment") + " made", href: "/money?view=month&month=paid" });
  if (withinBudget) money.done.push({ text: `${plural(withinBudget, "area")} within budget`, href: "/money" });
  if (whole.budget && whole.budget > whole.committed) money.done.push({ text: `${formatMoney(whole.budget - whole.committed)} of the budget still free`, href: "/money" });

  // ── Plan ──────────────────────────────────────────────────────────────
  const todos = milestones.filter((m) => m.status !== "skipped");
  const ticked = todos.filter((m) => m.status === "done");
  const open = todos.filter((m) => m.status !== "done");
  const lateTodos = open.filter((m) => !isNudge(m) && !!m.due_date && m.due_date < today).length;
  const undated = open.filter((m) => !planDate(m)).length;
  const latest = [...ticked].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))[0];
  const appointments = data.appointments;
  const been = appointments.filter((a) => a.on_date < today).length;
  const next = appointments.filter((a) => a.on_date >= today).sort((a, b) => a.on_date.localeCompare(b.on_date))[0];

  const plan: Section = {
    key: "plan",
    title: "Plan",
    link: { label: "In Plan", href: "/plan" },
    progress: todos.length
      ? { figure: String(ticked.length), words: `of ${plural(todos.length, "to-do")} done`, share: share(ticked.length, todos.length) }
      : { figure: "0", words: "to-dos yet", share: null },
    needs: [],
    done: [],
  };
  if (lateTodos) plan.needs.push({ figure: String(lateTodos), text: lateTodos === 1 ? "to-do overdue" : "to-dos overdue", href: "/plan?view=list&when=overdue" });
  if (undated) plan.needs.push({ figure: String(undated), text: undated === 1 ? "to-do with no date" : "to-dos with no date", href: "/plan?view=list&when=none" });
  if (ticked.length) plan.done.push({ text: `${plural(ticked.length, "to-do")} ticked off` + (latest ? ` · latest: ${latest.title}` : ""), href: "/plan?view=list" });
  if (been) plan.done.push({ text: `${plural(been, "appointment")} been`, href: "/plan?view=list&kind=appointments" });
  if (next) plan.done.push({ text: `Next: ${next.title}, ${formatDayMonth(next.on_date)}`, href: `/plan/appointments/${next.id}` });

  // ── The Day ───────────────────────────────────────────────────────────
  const day: Section = {
    key: "day",
    title: "The Day",
    link: { label: "In The Day", href: "/day" },
    progress: { figure: "0", words: "seated so far", share: null },
    needs: [],
    done: [],
  };
  if (data.day) {
    const seated = new Set(data.day.seats.map((s) => s.contact_id));
    const comingSeated = coming.filter((g) => seated.has(g.id)).length;
    if (data.day.tables.length && coming.length) {
      day.progress = { figure: String(comingSeated), words: `of ${coming.length} coming have a seat`, share: share(comingSeated, coming.length) };
    } else {
      day.progress = { figure: String(data.day.runSheet.length), words: data.day.runSheet.length === 1 ? "moment on the run sheet" : "moments on the run sheet", share: null };
    }
    const toSeat = coming.length - comingSeated;
    if (!data.day.runSheet.length) day.needs.push({ text: "Start the order of the day", href: "/day" });
    if (!data.day.tables.length && coming.length) day.needs.push({ text: "No tables yet", href: "/day?tab=seating" });
    else if (toSeat > 0) day.needs.push({ figure: String(toSeat), text: "coming, not seated yet", href: "/day?tab=seating" });
    // Lifts only matter once there's transport at all.
    if (data.day.runs.length) {
      const facts = areaGuestFacts("transport", { guests, households: data.households, events, rsvps, runs: data.day.runs, passengers: data.day.passengers });
      if (facts.kind === "transport") {
        if (facts.withoutLift) day.needs.push({ figure: String(facts.withoutLift), text: "day guests without a lift", href: "/day?tab=travel" });
        if (facts.travelling) day.done.push({ text: `${plural(facts.travelling, "guest")} with a lift`, href: "/day?tab=travel" });
      }
    }
    if (data.day.runSheet.length) day.done.push({ text: `Run sheet · ${plural(data.day.runSheet.length, "moment")}`, href: "/day" });
    if (data.day.tables.length) day.done.push({ text: `${plural(data.day.tables.length, "table")} set`, href: "/day?tab=seating" });
    if (data.day.tables.length && coming.length && toSeat === 0) day.done.push({ text: "Everyone coming has a seat", href: "/day?tab=seating" });
  }

  // ── Areas ─────────────────────────────────────────────────────────────
  const staged = live.map((a) => {
    const theirs = suppliers.filter((s) => s.supplier_details?.category === a.key);
    const m = moneyFor(a.key, suppliers, payments, a.budget ?? null);
    return { area: a, stage: areaStage(a, theirs, m, data.ideas?.get(a.key) ?? 0) };
  });
  const booked = staged.filter((s) => s.stage.done[2]);
  const ready = staged.filter((s) => s.stage.done[4]);
  const notStarted = staged.filter((s) => s.stage.current === 0);
  const toBook = staged.filter((s) => s.stage.current === 1 || s.stage.current === 2);
  const areaHref = (list: typeof staged) => (list.length === 1 ? `/area/${encodeURIComponent(list[0].area.key)}` : "/");
  const names = (list: typeof staged) =>
    list.length <= 3 ? list.map((s) => s.area.label).join(", ") : `${list.slice(0, 2).map((s) => s.area.label).join(", ")} and ${list.length - 2} more`;

  const areas: Section = {
    key: "areas",
    title: "Areas",
    link: { label: "On the Hub", href: "/" },
    progress: { figure: String(booked.length), words: `of ${plural(staged.length, "area")} booked`, share: share(booked.length, staged.length) },
    needs: [],
    done: [],
  };
  if (notStarted.length) areas.needs.push({ text: `Not started: ${names(notStarted)}`, href: areaHref(notStarted) });
  if (toBook.length) areas.needs.push({ text: `Still to book: ${names(toBook)}`, href: areaHref(toBook) });
  if (ready.length) areas.done.push({ text: `Ready: ${names(ready)}`, href: areaHref(ready) });
  const bookedNotReady = booked.filter((s) => !s.stage.done[4]);
  if (bookedNotReady.length) areas.done.push({ text: `Booked: ${names(bookedNotReady)}`, href: areaHref(bookedNotReady) });

  const sections = [people, money, plan, day, areas];
  const bookedSuppliers = suppliers.filter((s) => s.supplier_details?.status === "booked").length;
  return {
    sections,
    doneSoFar: {
      total: ticked.length + paidCount + bookedSuppliers,
      todos: ticked.length,
      payments: paidCount,
      booked: bookedSuppliers,
    },
    needCount: sections.reduce((sum, s) => sum + s.needs.length, 0),
  };
}
