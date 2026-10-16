import RowLine from "./row-line";
import DateStamp from "./date-stamp";
import Link from "next/link";
import { areaName, type AreaOption } from "@/lib/areas";
import CardLink from "./card-link";
import { Calendar, Check } from "lucide-react";
import StarterPlanCard from "@/components/starter-plan-card";
import TickForm from "@/components/tick-form";
import { toggleMilestoneAction } from "@/app/(app)/plan/actions";
import { markPaidAction } from "@/app/(app)/money/actions";
import { formatDayMonth, formatTime, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { isNudge, planDate } from "@/lib/plan";
import type { Appointment, Milestone, Payment } from "@/types/db";

/** How many of the week's things the Hub lists before "and N more". */
const LIST_LENGTH = 5;

type Entry = {
  key: string;
  kind: "todo" | "payment" | "appointment";
  id: string;
  date: string;
  /** On the same day: appointments, then payments, then to-dos — as the agenda has it. */
  order: number;
  href: string;
  title: string;
  meta: string;
  overdue: boolean;
  italic?: boolean;
  amount?: string;
};

/** This week's Monday and Sunday (weeks start on Monday, like the calendar). */
function weekBounds(today: string): [string, string] {
  const d = new Date(`${today}T00:00:00Z`);
  const weekday = (d.getUTCDay() + 6) % 7; // Monday 0 … Sunday 6
  d.setUTCDate(d.getUTCDate() - weekday);
  const monday = d.toISOString().slice(0, 10);
  d.setUTCDate(d.getUTCDate() + 6);
  return [monday, d.toISOString().slice(0, 10)];
}

/** "12–18 Oct", or "28 Sep – 4 Oct" across a month's end. */
function weekRange(monday: string, sunday: string): string {
  const [a, b] = [formatDayMonth(monday), formatDayMonth(sunday)];
  return monday.slice(5, 7) === sunday.slice(5, 7) ? `${a.split(" ")[0]}–${b}` : `${a} – ${b}`;
}

/**
 * "This week" under the ring (owner, 13 Oct 2026, in place of "Your top
 * three": a week has an end, so you can reach it). Everything due by Sunday
 * plus anything overdue, ticked off right here — to-dos done, payments paid —
 * each sliding away as it's ticked. Appointments show but need no tick; they
 * drop off once the day has passed. Undated to-dos never show (they'd keep
 * the week from ever being clear). When it's all done: "Nothing more this
 * week", and the next thing after it.
 */
export default function ThisWeek({
  milestones,
  appointments,
  payments,
  hasDate,
  areas = [],
  suppliers = [],
}: {
  milestones: Milestone[];
  appointments: Appointment[];
  payments: Payment[];
  hasDate: boolean;
  /** For each row's grey line: its area and who it's with (RowLine's rule). */
  areas?: AreaOption[];
  suppliers?: { id: string; name: string; area: string | null }[];
}) {
  const today = todayISO();
  const supplier = (id: string | null) => suppliers.find((s) => s.id === id);
  const named = (key: string | null | undefined) => (key ? areaName(key, areas) : null);
  // Kind first, then the most useful detail, then the area — as on every row (16 Oct 2026).
  const line = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join(" · ");
  const [monday, sunday] = weekBounds(today);

  const all: Entry[] = [
    ...milestones
      .filter((m) => m.status === "todo" || m.status === "in_progress")
      .flatMap((m) => {
        const date = planDate(m);
        if (!date) return [];
        // A nudge ("start around") is never overdue — its date passing means start now.
        const overdue = date < today && !isNudge(m);
        return [{
          key: `t-${m.id}`, kind: "todo" as const, id: m.id, date, order: 2, href: `/plan/${m.id}`,
          title: m.title, italic: isNudge(m), overdue,
          meta: line(isNudge(m) && "Start now", named(m.category)),
        }];
      }),
    ...appointments
      .filter((a) => a.on_date >= today)
      .map((a) => ({
        key: `a-${a.id}`, kind: "appointment" as const, id: a.id, date: a.on_date, order: 0,
        href: `/plan/appointments/${a.id}`, title: a.title, overdue: false,
        // Time, then who it's with — else where, else the area (RowLine's rule).
        meta: line(
          a.at_time && formatTime(a.at_time),
          supplier(a.contact_id)?.name ?? a.location ?? named(a.area_key),
        ),
      })),
    ...payments
      .filter((p) => !p.paid_on && p.due_date)
      .map((p) => {
        const overdue = p.due_date! < today;
        return {
          key: `p-${p.id}`, kind: "payment" as const, id: p.id, date: p.due_date!, order: 1,
          href: `/money/payments/${p.id}`, title: p.description, amount: formatMoney(p.amount), overdue,
          meta: line(supplier(p.contact_id)?.name ?? named(p.area_key)),
        };
      }),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

  const week = all.filter((e) => e.date <= sunday);
  const next = all.find((e) => e.date > sunday);
  const shown = week.slice(0, LIST_LENGTH);
  const more = week.length - shown.length;
  // One group per day, overdue days first (they sort first); an overdue day
  // shows its date like any other, with "Overdue" under the title (owner,
  // 13 Oct 2026).
  const groups: { key: string; overdue: boolean; date: string; items: Entry[] }[] = [];
  for (const e of shown) {
    const key = e.date;
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(e);
    else groups.push({ key, overdue: e.date < today, date: e.date, items: [e] });
  }

  if (milestones.length === 0 && all.length === 0) {
    return (
      <section className="relative px-5 lg:px-0">
        <StarterPlanCard returnTo="/" hasDate={hasDate} glass />
      </section>
    );
  }

  return (
    <section className="relative px-5 lg:px-0">
      <div className="glass-card rounded-[22px] px-4 pb-2 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="section-label">This week</h2>
          <span className="type-meta tabular-nums">{weekRange(monday, sunday)}</span>
        </div>

        {week.length > 0 ? (
          <>
            <div className="mt-2">
              {groups.map((g) => (
                <div key={g.key} className="flex gap-3.5 border-t border-linen py-1 first:border-t-0">
                  <span className="pt-2.5">
                    <DateStamp date={g.date} today={today} overdue={g.overdue} under="weekday" />
                  </span>
                  <ul className="min-w-0 flex-1">
                    {g.items.map((e) => (
                      <li key={e.key} className="flex items-center gap-3 border-t border-linen/70 first:border-t-0">
                        <CardLink href={e.href} className="flex min-w-0 flex-1 items-center gap-3 py-3">
                          <span className="min-w-0 flex-1">
                            <span className={`type-item block ${e.italic ? "italic" : ""}`}>{e.title}</span>
                            <RowLine details={[e.meta]} overdue={e.overdue} />
                          </span>
                          {e.amount && <span className="type-figure shrink-0 text-[18px]">{e.amount}</span>}
                        </CardLink>
                        <Mark entry={e} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-linen py-3">
              {more > 0 ? (
                <Link href="/plan" className="type-meta !text-champagne-600 hover:!text-ink">
                  And {more} more ›
                </Link>
              ) : (
                <span />
              )}
              <Link href="/plan" className="type-meta !text-champagne-600 hover:!text-ink">
                The plan ›
              </Link>
            </div>
          </>
        ) : (
          // The week is clear: a calm moment, then the next thing after it.
          <div className="pb-3 pt-4">
            <p className="flex items-center gap-2.5 font-display text-[22px] font-light italic leading-tight text-champagne-600">
              <span aria-hidden className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-champagne-600 text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              </span>
              Nothing more this week.
            </p>
            {next && (
              <Link href={next.href} className="type-meta mt-3 block hover:!text-ink">
                Next up: <span className="normal-case tracking-normal text-ink">{next.title}</span> · {formatWeekdayDayMonth(next.date)} ›
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** The mark at the end of a row: a tick circle for a to-do, £ for a payment, a calendar for an appointment. */
function Mark({ entry: e }: { entry: Entry }) {
  if (e.kind === "appointment") {
    return (
      <span aria-hidden className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-champagne-400/45 bg-champagne-100">
        <Calendar className="h-3.5 w-3.5 text-champagne-600" strokeWidth={2} />
      </span>
    );
  }
  const todo = e.kind === "todo";
  return (
    <TickForm
      action={todo ? toggleMilestoneAction.bind(null, e.id, true) : markPaidAction.bind(null, e.id, true)}
      undo={todo ? toggleMilestoneAction.bind(null, e.id, false) : markPaidAction.bind(null, e.id, false)}
      ticking
      label={todo ? "Ticked off" : "Marked paid"}
      ariaLabel={todo ? `Mark "${e.title}" as done` : `Mark "${e.title}" as paid`}
      className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-white transition hover:bg-champagne-100 ${
        todo ? (e.italic ? "border-[1.5px] border-dashed border-champagne-400" : "border-[1.5px] border-stone/50") : "border-[1.5px] border-champagne-400 font-display text-[13px] text-champagne-600"
      }`}
    >
      {!todo && "£"}
    </TickForm>
  );
}
