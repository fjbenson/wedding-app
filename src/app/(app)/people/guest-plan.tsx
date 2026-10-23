"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, CircleCheck, Clock, Palette, PoundSterling, type LucideIcon } from "lucide-react";
import { formatClock, formatDayMonth } from "@/lib/dates";
import { replaceQuery } from "@/lib/url-state";
import { guestPlanAction } from "../plan/card-actions";

export type InvolvedRow = {
  key: string;
  icon: LucideIcon;
  title: string;
  /** "To-do · due 3 Dec". */
  line: string;
  done: boolean;
  /** The card to swap this one for (`?todo=` …); Decor has none here, so it links to its page. */
  query?: Record<string, string>;
  href: string;
};

/**
 * Everything a guest is on, for the "Involved in" fold of their card (owner,
 * 23 Oct 2026): to-dos and appointments they're tagged on, payments they're
 * paying, Decor they set up and moments they're in charge of
 * (0021_involved.sql, 0023, 0027, 0031). Null until loaded; empty when they're
 * on nothing, and the fold is left out.
 */
export function useGuestInvolvement(guestId: string): InvolvedRow[] | null {
  const [rows, setRows] = useState<InvolvedRow[] | null>(null);
  useEffect(() => {
    let live = true;
    guestPlanAction(guestId)
      .then((p) => {
        if (!live) return;
        setRows([
          ...p.todos.map((t) => ({
            key: `t-${t.id}`,
            icon: CircleCheck,
            title: t.title,
            line: `To-do · ${t.done ? "done" : t.due_date ? `due ${formatDayMonth(t.due_date)}` : "no date"}`,
            done: t.done,
            query: { todo: t.id },
            href: `/plan/${t.id}`,
          })),
          ...p.appointments.map((a) => ({
            key: `a-${a.id}`,
            icon: Calendar,
            title: a.title,
            line: `Appointment · ${formatDayMonth(a.on_date)}`,
            done: false,
            query: { appointment: a.id },
            href: `/plan/appointments/${a.id}`,
          })),
          ...p.payments.map((m) => ({
            key: `p-${m.id}`,
            icon: PoundSterling,
            title: m.description,
            line: `Paying · ${m.paid_on ? `paid ${formatDayMonth(m.paid_on)}` : m.due_date ? `due ${formatDayMonth(m.due_date)}` : "no date"}`,
            done: !!m.paid_on,
            query: { payment: m.id },
            href: `/money/payments/${m.id}`,
          })),
          ...p.decor.map((d) => ({
            key: `d-${d.id}`,
            icon: Palette,
            title: d.name,
            line: `Sets up · ${d.place ?? "Decor"}`,
            done: false,
            href: `/day/decor?thing=${d.id}`,
          })),
          ...p.moments.map((m) => ({
            key: `m-${m.id}`,
            icon: Clock,
            title: m.title,
            line: `In charge · ${formatClock(m.at_time)} on the day`,
            done: false,
            query: { moment: m.id },
            href: `/day/run-sheet/${m.id}`,
          })),
        ]);
      })
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [guestId]);
  return rows;
}

/** The rows themselves: tapping one swaps this card for that one's (or goes to Decor's page). */
export function InvolvedRows({ rows }: { rows: InvolvedRow[] }) {
  const router = useRouter();
  const open = (event: React.MouseEvent, r: InvolvedRow) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    if (r.query) replaceQuery({ guest: null, household: null, ...r.query }, { sync: true });
    else router.push(r.href);
  };
  return (
    <ul>
      {rows.map((r) => (
        <li key={r.key} className="border-b border-linen last:border-b-0">
          <a href={r.href} onClick={(e) => open(e, r)} className="row-press flex min-h-[56px] items-center gap-3 py-2">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
              <r.icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-[15px] ${r.done ? "text-stone line-through" : "text-ink"}`}>{r.title}</span>
              <span className="block truncate text-[12px] text-stone">{r.line}</span>
            </span>
            {r.done && <Check className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={2.2} aria-hidden />}
          </a>
        </li>
      ))}
    </ul>
  );
}
