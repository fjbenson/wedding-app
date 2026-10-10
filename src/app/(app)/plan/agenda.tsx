import Link from "next/link";
import { CalendarClock, Check, ChevronRight } from "lucide-react";
import { areaName, type AreaOption } from "@/lib/areas";
import { daysUntil, formatDayMonth, formatLongDate, formatMonthYear, formatTime, formatWeekdayDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { isNudge, planDate } from "@/lib/plan";
import type { Appointment, Milestone, Payment } from "@/types/db";
import TickForm from "@/components/tick-form";
import { markPaidAction } from "../money/actions";
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

const titleOf = (e: Entry) =>
  e.kind === "todo" ? e.milestone.title : e.kind === "appointment" ? e.appointment.title : e.payment.description;

/** "2026-10" → "2026-11" */
function nextMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
}

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
  const now = inOrder(
    all.filter(
      (e) =>
        monthOf(e) === thisMonth ||
        (!isDone(e) && monthOf(e) && monthOf(e)! < thisMonth && !fromEarlier.includes(e)),
    ),
  );
  const later = all.filter((e) => monthOf(e) && monthOf(e)! > thisMonth);
  const undated = all.filter((e) => !isDone(e) && !e.date);

  // Once a month is over, what was done in it moves to "Looking back".
  const back: { key: string; entries: Entry[] }[] = [];
  for (const e of all.filter((e) => isDone(e) && monthOf(e) && monthOf(e)! < thisMonth).reverse()) {
    const key = monthOf(e)!;
    const group = back.find((g) => g.key === key);
    if (group) group.entries.push(e);
    else back.push({ key, entries: [e] });
  }

  // Every month from next month to the wedding (or the last thing planned),
  // with runs of empty months folded into one quiet line.
  const lastKey = [weddingDate?.slice(0, 7), ...later.map((e) => monthOf(e)!)]
    .filter((k): k is string => !!k)
    .sort()
    .pop();
  type Stop = { key: string; until: string; entries: Entry[] };
  const road: Stop[] = [];
  if (lastKey) {
    for (let key = nextMonth(thisMonth); key <= lastKey; key = nextMonth(key)) {
      const entries = inOrder(later.filter((e) => monthOf(e) === key));
      const previous = road[road.length - 1];
      if (entries.length === 0 && previous && previous.entries.length === 0) previous.until = key;
      else road.push({ key, until: key, entries });
    }
  }
  const roadFolds = road.filter((s) => s.entries.length > 0).map((s) => `m-${s.key}`);

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
        <li key={`a-${a.id}`} className={`flex items-center gap-3.5 border-b border-linen last:border-b-0 ${faded ? "opacity-60" : ""}`}>
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600" aria-hidden>
            {faded ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> : <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />}
          </span>
          <Link href={`/plan/appointments/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 hover:bg-cream/60">
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
      <li key={`p-${p.id}`} className={`flex items-center gap-3.5 border-b border-linen last:border-b-0 ${paid ? "opacity-60" : ""}`}>
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
        <Link href={`/money/payments/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 hover:bg-cream/60">
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

  const summary = (all: Entry[]) => {
    const entries = all.filter((e) => !isDone(e));
    if (entries.length === 0) return "All done.";
    return entries.slice(0, 3).map(titleOf).join(" · ") + (entries.length > 3 ? ` and ${entries.length - 3} more` : "");
  };

  const left = now.filter((e) => !isDone(e)).length;
  const done = now.length - left;
  const earlierMonth = fromEarlier[0]?.date?.slice(0, 7);
  const earlierWhen =
    earlierMonth && fromEarlier.every((e) => e.date!.startsWith(earlierMonth)) ? `from ${monthName(earlierMonth)}` : "from before";

  return (
    <FoldGroup initiallyOpen={["month", ...roadFolds.slice(0, 1)]}>
      {/* Past months: what got done in them, out of the way but not lost. */}
      {back.length > 0 && (
        <Fold
          id="back"
          className="mt-6"
          header={
            <span className="flex items-baseline justify-between gap-3">
              <span className="section-label">Looking back</span>
              <span className="type-meta">{back.reduce((n, g) => n + g.entries.length, 0)} done</span>
            </span>
          }
        >
          <div className="mt-2 space-y-1">
            {back.map((group) => (
              <Fold
                key={group.key}
                id={`b-${group.key}`}
                className="border-b border-linen py-2.5 last:border-b-0"
                header={
                  <span className="flex items-baseline justify-between gap-3">
                    <span>
                      <span className="font-display text-lg text-ink">{monthName(group.key)}</span>{" "}
                      <span className="font-display text-lg font-light italic text-champagne-600">{group.key.slice(0, 4)}</span>
                    </span>
                    <span className="type-meta">{group.entries.length} done</span>
                  </span>
                }
              >
                <ul className="mt-1">{group.entries.map((e) => row(e))}</ul>
              </Fold>
            ))}
          </div>
        </Fold>
      )}

      {/* This month: the one to look at. */}
      <Fold
        id="month"
        className={`glass-card rounded-3xl p-5 ${back.length > 0 ? "mt-4" : "mt-7"}`}
        chevronClassName="text-champagne-600"
        header={
          <>
            <span className="label block">This month · {formatMonthYear(`${thisMonth}-01`)}</span>
            <span className="mt-2.5 flex items-baseline gap-2.5">
              {left === 0 && done > 0 ? (
                <span className="font-display text-[30px] font-light italic leading-tight text-ink">
                  All done this month
                </span>
              ) : (
                <>
                  <span className="type-figure text-[56px] leading-none">{left}</span>
                  <span className="font-display text-[19px] italic text-ink/80">
                    {left === 0 ? "due this month" : `still to do${done > 0 ? `, ${done} done` : ""}`}
                  </span>
                </>
              )}
            </span>
            {left + done > 0 && (
              <span className="mt-3.5 block h-1 rounded-full bg-linen" aria-hidden>
                <span className="block h-1 rounded-full bg-champagne-400" style={{ width: `${(done / (left + done)) * 100}%` }} />
              </span>
            )}
          </>
        }
      >
        {now.length > 0 && <ul className="mt-2">{now.map((e) => row(e))}</ul>}
        {fromEarlier.length > 0 && (
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
        )}
      </Fold>

      {/* The road to the day. */}
      {(road.length > 0 || weddingDate) && (
        <section className="mt-9">
          <div className="flex items-baseline justify-between">
            <h2 className="section-label">The road to the day</h2>
            <FoldAll ids={roadFolds} />
          </div>
          <ol className="relative mt-2">
            <span aria-hidden className="absolute bottom-8 left-[6px] top-5 w-px bg-champagne-400/40" />
            {road.map((stop) => {
              const n = stop.entries.length;
              const nDone = stop.entries.filter(isDone).length;
              const allDone = n > 0 && nDone === n;
              const year = stop.until.slice(0, 4);
              const name =
                stop.until === stop.key
                  ? monthName(stop.key)
                  : `${monthName(stop.key)}${stop.key.slice(0, 4) !== year ? ` ${stop.key.slice(0, 4)}` : ""} – ${monthName(stop.until)}`;
              const heading = (
                <span className="block">
                  <span className={`font-display text-xl ${n ? "text-ink" : "text-stone"}`}>{name}</span>{" "}
                  <span className={`font-display text-xl font-light italic ${n ? "text-champagne-600" : "text-stone"}`}>{year}</span>
                </span>
              );
              return (
                <li key={stop.key} className="relative pb-[18px] pl-8 pt-3">
                  {allDone ? (
                    // A month with everything done earns a gold dot with a tick.
                    <span
                      aria-hidden
                      className="absolute -left-[3px] top-[16px] flex h-[19px] w-[19px] items-center justify-center rounded-full bg-champagne-400 text-ivory"
                    >
                      <Check className="h-3 w-3" strokeWidth={2.6} />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className={`absolute left-0 top-[19px] h-[13px] w-[13px] rounded-full border-[1.5px] bg-ivory ${
                        n ? "border-champagne-400" : "border-linen"
                      }`}
                    />
                  )}
                  {n === 0 ? (
                    <>
                      {heading}
                      <span className="mt-1 block text-sm text-stone">Nothing planned. Enjoy it.</span>
                    </>
                  ) : (
                    <Fold
                      id={`m-${stop.key}`}
                      header={
                        <span className="flex items-start justify-between gap-3">
                          {heading}
                          <span className="mt-0.5 inline-flex h-[26px] shrink-0 items-center rounded-full bg-champagne-100 px-3 text-[13px] font-medium text-champagne-600">
                            {allDone ? "All done" : nDone > 0 ? `${nDone} of ${n} done` : `${n} ${n === 1 ? "item" : "items"}`}
                          </span>
                        </span>
                      }
                      closed={<span className="mt-1 block text-sm leading-relaxed text-stone">{summary(stop.entries)}</span>}
                    >
                      <ul className="mt-1">{stop.entries.map((e) => row(e))}</ul>
                    </Fold>
                  )}
                </li>
              );
            })}
            {weddingDate && (
              <li className="relative pl-8 pt-3">
                {/* The run-up ends where The Day begins: one tap across. */}
                <Link href="/day" className="group block">
                  <span aria-hidden className="absolute -left-1 top-[15px] h-[21px] w-[21px] rounded-full border-[5px] border-champagne-400 bg-ivory" />
                  <span className="font-display text-xl italic text-ink">{formatLongDate(weddingDate).replace(/ \d{4}$/, "")}</span>{" "}
                  <span className="font-display text-xl font-light italic text-champagne-600">{weddingDate.slice(0, 4)}</span>
                  <span className="mt-1 block text-sm text-stone group-hover:text-ink">
                    The day{daysUntil(weddingDate) > 0 ? ` · ${daysUntil(weddingDate)} days to go` : ""} ›
                  </span>
                </Link>
              </li>
            )}
          </ol>
        </section>
      )}

      {undated.length > 0 && (
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
      )}

    </FoldGroup>
  );
}
