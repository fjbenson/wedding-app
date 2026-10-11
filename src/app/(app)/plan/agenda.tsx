import Link from "next/link";
import { CalendarClock, CalendarDays, Check, ChevronRight, List } from "lucide-react";
import { areaName, type AreaOption } from "@/lib/areas";
import { daysUntil, formatDayMonth, formatLongDate, formatMonthYear, formatTime, formatWeekdayDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { isNudge, planDate } from "@/lib/plan";
import type { Appointment, Milestone, Payment } from "@/types/db";
import TickForm from "@/components/tick-form";
import { markPaidAction } from "../money/actions";
import PlanCalendar, { type Dot } from "./calendar";
import { Fold, FoldAll, FoldGroup } from "./fold";
import { MilestoneRow, isOpen } from "./milestone-row";

type Entry =
  | { kind: "todo"; date: string | null; milestone: Milestone }
  | { kind: "appointment"; date: string; appointment: Appointment }
  | { kind: "payment"; date: string | null; payment: Payment };

/** Same day: appointments first (they happen at a time), then payments, then to-dos. */
const KIND_ORDER = { appointment: 0, payment: 1, todo: 2 };

const byDate = (a: Entry, b: Entry) => {
  if (a.date !== b.date) return !a.date ? 1 : !b.date ? -1 : a.date.localeCompare(b.date);
  if (a.kind === "appointment" && b.kind === "appointment") {
    return (a.appointment.at_time ?? "").localeCompare(b.appointment.at_time ?? "");
  }
  return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
};

const monthName = (key: string) => formatMonthYear(`${key}-01`).split(" ")[0];

/**
 * The agenda (screens 16 and 17), as settled on the canvas ("Plan · Round
 * 4", option A, 10 Oct 2026): this month on a card — what's left, what's
 * done, a bar — then "the road to the day", a line down the left with a dot
 * per month, each opening to show what's in it (a pill says how many), and
 * the wedding at the end. Quiet months say so. Done things stay in their
 * month, crossed out, until the month is over; then "Looking back" has them. To-dos, appointments and
 * payments due share the one timeline because they all answer "what's
 * coming up"; their marks tell them apart.
 */
export default function Agenda({
  milestones,
  appointments,
  payments,
  suppliers,
  areas,
  weddingDate,
  today,
}: {
  milestones: Milestone[];
  appointments: Appointment[] | null;
  payments: Payment[];
  suppliers: { id: string; name: string }[];
  areas: AreaOption[];
  weddingDate: string | null;
  today: string;
}) {
  const thisMonth = today.slice(0, 7);

  // Done means ticked, been (an appointment's day has passed) or paid.
  const isDone = (e: Entry) =>
    e.kind === "todo" ? !isOpen(e.milestone) : e.kind === "appointment" ? e.appointment.on_date < today : !!e.payment.paid_on;
  const monthOf = (e: Entry) => e.date?.slice(0, 7) ?? null;
  // Within a month: what's left first, what's done sinks to the bottom.
  const inOrder = (entries: Entry[]) => [...entries.filter((e) => !isDone(e)), ...entries.filter(isDone)];

  // Everything sits on its own day — done or not — so ticking something off
  // leaves it where it was, crossed out (owner's ask, 10 Oct 2026). An
  // undated to-do that's been done sits on the day it was done.
  const all: Entry[] = [
    ...milestones.map((m) => ({
      kind: "todo" as const,
      date: planDate(m) ?? (isOpen(m) ? null : (m.completed_at?.slice(0, 10) ?? null)),
      milestone: m,
    })),
    ...(appointments ?? []).map((a) => ({ kind: "appointment" as const, date: a.on_date, appointment: a })),
    ...payments.map((p) => ({ kind: "payment" as const, date: p.due_date ?? p.paid_on, payment: p })),
  ].sort(byDate);

  // A nudge whose month has gone by just means "start now", so it joins this
  // month; anything else left over from an earlier month is "still open".
  const fromEarlier = all.filter(
    (e) => !isDone(e) && monthOf(e) && monthOf(e)! < thisMonth && !(e.kind === "todo" && isNudge(e.milestone)),
  );
  const later = all.filter((e) => monthOf(e) && monthOf(e)! > thisMonth);
  const undated = all.filter((e) => !isDone(e) && !e.date);

  // The calendar runs as far as the wedding, or the last thing planned.
  const lastKey = [weddingDate?.slice(0, 7), ...later.map((e) => monthOf(e)!)]
    .filter((k): k is string => !!k)
    .sort()
    .pop();

  const supplierName = (id: string | null) => suppliers.find((s) => s.id === id)?.name;

  const row = (entry: Entry) => {
    const faded = isDone(entry);
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
      const details = [
        `${formatWeekdayDayMonth(a.on_date)}${a.at_time ? ` · ${formatTime(a.at_time)}` : ""}`,
        a.location,
        // "at Hazel Gap Barn · with Hazel Gap Barn" says it twice.
        supplierName(a.contact_id) && !a.location?.includes(supplierName(a.contact_id)!) && `with ${supplierName(a.contact_id)}`,
      ].filter(Boolean);
      return (
        <li key={`a-${a.id}`} className={`row-press flex items-center gap-3.5 border-b border-linen last:border-b-0 ${faded ? "opacity-60" : ""}`}>
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600" aria-hidden>
            {faded ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> : <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />}
          </span>
          <Link href={`/plan/appointments/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3">
            <span className="min-w-0 flex-1">
              <span className={`type-item block ${faded ? "!text-stone" : ""}`}>{a.title}</span>
              <span className="type-meta mt-1 block">{details.join(" · ")}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
          </Link>
        </li>
      );
    }
    const p = entry.payment;
    const paid = !!p.paid_on;
    const late = !paid && p.due_date && p.due_date < today;
    return (
      <li key={`p-${p.id}`} className={`row-press flex items-center gap-3.5 border-b border-linen last:border-b-0 ${paid ? "opacity-60" : ""}`}>
        <TickForm
          action={markPaidAction.bind(null, p.id, !paid)}
          undo={markPaidAction.bind(null, p.id, paid)}
          ticking={!paid}
          label="Marked paid"
          ariaLabel={paid ? `Mark "${p.description}" as not paid` : `Mark "${p.description}" as paid`}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-champagne-100 font-display text-sm text-champagne-600 hover:bg-cream"
        >
          {paid ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden /> : "£"}
        </TickForm>
        <Link href={`/money/payments/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3">
          <span className="min-w-0 flex-1">
            <span className={`type-item block ${paid ? "!text-stone" : ""}`}>{p.description}</span>
            <span className="type-meta mt-1 block">
              {late && <span className="text-champagne-600">Overdue · </span>}
              {[
                paid ? `Paid ${formatDayMonth(p.paid_on!)}` : p.due_date && `Due ${formatWeekdayDayMonth(p.due_date)}`,
                supplierName(p.contact_id),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <span className="type-figure shrink-0 text-lg !font-normal">{formatMoney(p.amount)}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        </Link>
      </li>
    );
  };

  const earlierMonth = fromEarlier[0]?.date?.slice(0, 7);
  const earlierWhen =
    earlierMonth && fromEarlier.every((e) => e.date!.startsWith(earlierMonth)) ? `from ${monthName(earlierMonth)}` : "from before";

  const earlierFold = fromEarlier.length > 0 && (
    <Fold
      id="earlier"
      className="mt-3 rounded-2xl bg-cream px-4 py-3"
      header={
        <span className="block text-sm text-ink">
          {fromEarlier.length} still open {earlierWhen}
        </span>
      }
    >
      <ul className="mt-1">{fromEarlier.map((e) => row(e))}</ul>
    </Fold>
  );

  const undatedFold = undated.length > 0 && (
    <Fold
      id="undated"
      className="mt-10 border-t border-linen pt-4"
      header={
        <span className="flex items-baseline justify-between gap-3">
          <span className="section-label">No date yet</span>
          <span className="type-meta">{undated.length}</span>
        </span>
      }
    >
      <ul className="mt-1">{undated.map((e) => row(e))}</ul>
    </Fold>
  );

  // Nudges ("start around") have a month, not a day, so they aren't on the
  // grid; they're on the List's month cards. A "Start this month" box above
  // the grid was tried and put in the backlog (owner, 11 Oct 2026).
  const nudge = (e: Entry) => e.kind === "todo" && isNudge(e.milestone);
  const dots: Record<string, Dot[]> = {};
  const byDay: Record<string, Entry[]> = {};
  for (const e of all) {
    if (!e.date) continue;
    if (nudge(e)) continue;
    (byDay[e.date] ??= []).push(e);
    (dots[e.date] ??= []).push(isDone(e) ? "done" : e.kind);
  }
  const dayPanels = Object.fromEntries(
    Object.entries(byDay).map(([date, entries]) => [date, <ul key={date} className="mt-1">{inOrder(entries).map((e) => row(e))}</ul>]),
  );
  const monthTops = { [thisMonth]: <div key={thisMonth}>{earlierFold}</div> };
  const dated = all.filter((e) => e.date).map((e) => monthOf(e)!);
  const firstMonth = [thisMonth, ...dated].sort()[0];
  const lastMonth = [thisMonth, ...(lastKey ? [lastKey] : []), ...dated].sort().pop()!;

  return (
    <FoldGroup initiallyOpen={[]}>
      <PlanCalendar
        today={today}
        weddingDate={weddingDate}
        firstMonth={firstMonth}
        lastMonth={lastMonth}
        dots={dots}
        dayPanels={dayPanels}
        monthTops={monthTops}
        toggle={null}
        weddingPanel={
          <Link href="/day" className="mt-2 block font-display text-xl italic text-ink hover:text-champagne-600">
            The wedding — open The Day ›
          </Link>
        }
      />
      {undatedFold}
    </FoldGroup>
  );
}
