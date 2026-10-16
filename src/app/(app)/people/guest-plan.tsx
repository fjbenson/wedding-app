"use client";

import { useEffect, useState } from "react";
import { Calendar, Check } from "lucide-react";
import { formatDayMonth } from "@/lib/dates";
import { replaceQuery } from "@/lib/url-state";
import { guestPlanAction } from "../plan/card-actions";

type Plan = Awaited<ReturnType<typeof guestPlanAction>>;

/**
 * On a guest's card: the to-dos and appointments they're tagged on
 * (0021_involved.sql). Tapping one swaps this card for that one's. Hidden
 * when they're on nothing — they're added from the to-do's own card.
 */
export function GuestPlanSection({ guestId }: { guestId: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    let live = true;
    guestPlanAction(guestId)
      .then((p) => live && setPlan(p))
      .catch(() => live && setPlan(null));
    return () => {
      live = false;
    };
  }, [guestId]);

  if (!plan || plan.todos.length + plan.appointments.length === 0) return null;
  const open = (event: React.MouseEvent, query: Record<string, string>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    replaceQuery({ guest: null, household: null, ...query }, { sync: true });
  };
  const rows = [
    ...plan.appointments.map((a) => ({ key: `a-${a.id}`, href: `/plan/appointments/${a.id}`, query: { appointment: a.id }, title: a.title, date: a.on_date, done: false, appt: true })),
    ...plan.todos.map((t) => ({ key: `t-${t.id}`, href: `/plan/${t.id}`, query: { todo: t.id }, title: t.title, date: t.due_date, done: t.done, appt: false })),
  ];

  return (
    <section className="mt-7">
      <h3 className="section-label">In the plan</h3>
      <ul className="mt-1">
        {rows.map((r) => (
          <li key={r.key} className="border-b border-linen last:border-b-0">
            <a href={r.href} onClick={(e) => open(e, r.query)} className="row-press flex min-h-[48px] items-center gap-3 py-2.5">
              <span className={`w-14 shrink-0 text-[13px] ${r.done ? "text-stone" : "font-medium text-champagne-600"}`}>{r.date ? formatDayMonth(r.date) : "No date"}</span>
              <span className={`min-w-0 flex-1 truncate text-[15px] ${r.done ? "text-stone line-through" : "text-ink"}`}>{r.title}</span>
              <span
                aria-hidden
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
                  r.appt ? "border border-champagne-400/45 bg-champagne-100 text-champagne-600" : r.done ? "bg-champagne-600 text-white" : "border-[1.5px] border-stone/50 bg-white"
                }`}
              >
                {r.appt ? <Calendar className="h-3 w-3" strokeWidth={2} /> : r.done ? <Check className="h-3 w-3" strokeWidth={2.4} /> : null}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
