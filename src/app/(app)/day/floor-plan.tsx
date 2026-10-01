"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Contact, Seat, SeatingTable, TableShape } from "@/types/db";
import { moveTableAction, seatOnPlanAction, setTableShapeAction, unseatOnPlanAction } from "./actions";

type Point = { x: number; y: number };

function fullName(g: Contact) {
  return [g.first_name, g.last_name].filter(Boolean).join(" ");
}

/** Where a never-moved table stands: a tidy grid, four across. */
function defaultSpot(index: number): Point {
  return { x: 12.5 + (index % 4) * 25, y: Math.min(90, 14 + Math.floor(index / 4) * 24) };
}

/** Table size as a % of the room's width — bigger tables look bigger. */
function tableSize(shape: TableShape, capacity: number) {
  if (shape === "long") {
    const width = Math.max(16, Math.min(36, 6 + capacity * 1.8));
    return { width, aspect: width / 8 };
  }
  const width = Math.max(11, Math.min(18, 9 + capacity * 0.6));
  return { width, aspect: 1 };
}

/** The little seat dots: round the edge of a round table, down both sides of a long one. */
function seatDots(shape: TableShape, capacity: number) {
  const dots: Point[] = [];
  if (shape === "long") {
    const perSide = Math.ceil(capacity / 2);
    for (let i = 0; i < capacity; i++) {
      const side = i < perSide ? 0 : 1;
      const n = side === 0 ? perSide : capacity - perSide;
      const k = side === 0 ? i : i - perSide;
      dots.push({ x: ((k + 0.5) / n) * 100, y: side === 0 ? -22 : 122 });
    }
  } else {
    for (let i = 0; i < capacity; i++) {
      const angle = (i / capacity) * 2 * Math.PI - Math.PI / 2;
      dots.push({ x: 50 + 62 * Math.cos(angle), y: 50 + 62 * Math.sin(angle) });
    }
  }
  return dots;
}

/**
 * The seating floor plan (screen 26). Tables are dragged about a room; on a
 * phone the room scrolls sideways rather than shrinking past readable.
 * Guests are seated by tapping their name, then a table — the same on a
 * phone and a laptop, and far kinder to thumbs than dragging a name.
 *
 * Everything changes on screen first; the save follows behind and only
 * speaks up if it fails.
 */
export default function FloorPlan({
  tables,
  seats,
  guests,
}: {
  tables: SeatingTable[];
  seats: Seat[];
  /** Everyone who's coming (or hasn't said they aren't). */
  guests: Contact[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const roomRef = useRef<HTMLDivElement>(null);

  const [spots, setSpots] = useState<Record<string, Point>>({});
  const [shapes, setShapes] = useState<Record<string, TableShape>>({});
  const [tableOf, setTableOf] = useState<Map<string, string>>(new Map());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** The table under a finger right now — drawn on top of the others. */
  const [lifted, setLifted] = useState<string | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; startX: number; startY: number; moved: boolean } | null>(null);

  // Take the server's word whenever fresh data arrives.
  useEffect(() => {
    setSpots(
      Object.fromEntries(
        tables.map((t, i) => [t.id, t.pos_x != null && t.pos_y != null ? { x: t.pos_x, y: t.pos_y } : defaultSpot(i)]),
      ),
    );
    setShapes(Object.fromEntries(tables.map((t) => [t.id, t.shape ?? "round"])));
  }, [tables]);
  useEffect(() => setTableOf(new Map(seats.map((s) => [s.contact_id, s.table_id]))), [seats]);

  function save(action: () => Promise<string | null>) {
    startTransition(async () => {
      const message = await action();
      setError(message);
      if (message) router.refresh();
    });
  }

  const unseated = guests.filter((g) => !tableOf.has(g.id));
  const atTable = (id: string) => guests.filter((g) => tableOf.get(g.id) === id);

  function seat(contactId: string, tableId: string) {
    setTableOf((m) => new Map(m).set(contactId, tableId));
    setSelectedGuest(null);
    setSelectedTable(tableId);
    save(() => seatOnPlanAction(contactId, tableId));
  }

  function unseat(contactId: string) {
    setTableOf((m) => {
      const next = new Map(m);
      next.delete(contactId);
      return next;
    });
    save(() => unseatOnPlanAction(contactId));
  }

  function tapTable(id: string) {
    if (selectedGuest) seat(selectedGuest, id);
    else setSelectedTable((current) => (current === id ? null : id));
  }

  function pointAt(clientX: number, clientY: number): Point | null {
    const room = roomRef.current?.getBoundingClientRect();
    if (!room) return null;
    return { x: ((clientX - room.left) / room.width) * 100, y: ((clientY - room.top) / room.height) * 100 };
  }

  const keep = (n: number) => Math.max(3, Math.min(97, n));

  function onPointerDown(event: React.PointerEvent, id: string) {
    const p = pointAt(event.clientX, event.clientY);
    if (!p) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setLifted(id);
    drag.current = { id, dx: p.x - spots[id].x, dy: p.y - spots[id].y, startX: event.clientX, startY: event.clientY, moved: false };
  }

  function onPointerMove(event: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 6) return;
    d.moved = true;
    const p = pointAt(event.clientX, event.clientY);
    if (p) setSpots((s) => ({ ...s, [d.id]: { x: keep(p.x - d.dx), y: keep(p.y - d.dy) } }));
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setLifted(null);
    if (!d) return;
    if (!d.moved) return tapTable(d.id);
    const spot = spots[d.id];
    save(() => moveTableAction(d.id, spot.x, spot.y));
  }

  function onKeyDown(event: React.KeyboardEvent, id: string) {
    const step = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[event.key];
    if (!step) return;
    event.preventDefault();
    const spot = { x: keep(spots[id].x + step[0]), y: keep(spots[id].y + step[1]) };
    setSpots((s) => ({ ...s, [id]: spot }));
    save(() => moveTableAction(id, spot.x, spot.y));
  }

  function changeShape(id: string, shape: TableShape) {
    setShapes((s) => ({ ...s, [id]: shape }));
    save(() => setTableShapeAction(id, shape));
  }

  const picked = guests.find((g) => g.id === selectedGuest);
  const table = tables.find((t) => t.id === selectedTable);

  return (
    <div className="mt-6">
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <p className="mb-3 text-sm text-stone" aria-live="polite">
        {picked
          ? <>Now tap a table to sit <span className="text-ink">{fullName(picked)}</span>.</>
          : "Drag tables to set out the room. Tap one to see who's sitting there."}
      </p>

      {/* Below ~560px the room scrolls sideways instead of shrinking past readable. */}
      <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        <div
          ref={roomRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
            setLifted(null);
          }}
          className="relative aspect-[4/3] w-full min-w-[560px] rounded-2xl border border-linen bg-white bg-[radial-gradient(circle,#E6E0D6_1px,transparent_1px)] [background-size:24px_24px]"
          aria-label="Floor plan"
        >
          {tables.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-stone">
              Add a table above and it&apos;ll appear here, ready to move.
            </p>
          )}
          {tables.map((t) => {
            const spot = spots[t.id];
            if (!spot) return null;
            const shape = shapes[t.id] ?? "round";
            const { width, aspect } = tableSize(shape, t.capacity);
            const sitting = atTable(t.id).length;
            const over = sitting > t.capacity;
            const full = sitting >= t.capacity;
            const active = selectedTable === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onPointerDown={(e) => onPointerDown(e, t.id)}
                onKeyDown={(e) => onKeyDown(e, t.id)}
                onClick={(e) => {
                  // Pointer taps are handled on release; this catches Enter and Space.
                  if (e.detail === 0) tapTable(t.id);
                }}
                aria-pressed={active}
                aria-label={`${t.name}, ${sitting} of ${t.capacity} seated${over ? ", over" : ""}. Arrow keys move it.`}
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${width}%`,
                  aspectRatio: aspect,
                  zIndex: lifted === t.id ? 20 : active ? 10 : undefined,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 touch-none select-none border transition-[border-color,box-shadow] ${
                  shape === "round" ? "rounded-full" : "rounded-lg"
                } ${full ? "bg-champagne-100" : "bg-cream"} ${
                  active ? "border-ink shadow-[0_0_0_2px_#1E1B18]" : "border-champagne-400"
                } ${selectedGuest ? "cursor-copy" : "cursor-grab active:cursor-grabbing"}`}
              >
                {seatDots(shape, t.capacity).map((d, i) => (
                  <span
                    key={i}
                    aria-hidden
                    style={{ left: `${d.x}%`, top: `${d.y}%` }}
                    className={`absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                      i < sitting ? "border-champagne-600 bg-champagne-600" : "border-champagne-400 bg-white"
                    }`}
                  />
                ))}
                <span className="pointer-events-none flex h-full flex-col items-center justify-center px-1 leading-tight">
                  <span className="max-w-full truncate text-xs font-medium text-ink">{t.name}</span>
                  <span className={`text-xs ${over ? "font-medium text-champagne-600" : "text-stone"}`}>
                    {sitting}/{t.capacity}
                    {over && " over"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {tables.length > 0 && unseated.length > 0 && (
        <section className="mt-6">
          <p className="label">Not seated yet · {unseated.length}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unseated.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  aria-pressed={selectedGuest === g.id}
                  onClick={() => setSelectedGuest((current) => (current === g.id ? null : g.id))}
                  className={`h-9 rounded-full border px-3 text-sm transition ${
                    selectedGuest === g.id
                      ? "border-ink bg-ink text-ivory"
                      : "border-linen bg-white text-ink hover:border-champagne-400"
                  }`}
                >
                  {fullName(g)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tables.length > 0 && unseated.length === 0 && guests.length > 0 && (
        <p className="mt-6 text-sm text-stone">Everyone coming has a seat.</p>
      )}

      {table && (
        <section className="mt-6 rounded-2xl border border-linen bg-white p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl text-ink">{table.name}</h2>
            <span className="text-xs uppercase tracking-[0.14em] text-stone">
              {atTable(table.id).length} / {table.capacity}
            </span>
          </div>

          <div className="mt-3 inline-grid grid-cols-2 rounded-xl border border-linen bg-cream/60 p-1" role="group" aria-label="Table shape">
            {(["round", "long"] as const).map((shape) => (
              <button
                key={shape}
                type="button"
                aria-pressed={(shapes[table.id] ?? "round") === shape}
                onClick={() => changeShape(table.id, shape)}
                className={`h-9 rounded-lg px-4 text-sm capitalize ${
                  (shapes[table.id] ?? "round") === shape ? "bg-white text-ink shadow-[0_1px_2px_rgb(30_27_24/0.08)]" : "text-stone"
                }`}
              >
                {shape}
              </button>
            ))}
          </div>

          {atTable(table.id).length === 0 ? (
            <p className="mt-3 text-sm text-stone">Nobody yet — tap a name above, then this table.</p>
          ) : (
            <ul className="mt-2">
              {atTable(table.id).map((g) => (
                <li key={g.id} className="flex items-center gap-2 border-b border-linen py-1.5 last:border-b-0">
                  <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
                    {fullName(g)}
                    {g.role_on_the_day && <span className="ml-2 text-xs text-champagne-600">{g.role_on_the_day}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => unseat(g.id)}
                    aria-label={`Take ${g.first_name} off ${table.name}`}
                    className="p-1.5 text-stone hover:text-ink"
                  >
                    <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/day?tab=seating&view=list"
            className="mt-3 inline-block text-sm text-stone underline underline-offset-4 hover:text-ink"
          >
            Rename, change seats or remove — in the list
          </Link>
        </section>
      )}
    </div>
  );
}
