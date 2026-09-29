import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import MenuBar from "@/components/menu-bar";
import StarterPlanCard from "@/components/starter-plan-card";
import { areaLabel } from "@/lib/areas";
import { formatDayMonth, formatLongDate, formatMonthYear, todayISO } from "@/lib/dates";
import type { Milestone } from "@/types/db";
import { toggleMilestoneAction } from "./actions";

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

const isOpen = (m: Milestone) => m.status === "todo" || m.status === "in_progress";

/**
 * The wedding's to-dos in date order, grouped by month like a contents page.
 * Undated ones come after the dated; done ones collect at the bottom.
 */
export default function TimelineView({
  milestones,
  weddingDate,
}: {
  milestones: Milestone[];
  weddingDate: string | null;
}) {
  const today = todayISO();
  const open = milestones.filter(isOpen);
  const done = milestones
    .filter((m) => !isOpen(m))
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  const overdue = open.filter((m) => m.due_date && m.due_date < today).length;

  // listMilestones already sorts by date with undated last.
  const groups: { key: string; title: string; items: Milestone[] }[] = [];
  for (const m of open) {
    const key = m.due_date ? m.due_date.slice(0, 7) : "undated";
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, title: m.due_date ? formatMonthYear(m.due_date) : "Whenever", items: [] };
      groups.push(group);
    }
    group.items.push(m);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 pb-28 pt-10">
      <p className="label">Timeline</p>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {milestones.length === 0 ? "Nothing planned yet." : "The plan"}
      </h1>
      <p className="mt-2 text-sm text-stone">
        {milestones.length === 0
          ? "Whatever you add here shows on your home screen too."
          : [
              plural(open.length, "to-do"),
              done.length > 0 && `${done.length} done`,
              overdue > 0 && `${overdue} overdue`,
            ]
              .filter(Boolean)
              .join(" · ")}
      </p>

      {milestones.length === 0 ? (
        <div className="mt-8">
          <StarterPlanCard returnTo="/timeline" hasDate={weddingDate !== null} />
        </div>
      ) : (
        <Link
          href="/timeline/new"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          Add a to-do
        </Link>
      )}

      <div className="mt-10 space-y-8">
        {groups.map((group, index) => (
          <section key={group.key}>
            <div className="flex items-baseline gap-3 border-b border-champagne-400 pb-2">
              <span className="font-display text-sm text-champagne-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="flex-1 text-xl text-ink">{group.title}</h2>
            </div>
            <ul>
              {group.items.map((m) => (
                <MilestoneRow key={m.id} milestone={m} overdue={!!m.due_date && m.due_date < today} />
              ))}
            </ul>
          </section>
        ))}

        {weddingDate && open.length > 0 && (
          <p className="text-center font-display text-lg italic text-champagne-600">
            {formatLongDate(weddingDate)} — the wedding
          </p>
        )}

        {done.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between border-b border-champagne-400 pb-2">
              <h2 className="text-xl text-ink">Done</h2>
              <span className="text-[10px] uppercase tracking-[0.14em] text-stone">
                {done.length}
              </span>
            </div>
            <ul>
              {done.map((m) => (
                <MilestoneRow key={m.id} milestone={m} overdue={false} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <MenuBar current="/timeline" />
    </main>
  );
}

function MilestoneRow({ milestone: m, overdue }: { milestone: Milestone; overdue: boolean }) {
  const done = !isOpen(m);
  const details = [m.due_date && formatDayMonth(m.due_date), areaLabel(m.category)].filter(Boolean);

  return (
    <li className="flex items-center gap-3 border-b border-linen last:border-b-0">
      <form action={toggleMilestoneAction.bind(null, m.id, !done)}>
        <button
          type="submit"
          aria-label={done ? `Mark "${m.title}" as not done` : `Mark "${m.title}" as done`}
          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
            done
              ? "border-ink bg-ink text-ivory"
              : "border-champagne-400 bg-white hover:bg-champagne-100"
          }`}
        >
          {done && <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />}
        </button>
      </form>

      <Link href={`/timeline/${m.id}`} className="flex flex-1 items-center gap-3 py-3 hover:bg-cream/60">
        <span className="flex-1">
          <span className={`block text-[15px] ${done ? "text-stone line-through" : "text-ink"}`}>
            {m.title}
          </span>
          {(details.length > 0 || overdue) && (
            <span className="mt-0.5 block text-xs text-stone">
              {overdue && <span className="font-medium text-champagne-600">Overdue · </span>}
              {details.join(" · ")}
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
      </Link>
    </li>
  );
}
