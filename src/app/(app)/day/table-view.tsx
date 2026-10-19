"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import CardSheet from "@/components/card-sheet";
import { jumpTo } from "@/lib/jump-to";
import type { Contact, SeatingTable, TableShape } from "@/types/db";
import DietLine from "@/components/diet-line";

const ROSE = "#9A3F2B";

function fullName(g: Contact) {
  return [g.first_name, g.last_name].filter(Boolean).join(" ");
}

function initials(g: Contact) {
  return [g.first_name, g.last_name]
    .filter(Boolean)
    .map((part) => part!.trim().charAt(0).toUpperCase())
    .join("");
}

/** Where each seat sits, as % of a square box: round the table, or down both sides of a long one. */
function seatSpots(shape: TableShape, capacity: number) {
  const spots: { x: number; y: number }[] = [];
  if (shape === "long") {
    const perSide = Math.ceil(capacity / 2);
    for (let i = 0; i < capacity; i++) {
      const side = i < perSide ? 0 : 1;
      const n = side === 0 ? perSide : capacity - perSide;
      const k = side === 0 ? i : i - perSide;
      spots.push({ x: side === 0 ? 20 : 80, y: 8 + ((k + 0.5) / n) * 84 });
    }
  } else {
    for (let i = 0; i < capacity; i++) {
      const angle = (i / capacity) * 2 * Math.PI - Math.PI / 2;
      spots.push({ x: 50 + 39 * Math.cos(angle), y: 50 + 39 * Math.sin(angle) });
    }
  }
  return spots;
}

/**
 * One table, close up (canvas 3 "Seating · Round 1 · The phone", B, owner's
 * pick 19 Oct 2026): the table large, everyone's initials in their seat and
 * any dietary need written under them, free seats as a dashed +. ‹ › or a
 * swipe goes to the next table. Tap a free seat to pick who sits there; tap
 * someone to find them in the list underneath.
 *
 * Seats are slots, not numbered places: the database only knows who's at
 * which table, so people fill the seats in name order.
 */
export default function TableView({
  table,
  shape,
  position,
  guests,
  unseated,
  needs,
  onSeat,
  onUnseat,
  onShape,
  onStep,
  onClose,
}: {
  table: SeatingTable;
  shape: TableShape;
  /** "2 of 6". */
  position: { index: number; total: number };
  /** Who sits here. */
  guests: Contact[];
  /** Everyone coming who has no table yet — offered for a free seat. */
  unseated: Contact[];
  needs: Record<string, string[]>;
  onSeat: (contactId: string) => void;
  onUnseat: (contactId: string) => void;
  onShape: (shape: TableShape) => void;
  /** -1 the table before, +1 the next. */
  onStep: (by: -1 | 1) => void;
  onClose: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState("");
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const sitting = [...guests].sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }));
  const seats = Math.max(table.capacity, sitting.length);
  const spots = seatSpots(shape, seats);
  const diets = sitting.filter((g) => needs[g.id]?.length).length;
  const free = table.capacity - sitting.length;
  // Bigger tables, smaller seats, so they still fit round the edge.
  const size = seats <= 10 ? 48 : seats <= 14 ? 40 : 34;

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const choices = unseated
    .filter((g) => words.every((w) => fullName(g).toLowerCase().includes(w)))
    .sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }));

  const pick = () => {
    setQuery("");
    setPicking(true);
    window.setTimeout(() => jumpTo("table-pick"), 0);
  };

  return (
    <CardSheet
      label={table.name}
      onClose={onClose}
      top={<span className="label">{`Table ${position.index + 1} of ${position.total}`}</span>}
    >
      <div className="mt-1 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="type-display truncate text-[32px] leading-[1.05] tracking-[-0.02em]">{table.name}</h2>
          <p className="mt-1 text-[13px] text-stone">
            {sitting.length} of {table.capacity} seats · {shape}
            {diets > 0 && <span style={{ color: ROSE }}>{` · ${diets} dietary ${diets === 1 ? "need" : "needs"}`}</span>}
            {sitting.length > table.capacity && <span className="text-champagne-600"> · over</span>}
          </p>
        </div>
        {position.total > 1 && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label="The table before"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-linen bg-white text-ink hover:border-champagne-400"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="The next table"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-linen bg-white text-ink hover:border-champagne-400"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          </div>
        )}
      </div>

      {/* The table, large. A sideways swipe goes to the next one. */}
      <div
        onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s || position.total < 2) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) onStep(dx < 0 ? 1 : -1);
        }}
        className="relative mx-auto mt-5 aspect-square w-full max-w-[340px] touch-pan-y select-none"
      >
        <div
          aria-hidden
          className={`absolute flex flex-col items-center justify-center border border-champagne-400 bg-[#FFFDF8] text-center shadow-[0_18px_40px_-24px_rgb(60_50_40/0.4)] ${
            shape === "long" ? "left-[36%] top-[6%] h-[88%] w-[28%] rounded-xl" : "left-[25%] top-[25%] h-1/2 w-1/2 rounded-full"
          }`}
        >
          <span className="font-display text-[17px] italic text-ink">{table.name}</span>
          {position.total > 1 && <span className="mt-0.5 px-2 text-xs text-stone">Swipe for the next</span>}
        </div>

        {spots.map((spot, i) => {
          const g = sitting[i];
          const need = g ? needs[g.id] : undefined;
          return (
            <div
              key={g?.id ?? `free-${i}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className="absolute flex w-20 -translate-x-1/2 flex-col items-center"
            >
              {g ? (
                <button
                  type="button"
                  onClick={() => jumpTo(`seat-${g.id}`)}
                  aria-label={`${fullName(g)}${need?.length ? `, ${need.join(", ")}` : ""}`}
                  style={{ width: size, height: size, marginTop: -size / 2, ...(need?.length ? { borderColor: ROSE, color: ROSE } : {}) }}
                  className={`flex items-center justify-center rounded-full text-[15px] font-semibold ${
                    need?.length ? "border-[2.5px] bg-[#F7E3DD]" : "bg-champagne-100 text-champagne-600 shadow-[0_0_0_3px_#FFFFFF]"
                  }`}
                >
                  {initials(g)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pick}
                  aria-label="Free seat: pick who sits here"
                  style={{ width: size, height: size, marginTop: -size / 2 }}
                  className="flex items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 bg-white text-champagne-600"
                >
                  <Plus className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                </button>
              )}
              {need?.length ? (
                <span className="mt-0.5 max-w-full truncate text-[11px] font-semibold" style={{ color: ROSE }}>
                  {need.join(" · ")}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {position.total > 1 && (
        <div aria-hidden className="mt-2 flex justify-center gap-1.5">
          {Array.from({ length: Math.min(position.total, 12) }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full ${i === position.index ? "w-[18px] bg-champagne-600" : "w-1.5 bg-linen"}`} />
          ))}
        </div>
      )}

      {picking && (
        <section id="table-pick" className="mt-6 rounded-[22px] border border-linen bg-white p-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="section-label">Who sits here?</h3>
            <button type="button" onClick={() => setPicking(false)} className="text-sm text-stone underline underline-offset-4 hover:text-ink">
              Done
            </button>
          </div>
          {unseated.length === 0 ? (
            <p className="px-1 py-3 text-sm text-stone">Everyone coming has a seat.</p>
          ) : (
            <>
              <label className="mt-2 flex h-10 items-center gap-2 rounded-full border border-linen bg-ivory px-3.5">
                <Search className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a guest"
                  aria-label="Find a guest"
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
                />
              </label>
              <ul className="mt-1 max-h-72 overflow-y-auto">
                {choices.map((g) => (
                  <li key={g.id} className="border-b border-linen last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSeat(g.id);
                        if (free <= 1) setPicking(false);
                      }}
                      className="flex min-h-12 w-full items-center gap-3 px-1 py-2 text-left hover:text-champagne-600"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-ink">{fullName(g)}</span>
                        {needs[g.id]?.length ? <DietLine needs={needs[g.id]} /> : null}
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
                    </button>
                  </li>
                ))}
                {choices.length === 0 && <li className="px-1 py-3 text-sm text-stone">No one matches that.</li>}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="mt-6 -mx-[22px] border-t border-linen px-[22px] pt-5">
        <h3 className="section-label">Sitting here · {sitting.length}</h3>
        {sitting.length === 0 ? (
          <p className="mt-2 text-sm text-stone">Nobody yet. Tap a free seat to sit someone here.</p>
        ) : (
          <ul className="mt-1">
            {sitting.map((g) => {
              const need = needs[g.id];
              return (
                <li key={g.id} id={`seat-${g.id}`} className="flex items-center gap-3 rounded-lg border-b border-ink/[0.12] py-2 last:border-b-0">
                  <span
                    aria-hidden
                    style={need?.length ? { borderColor: ROSE, color: ROSE } : undefined}
                    className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      need?.length ? "border-2 bg-[#F7E3DD]" : "bg-champagne-100 text-champagne-600"
                    }`}
                  >
                    {initials(g)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-ink">
                      {fullName(g)}
                      {g.role_on_the_day && <span className="ml-2 text-xs text-champagne-600">{g.role_on_the_day}</span>}
                    </span>
                    {need?.length ? <DietLine needs={need} /> : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUnseat(g.id)}
                    aria-label={`Take ${g.first_name} off ${table.name}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-stone hover:text-ink"
                  >
                    <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {free > 0 && !picking && (
          <button type="button" onClick={pick} className="mt-1 flex min-h-12 items-center gap-3 font-display text-[15px] italic text-stone hover:text-ink">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 text-champagne-600">
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </span>
            {free === 1 ? "1 free seat" : `${free} free seats`}: sit someone here
          </button>
        )}
      </section>

      <div className="mt-6 inline-grid grid-cols-2 rounded-xl border border-linen bg-cream/60 p-1" role="group" aria-label="Table shape">
        {(["round", "long"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={shape === s}
            onClick={() => onShape(s)}
            className={`h-9 rounded-lg px-4 text-sm capitalize ${shape === s ? "bg-white text-ink shadow-[0_1px_2px_rgb(30_27_24/0.08)]" : "text-stone"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <Link href="/day?tab=seating&view=list" className="mt-3 block text-sm text-stone underline underline-offset-4 hover:text-ink">
        Rename, change seats or remove: in the list
      </Link>
    </CardSheet>
  );
}
