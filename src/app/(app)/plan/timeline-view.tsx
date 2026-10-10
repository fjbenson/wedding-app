import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import StarterPlanCard from "@/components/starter-plan-card";
import CornerSwitch from "@/components/corner-switch";
import { areaName, type AreaOption } from "@/lib/areas";
import { todayISO } from "@/lib/dates";
import { planDate } from "@/lib/plan";
import type { Appointment, Milestone, Payment } from "@/types/db";
import Agenda from "./agenda";
import { Fold, FoldAll, FoldGroup } from "./fold";
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
  as,
}: {
  milestones: Milestone[];
  /** null until 0007_appointments.sql has been run. */
  appointments: Appointment[] | null;
  payments: Payment[];
  suppliers: { id: string; name: string }[];
  weddingDate: string | null;
  areas: AreaOption[];
  view: "agenda" | "area";
  /** By date opens on the calendar; `?as=list` shows the list. */
  as: "calendar" | "list";
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
          as={as}
        />
      )}
    </main>
  );
}

/**
 * By area (screen 18), in the By date list's style: one fold per area in
 * the wedding's own order — the name, a pill ("3 items", "1 of 3 done",
 * "All done"), a one-line summary while closed — then any to-dos tagged
 * with an area that's switched off (or an older "Guests" tag), then the
 * untagged. Inside: what's left by date, what's done crossed out below, a
 * way to add one, and a link to the area's own page. An empty area still
 * shows, with "Add a to-do" that pre-picks it.
 */
function ByArea({ milestones, areas, today }: { milestones: Milestone[]; areas: AreaOption[]; today: string }) {
  const byPlanDate = (a: Milestone, b: Milestone) => (planDate(a) ?? "9999").localeCompare(planDate(b) ?? "9999");
  const inOrder = (items: Milestone[]) => [...items.filter(isOpen).sort(byPlanDate), ...items.filter((m) => !isOpen(m))];
  const known = new Set(areas.map((a) => a.key));
  const others = [...new Set(milestones.map((m) => m.category).filter((c): c is string => !!c && !known.has(c)))];

  const groups = [
    ...areas.map((a) => ({ key: a.key, title: a.label, isArea: true })),
    ...others.map((key) => ({ key, title: areaName(key, areas) ?? key, isArea: false })),
  ].map((g) => ({ ...g, items: inOrder(milestones.filter((m) => m.category === g.key)) }));
  const untagged = inOrder(milestones.filter((m) => !m.category));
  if (untagged.length > 0) groups.push({ key: "", title: "No particular area", isArea: false, items: untagged });

  const ids = groups.filter((g) => g.items.length > 0).map((g) => `a-${g.key}`);

  return (
    <FoldGroup initiallyOpen={[]}>
      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="section-label">Every area</h2>
        <FoldAll ids={ids} />
      </div>
      <ul className="mt-1">
        {groups.map((group) => {
          const n = group.items.length;
          const done = group.items.filter((m) => !isOpen(m)).length;
          const left = group.items.filter(isOpen);
          const heading = <span className={`font-display text-xl ${n ? "text-ink" : "text-stone"}`}>{group.title}</span>;
          return (
            <li key={group.key || "untagged"} className="border-b border-linen py-3.5 last:border-b-0">
              {n === 0 ? (
                <div className="flex items-baseline justify-between gap-3">
                  {heading}
                  <Link
                    href={`/plan/new?area=${encodeURIComponent(group.key)}`}
                    className="shrink-0 text-sm text-champagne-600 hover:text-ink"
                  >
                    + Add a to-do
                  </Link>
                </div>
              ) : (
                <Fold
                  id={`a-${group.key}`}
                  header={
                    <span className="flex items-start justify-between gap-3">
                      {heading}
                      <span className="mt-0.5 inline-flex h-[26px] shrink-0 items-center rounded-full bg-champagne-100 px-3 text-[13px] font-medium text-champagne-600">
                        {done === n ? "All done" : done > 0 ? `${done} of ${n} done` : `${n} ${n === 1 ? "item" : "items"}`}
                      </span>
                    </span>
                  }
                  closed={
                    <span className="mt-1 block text-sm leading-relaxed text-stone">
                      {left.length === 0
                        ? "All done."
                        : left.slice(0, 3).map((m) => m.title).join(" · ") + (left.length > 3 ? ` and ${left.length - 3} more` : "")}
                    </span>
                  }
                >
                  <ul className="mt-1">
                    {group.items.map((m) => (
                      <MilestoneRow key={m.id} milestone={m} overdue={isOpen(m) && !!m.due_date && m.due_date < today} />
                    ))}
                  </ul>
                  {group.isArea && (
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <Link href={`/plan/new?area=${encodeURIComponent(group.key)}`} className="py-2 text-champagne-600 hover:text-ink">
                        + Add a to-do
                      </Link>
                      <Link href={`/area/${encodeURIComponent(group.key)}`} className="py-2 text-stone hover:text-ink">
                        Open the {group.title} page ›
                      </Link>
                    </div>
                  )}
                </Fold>
              )}
            </li>
          );
        })}
      </ul>
    </FoldGroup>
  );
}
