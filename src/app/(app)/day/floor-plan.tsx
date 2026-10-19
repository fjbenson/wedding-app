"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { House, UsersRound, WheatOff } from "lucide-react";
import TableView from "./table-view";
import type { Contact, Seat, SeatingTable, TableShape } from "@/types/db";
import { moveTableAction, seatAtAction, seatOnPlanAction, setTableShapeAction, unseatOnPlanAction } from "./actions";
import { arrangeSeats, defaultSpot, GRID_X, GRID_Y } from "@/lib/seating";

type Point = { x: number; y: number };

function fullName(g: Contact) {
  return [g.first_name, g.last_name].filter(Boolean).join(" ");
}

/** Table size as a % of the room's width — bigger tables look bigger. */
function tableSize(shape: TableShape, capacity: number) {
  if (shape === "top") {
    // Every chair on one side, so it runs longer than a long table of the same size.
    const width = Math.max(20, Math.min(50, 6 + capacity * 3.2));
    return { width, aspect: width / 7 };
  }
  if (shape === "long") {
    const width = Math.max(16, Math.min(36, 6 + capacity * 1.8));
    return { width, aspect: width / 8 };
  }
  const width = Math.max(11, Math.min(18, 9 + capacity * 0.6));
  return { width, aspect: 1 };
}

/** The little seat dots: round the edge of a round table, both sides of a long one, behind a top table. */
function seatDots(shape: TableShape, capacity: number) {
  const dots: Point[] = [];
  if (shape === "top") {
    // Behind the table, so the people sitting there face down into the room.
    for (let i = 0; i < capacity; i++) dots.push({ x: ((i + 0.5) / capacity) * 100, y: -24 });
  } else if (shape === "long") {
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
  households = [],
  needs = {},
}: {
  tables: SeatingTable[];
  seats: Seat[];
  /** Everyone who's coming (or hasn't said they aren't). */
  guests: Contact[];
  /** Groups of guests: tap one, then a table, to sit them together. */
  groups?: { id: string; name: string; members: string[] }[];
  /** Households, seated together the same way (owner, 19 Oct 2026). */
  households?: { id: string; name: string }[];
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
  /** Which chair each guest sits in (0025); null: any free one. */
  const [chairOf, setChairOf] = useState<Map<string, number | null>>(new Map());
  useEffect(() => setChairOf(new Map(seats.map((s) => [s.contact_id, s.seat_no ?? null]))), [seats]);

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
  // Groups and households of two or more, seated together in one go.
  const parties: { id: string; name: string; kind: "group" | "household"; members: string[] }[] = [
    ...groups.map((g) => ({ ...g, id: `g:${g.id}`, kind: "group" as const })),
    ...households
      .map((h) => ({ id: `h:${h.id}`, name: h.name, kind: "household" as const, members: guests.filter((g) => g.household_id === h.id).map((g) => g.id) }))
      .filter((h) => h.members.length > 1),
  ];
  const groupUnseated = (groupId: string) => {
    const members = new Set(parties.find((g) => g.id === groupId)?.members ?? []);
    return unseated.filter((g) => members.has(g.id));
  };
  /** Chair by chair: the guest's id, or null for a free chair. */
  const chairsAt = (t: SeatingTable) => arrangeSeats(atTable(t.id).map((g) => g.id), chairOf, t.capacity);

  /**
   * Sits someone in one chair. Anyone there swaps into the chair the mover
   * left (if it was at this table). Everyone's drawn chair is saved first,
   * so nobody else moves about.
   */
  function seatAt(contactId: string, t: SeatingTable, chair: number) {
    const chairs = chairsAt(t);
    const pins = chairs.flatMap((id, i) => (id && chairOf.get(id) !== i + 1 ? [{ contactId: id, seatNo: i + 1 }] : []));
    const other = chairs[chair - 1];
    const left = chairs.indexOf(contactId);
    setChairOf((m) => {
      const next = new Map(m);
      pins.forEach((p) => next.set(p.contactId, p.seatNo));
      next.set(contactId, chair);
      if (other && other !== contactId) next.set(other, left >= 0 ? left + 1 : null);
      return next;
    });
    setTableOf((m) => new Map(m).set(contactId, t.id));
    save(() => seatAtAction(contactId, t.id, chair, pins));
  }

  /**
   * Sits several people in a table's free chairs, in order — a group or a
   * household from the close-up. Returns how many didn't fit.
   */
  function seatManyAt(ids: string[], t: SeatingTable): number {
    const chairs = chairsAt(t);
    const free = chairs.flatMap((id, i) => (id ? [] : [i + 1]));
    const placing = ids.slice(0, free.length).map((id, i) => ({ id, chair: free[i] }));
    if (placing.length === 0) return ids.length;
    const pins = chairs.flatMap((id, i) => (id && chairOf.get(id) !== i + 1 ? [{ contactId: id, seatNo: i + 1 }] : []));
    setChairOf((m) => {
      const next = new Map(m);
      pins.forEach((p) => next.set(p.contactId, p.seatNo));
      placing.forEach((p) => next.set(p.id, p.chair));
      return next;
    });
    setTableOf((m) => {
      const next = new Map(m);
      placing.forEach((p) => next.set(p.id, t.id));
      return next;
    });
    save(async () => {
      for (const [i, p] of placing.entries()) {
        const message = await seatAtAction(p.id, t.id, p.chair, i === 0 ? pins : []);
        if (message) return message;
      }
      return null;
    });
    return ids.length - placing.length;
  }

  // Groups with someone coming still to seat.
  const openGroups = parties.map((g) => ({ ...g, waiting: groupUnseated(g.id).length })).filter((g) => g.waiting > 0);
  const inPickedGroup = new Set(selectedGroup ? groupUnseated(selectedGroup).map((g) => g.id) : []);

  function seat(contactId: string, tableId: string) {
    setTableOf((m) => new Map(m).set(contactId, tableId));
    setChairOf((m) => new Map(m).set(contactId, null));
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
    setChairOf((m) => {
      const next = new Map(m);
      ids.forEach((id) => next.set(id, null));
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

  // Tables snap to the room's dots (owner, 19 Oct 2026): a 20 × 15 grid of
  // square cells (the room is 4:3), each dot in the middle of its cell.
  const snapTo = (n: number, step: number) => {
    const cells = Math.round(100 / step);
    const k = Math.max(0, Math.min(cells - 1, Math.round((n - step / 2) / step)));
    return Math.round((k * step + step / 2) * 10) / 10;
  };
  const keep = (n: number) => snapTo(n, GRID_X);
  const keepY = (n: number) => snapTo(n, GRID_Y);

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
    if (p) setSpots((s) => ({ ...s, [d.id]: { x: keep(p.x - d.dx), y: keepY(p.y - d.dy) } }));
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
    const step = { ArrowLeft: [-GRID_X, 0], ArrowRight: [GRID_X, 0], ArrowUp: [0, -GRID_Y], ArrowDown: [0, GRID_Y] }[event.key];
    if (!step) return;
    event.preventDefault();
    const spot = { x: keep(spots[id].x + step[0]), y: keepY(spots[id].y + step[1]) };
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
          className="relative aspect-[4/3] w-full min-w-[560px] rounded-2xl border border-linen bg-white bg-[radial-gradient(circle,#D8CFC2_1.5px,transparent_1.5px)] [background-size:5%_6.6667%]"
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
            // The same chairs as the close-up, so a rose dot is where that guest sits.
            const chairs = chairsAt(t);
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
                      chairs[i]
                        ? needs[chairs[i]!]?.length
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
                    {g.kind === "household" ? (
                      <House className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                    ) : (
                      <UsersRound className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                    )}
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
          chairs={chairsAt(table)}
          unseated={unseated}
          needs={needs}
          onSeatAt={(id, chair) => seatAt(id, table, chair)}
          parties={openGroups.map((g) => ({ id: g.id, name: g.name, kind: g.kind, people: groupUnseated(g.id).map((p) => p.id) }))}
          onSeatMany={(ids) => seatManyAt(ids, table)}
          onUnseat={unseat}
          onShape={(shape) => changeShape(table.id, shape)}
          onStep={(by) => setSelectedTable(tables[(tableIndex + by + tables.length) % tables.length].id)}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
}

