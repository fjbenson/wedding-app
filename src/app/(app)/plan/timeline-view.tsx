import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import StarterPlanCard from "@/components/starter-plan-card";
import CornerSwitch from "@/components/corner-switch";
import { areaName, type AreaOption } from "@/lib/areas";
import { todayISO } from "@/lib/dates";
import type { Appointment, Milestone, Payment } from "@/types/db";
import Agenda from "./agenda";
import { MilestoneRow, isOpen } from "./milestone-row";

/**
 * The Plan tab (docs/information-architecture.md): two views of the run-up.
 *
 * - By date (screens 16, 17): this month on a card, then every later month
 *   on "the road to the day", the wedding at the end. To-dos (and "start
 *   around" nudges), appointments and payments due together. agenda.tsx.
 * - By area (screen 18): to-dos grouped under each of the wedding's areas.
 */
export default function TimelineView({
  milestones,
  appointments,
  payments,
  suppliers,
  weddingDate,
  areas,
  view,
}: {
  milestones: Milestone[];
  /** null until 0007_appointments.sql has been run. */
  appointments: Appointment[] | null;
  payments: Payment[];
  suppliers: { id: string; name: string }[];
  weddingDate: string | null;
  areas: AreaOption[];
  view: "agenda" | "area";
}) {
  const today = todayISO();
  const upcoming = (appointments ?? []).filter((a) => a.on_date >= today).length;
  const due = payments.filter((p) => !p.paid_on).length;
  const nothing = milestones.length === 0 && upcoming === 0 && due === 0;

  return (
    <main className="page pb-28 lg:pb-16">
      <CornerSwitch
        label="Show the plan"
        tabs={[
          { label: "By date", href: "/plan", active: view === "agenda" },
          { label: "By area", href: "/plan?view=area", active: view === "area" },
        ]}
      />
      <h1 className="type-display mt-3 text-[40px] leading-[1.05] tracking-[-0.02em]">
        {nothing ? "Nothing planned yet." : "The plan"}
      </h1>
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

      {view === "area" ? (
        <ByArea milestones={milestones} areas={areas} today={today} />
      ) : (
        <Agenda
          milestones={milestones}
          appointments={appointments}
          payments={payments}
          suppliers={suppliers}
          areas={areas}
          weddingDate={weddingDate}
          today={today}
        />
      )}
    </main>
  );
}

/**
 * By area: one group per area in the wedding's own order, then any to-dos
 * tagged with an area that's switched off (or an older "Guests" tag), then
 * the untagged. Open to-dos by date first, done ones after. An area with
 * nothing in it still shows, with a way to add its first to-do.
 */
function ByArea({ milestones, areas, today }: { milestones: Milestone[]; areas: AreaOption[]; today: string }) {
  const inOrder = (items: Milestone[]) => [...items.filter(isOpen), ...items.filter((m) => !isOpen(m))];
  const known = new Set(areas.map((a) => a.key));
  const others = [...new Set(milestones.map((m) => m.category).filter((c): c is string => !!c && !known.has(c)))];

  const groups = [
    ...areas.map((a) => ({ key: a.key, title: a.label, addable: true })),
    ...others.map((key) => ({ key, title: areaName(key, areas) ?? key, addable: false })),
  ].map((g) => ({ ...g, items: inOrder(milestones.filter((m) => m.category === g.key)) }));
  const untagged = inOrder(milestones.filter((m) => !m.category));

  return (
    <div className="mt-10 space-y-8">
      {groups.map((group, index) => {
        const open = group.items.filter(isOpen).length;
        const done = group.items.length - open;
        return (
          <section key={group.key}>
            <div className="flex items-baseline gap-3 border-b border-champagne-400 pb-2">
              <span className="font-display text-sm text-champagne-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="flex-1 text-xl text-ink">{group.title}</h2>
              {group.items.length > 0 && (
                <span className="text-xs uppercase tracking-[0.14em] text-stone">
                  {[open > 0 && `${open} to do`, done > 0 && `${done} done`].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            {group.items.length > 0 ? (
              <ul>
                {group.items.map((m) => (
                  <MilestoneRow key={m.id} milestone={m} overdue={isOpen(m) && !!m.due_date && m.due_date < today} />
                ))}
              </ul>
            ) : (
              <p className="py-3 text-sm text-stone">
                Nothing here yet.{" "}
                {group.addable && (
                  <Link
                    href={`/plan/new?area=${encodeURIComponent(group.key)}`}
                    className="text-ink underline underline-offset-4"
                  >
                    Add a to-do
                  </Link>
                )}
              </p>
            )}
          </section>
        );
      })}

      {untagged.length > 0 && (
        <section>
          <div className="flex items-baseline gap-3 border-b border-champagne-400 pb-2">
            <h2 className="flex-1 text-xl text-ink">No particular area</h2>
            <span className="text-xs uppercase tracking-[0.14em] text-stone">{untagged.length}</span>
          </div>
          <ul>
            {untagged.map((m) => (
              <MilestoneRow key={m.id} milestone={m} overdue={isOpen(m) && !!m.due_date && m.due_date < today} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
