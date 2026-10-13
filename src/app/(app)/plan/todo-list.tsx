import Link from "next/link";
import { areaFilterRows, areaName, type AreaOption } from "@/lib/areas";
import { isNudge, planDate } from "@/lib/plan";
import type { Appointment, Milestone } from "@/types/db";
import { AppointmentRow } from "./appointment-row";
import FilterMenu from "@/components/filter-menu";
import { Fold, FoldGroup } from "./fold";
import { MilestoneRow, isOpen } from "./milestone-row";
import { WHEN_CHOICES, type When } from "./when";

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
  kind,
  milestones,
  appointments,
  suppliers,
  areas,
  area,
  when,
  today,
}: {
  kind: "todos" | "appointments";
  appointments: Appointment[];
  suppliers: { id: string; name: string; area: string | null }[];
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

  if (kind === "appointments") {
    return <AppointmentList appointments={appointments} suppliers={suppliers} areas={areas} area={area} when={when} today={today} />;
  }
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

  return (
    <FoldGroup initiallyOpen={[]}>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[26px] leading-tight text-ink">
          {open.length} <span className="font-light italic text-champagne-600">to do</span>
        </h2>
      </div>
      <FilterMenu
        base="/plan?view=list"
        groups={[
          { param: "when", title: "When", current: when, rows: WHEN_CHOICES.map(([key, label]) => ({ key, label })) },
          { param: "area", title: "Area", current: area, rows: areaFilterRows(areas) },
        ]}
      />

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

/**
 * Plan's List of appointments (`&kind=appointments`, owner, 12 Oct 2026: "it'd
 * still be nice to view appointments in a list"): what's coming up in date
 * order, with the same when and area filters as the to-dos (an appointment
 * with a supplier belongs to the supplier's area if it wasn't tagged), and
 * the ones that have been folded at the foot.
 */
function AppointmentList({
  appointments,
  suppliers,
  areas,
  area,
  when,
  today,
}: {
  appointments: Appointment[];
  suppliers: { id: string; name: string; area: string | null }[];
  areas: AreaOption[];
  area: string | null;
  when: When | null;
  today: string;
}) {
  const thisMonth = today.slice(0, 7);
  const soon = threeMonthsOn(today);
  const supplier = (id: string | null) => suppliers.find((s) => s.id === id);
  const areaOf = (a: Appointment) => a.area_key ?? supplier(a.contact_id)?.area ?? null;
  const inArea = (key: string | null) => (area === null ? true : area === "none" ? !key || key === "other" : key === area);
  const isWhen = (a: Appointment) =>
    when === "month" ? a.on_date.slice(0, 7) === thisMonth : when === "soon" ? a.on_date < soon : true;

  const shown = appointments.filter((a) => inArea(areaOf(a)));
  const byTime = (x: Appointment, y: Appointment) => x.on_date.localeCompare(y.on_date) || (x.at_time ?? "").localeCompare(y.at_time ?? "");
  const coming = shown.filter((a) => a.on_date >= today && isWhen(a)).sort(byTime);
  const been = shown.filter((a) => a.on_date < today).sort((x, y) => byTime(y, x));
  const areaLabel = area === "none" ? "other" : area ? (areaName(area, areas) ?? area) : null;
  const base = "/plan?view=list&kind=appointments";

  return (
    <FoldGroup initiallyOpen={[]}>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[26px] leading-tight text-ink">
          {coming.length} <span className="font-light italic text-champagne-600">coming up</span>
        </h2>
      </div>
      <FilterMenu
        base={base}
        groups={[
          {
            param: "when",
            title: "When",
            current: when === "month" || when === "soon" ? when : null,
            rows: WHEN_CHOICES.filter(([k]) => k === "month" || k === "soon").map(([key, label]) => ({ key, label })),
          },
          { param: "area", title: "Area", current: area, rows: areaFilterRows(areas) },
        ]}
      />

      {coming.length === 0 ? (
        <p className="mt-6 font-display text-xl italic text-ink">
          {appointments.length === 0 ? "No appointments yet." : `Nothing coming up${areaLabel ? ` for ${areaLabel}` : ""}.`}
        </p>
      ) : (
        <ul className="glass-card mt-4 overflow-hidden rounded-[22px] px-[18px] py-1 [--row-bleed:18px]">
          {coming.map((a) => (
            <AppointmentRow
              key={a.id}
              appointment={a}
              been={false}
              supplier={supplier(a.contact_id)?.name}
              area={area && area !== "none" ? null : areaName(areaOf(a), areas)}
            />
          ))}
        </ul>
      )}

      {been.length > 0 && (
        <Fold
          id="list-been"
          className="mt-10 border-t border-linen pt-4"
          header={
            <span className="flex items-baseline justify-between gap-3">
              <span className="section-label">Been</span>
              <span className="type-meta">{been.length}</span>
            </span>
          }
        >
          <ul className="mt-1">
            {been.map((a) => (
              <AppointmentRow key={a.id} appointment={a} been supplier={supplier(a.contact_id)?.name} area={areaName(areaOf(a), areas)} />
            ))}
          </ul>
        </Fold>
      )}
    </FoldGroup>
  );
}
