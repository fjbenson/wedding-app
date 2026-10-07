import Link from "next/link";
import StarterPlanCard from "@/components/starter-plan-card";
import { formatWeekdayDayMonth, isThisMonth } from "@/lib/dates";
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
  const open = milestones.filter((m) => m.status === "todo" || m.status === "in_progress");
  const upcoming = open.slice(0, LIST_LENGTH);
  const next = upcoming[0];

  const label = next?.due_date && !isThisMonth(next.due_date) ? "Coming up" : "This month";

  return (
    <section className="relative px-5 lg:px-0">
      <div className="flex items-baseline justify-between px-1">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-stone">{label}</p>
        <Link href="/plan" className="text-xs font-medium uppercase tracking-label text-champagne-600 hover:text-ink">
          The plan
        </Link>
      </div>

      {upcoming.length > 0 ? (
        <ol className="glass-card mt-2.5 rounded-[22px] px-[18px] py-1.5">
          {upcoming.map((m) => (
            <li key={m.id} className="flex items-center gap-3.5 border-t border-linen py-3.5 first:border-t-0">
              <span className="w-[34px] shrink-0 font-display text-[22px] font-light text-champagne-600">
                {m.due_date ? m.due_date.slice(8) : "—"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] leading-tight text-ink">{m.title}</span>
                {m.due_date && (
                  <span className="mt-1 block text-xs font-medium uppercase tracking-[0.2em] text-stone">
                    Due {formatWeekdayDayMonth(m.due_date)}
                  </span>
                )}
              </span>
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
