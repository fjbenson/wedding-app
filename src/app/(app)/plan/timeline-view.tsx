import PageTitle from "@/components/page-title";
import StarterPlanCard from "@/components/starter-plan-card";
import CornerSwitch from "@/components/corner-switch";
import type { AreaOption } from "@/lib/areas";
import { todayISO } from "@/lib/dates";
import type { Appointment, Milestone } from "@/types/db";
import Agenda from "./agenda";
import PlanList from "./plan-list";
import type { When } from "./when";

/**
 * The Plan tab (docs/information-architecture.md): two views, owner's call
 * 11 Oct 2026 —
 *
 * - Calendar (the default): to-dos and appointments as dots on their days
 *   (payments live in Money only, owner, 12 Oct 2026). agenda.tsx + calendar.tsx.
 * - List (`?view=list`): search and + on one row, then Filter and Sort, then
 *   to-dos and appointments in one list (16 Oct 2026; plan-list.tsx).
 *
 * The old list ("the road to the day": a gold line with a dot per month) is
 * kept in mind for The Day's run sheet rather than Plan (docs/DESIGN.md).
 */
export default function TimelineView({
  milestones,
  appointments,
  suppliers,
  weddingDate,
  areas,
  view,
  area,
  when,
  show,
  query,
}: {
  milestones: Milestone[];
  /** null until 0007_appointments.sql has been run. */
  appointments: Appointment[] | null;
  suppliers: { id: string; name: string; area: string | null }[];
  weddingDate: string | null;
  areas: AreaOption[];
  view: "calendar" | "list";
  /** The List's area filter: an area's key, or null for all. */
  area: string | null;
  /** The List's when filter. */
  when: When | null;
  /** The List's Show filter (`&show=`): to-dos, appointments, or both (null). */
  show: "todos" | "appointments" | null;
  /** The List's search (`&q=`). */
  query: string;
}) {
  const today = todayISO();
  const upcoming = (appointments ?? []).filter((a) => a.on_date >= today).length;
  const nothing = milestones.length === 0 && upcoming === 0;

  return (
    // Laptops: the calendar uses the width (calendar beside the month's list); the List stays a comfortable column.
    <main className={`page pb-40 lg:pb-16 ${view === "calendar" ? "lg:max-w-[1640px] lg:px-12" : "lg:max-w-[1180px]"}`}>
      <CornerSwitch
        label="Show the plan"
        tabs={[
          { label: "Calendar", href: "/plan", active: view === "calendar" },
          { label: "List", href: "/plan?view=list", active: view === "list" },
        ]}
      />
      <PageTitle drawing="plan" className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">
        {nothing ? "Nothing planned yet." : "The plan"}
      </PageTitle>
      {nothing && (
        <p className="mt-2 text-sm text-stone">Whatever you add here shows on your home screen too.</p>
      )}

      {milestones.length === 0 && (
        <div className="mt-8">
          <StarterPlanCard returnTo="/plan" hasDate={weddingDate !== null} />
        </div>
      )}

      {view === "list" ? (
        <PlanList
          milestones={milestones}
          appointments={appointments ?? []}
          suppliers={suppliers}
          areas={areas}
          area={area}
          when={when}
          show={show}
          initialQuery={query}
          today={today}
        />
      ) : (
        <Agenda
          milestones={milestones}
          appointments={appointments}
          suppliers={suppliers}
          areas={areas}
          weddingDate={weddingDate}
          today={today}
        />
      )}
    </main>
  );
}
