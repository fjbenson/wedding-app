import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { formatDayMonth, formatMonthYear, todayISO } from "@/lib/dates";
import { isNudge } from "@/lib/plan";
import type { Milestone } from "@/types/db";
import TickForm from "@/components/tick-form";
import { toggleMilestoneAction } from "./actions";

export const isOpen = (m: Milestone) => m.status === "todo" || m.status === "in_progress";

/**
 * One to-do: tick it off, or tap through to edit. `area` is left off where
 * the group already says it. A nudge ("start around") has a dashed gold
 * circle and an italic title, and says "Start now" once its month comes
 * rather than ever being overdue.
 */
export function MilestoneRow({
  milestone: m,
  overdue,
  area,
}: {
  milestone: Milestone;
  overdue: boolean;
  area?: string | null;
}) {
  const done = !isOpen(m);
  const nudge = isNudge(m);
  const start = m.remind_at?.slice(0, 10);
  const when = nudge && start
    ? start.slice(0, 7) <= todayISO().slice(0, 7)
      ? "Start now"
      : `Start ${formatMonthYear(start).split(" ")[0]}`
    : m.due_date && `By ${formatDayMonth(m.due_date)}`;
  const details = [when, area].filter(Boolean);

  return (
    <li className="flex items-center gap-3.5 border-b border-linen last:border-b-0">
      <TickForm
        action={toggleMilestoneAction.bind(null, m.id, !done)}
        undo={toggleMilestoneAction.bind(null, m.id, done)}
        ticking={!done}
        label="Ticked off"
        ariaLabel={done ? `Mark "${m.title}" as not done` : `Mark "${m.title}" as done`}
        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full transition ${
          done
            ? "border border-ink bg-ink text-ivory"
            : nudge
              ? "border-[1.5px] border-dashed border-champagne-400 bg-white hover:bg-champagne-100"
              : "border-[1.5px] border-stone/50 bg-white hover:bg-champagne-100"
        }`}
      >
        {done && <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />}
      </TickForm>

      <Link href={`/plan/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 hover:bg-cream/60">
        <span className="min-w-0 flex-1">
          <span className={`type-item block ${done ? "!text-stone line-through" : nudge ? "italic !text-ink/80" : ""}`}>
            {m.title}
          </span>
          {(details.length > 0 || overdue) && (
            <span className="type-meta mt-1 block">
              {overdue && !nudge && <span className="text-champagne-600">Overdue · </span>}
              {nudge && !done ? (
                <>
                  <span className="text-champagne-600">{details[0]}</span>
                  {details.slice(1).map((d) => ` · ${d}`)}
                </>
              ) : (
                details.join(" · ")
              )}
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
      </Link>
    </li>
  );
}
