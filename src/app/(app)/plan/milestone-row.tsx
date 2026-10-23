import CardLink from "@/components/card-link";
import RowLine from "@/components/row-line";
import RowPeople from "@/components/row-people";
import { Check } from "lucide-react";
import { formatMonthYear, formatTime, todayISO } from "@/lib/dates";
import { isNudge } from "@/lib/plan";
import type { Milestone } from "@/types/db";
import DateStamp, { TimeStamp } from "@/components/date-stamp";
import TickForm from "@/components/tick-form";
import { toggleMilestoneAction } from "./actions";

export const isOpen = (m: Milestone) => m.status === "todo" || m.status === "in_progress";

/**
 * One to-do, laid out like the Hub's This week (owner, 16 Oct 2026: to-dos,
 * appointments and payments all the same): the date large on the left, the
 * title with its area under it, and the tick circle on the right. Tap the
 * row and its card opens over the page (`plan-cards.tsx`). `area` is left off where the list is already one area. A
 * nudge ("start around") has a dashed circle and an italic title, and says
 * "Start now" once its month comes rather than ever being overdue.
 */
export function MilestoneRow({
  milestone: m,
  overdue,
  area,
  inDay = false,
}: {
  milestone: Milestone;
  overdue: boolean;
  area?: string | null;
  /** In a day's card: "times" puts the time where the date was; "plain" (no times that day) leaves the column out. */
  inDay?: "times" | "plain" | false;
  /** Kept for callers; the date column now says "No date" itself. */
  showNoDate?: boolean;
}) {
  const done = !isOpen(m);
  const nudge = isNudge(m);
  const start = m.remind_at?.slice(0, 10);
  const nudgeWhen =
    nudge && start
      ? start.slice(0, 7) <= todayISO().slice(0, 7)
        ? "Start now"
        : `Start ${formatMonthYear(start).split(" ")[0]}`
      : null;
  const late = overdue && !nudge && !done;

  return (
    <li className="row-press flex items-center gap-3.5 border-b border-ink/[0.12] last:border-b-0">
      <CardLink href={`/plan/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 py-3">
        {inDay === "times" ? (
          <TimeStamp time={m.due_time} done={done} />
        ) : (
          !inDay && <DateStamp date={m.due_date ?? (nudge ? start ?? null : null)} today={todayISO()} overdue={late} done={done} />
        )}
        <span className="min-w-0 flex-1">
          <span className={`type-item block ${done ? "!text-stone line-through" : nudge ? "italic !text-ink/80" : ""}`}>{m.title}</span>
          <RowLine status={done ? "Done" : nudgeWhen} details={[inDay !== "times" && m.due_date && m.due_time ? formatTime(m.due_time) : null, area]} overdue={late} />
        </span>
        <RowPeople kind="todo" id={m.id} />
      </CardLink>
      <TickForm
        action={toggleMilestoneAction.bind(null, m.id, !done)}
        undo={toggleMilestoneAction.bind(null, m.id, done)}
        ticking={!done}
        label="Ticked off"
        ariaLabel={done ? `Mark "${m.title}" as not done` : `Mark "${m.title}" as done`}
        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full transition ${
          done
            ? "bg-champagne-600 text-white"
            : nudge
              ? "border-[1.5px] border-dashed border-champagne-400 bg-white hover:bg-champagne-100"
              : "border-[1.5px] border-stone/50 bg-white hover:bg-champagne-100"
        }`}
      >
        {done && <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />}
      </TickForm>
    </li>
  );
}
