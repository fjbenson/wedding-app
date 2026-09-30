import Link from "next/link";
import { CalendarClock, Check, ChevronRight } from "lucide-react";
import { areaName, type AreaOption } from "@/lib/areas";
import { formatDayMonth, formatLongDate, formatMonthYear, formatTime, formatWeekdayDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Appointment, Milestone, Payment } from "@/types/db";
import { markPaidAction } from "../money/actions";
import { MilestoneRow, isOpen } from "./milestone-row";

export type AgendaFilter = "all" | "todos" | "appointments" | "payments";

type Entry =
  | { kind: "todo"; date: string | null; milestone: Milestone }
  | { kind: "appointment"; date: string; appointment: Appointment }
  | { kind: "payment"; date: string | null; payment: Payment };

/** Same day: appointments first (they happen at a time), then payments, then to-dos. */
const KIND_ORDER = { appointment: 0, payment: 1, todo: 2 };

/**
 * The agenda (screens 16 and 17): three genuinely different things — a to-do
 * is ticked off, an appointment is attended, a payment is paid — that all
 * answer "what's coming up", so they share one timeline and are told apart
 * by filter, not by screen. Grouped by month; the wedding day closes it.
 */
export default function Agenda({
  milestones,
  appointments,
  payments,
  suppliers,
  areas,
  weddingDate,
  show,
  today,
}: {
  milestones: Milestone[];
  appointments: Appointment[] | null;
  payments: Payment[];
  suppliers: { id: string; name: string }[];
  areas: AreaOption[];
  weddingDate: string | null;
  show: AgendaFilter;
  today: string;
}) {
  const wants = (kind: Entry["kind"]) =>
    show === "all" || (show === "todos" && kind === "todo") || (show === "appointments" && kind === "appointment") || (show === "payments" && kind === "payment");

  const upcoming: Entry[] = [
    ...(wants("todo") ? milestones.filter(isOpen).map((m) => ({ kind: "todo" as const, date: m.due_date, milestone: m })) : []),
    ...(wants("appointment")
      ? (appointments ?? []).filter((a) => a.on_date >= today).map((a) => ({ kind: "appointment" as const, date: a.on_date, appointment: a }))
      : []),
    ...(wants("payment") ? payments.filter((p) => !p.paid_on).map((p) => ({ kind: "payment" as const, date: p.due_date, payment: p })) : []),
  ].sort((a, b) => {
    if (a.date !== b.date) return !a.date ? 1 : !b.date ? -1 : a.date.localeCompare(b.date);
    if (a.kind === "appointment" && b.kind === "appointment") {
      return (a.appointment.at_time ?? "").localeCompare(b.appointment.at_time ?? "");
    }
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  });

  // Done to-dos and appointments that have happened, most recent first.
  const behind: Entry[] = [
    ...(wants("todo") ? milestones.filter((m) => !isOpen(m)).map((m) => ({ kind: "todo" as const, date: m.completed_at?.slice(0, 10) ?? m.due_date, milestone: m })) : []),
    ...(wants("appointment")
      ? (appointments ?? []).filter((a) => a.on_date < today).map((a) => ({ kind: "appointment" as const, date: a.on_date, appointment: a }))
      : []),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const groups: { key: string; title: string; entries: Entry[] }[] = [];
  for (const entry of upcoming) {
    const key = entry.date ? entry.date.slice(0, 7) : "undated";
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, title: entry.date ? formatMonthYear(entry.date) : "Whenever", entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  const dated = groups.filter((g) => g.key !== "undated");
  const undated = groups.find((g) => g.key === "undated");

  const supplierName = (id: string | null) => suppliers.find((s) => s.id === id)?.name;
  const row = (entry: Entry) => {
    if (entry.kind === "todo") {
      const m = entry.milestone;
      return (
        <MilestoneRow
          key={`t-${m.id}`}
          milestone={m}
          overdue={isOpen(m) && !!m.due_date && m.due_date < today}
          area={areaName(m.category, areas)}
        />
      );
    }
    if (entry.kind === "appointment") {
      const a = entry.appointment;
      const past = a.on_date < today;
      const details = [
        `${formatWeekdayDayMonth(a.on_date)}${a.at_time ? ` · ${formatTime(a.at_time)}` : ""}`,
        a.location,
        // "at Hazel Gap Barn · with Hazel Gap Barn" says it twice.
        supplierName(a.contact_id) && !a.location?.includes(supplierName(a.contact_id)!) && `with ${supplierName(a.contact_id)}`,
      ].filter(Boolean);
      return (
        <li key={`a-${a.id}`} className="flex items-center gap-3 border-b border-linen last:border-b-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600" aria-hidden>
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <Link href={`/plan/appointments/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 hover:bg-cream/60">
            <span className="min-w-0 flex-1">
              <span className={`block text-[15px] ${past ? "text-stone" : "text-ink"}`}>{a.title}</span>
              <span className="mt-0.5 block text-xs text-stone">{details.join(" · ")}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
          </Link>
        </li>
      );
    }
    const p = entry.payment;
    const late = p.due_date && p.due_date < today;
    return (
      <li key={`p-${p.id}`} className="flex items-center gap-3 border-b border-linen last:border-b-0">
        <form action={markPaidAction.bind(null, p.id, true)}>
          <button
            type="submit"
            aria-label={`Mark "${p.description}" as paid`}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-champagne-400 bg-white text-[11px] font-medium text-champagne-600 hover:bg-champagne-100"
          >
            £
          </button>
        </form>
        <Link href={`/money/payments/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 hover:bg-cream/60">
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] text-ink">Pay: {p.description}</span>
            <span className="mt-0.5 block text-xs text-stone">
              {late && <span className="font-medium text-champagne-600">Overdue · </span>}
              {[p.due_date && `Due ${formatDayMonth(p.due_date)}`, supplierName(p.contact_id)].filter(Boolean).join(" · ")}
            </span>
          </span>
          <span className="shrink-0 font-display text-lg text-ink">{formatMoney(p.amount)}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        </Link>
      </li>
    );
  };

  const filters: { id: AgendaFilter; label: string }[] = [
    { id: "all", label: "Everything" },
    { id: "todos", label: "To-dos" },
    { id: "appointments", label: "Appointments" },
    { id: "payments", label: "Payments" },
  ];

  const section = (key: string, index: number | null, title: string, entries: Entry[]) => (
    <section key={key}>
      <div className="flex items-baseline gap-3 border-b border-champagne-400 pb-2">
        {index !== null && <span className="font-display text-sm text-champagne-600">{String(index + 1).padStart(2, "0")}</span>}
        <h2 className="flex-1 text-xl text-ink">{title}</h2>
        {index === null && <span className="text-xs uppercase tracking-[0.14em] text-stone">{entries.length}</span>}
      </div>
      <ul>{entries.map(row)}</ul>
    </section>
  );

  return (
    <>
      {/* Scrolls sideways within itself on a narrow phone, never the page. */}
      <nav aria-label="Show" className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/plan" : `/plan?show=${f.id}`}
            aria-current={show === f.id ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
              show === f.id ? "border-ink bg-ink text-ivory" : "border-linen bg-white text-ink hover:border-champagne-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {appointments === null && show === "appointments" && (
        <p className="mt-5 rounded-xl border border-dashed border-champagne-400 px-4 py-3 text-sm text-ink">
          Appointments need one more database step: run{" "}
          <span className="font-mono text-xs">supabase/migrations/0007_appointments.sql</span> in Supabase.
        </p>
      )}

      <div className="mt-8 space-y-8">
        {upcoming.length === 0 && behind.length === 0 && (
          <p className="text-sm text-stone">
            {show === "appointments"
              ? "No appointments yet — fittings, tastings, venue visits."
              : show === "payments"
                ? "No payments due. Add them in Money."
                : "Nothing here yet."}
          </p>
        )}

        {dated.map((g, i) => section(g.key, i, g.title, g.entries))}

        {weddingDate && show === "all" && upcoming.length > 0 && (
          // The run-up ends where The Day begins: one tap across (the plan's link between the two).
          <Link href="/day" className="block text-center font-display text-lg italic text-champagne-600 hover:text-ink">
            {formatLongDate(weddingDate)} — the wedding →
          </Link>
        )}

        {undated && section("undated", dated.length, "Whenever", undated.entries)}

        {behind.length > 0 && section("behind", null, "Done and been", behind)}
      </div>
    </>
  );
}
