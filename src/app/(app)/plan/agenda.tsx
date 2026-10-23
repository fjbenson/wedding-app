import type { ReactNode } from "react";
import Link from "next/link";
import AddMenu from "@/components/add-menu";
import { planChoices } from "@/components/add-choices";
import { areaName, type AreaOption } from "@/lib/areas";
import { formatMonthYear, formatTime } from "@/lib/dates";
import { isNudge, planDate } from "@/lib/plan";
import type { Appointment, Milestone } from "@/types/db";
import { AppointmentRow } from "./appointment-row";
import PlanCalendar, { type Chip, type Dot } from "./calendar";
import { Fold, FoldAll, FoldGroup } from "./fold";
import { MilestoneRow, isOpen } from "./milestone-row";

type Entry =
  | { kind: "todo"; date: string | null; milestone: Milestone }
  | { kind: "appointment"; date: string; appointment: Appointment };

/** Same day: appointments first (they happen at a time), then to-dos. */
const KIND_ORDER = { appointment: 0, todo: 1 };

const byDate = (a: Entry, b: Entry) => {
  if (a.date !== b.date) return !a.date ? 1 : !b.date ? -1 : a.date.localeCompare(b.date);
  if (a.kind === "appointment" && b.kind === "appointment") {
    return (a.appointment.at_time ?? "").localeCompare(b.appointment.at_time ?? "");
  }
  return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
};

const monthName = (key: string) => formatMonthYear(`${key}-01`).split(" ")[0];

/**
 * The agenda (screens 16 and 17): the calendar, with the month in view
 * listed under it and a card per tapped day (`calendar.tsx`), then the
 * things with no date yet. Just to-dos and appointments: what you have to do
 * or go to. Payments live in Money only (owner, 12 Oct 2026), whose By month
 * view is their calendar; the Hub's "coming up" still shows the next ones.
 */
export default function Agenda({
  milestones,
  appointments,
  suppliers,
  areas,
  weddingDate,
  today,
}: {
  milestones: Milestone[];
  appointments: Appointment[] | null;
  suppliers: { id: string; name: string; area?: string | null }[];
  areas: AreaOption[];
  weddingDate: string | null;
  today: string;
}) {
  const thisMonth = today.slice(0, 7);

  // Done means ticked, or been (an appointment's day has passed).
  const isDone = (e: Entry) => (e.kind === "todo" ? !isOpen(e.milestone) : e.appointment.on_date < today);
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
    const a = entry.appointment;
    const areaKey = a.area_key ?? suppliers.find((s) => s.id === a.contact_id)?.area ?? null;
    return <AppointmentRow key={`a-${a.id}`} appointment={a} been={faded} supplier={supplierName(a.contact_id)} area={areaName(areaKey, areas)} />;
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

  // To-dos with no date have no day on the grid: a line under the month
  // opens them in a card of their own, like a day's (owner, 12 Oct 2026).
  const undatedPanel = undated.length > 0 && <ul className="mt-1">{undated.map((e) => row(e))}</ul>;

  // Nudges ("start around") have a month, not a day, so they aren't on the
  // grid; they're on the List's month cards. A "Start this month" box above
  // the grid was tried and put in the backlog (owner, 11 Oct 2026).
  const nudge = (e: Entry) => e.kind === "todo" && isNudge(e.milestone);
  const dots: Record<string, Dot[]> = {};
  // The laptop's big month writes each thing in its day (canvas 5 "Laptop · Round 21", A, owner's pick 23 Oct 2026).
  const chips: Record<string, Chip[]> = {};
  const byDay: Record<string, Entry[]> = {};
  for (const e of all) {
    if (!e.date) continue;
    if (nudge(e)) continue;
    (byDay[e.date] ??= []).push(e);
    // Done things stay in the day's card and the list, but get no mark.
    if (isDone(e)) continue;
    (dots[e.date] ??= []).push(e.kind);
    (chips[e.date] ??= []).push(
      e.kind === "todo"
        ? { kind: "todo", title: e.milestone.title, time: null, overdue: !!e.milestone.due_date && e.milestone.due_date < today }
        : { kind: "appointment", title: e.appointment.title, time: e.appointment.at_time ? formatTime(e.appointment.at_time) : null, overdue: false },
    );
  }
  const dayPanels = Object.fromEntries(
    Object.entries(byDay).map(([date, entries]) => [date, <ul key={date} className="mt-1">{inOrder(entries).map((e) => row(e))}</ul>]),
  );
  // The list under the grid: everything with a date in the month, in date
  // order, no day headings (owner, 11 Oct 2026): each row carries its own
  // date. What's done moves down into a "Done" fold at the foot (owner, 12
  // Oct 2026: crossed out in place was jarring; ticking slides it away).
  const byMonth: Record<string, Entry[]> = {};
  for (const e of all) if (e.date) (byMonth[monthOf(e)!] ??= []).push(e);
  // The big month has no list under it, so a month's Done opens in a card from the pill by the month's name.
  const doneLists: Record<string, { count: number; panel: ReactNode }> = {};
  for (const [key, entries] of Object.entries(byMonth)) {
    const done = entries.filter(isDone);
    if (done.length) doneLists[key] = { count: done.length, panel: <ul className="mt-1">{done.map((e) => row(e))}</ul> };
  }
  const monthLists = Object.fromEntries(
    Object.entries(byMonth).map(([key, entries]) => {
      const open = entries.filter((e) => !isDone(e));
      const done = entries.filter(isDone);
      return [
        key,
        <div key={key}>
          {/* The month's heading, the same pattern as Done below: name on the left, count on the right. */}
          {open.length > 0 && (
            <p className="flex items-baseline justify-between gap-3 pt-1">
              <span className="section-label">{monthName(key)}</span>
              <span className="type-meta">{open.length === 1 ? "1 item" : `${open.length} items`}</span>
            </p>
          )}
          {open.length > 0 && <ul className="mt-1">{open.map((e) => row(e))}</ul>}
          {done.length > 0 && (
            <Fold
              id={`done-${key}`}
              className="mt-3 border-t border-ink/[0.12] pt-3"
              header={
                <span className="flex items-baseline justify-between gap-3">
                  <span className="section-label">Done</span>
                  <span className="type-meta">{done.length === 1 ? "1 item" : `${done.length} items`}</span>
                </span>
              }
            >
              <ul className="mt-1">{done.map((e) => row(e))}</ul>
            </Fold>
          )}
        </div>,
      ];
    }),
  );
  const monthTops = { [thisMonth]: <div key={thisMonth}>{earlierFold}</div> };
  const dated = all.filter((e) => e.date).map((e) => monthOf(e)!);
  const firstMonth = [thisMonth, ...dated].sort()[0];
  const lastMonth = [thisMonth, ...(lastKey ? [lastKey] : []), ...dated].sort().pop()!;

  // Laptops: where the plan stands, as tiles over the big month (calendar.tsx), counted like the List's numbers card.
  const openTodos = milestones.filter(isOpen);
  const late = (m: Milestone) => !isNudge(m) && !!m.due_date && m.due_date < today;
  const totals = {
    overdue: openTodos.filter(late).length,
    todos: openTodos.length,
    appointments: (appointments ?? []).filter((a) => a.on_date >= today).length,
  };

  return (
    <FoldGroup initiallyOpen={[]}>
      <PlanCalendar
        today={today}
        weddingDate={weddingDate}
        firstMonth={firstMonth}
        lastMonth={lastMonth}
        dots={dots}
        chips={chips}
        totals={totals}
        doneLists={doneLists}
        dayPanels={dayPanels}
        monthLists={monthLists}
        monthTops={monthTops}
        undatedCount={undated.length}
        undatedPanel={undatedPanel}
        toggle={
          // The one way in (owner, 12 Oct 2026): the round black +, at the end of the key's row under the month (16 Oct 2026).
          <AddMenu label="Add to the plan" title="Add to the plan" choices={planChoices()} />
        }
        weddingPanel={
          <Link href="/day" className="mt-2 block font-display text-xl italic text-ink hover:text-champagne-600">
            The wedding — open The Day ›
          </Link>
        }
      />
    </FoldGroup>
  );
}
