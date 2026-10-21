"use client";

import type { HTMLAttributes } from "react";
import { GripVertical, House, Minus, Plus, UsersRound, WheatOff } from "lucide-react";
import type { TableShape } from "@/types/db";

/** What a hand is holding while it drags across to the floor plan. */
export type DragPayload =
  | { kind: "guest"; id: string; label: string }
  | { kind: "group"; id: string; label: string }
  | { kind: "table"; shape: TableShape; label: string };

type PointerHandlers = Pick<
  HTMLAttributes<HTMLElement>,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel" | "onClick"
>;

const SHAPES: { shape: TableShape; label: string }[] = [
  { shape: "round", label: "Round" },
  { shape: "long", label: "Long" },
  { shape: "top", label: "Top table" },
];

/** A table drawn small, in the panel's own line weight. */
function ShapeIcon({ shape, size = 16 }: { shape: TableShape; size?: number }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 44 36" aria-hidden className="shrink-0 text-champagne-600">
      {shape === "round" && <circle cx="22" cy="18" r="11" {...stroke} />}
      {shape === "long" && <rect x="4" y="12" width="36" height="12" rx="3" {...stroke} />}
      {shape === "top" && (
        <>
          <rect x="4" y="16" width="36" height="9" rx="2" {...stroke} />
          <path d="M8 9h28" {...stroke} strokeLinecap="round" strokeDasharray="1 5" />
        </>
      )}
    </svg>
  );
}

/**
 * The laptop's control panel beside the floor plan (canvas 4 "Laptop · Round
 * 11 · Seating", A, owner's pick 21 Oct 2026): add a table without a pop-up,
 * then who is still to seat, then the tables. The tiles and names drag onto
 * the plan; tapping one still works, the same as on a phone.
 */
export default function FloorPlanPanel({
  tables,
  unseated,
  parties,
  needs,
  selectedGuest,
  selectedGroup,
  capacity,
  onCapacity,
  drag,
  onPlace,
  onOpenTable,
  onPickGuest,
  onPickGroup,
  activeTable,
  everyoneSeated,
}: {
  tables: { id: string; name: string; shape: TableShape; capacity: number; sitting: number; diets: number }[];
  unseated: { id: string; name: string; initials: string }[];
  parties: { id: string; name: string; kind: "group" | "household"; waiting: number }[];
  needs: Record<string, string[]>;
  selectedGuest: string | null;
  selectedGroup: string | null;
  capacity: number;
  onCapacity: (n: number) => void;
  /** Gives a thing the handlers that let it be dragged (or tapped, for the click). */
  drag: (payload: DragPayload, onClick: () => void) => PointerHandlers;
  onPlace: (shape: TableShape) => void;
  onOpenTable: (id: string) => void;
  /** A name or group tapped rather than dragged: it waits for a tap on a table. */
  onPickGuest: (id: string) => void;
  onPickGroup: (id: string) => void;
  activeTable: string | null;
  everyoneSeated: boolean;
}) {
  return (
    <aside aria-label="Seating controls" className="glass-card hidden rounded-[18px] p-2.5 lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-3rem)] lg:flex-col">
      <div className="px-2.5 pb-2 pt-1.5">
        <p className="label">Add a table</p>
      </div>
      <div className="flex gap-2 px-1.5">
        {SHAPES.map((s) => (
          <button
            key={s.shape}
            type="button"
            {...drag({ kind: "table", shape: s.shape, label: s.label }, () => onPlace(s.shape))}
            className="flex flex-1 cursor-grab touch-none select-none flex-col items-center gap-0.5 rounded-2xl border border-linen bg-white px-1 pb-2 pt-2.5 text-[14px] text-ink transition hover:border-champagne-400"
          >
            <ShapeIcon shape={s.shape} size={44} />
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between px-2.5 pb-1 pt-3 text-[14px] text-stone">
        Chairs
        <span className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Fewer chairs"
            onClick={() => onCapacity(Math.max(1, capacity - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-linen bg-white text-ink hover:border-champagne-400"
          >
            <Minus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
          <span className="min-w-5 text-center text-[16px] tabular-nums text-ink">{capacity}</span>
          <button
            type="button"
            aria-label="More chairs"
            onClick={() => onCapacity(Math.min(40, capacity + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-linen bg-white text-ink hover:border-champagne-400"
          >
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
        </span>
      </div>

      <div className="mx-2.5 my-2 border-t border-champagne-400/50" />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="label px-2.5 pb-1.5 pt-1">{everyoneSeated ? "Still to seat" : `Still to seat · ${unseated.length}`}</p>
        {everyoneSeated || unseated.length === 0 ? (
          <p className="px-2.5 pb-2 text-sm text-stone">Everyone coming has a seat.</p>
        ) : (
          <ul className="px-0.5">
            {parties.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  aria-pressed={selectedGroup === g.id}
                  {...drag({ kind: "group", id: g.id, label: g.name }, () => onPickGroup(g.id))}
                  className={`mb-1 flex w-full cursor-grab touch-none select-none items-center gap-2.5 rounded-xl border border-dashed px-2.5 py-1.5 text-left transition ${
                    selectedGroup === g.id ? "border-champagne-600 bg-champagne-200" : "border-champagne-400 bg-champagne-100/60 hover:border-champagne-600"
                  }`}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-stone/60" aria-hidden />
                  <span aria-hidden className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white text-champagne-600">
                    {g.kind === "household" ? <House className="h-4 w-4" strokeWidth={1.6} /> : <UsersRound className="h-4 w-4" strokeWidth={1.6} />}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] leading-tight text-ink">
                    <span className="block truncate">{g.name}</span>
                    <span className="block text-xs text-stone">{g.waiting} to seat together</span>
                  </span>
                </button>
              </li>
            ))}
            {unseated.map((g) => {
              const need = needs[g.id];
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    aria-pressed={selectedGuest === g.id}
                    {...drag({ kind: "guest", id: g.id, label: g.name }, () => onPickGuest(g.id))}
                    className={`flex w-full cursor-grab touch-none select-none items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition ${
                      selectedGuest === g.id ? "bg-champagne-200 ring-1 ring-champagne-400" : "hover:bg-champagne-100/70"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-stone/60" aria-hidden />
                    <span aria-hidden className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-xs font-semibold text-champagne-600">
                      {g.initials}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{g.name}</span>
                    {need?.length ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-[#9A3F2B]">
                        <WheatOff aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                        <span className="max-w-[90px] truncate">{need.join(" · ")}</span>
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mx-2.5 my-2 border-t border-champagne-400/50" />

        <p className="label px-2.5 pb-1.5 pt-1">Tables · {tables.length}</p>
        <ul className="px-0.5 pb-1">
          {tables.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onOpenTable(t.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[15px] text-ink transition ${
                  activeTable === t.id ? "bg-champagne-200" : "hover:bg-champagne-100/70"
                }`}
              >
                <ShapeIcon shape={t.shape} />
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                {t.diets > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-[#9A3F2B]">
                    <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-[#9A3F2B]" />
                    {t.diets}
                    <span className="sr-only"> with dietary needs</span>
                  </span>
                )}
                <span className={`w-10 shrink-0 text-right text-sm tabular-nums ${t.sitting > t.capacity ? "font-medium text-champagne-600" : "text-stone"}`}>
                  {t.sitting}/{t.capacity}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
