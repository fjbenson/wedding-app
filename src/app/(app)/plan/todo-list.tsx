import Link from "next/link";
import { areaName, type AreaOption } from "@/lib/areas";
import { formatMonthYear } from "@/lib/dates";
import { isNudge, planDate } from "@/lib/plan";
import type { Appointment, Milestone } from "@/types/db";
import { AppointmentRow } from "./appointment-row";
import AreaFilter from "./area-filter";
import { Fold, FoldGroup } from "./fold";
import { MilestoneRow, isOpen } from "./milestone-row";

type Item = { kind: "todo"; date: string | null; m: Milestone } | { kind: "appointment"; date: string; a: Appointment };

/** "2 to-dos · 1 appointment", leaving out whichever there are none of. */
function countLabel(items: Item[]) {
  const todos = items.filter((i) => i.kind === "todo").length;
  const appts = items.length - todos;
  const parts = [
    todos > 0 && (todos === 1 ? "1 to-do" : `${todos} to-dos`),
    appts > 0 && (appts === 1 ? "1 appointment" : `${appts} appointments`),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Nothing";
}

/**
 * Plan's List (`?view=list`, owner's call 11 Oct 2026): to-dos and
 * appointments — everything Plan holds, as the Calendar and an area page's
 * Plan section do (12 Oct 2026; payments live in Money) — as a glass card per
 * month: Overdue first, then each month in turn, then No date yet (#no-date,
 * which the calendar links to), and what's done folded away at the foot. An
 * area filter at the top (`&area=`, or `none` for untagged) stands in for the
 * old "By area" view.
 */
export default function TodoList({
  milestones,
  appointments,
  suppliers,
  areas,
  area,
  today,
}: {
  milestones: Milestone[];
  appointments: Appointment[];
  suppliers: { id: string; name: string; area: string | null }[];
  areas: AreaOption[];
  area: string | null;
  today: string;
}) {
  const thisMonth = today.slice(0, 7);
  const inArea = (key: string | null) => (area === null ? true : area === "none" ? !key || key === "other" : key === area);
  const supplier = (id: string | null) => suppliers.find((s) => s.id === id);
  // An appointment with a supplier belongs to the supplier's area if it wasn't tagged (as on the area page).
  const appointmentArea = (a: Appointment) => a.area_key ?? supplier(a.contact_id)?.area ?? null;

  const shown = milestones.filter((m) => inArea(m.category));
  const shownAppts = appointments.filter((a) => inArea(appointmentArea(a)));
  const open: Item[] = [
    ...shown.filter(isOpen).map((m) => ({ kind: "todo" as const, date: planDate(m), m })),
    ...shownAppts.filter((a) => a.on_date >= today).map((a) => ({ kind: "appointment" as const, date: a.on_date, a })),
  ].sort(
    (x, y) =>
      (x.date ?? "9999").localeCompare(y.date ?? "9999") ||
      (x.kind === y.kind ? (x.kind === "appointment" && y.kind === "appointment" ? (x.a.at_time ?? "").localeCompare(y.a.at_time ?? "") : 0) : x.kind === "appointment" ? -1 : 1),
  );
  const doneTodos = shown.filter((m) => !isOpen(m)).sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  const been = shownAppts.filter((a) => a.on_date < today).sort((a, b) => b.on_date.localeCompare(a.on_date));

  // A nudge whose month has come is "start now" (this month), never overdue (src/lib/plan.ts).
  const isOverdue = (i: Item) => i.kind === "todo" && !isNudge(i.m) && !!i.m.due_date && i.m.due_date < today;
  const overdue = open.filter(isOverdue);
  const months = new Map<string, Item[]>();
  for (const i of open) {
    if (!i.date || isOverdue(i)) continue;
    const key = i.date.slice(0, 7) < thisMonth ? thisMonth : i.date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), i]);
  }
  const undated = open.filter((i) => !i.date);

  const cards: { id: string; title: React.ReactNode; note?: string; items: Item[]; overdue?: boolean }[] = [
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
        <h2 className="section-label">{countLabel(open)}</h2>
        <AreaFilter areas={areas} current={area} />
      </div>

      {open.length === 0 && (
        <p className="mt-6 font-display text-xl italic text-ink">
          {milestones.length === 0 && appointments.length === 0
            ? "Nothing planned yet."
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
              {/* "3 to-dos", not a bare number (owner, 12 Oct 2026). */}
              {countLabel(card.items)}
            </span>
          </div>
          <ul className="glass-card mt-2.5 overflow-hidden rounded-[22px] px-[18px] py-1 [--row-bleed:18px]">
            {card.items.map((i) =>
              i.kind === "todo" ? (
                <MilestoneRow
                  key={i.m.id}
                  milestone={i.m}
                  overdue={!!card.overdue}
                  area={area && area !== "none" ? null : areaName(i.m.category, areas)}
                />
              ) : (
                <AppointmentRow
                  key={i.a.id}
                  appointment={i.a}
                  been={false}
                  supplier={supplier(i.a.contact_id)?.name}
                  area={area && area !== "none" ? null : areaName(appointmentArea(i.a), areas)}
                />
              ),
            )}
          </ul>
        </section>
      ))}

      {doneTodos.length + been.length > 0 && (
        <Fold
          id="list-done"
          className="mt-10 border-t border-linen pt-4"
          header={
            <span className="flex items-baseline justify-between gap-3">
              <span className="section-label">Done</span>
              <span className="type-meta">{doneTodos.length + been.length}</span>
            </span>
          }
        >
          <ul className="mt-1">
            {doneTodos.map((m) => (
              <MilestoneRow key={m.id} milestone={m} overdue={false} area={areaName(m.category, areas)} />
            ))}
            {been.map((a) => (
              <AppointmentRow key={a.id} appointment={a} been supplier={supplier(a.contact_id)?.name} area={areaName(appointmentArea(a), areas)} />
            ))}
          </ul>
        </Fold>
      )}
    </FoldGroup>
  );
}
