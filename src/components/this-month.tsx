import Link from "next/link";
import StarterPlanCard from "@/components/starter-plan-card";
import { AREAS } from "@/lib/areas";
import { formatDayMonth, isThisMonth } from "@/lib/dates";
import type { Milestone } from "@/types/db";

/** How many upcoming milestones the home screen lists. */
const LIST_LENGTH = 3;

/**
 * The story under the cover: a headline written like a lead story, then the
 * next few things to do as a numbered list, like a contents page.
 */
export default function ThisMonth({
  milestones,
  hasDate,
}: {
  milestones: Milestone[];
  hasDate: boolean;
}) {
  const open = milestones.filter((m) => m.status === "todo" || m.status === "in_progress");
  const lastDone = milestones
    .filter((m) => m.status === "done" && m.completed_at)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))[0];
  const upcoming = open.slice(0, LIST_LENGTH);
  const next = upcoming[0];

  const label = next?.due_date && !isThisMonth(next.due_date) ? "Coming up" : "This month";

  let headline: string;
  if (next && lastDone) headline = `${lastDone.title} — done. Next: ${next.title}.`;
  else if (next) headline = `First up: ${next.title}.`;
  else if (lastDone) headline = `${lastDone.title} — done. Nothing else due.`;
  else if (hasDate) headline = "The date is set. Now for the plan.";
  else headline = "Every wedding starts with a date.";

  return (
    <section className="px-6">
      <div className="flex items-baseline justify-between border-b border-champagne-400 pb-2">
        <p className="label">{label}</p>
        <p className="text-xs font-medium uppercase tracking-label text-stone">
          {AREAS.length} areas
        </p>
      </div>

      <h2 className="mt-4 text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">{headline}</h2>

      {upcoming.length > 0 ? (
        <ol className="mt-4">
          {upcoming.map((m, index) => (
            <li key={m.id} className="flex items-baseline gap-3 border-t border-linen py-3">
              <span className="w-5 font-display text-sm text-champagne-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-display text-lg text-ink">{m.title}</span>
              {m.due_date && (
                <span className="text-xs uppercase tracking-[0.14em] text-stone">
                  {formatDayMonth(m.due_date)}
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        milestones.length === 0 ? (
          <div className="mt-6">
            <StarterPlanCard returnTo="/" hasDate={hasDate} />
          </div>
        ) : (
          <Link
            href="/timeline/new"
            className="mt-4 block border-t border-linen pt-3 text-sm text-champagne-600 underline underline-offset-4 hover:text-ink"
          >
            Add a to-do
          </Link>
        )
      )}
    </section>
  );
}
