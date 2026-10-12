import PageTitle from "@/components/page-title";
import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import StarterPlanCard from "@/components/starter-plan-card";
import CornerSwitch from "@/components/corner-switch";
import type { AreaOption } from "@/lib/areas";
import { todayISO } from "@/lib/dates";
import type { Appointment, Milestone } from "@/types/db";
import Agenda from "./agenda";
import TodoList from "./todo-list";

/**
 * The Plan tab (docs/information-architecture.md): two views, owner's call
 * 11 Oct 2026 —
 *
 * - Calendar (the default): to-dos and appointments as dots on their days
 *   (payments live in Money only, owner, 12 Oct 2026). agenda.tsx + calendar.tsx.
 * - List (`?view=list`): just the to-dos, a glass card per month, with an
 *   area filter (`&area=`) in place of the old "By area" view. todo-list.tsx.
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
}: {
  milestones: Milestone[];
  /** null until 0007_appointments.sql has been run. */
  appointments: Appointment[] | null;
  suppliers: { id: string; name: string }[];
  weddingDate: string | null;
  areas: AreaOption[];
  view: "calendar" | "list";
  /** The List's area filter: an area's key, or null for all. */
  area: string | null;
}) {
  const today = todayISO();
  const upcoming = (appointments ?? []).filter((a) => a.on_date >= today).length;
  const nothing = milestones.length === 0 && upcoming === 0;

  return (
    <main className="page pb-28 lg:pb-16">
      <CornerSwitch
        label="Show the plan"
        tabs={[
          { label: "Calendar", href: "/plan", active: view === "calendar" },
          { label: "List", href: "/plan?view=list", active: view === "list" },
        ]}
      />
      <PageTitle drawing="plan" spacing="mt-3" className="type-display text-[40px] leading-[1.05] tracking-[-0.02em]">
        {nothing ? "Nothing planned yet." : "The plan"}
      </PageTitle>
      {nothing && (
        <p className="mt-2 text-sm text-stone">Whatever you add here shows on your home screen too.</p>
      )}

      {/* The two ways in, side by side (owner's ask, Plan round 3). */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 lg:max-w-md">
        <Link
          href="/plan/new"
          className="flex h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-ink px-2 text-sm text-ivory transition hover:bg-ink/90"
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
          Add a to-do
        </Link>
        <Link
          href="/plan/appointments/new"
          className="flex h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border border-champagne-400/70 bg-white px-2 text-sm text-ink transition hover:bg-champagne-100"
        >
          <CalendarClock className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
          Add an appointment
        </Link>
      </div>

      {milestones.length === 0 && (
        <div className="mt-8">
          <StarterPlanCard returnTo="/plan" hasDate={weddingDate !== null} />
        </div>
      )}

      {view === "list" ? (
        <TodoList milestones={milestones} areas={areas} area={area} today={today} />
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
