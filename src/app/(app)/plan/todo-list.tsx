import Link from "next/link";
import { areaName, type AreaOption } from "@/lib/areas";
import { isNudge, planDate } from "@/lib/plan";
import type { Milestone } from "@/types/db";
import AreaFilter from "./area-filter";
import { Fold, FoldGroup } from "./fold";
import { MilestoneRow, isOpen } from "./milestone-row";
import WhenFilter, { WHEN_CHOICES, type When } from "./when-filter";

/** "2026-10-12" → "2027-01-12": three months on, for "Next 3 months". */
function threeMonthsOn(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + 3, d)).toISOString().slice(0, 10);
}

/**
 * Plan's List (`?view=list`): **what's left to do** — one long checklist of
 * to-dos (owner, 12 Oct 2026). The Calendar is the diary (when is
 * everything?), so appointments live there, not here, and the months aren't
 * headings any more: each to-do carries its date in the grey line under it,
 * and "when" is a filter (`&when=`: overdue, month, soon, none) beside the
 * area filter (`&area=`, or `none` for Other). Order: overdue, then soonest,
 * then no date; what's done folded away at the foot.
 */
export default function TodoList({
  milestones,
  areas,
  area,
  when,
  today,
}: {
  milestones: Milestone[];
  areas: AreaOption[];
  area: string | null;
  when: When | null;
  today: string;
}) {
  const thisMonth = today.slice(0, 7);
  const soon = threeMonthsOn(today);
  const inArea = (key: string | null) => (area === null ? true : area === "none" ? !key || key === "other" : key === area);
  // A nudge whose month has come is "start now", never overdue (src/lib/plan.ts).
  const isOverdue = (m: Milestone) => !isNudge(m) && !!m.due_date && m.due_date < today;
  const isWhen = (m: Milestone) => {
    const date = planDate(m);
    if (when === "overdue") return isOverdue(m);
    if (when === "none") return !date;
    if (!date || isOverdue(m)) return false;
    if (when === "month") return date.slice(0, 7) <= thisMonth;
    if (when === "soon") return date < soon;
    return true;
  };

  const shown = milestones.filter((m) => inArea(m.category));
  const open = shown
    .filter(isOpen)
    .filter((m) => when === null || isWhen(m))
    .sort(
      (a, b) =>
        Number(isOverdue(b)) - Number(isOverdue(a)) || (planDate(a) ?? "9999").localeCompare(planDate(b) ?? "9999"),
    );
  const done = shown.filter((m) => !isOpen(m)).sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  const areaLabel = area === "none" ? "other" : area ? (areaName(area, areas) ?? area) : null;
  const whenLabel = WHEN_CHOICES.find(([key]) => key === when)?.[1].toLowerCase();
  const param = (key: string, value: string | null) => (value ? `&${key}=${encodeURIComponent(value)}` : "");

  return (
    <FoldGroup initiallyOpen={[]}>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[26px] leading-tight text-ink">
          {open.length} <span className="font-light italic text-champagne-600">to do</span>
        </h2>
        <div className="flex gap-2">
          <WhenFilter current={when} base={`/plan?view=list${param("area", area)}`} />
          <AreaFilter areas={areas} current={area} base={`/plan?view=list${param("when", when)}`} />
        </div>
      </div>

      {open.length === 0 ? (
        <p className="mt-6 font-display text-xl italic text-ink">
          {milestones.length === 0
            ? "Nothing to do yet."
            : areaLabel || whenLabel
              ? `Nothing to do${areaLabel ? ` for ${areaLabel}` : ""}${whenLabel ? ` · ${whenLabel}` : ""}.`
              : "Everything's done. Lovely."}
          {area && area !== "none" && (
            <Link
              href={`/plan/new?area=${encodeURIComponent(area)}`}
              className="mt-2 block font-body text-sm not-italic text-champagne-600 hover:text-ink"
            >
              + Add a to-do for {areaLabel}
            </Link>
          )}
        </p>
      ) : (
        <ul className="glass-card mt-4 overflow-hidden rounded-[22px] px-[18px] py-1 [--row-bleed:18px]">
          {open.map((m) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              overdue={isOverdue(m)}
              area={area && area !== "none" ? null : areaName(m.category, areas)}
              showNoDate
            />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <Fold
          id="list-done"
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
