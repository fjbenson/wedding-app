import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { formatDayMonth } from "@/lib/dates";
import type { Milestone } from "@/types/db";
import { toggleMilestoneAction } from "./actions";

export const isOpen = (m: Milestone) => m.status === "todo" || m.status === "in_progress";

/** One to-do: tick it off, or tap through to edit. `area` is left off where the group already says it. */
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
  const details = [m.due_date && formatDayMonth(m.due_date), area].filter(Boolean);

  return (
    <li className="flex items-center gap-3 border-b border-linen last:border-b-0">
      <form action={toggleMilestoneAction.bind(null, m.id, !done)}>
        <button
          type="submit"
          aria-label={done ? `Mark "${m.title}" as not done` : `Mark "${m.title}" as done`}
          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
            done
              ? "border-ink bg-ink text-ivory"
              : "border-champagne-400 bg-white hover:bg-champagne-100"
          }`}
        >
          {done && <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />}
        </button>
      </form>

      <Link href={`/plan/${m.id}`} className="flex flex-1 items-center gap-3 py-3 hover:bg-cream/60">
        <span className="flex-1">
          <span className={`type-item block ${done ? "!text-stone line-through" : ""}`}>{m.title}</span>
          {(details.length > 0 || overdue) && (
            <span className="type-meta mt-1 block">
              {overdue && <span className="text-champagne-600">Overdue · </span>}
              {details.join(" · ")}
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
      </Link>
    </li>
  );
}
