import Link from "next/link";
import StarterPlanCard from "@/components/starter-plan-card";
import { formatMonthYear, formatTime, formatWeekdayDayMonth, isThisMonth, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { isNudge, planDate } from "@/lib/plan";
import type { Appointment, Milestone, Payment } from "@/types/db";

/** How many upcoming things the home screen lists. */
const LIST_LENGTH = 3;

type Entry = {
  key: string;
  date: string | null;
  /** On the same day: appointments, then payments, then to-dos — as the agenda has it. */
  order: number;
  href: string;
  title: string;
  meta: string | null;
  italic?: boolean;
  amount?: string;
};

/**
 * Under the notes: the next few to-dos, appointments and payments on a glass
 * card — the Plan agenda in miniature — each led by its day of the month in
 * dark gold, like Editorial's contents numbers.
 */
export default function ThisMonth({
  milestones,
  appointments,
  payments,
  hasDate,
}: {
  milestones: Milestone[];
  appointments: Appointment[];
  payments: Payment[];
  hasDate: boolean;
}) {
  const today = todayISO();
  const thisMonth = today.slice(0, 7);

  const entries: Entry[] = [
    // In plan order: a nudge ("start around") sits on its start date.
    ...milestones
      .filter((m) => m.status === "todo" || m.status === "in_progress")
      .map((m) => {
        const date = planDate(m);
        return {
          key: `t-${m.id}`,
          date,
          order: 2,
          href: `/plan/${m.id}`,
          title: m.title,
          italic: isNudge(m),
          meta: !date
            ? null
            : !isNudge(m)
              ? `Due ${formatWeekdayDayMonth(date)}`
              : date.slice(0, 7) <= thisMonth
                ? "Start now"
                : `Start ${formatMonthYear(date).split(" ")[0]}`,
        };
      }),
    ...appointments
      .filter((a) => a.on_date >= today)
      .map((a) => ({
        key: `a-${a.id}`,
        date: a.on_date,
        order: 0,
        href: `/plan/appointments/${a.id}`,
        title: a.title,
        meta: `${formatWeekdayDayMonth(a.on_date)}${a.at_time ? ` · ${formatTime(a.at_time)}` : ""}`,
      })),
    ...payments
      .filter((p) => !p.paid_on)
      .map((p) => ({
        key: `p-${p.id}`,
        date: p.due_date,
        order: 1,
        href: `/money/payments/${p.id}`,
        title: `Pay: ${p.description}`,
        meta: p.due_date ? `Due ${formatWeekdayDayMonth(p.due_date)}` : null,
        amount: formatMoney(p.amount),
      })),
  ]
    .sort((a, b) => {
      if (a.date !== b.date) return (a.date ?? "9999").localeCompare(b.date ?? "9999");
      return a.order - b.order;
    })
    .slice(0, LIST_LENGTH);

  const nextDate = entries[0]?.date;
  const label = nextDate && !isThisMonth(nextDate) ? "Coming up" : "This month";

  return (
    <section className="relative px-5 lg:px-0">
      <div className="flex items-baseline justify-between px-1">
        <p className="section-label">{label}</p>
        <Link href="/plan" className="label hover:text-ink">
          The plan
        </Link>
      </div>

      {entries.length > 0 ? (
        <ol className="glass-card mt-2.5 rounded-[22px] px-[18px] py-1.5">
          {entries.map((e) => (
            <li key={e.key} className="border-t border-linen first:border-t-0">
              <Link href={e.href} className="flex items-center gap-3.5 py-3.5">
                <span className="w-[34px] shrink-0 font-display text-[22px] font-light text-champagne-600">
                  {e.date ? e.date.slice(8) : "—"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`type-item block ${e.italic ? "italic" : ""}`}>{e.title}</span>
                  {e.meta && <span className="type-meta mt-1 block">{e.meta}</span>}
                </span>
                {e.amount && <span className="type-figure shrink-0 text-[19px]">{e.amount}</span>}
              </Link>
            </li>
          ))}
        </ol>
      ) : milestones.length === 0 ? (
        <div className="mt-2.5">
          <StarterPlanCard returnTo="/" hasDate={hasDate} glass />
        </div>
      ) : (
        <Link
          href="/plan/new"
          className="glass-card mt-2.5 block rounded-[22px] px-[18px] py-4 text-sm text-champagne-600 underline underline-offset-4 hover:text-ink"
        >
          Add a to-do
        </Link>
      )}
    </section>
  );
}
