import Link from "next/link";
import { areaName, type AreaOption } from "@/lib/areas";
import { formatMonthYear } from "@/lib/dates";
import { isNudge, planDate } from "@/lib/plan";
import type { Milestone } from "@/types/db";
import AreaFilter from "./area-filter";
import { Fold, FoldGroup } from "./fold";
import { MilestoneRow, isOpen } from "./milestone-row";

/**
 * Plan's List (`?view=list`, owner's call 11 Oct 2026): just the to-dos — no
 * appointments or payments, which live on the Calendar — as a glass card per
 * month: Overdue first, then each month in turn, then No date yet (#no-date,
 * which the calendar links to), and what's done folded away at the foot. An
 * area filter at the top (`&area=`, or `none` for untagged) stands in for the
 * old "By area" view.
 */
export default function TodoList({
  milestones,
  areas,
  area,
  today,
}: {
  milestones: Milestone[];
  areas: AreaOption[];
  area: string | null;
  today: string;
}) {
  const thisMonth = today.slice(0, 7);
  const shown = milestones.filter((m) => (area === null ? true : area === "none" ? !m.category || m.category === "other" : m.category === area));
  const open = shown.filter(isOpen).sort((a, b) => (planDate(a) ?? "9999").localeCompare(planDate(b) ?? "9999"));
  const done = shown.filter((m) => !isOpen(m)).sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  // A nudge whose month has come is "start now" (this month), never overdue (src/lib/plan.ts).
  const overdue = open.filter((m) => !isNudge(m) && !!m.due_date && m.due_date < today);
  const months = new Map<string, Milestone[]>();
  for (const m of open) {
    const date = planDate(m);
    if (!date || overdue.includes(m)) continue;
    const key = date.slice(0, 7) < thisMonth ? thisMonth : date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), m]);
  }
  const undated = open.filter((m) => !planDate(m));

  const cards: { id: string; title: React.ReactNode; note?: string; items: Milestone[]; overdue?: boolean }[] = [
    ...(overdue.length ? [{ id: "overdue", title: "Overdue", items: overdue, overdue: true }] : []),
    ...[...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => {
        const [name, year] = formatMonthYear(`${key}-01`).split(" ");
        return {
          id: `m-${key}`,
          title: (
            <>
              {name} <span className="font-light italic text-champagne-600">{year}</span>
            </>
          ),
          note: key === thisMonth ? "This month" : undefined,
          items,
        };
      }),
    ...(undated.length ? [{ id: "no-date", title: "No date yet", items: undated }] : []),
  ];

  const areaLabel = area === "none" ? "other" : area ? (areaName(area, areas) ?? area) : null;

  return (
    <FoldGroup initiallyOpen={[]}>
      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="section-label">{open.length === 1 ? "1 to-do" : `${open.length} to-dos`}</h2>
        <AreaFilter areas={areas} current={area} />
      </div>

      {open.length === 0 && (
        <p className="mt-6 font-display text-xl italic text-ink">
          {milestones.length === 0
            ? "Nothing to do yet."
            : areaLabel
              ? `Nothing to do for ${areaLabel}.`
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
      )}

      {cards.map((card) => (
        <section key={card.id} id={card.id} className="mt-7 scroll-mt-6">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h3 className={`font-display text-[22px] leading-tight ${card.overdue ? "text-champagne-600" : "text-ink"}`}>
              {card.title}
            </h3>
            <span className="type-meta">
              {card.note ? `${card.note} · ` : ""}
              {card.items.length}
            </span>
          </div>
          <ul className="glass-card mt-2.5 overflow-hidden rounded-[22px] px-[18px] py-1 [--row-bleed:18px]">
            {card.items.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                overdue={!!card.overdue}
                area={area && area !== "none" ? null : areaName(m.category, areas)}
              />
            ))}
          </ul>
        </section>
      ))}

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
