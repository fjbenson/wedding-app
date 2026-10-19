"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UsersRound, WheatOff } from "lucide-react";
import TableView from "./table-view";
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
  groups = [],
  needs = {},
}: {
  tables: SeatingTable[];
  seats: Seat[];
  /** Everyone who's coming (or hasn't said they aren't). */
  guests: Contact[];
  /** Groups of guests: tap one, then a table, to sit them together. */
  groups?: { id: string; name: string; members: string[] }[];
  /** Guest id → their dietary needs, marked on the plan (owner, 19 Oct 2026: "really, really important"). */
  needs?: Record<string, string[]>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const roomRef = useRef<HTMLDivElement>(null);

  const [spots, setSpots] = useState<Record<string, Point>>({});
  const [shapes, setShapes] = useState<Record<string, TableShape>>({});
  const [tableOf, setTableOf] = useState<Map<string, string>>(new Map());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
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
  // In name order, so the dots and the close-up's seats agree.
  const atTable = (id: string) =>
    guests
      .filter((g) => tableOf.get(g.id) === id)
      .sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }));
  const groupUnseated = (groupId: string) => {
    const members = new Set(groups.find((g) => g.id === groupId)?.members ?? []);
    return unseated.filter((g) => members.has(g.id));
  };
  // Groups with someone coming still to seat.
  const openGroups = groups.map((g) => ({ ...g, waiting: groupUnseated(g.id).length })).filter((g) => g.waiting > 0);
  const inPickedGroup = new Set(selectedGroup ? groupUnseated(selectedGroup).map((g) => g.id) : []);

  function seat(contactId: string, tableId: string) {
    setTableOf((m) => new Map(m).set(contactId, tableId));
    setSelectedGuest(null);
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

  /** Sits everyone in the group who isn't seated yet at one table. */
  function seatGroup(groupId: string, tableId: string) {
    const ids = groupUnseated(groupId).map((g) => g.id);
    setTableOf((m) => {
      const next = new Map(m);
      ids.forEach((id) => next.set(id, tableId));
      return next;
    });
    setSelectedGroup(null);
    save(async () => {
      for (const id of ids) {
        const message = await seatOnPlanAction(id, tableId);
        if (message) return message;
      }
      return null;
    });
  }

  function tapTable(id: string) {
    if (selectedGroup) seatGroup(selectedGroup, id);
    else if (selectedGuest) seat(selectedGuest, id);
    // Nobody picked: the table opens close up (canvas 3 "Seating · Round 1", B).
    else setSelectedTable(id);
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
  const pickedGroup = openGroups.find((g) => g.id === selectedGroup);
  const table = tables.find((t) => t.id === selectedTable);
  const tableIndex = tables.findIndex((t) => t.id === selectedTable);

  return (
    <div className="mt-6">
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <p className="mb-3 text-sm text-stone" aria-live="polite">
        {pickedGroup
          ? <>Now tap a table to sit <span className="text-ink">{pickedGroup.name}</span> together ({pickedGroup.waiting}).</>
          : picked
          ? <>Now tap a table to sit <span className="text-ink">{fullName(picked)}</span>.</>
          : "Drag tables to set out the room. Tap one to open it."}
      </p>

      {/* Below ~560px the room scrolls sideways instead of shrinking past readable. */}
      <div className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] pb-2 sm:mx-0 sm:px-0">
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
            const people = atTable(t.id);
            const diets = people.filter((g) => needs[g.id]?.length).length;
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
                aria-label={`${t.name}, ${sitting} of ${t.capacity} seated${over ? ", over" : ""}${diets ? `, ${diets} with dietary needs` : ""}. Arrow keys move it.`}
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
                } ${selectedGuest || selectedGroup ? "cursor-copy" : "cursor-grab active:cursor-grabbing"}`}
              >
                {seatDots(shape, t.capacity).map((d, i) => (
                  <span
                    key={i}
                    aria-hidden
                    style={{ left: `${d.x}%`, top: `${d.y}%` }}
                    // A rose dot: the person in that seat has a dietary need (owner, 19 Oct 2026).
                    className={`absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                      i < sitting
                        ? needs[people[i].id]?.length
                          ? "border-[#9A3F2B] bg-[#9A3F2B]"
                          : "border-champagne-600 bg-champagne-600"
                        : "border-champagne-400 bg-white"
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
          {openGroups.length > 0 && (
            <ul aria-label="Groups" className="mt-3 flex flex-wrap gap-2">
              {openGroups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    aria-pressed={selectedGroup === g.id}
                    onClick={() => {
                      setSelectedGuest(null);
                      setSelectedGroup((current) => (current === g.id ? null : g.id));
                    }}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition ${
                      selectedGroup === g.id
                        ? "border-ink bg-ink text-ivory"
                        : "border-dashed border-champagne-400 bg-champagne-100/60 text-ink hover:border-champagne-600"
                    }`}
                  >
                    <UsersRound className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                    {g.name}
                    <span className="opacity-60">{g.waiting}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-3 flex flex-wrap gap-2">
            {unseated.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  aria-pressed={selectedGuest === g.id}
                  onClick={() => {
                    setSelectedGroup(null);
                    setSelectedGuest((current) => (current === g.id ? null : g.id));
                  }}
                  aria-label={needs[g.id]?.length ? `${fullName(g)}, ${needs[g.id].join(", ")}` : undefined}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition ${
                    selectedGuest === g.id || inPickedGroup.has(g.id)
                      ? "border-ink bg-ink text-ivory"
                      : "border-linen bg-white text-ink hover:border-champagne-400"
                  }`}
                >
                  {fullName(g)}
                  {needs[g.id]?.length ? <WheatOff aria-hidden className="h-3.5 w-3.5 text-[#C8735F]" strokeWidth={2} /> : null}
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
        <TableView
          table={table}
          shape={shapes[table.id] ?? "round"}
          position={{ index: tableIndex, total: tables.length }}
          guests={atTable(table.id)}
          unseated={unseated}
          needs={needs}
          onSeat={(id) => {
            setTableOf((m) => new Map(m).set(id, table.id));
            save(() => seatOnPlanAction(id, table.id));
          }}
          onUnseat={unseat}
          onShape={(shape) => changeShape(table.id, shape)}
          onStep={(by) => setSelectedTable(tables[(tableIndex + by + tables.length) % tables.length].id)}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
}

