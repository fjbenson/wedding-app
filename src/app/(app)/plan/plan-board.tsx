"use client";

import { useEffect, useState } from "react";
import { formatMonthYear, formatWeekdayDayMonth } from "@/lib/dates";
import { updatePlanFieldsAction } from "./card-actions";

export type BoardEntry = {
  key: string;
  id: string;
  /** The day it's due or happens; null for none. */
  date: string | null;
  overdue: boolean;
  /** To-dos with a real due date can be dragged to another month; appointments and nudges stay put. */
  movable: boolean;
  row: React.ReactNode;
};

type Lane = { key: string; title: string; kind: "overdue" | "month" | "none"; entries: BoardEntry[] };

const pad = (n: number) => String(n).padStart(2, "0");

/** The day a to-do takes when dropped on a month: its own day (the last day of a shorter month), never a day already gone this month. */
function landOn(month: string, from: string | null, today: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const wanted = from ? Number(from.slice(8, 10)) : 1;
  const day = Math.min(wanted, last);
  const date = `${month}-${pad(day)}`;
  return date < today ? today : date;
}

/** Same call as safely() on the guest card: a server action must never throw into React. */
async function safely(run: () => Promise<{ error?: string }>): Promise<string | null> {
  try {
    return (await run()).error ?? null;
  } catch {
    return "That didn't save. Please try again.";
  }
}

/**
 * Plan's List on a laptop as a board (owner, 24 Oct 2026, canvas 5 "Laptop ·
 * Round 26", B): Overdue first, then a column for every month from this one,
 * No date last. Drag a to-do onto another month and it takes that month,
 * keeping its day. Appointments and "start around" nudges stay where they
 * are; Overdue and No date aren't places to drop.
 */
export default function PlanBoard({
  entries,
  today,
  everyMonth,
}: {
  entries: BoardEntry[];
  today: string;
  /** No search or filter on: show empty months too, so there's somewhere to drop. */
  everyMonth: boolean;
}) {
  const [moves, setMoves] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Once the page has the new dates, our stand-ins are done with.
  const sig = entries.map((e) => `${e.key}:${e.date}`).join("|");
  useEffect(() => setMoves({}), [sig]);

  const dateOf = (e: BoardEntry) => (e.id in moves ? moves[e.id] : e.date);
  const lateNow = (e: BoardEntry) => e.overdue && !(e.id in moves);
  const thisMonth = today.slice(0, 7);

  const monthsUsed = entries.map((e) => dateOf(e)).filter((d): d is string => !!d && d >= today).map((d) => d.slice(0, 7));
  const months: string[] = [];
  const last = [thisMonth, ...monthsUsed].sort().pop()!;
  const [ly, lm] = last.split("-").map(Number);
  const [ty, tm] = thisMonth.split("-").map(Number);
  const span = Math.min(Math.max((ly - ty) * 12 + (lm - tm), everyMonth ? 2 : 0), 14);
  for (let i = 0; i <= span; i++) months.push(new Date(Date.UTC(ty, tm - 1 + i, 1)).toISOString().slice(0, 7));

  const every: Lane[] = [
    { key: "overdue", title: "Overdue", kind: "overdue", entries: entries.filter(lateNow) },
    ...months.map((m): Lane => ({
      key: m,
      title: formatMonthYear(`${m}-01`).split(" ")[0],
      kind: "month",
      entries: entries.filter((e) => !lateNow(e) && dateOf(e)?.slice(0, 7) === m),
    })),
    { key: "none", title: "No date", kind: "none", entries: entries.filter((e) => !dateOf(e)) },
  ];
  const lanes = every.filter((l) => (l.kind === "month" ? everyMonth || l.entries.length > 0 : l.entries.length > 0));

  const byId = (id: string | null) => entries.find((e) => e.id === id);
  const drop = async (month: string) => {
    const e = byId(dragging);
    setDragging(null);
    setOver(null);
    if (!e || !e.movable) return;
    const from = dateOf(e);
    const to = landOn(month, from ?? null, today);
    if (to === from) return;
    setError(null);
    setMoves((m) => ({ ...m, [e.id]: to }));
    const problem = await safely(() => updatePlanFieldsAction("todo", e.id, { due_date: to }));
    if (problem) {
      setMoves(({ [e.id]: _gone, ...rest }) => rest);
      setError(problem);
    }
  };

  const picked = byId(dragging);
  const slotDate = (month: string) => (picked ? landOn(month, dateOf(picked) ?? null, today) : null);

  return (
    <div className="mt-3">
      <div className="-mx-2 flex items-start gap-3.5 overflow-x-auto px-2 pb-4">
        {lanes.map((lane) => {
          const canDrop = lane.kind === "month" && !!picked;
          const hot = canDrop && over === lane.key;
          const slot = hot ? slotDate(lane.key) : null;
          const shown = lane.entries.filter((e) => e.id !== dragging || e.id in moves);
          const at = slot ? shown.findIndex((e) => (dateOf(e) ?? "9999") > slot) : -1;
          const stack = shown.map((e) => (
            <div
              key={e.key}
              draggable={e.movable}
              onDragStart={(ev) => {
                // The row's link would otherwise drag its address along.
                ev.dataTransfer.setData("text/plain", e.id);
                ev.dataTransfer.effectAllowed = "move";
                setDragging(e.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              className={`glass-card overflow-hidden rounded-[14px] px-3 py-0.5 [--row-bleed:12px] ${e.movable ? "cursor-grab active:cursor-grabbing" : ""} ${dragging === e.id ? "opacity-40" : ""}`}
            >
              <ul>{e.row}</ul>
            </div>
          ));
          const placeholder = slot && (
            <div key="slot" className="type-meta flex h-16 items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-champagne-400 bg-champagne-100/60 !text-champagne-600">
              Drop to make it {formatWeekdayDayMonth(slot).split(" ").slice(1).join(" ")}
            </div>
          );
          if (placeholder) stack.splice(at === -1 ? stack.length : at, 0, placeholder);
          return (
            <section
              key={lane.key}
              aria-label={lane.title}
              onDragOver={canDrop ? (ev) => { ev.preventDefault(); setOver(lane.key); } : undefined}
              onDragLeave={canDrop ? (ev) => { if (!ev.currentTarget.contains(ev.relatedTarget as Node)) setOver(null); } : undefined}
              onDrop={canDrop ? (ev) => { ev.preventDefault(); void drop(lane.key); } : undefined}
              className={`w-[272px] shrink-0 rounded-[20px] border px-2.5 pb-3 pt-3.5 transition-colors ${
                hot
                  ? "border-[#E3D3B3] bg-champagne-100/70"
                  : lane.kind === "overdue"
                    ? "border-[#E8C2B9] bg-[#FBEDEA]/65"
                    : lane.kind === "none"
                      ? "border-dashed border-[#D8C7A4] bg-white/20"
                      : "border-white/80 bg-white/40"
              }`}
            >
              <p className="flex items-baseline justify-between px-1 pb-3">
                <span className={`font-display text-[22px] font-light ${lane.kind === "overdue" ? "text-[#9A3F2B]" : "text-ink"}`}>{lane.title}</span>
                <span className="type-meta">{lane.entries.length}</span>
              </p>
              <div className="flex flex-col gap-2.5">
                {stack}
                {lane.entries.length === 0 && !placeholder && lane.kind === "month" && (
                  <p aria-hidden className="type-meta rounded-[14px] border border-dashed border-champagne-400/50 py-6 text-center !text-stone/50">
                    Nothing yet
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-[#9A3F2B]">
          {error}
        </p>
      )}
    </div>
  );
}
