import Link from "next/link";
import StarterPlanCard from "@/components/starter-plan-card";
import { formatMonthYear, formatWeekdayDayMonth, isThisMonth, todayISO } from "@/lib/dates";
import { isNudge, planDate } from "@/lib/plan";
import type { Milestone } from "@/types/db";

/** How many upcoming milestones the home screen lists. */
const LIST_LENGTH = 3;

/**
 * Under the ring: the next few things to do on a glass card, each led by
 * its day of the month in dark gold, like Editorial's contents numbers.
 */
export default function ThisMonth({
  milestones,
  hasDate,
}: {
  milestones: Milestone[];
  hasDate: boolean;
}) {
  // In plan order: a nudge ("start around") sits on its start date.
  const open = milestones
    .filter((m) => m.status === "todo" || m.status === "in_progress")
    .sort((a, b) => (planDate(a) ?? "9999").localeCompare(planDate(b) ?? "9999"));
  const upcoming = open.slice(0, LIST_LENGTH);
  const next = upcoming[0];

  const nextDate = next && planDate(next);
  const label = nextDate && !isThisMonth(nextDate) ? "Coming up" : "This month";
  const thisMonth = todayISO().slice(0, 7);

  return (
    <section className="relative px-5 lg:px-0">
      <div className="flex items-baseline justify-between px-1">
        <p className="section-label">{label}</p>
        <Link href="/plan" className="label hover:text-ink">
          The plan
        </Link>
      </div>

      {upcoming.length > 0 ? (
        <ol className="glass-card mt-2.5 rounded-[22px] px-[18px] py-1.5">
          {upcoming.map((m) => {
            const date = planDate(m);
            return (
            <li key={m.id} className="flex items-center gap-3.5 border-t border-linen py-3.5 first:border-t-0">
              <span className="w-[34px] shrink-0 font-display text-[22px] font-light text-champagne-600">
                {date ? date.slice(8) : "—"}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`type-item block ${isNudge(m) ? "italic" : ""}`}>{m.title}</span>
                {date && (
                  <span className="type-meta mt-1 block">
                    {!isNudge(m)
                      ? `Due ${formatWeekdayDayMonth(date)}`
                      : date.slice(0, 7) <= thisMonth
                        ? "Start now"
                        : `Start ${formatMonthYear(date).split(" ")[0]}`}
                  </span>
                )}
              </span>
            </li>
            );
          })}
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
