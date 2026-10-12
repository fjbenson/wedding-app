import PageTitle from "@/components/page-title";
import Link from "next/link";
import { Plus } from "lucide-react";
import StarterPlanCard from "@/components/starter-plan-card";
import CornerSwitch from "@/components/corner-switch";
import type { AreaOption } from "@/lib/areas";
import { todayISO } from "@/lib/dates";
import type { Appointment, Milestone } from "@/types/db";
import Agenda from "./agenda";
import TodoList from "./todo-list";
import type { When } from "./when";

/**
 * The Plan tab (docs/information-architecture.md): two views, owner's call
 * 11 Oct 2026 —
 *
 * - Calendar (the default): to-dos and appointments as dots on their days
 *   (payments live in Money only, owner, 12 Oct 2026). agenda.tsx + calendar.tsx.
 * - List (`?view=list`): a To-dos | Appointments switch (`&kind=appointments`);
 *   to-dos as one checklist, appointments in date order, both with when
 *   (`&when=`) and area (`&area=`) filters (12 Oct 2026).
 *   todo-list.tsx.
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
  kind,
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
  /** What the List lists (`&kind=appointments`), to-dos by default. */
  kind: "todos" | "appointments";
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

      {/* One way in (owner, 12 Oct 2026): a round black + like People's,
          opening one form with a To-do | Appointment switch. On the List,
          the switch for what it lists sits beside it. */}
      <div className="mt-5 flex items-center justify-between gap-3">
        {view === "list" ? (
          <div role="tablist" aria-label="List" className="grid grid-cols-2 rounded-full bg-cream p-[3px]">
            {(
              [
                ["todos", "To-dos"],
                ["appointments", "Appointments"],
              ] as const
            ).map(([k, label]) => (
              <Link
                key={k}
                role="tab"
                aria-selected={kind === k}
                href={`/plan?view=list${k === "appointments" ? "&kind=appointments" : ""}${area ? `&area=${encodeURIComponent(area)}` : ""}`}
                className={`flex h-9 items-center justify-center rounded-full px-4 text-[13px] transition ${
                  kind === k ? "bg-white text-ink shadow-[0_1px_4px_rgb(60_50_40/0.14)]" : "text-stone hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        ) : (
          <span />
        )}
        <Link
          href={view === "list" && kind === "appointments" ? "/plan/appointments/new" : "/plan/new"}
          aria-label="Add to the plan"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-ivory shadow-[0_10px_24px_-10px_rgb(30_27_24/0.6)] transition hover:bg-ink/90"
        >
          <Plus className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </Link>
      </div>

      {milestones.length === 0 && (
        <div className="mt-8">
          <StarterPlanCard returnTo="/plan" hasDate={weddingDate !== null} />
        </div>
      )}

      {view === "list" ? (
        <TodoList
          kind={kind}
          milestones={milestones}
          appointments={appointments ?? []}
          suppliers={suppliers}
          areas={areas}
          area={area}
          when={when}
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
