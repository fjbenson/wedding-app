import { areaName, type AreaOption } from "@/lib/areas";
import { isNudge, planDate } from "@/lib/plan";
import type { Milestone } from "@/types/db";
import { Fold, FoldGroup } from "./fold";
import { MilestoneRow, isOpen } from "./milestone-row";

/**
 * Plan's third view, **To-dos** (`?view=todos`, owner's ask 11 Oct 2026): just
 * the to-dos as a plain checklist — no appointments or payments mixed in —
 * grouped Overdue · This month · Later · No date yet, with what's done
 * folded away at the foot. "No date yet" has an anchor (#no-date) so the
 * calendar can link straight to it.
 */
export default function TodoList({ milestones, areas, today }: { milestones: Milestone[]; areas: AreaOption[]; today: string }) {
  const thisMonth = today.slice(0, 7);
  const open = milestones
    .filter(isOpen)
    .sort((a, b) => (planDate(a) ?? "9999").localeCompare(planDate(b) ?? "9999"));
  const done = milestones
    .filter((m) => !isOpen(m))
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  // A nudge whose month has come is "start now", never overdue (src/lib/plan.ts).
  const overdue = open.filter((m) => !isNudge(m) && !!m.due_date && m.due_date < today);
  const now = open.filter((m) => !overdue.includes(m) && !!planDate(m) && planDate(m)!.slice(0, 7) <= thisMonth);
  const later = open.filter((m) => !!planDate(m) && planDate(m)!.slice(0, 7) > thisMonth);
  const undated = open.filter((m) => !planDate(m));

  const groups = [
    { id: "overdue", title: "Overdue", items: overdue },
    { id: "this-month", title: "This month", items: now },
    { id: "later", title: "Later", items: later },
    { id: "no-date", title: "No date yet", items: undated },
  ].filter((g) => g.items.length > 0);

  if (open.length === 0 && done.length === 0) return null;

  return (
    <FoldGroup initiallyOpen={[]}>
      {open.length === 0 && <p className="mt-8 font-display text-xl italic text-ink">Everything's done. Lovely.</p>}
      {groups.map((g) => (
        <section key={g.id} id={g.id} className="mt-8 scroll-mt-6">
          <div className="flex items-baseline justify-between px-1">
            <h2 className={`section-label ${g.id === "overdue" ? "!text-champagne-600" : ""}`}>{g.title}</h2>
            <span className="type-meta">{g.items.length}</span>
          </div>
          <ul className="glass-card mt-2.5 rounded-[22px] px-[18px] py-1">
            {g.items.map((m) => (
              <MilestoneRow key={m.id} milestone={m} overdue={g.id === "overdue"} area={areaName(m.category, areas)} />
            ))}
          </ul>
        </section>
      ))}
      {done.length > 0 && (
        <Fold
          id="todos-done"
          className="mt-10 border-t border-linen pt-4"
          header={
            <span className="flex items-baseline justify-between gap-3">
              <span className="section-label">Done</span>
              <span className="type-meta">{done.length}</span>
            </span>
          }
        >
          <ul className="mt-1">
            {done.map((m) => (
              <MilestoneRow key={m.id} milestone={m} overdue={false} area={areaName(m.category, areas)} />
            ))}
          </ul>
        </Fold>
      )}
    </FoldGroup>
  );
}
