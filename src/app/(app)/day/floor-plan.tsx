"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { House, Minus, Plus, UsersRound, WheatOff } from "lucide-react";
import TableView from "./table-view";
import FloorPlanPanel, { type DragPayload } from "./floor-plan-panel";
import type { Contact, Seat, SeatingTable, TableShape } from "@/types/db";
import { addTableAtAction, moveTableAction, seatAtAction, seatOnPlanAction, setTableShapeAction, unseatOnPlanAction } from "./actions";
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

  // Laptop only: the room sits on a canvas you can zoom and pan (owner, 21 Oct
  // 2026: "like Figma"). Tables stay inside the room — positions are saved as
  // 0–100% and the database refuses anything outside that.
  const [wide, setWide] = useState(false);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const viewRef = useRef<HTMLDivElement>(null);
  const pan = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  // On a laptop the canvas fills the space and the room sits in it as a 4:3
  // sheet (positions are % of the room), centred, with the dots going on round it.
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = viewRef.current;
    if (!el || !wide) return setBox(null);
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [wide]);
  const roomW = box ? Math.min(box.w, (box.h * 4) / 3) : 0;
  const roomH = (roomW * 3) / 4;
  const home = box ? { x: (box.w - roomW) / 2, y: (box.h - roomH) / 2 } : { x: 0, y: 0 };
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  /** Zooms about a point (px from the canvas's top left) so what's under it stays put. */
  const zoomBy = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const z = Math.min(2.5, Math.max(0.15, v.z * factor));
      const k = z / v.z;
      return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }, []);
  /** Zooms and pans so the room and every table are in view (never bigger than 100%). */
  function fitAll() {
    if (!box || !roomW) return;
    let [x0, y0, x1, y1] = [0, 0, roomW, roomH];
    for (const t of tables) {
      const s = spots[t.id];
      if (!s) continue;
      const { width, aspect } = tableSize(shapes[t.id] ?? "round", t.capacity);
      const w = (roomW * width) / 100;
      const h = w / aspect;
      const [cx, cy, m] = [(s.x / 100) * roomW, (s.y / 100) * roomH, 16];
      x0 = Math.min(x0, cx - w / 2 - m);
      x1 = Math.max(x1, cx + w / 2 + m);
      y0 = Math.min(y0, cy - h / 2 - m);
      y1 = Math.max(y1, cy + h / 2 + m);
    }
    const z = Math.min(1, box.w / (x1 - x0), box.h / (y1 - y0));
    setView({ z, x: box.w / 2 - ((x0 + x1) / 2) * z - home.x, y: box.h / 2 - ((y0 + y1) / 2) * z - home.y });
  }
  // Opening the plan with a table outside the room: start with everything in view.
  const fitted = useRef(false);
  useEffect(() => {
    if (!wide || !box || fitted.current || tables.length === 0 || Object.keys(spots).length === 0) return;
    fitted.current = true;
    if (Object.values(spots).some((s) => s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100)) fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, box, spots, tables.length]);
  function zoomFromCentre(factor: number) {
    const r = viewRef.current?.getBoundingClientRect();
    if (r) zoomBy(factor, r.width / 2, r.height / 2);
  }
  // A trackpad pinch (or ctrl + scroll) zooms; a plain scroll still moves the page.
  useEffect(() => {
    const el = viewRef.current;
    if (!el || !wide) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wide, zoomBy]);

  // The panel: how many chairs a new table gets, and what's being dragged in from it.
  const [newCapacity, setNewCapacity] = useState(8);
  const dragItem = useRef<{ payload: DragPayload; startX: number; startY: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const [ghost, setGhost] = useState<{ kind: DragPayload["kind"]; label: string; x: number; y: number } | null>(null);
  const [hoverTable, setHoverTable] = useState<string | null>(null);
  /** The chair under a name being dragged (from 1), so it can be dropped on one seat. */
  const [hoverChair, setHoverChair] = useState<{ table: string; chair: number } | null>(null);

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
  // The dots carry on outside the room, three room-widths each way (0036).
  const snapTo = (n: number, step: number) => {
    const cells = Math.round(100 / step);
    const k = Math.max(-3 * cells, Math.min(4 * cells - 1, Math.round((n - step / 2) / step)));
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

  /** The table (and the chair, if it's on one) under a point on the screen. */
  const targetAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const tableEl = el?.closest<HTMLElement>("[data-table-id]");
    if (!tableEl) return { table: null, chair: null };
    // The chair nearest the cursor within reach, so it needn't be hit exactly.
    let chair: number | null = null;
    let nearest = 36;
    tableEl.querySelectorAll<HTMLElement>("[data-chair]").forEach((c) => {
      const r = c.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
      if (d < nearest) {
        nearest = d;
        chair = Number(c.dataset.chair);
      }
    });
    return { table: tableEl.dataset.tableId ?? null, chair };
  };

  function addTableAt(shape: TableShape, x: number, y: number) {
    save(() => addTableAtAction(shape, newCapacity, x, y));
  }

  /** A tap on a shape tile (rather than a drag): the table goes on the next free spot. */
  function placeNext(shape: TableShape) {
    const spot = defaultSpot(tables.length);
    addTableAt(shape, keep(spot.x), keepY(spot.y));
  }

  /**
   * Makes a panel item draggable onto the plan: a name or group onto a table
   * sits them there; a shape tile onto the room adds a table where it lands.
   * A tap (no drag) falls through to `click`.
   */
  function dragProps(payload: DragPayload, click: () => void) {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragItem.current = { payload, startX: e.clientX, startY: e.clientY, moved: false };
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        const d = dragItem.current;
        if (!d) return;
        if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
        d.moved = true;
        setGhost({ kind: payload.kind, label: payload.label, x: e.clientX, y: e.clientY });
        if (payload.kind === "table") return;
        const over = targetAt(e.clientX, e.clientY);
        setHoverTable(over.table);
        setHoverChair(over.table && over.chair ? { table: over.table, chair: over.chair } : null);
      },
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
        const d = dragItem.current;
        dragItem.current = null;
        setGhost(null);
        setHoverTable(null);
        setHoverChair(null);
        if (!d?.moved) return;
        justDragged.current = true;
        setTimeout(() => (justDragged.current = false), 80);
        if (payload.kind === "table") {
          const v = viewRef.current?.getBoundingClientRect();
          const over = v && e.clientX >= v.left && e.clientX <= v.right && e.clientY >= v.top && e.clientY <= v.bottom;
          const p = over ? pointAt(e.clientX, e.clientY) : null;
          if (p) addTableAt(payload.shape, keep(p.x), keepY(p.y));
          return;
        }
        const onto = targetAt(e.clientX, e.clientY);
        if (!onto.table) return;
        const where = tables.find((t) => t.id === onto.table);
        if (payload.kind === "guest" && where && onto.chair) seatAt(payload.id, where, onto.chair);
        else if (payload.kind === "guest") seat(payload.id, onto.table);
        else seatGroup(payload.id, onto.table);
      },
      onPointerCancel: () => {
        dragItem.current = null;
        setGhost(null);
        setHoverTable(null);
        setHoverChair(null);
      },
      onClick: () => {
        if (justDragged.current) return;
        click();
      },
    };
  }

  const picked = guests.find((g) => g.id === selectedGuest);
  const pickedGroup = openGroups.find((g) => g.id === selectedGroup);
  const table = tables.find((t) => t.id === selectedTable);
  const tableIndex = tables.findIndex((t) => t.id === selectedTable);

  return (
    <div className="mt-6 lg:mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-5">
      <div className="min-w-0">
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <p className={`mb-3 text-sm text-stone ${picked || pickedGroup ? "" : "lg:hidden"}`} aria-live="polite">
        {pickedGroup
          ? <>Now tap a table to sit <span className="text-ink">{pickedGroup.name}</span> together ({pickedGroup.waiting}).</>
          : picked
          ? <>Now tap a table to sit <span className="text-ink">{fullName(picked)}</span>.</>
          : "Drag tables to set out the room. Tap one to open it."}
      </p>

      {/* Below ~560px the room scrolls sideways instead of shrinking past readable. */}
      <div className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] pb-2 sm:mx-0 sm:px-0">
        <div
          ref={viewRef}
          onPointerDown={(e) => {
            if (!wide || e.button !== 0) return;
            if ((e.target as HTMLElement).closest("[data-table-id],[data-nopan]")) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            pan.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
          }}
          onPointerMove={(e) => {
            const p = pan.current;
            if (p) setView((v) => ({ ...v, x: p.ox + e.clientX - p.sx, y: p.oy + e.clientY - p.sy }));
          }}
          onPointerUp={() => (pan.current = null)}
          onPointerCancel={() => (pan.current = null)}
          className="relative aspect-[4/3] w-full min-w-[560px] overflow-hidden rounded-2xl lg:border lg:border-linen lg:bg-white lg:aspect-auto lg:h-[calc(100vh-9rem)] lg:min-h-[480px] lg:min-w-0 lg:cursor-grab lg:touch-none"
          style={
            wide && box
              ? {
                  backgroundImage: "radial-gradient(circle,#D8CFC2 1.5px,transparent 1.5px)",
                  backgroundSize: `${roomW * 0.05 * view.z}px ${(roomH / 15) * view.z}px`,
                  backgroundPosition: `${home.x + view.x}px ${home.y + view.y}px`,
                }
              : undefined
          }
        >
        <div
          ref={roomRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
            setLifted(null);
          }}
          style={
            wide && box
              ? { width: roomW, height: roomH, left: home.x, top: home.y, transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }
              : undefined
          }
          className={`absolute inset-0 origin-top-left ${wide ? "" : "rounded-2xl border border-linen bg-white bg-[radial-gradient(circle,#D8CFC2_1.5px,transparent_1.5px)] [background-size:5%_6.6667%]"}`}
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
                data-table-id={t.id}
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
                  active ? "border-ink shadow-[0_0_0_2px_#1E1B18]" : hoverTable === t.id ? "border-champagne-600 shadow-[0_0_0_3px_#B8914F]" : "border-champagne-400"
                } ${selectedGuest || selectedGroup ? "cursor-copy" : "cursor-grab active:cursor-grabbing"}`}
              >
                {seatDots(shape, t.capacity).map((d, i) => (
                  <span
                    key={i}
                    aria-hidden
                    data-chair={i + 1}
                    style={{ left: `${d.x}%`, top: `${d.y}%` }}
                    // A rose dot: the person in that seat has a dietary need (owner, 19 Oct 2026).
                    // While a name is dragged the chairs grow into targets (owner, 21 Oct 2026).
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[width,height] ${
                      ghost?.kind === "guest" ? "h-[18px] w-[18px]" : "h-[7px] w-[7px]"
                    } ${
                      // The chair a name would land in: a bolder edge, like the table's (owner, 21 Oct 2026).
                      hoverChair?.table === t.id && hoverChair.chair === i + 1
                        ? `scale-125 border-2 border-champagne-600 shadow-[0_0_0_3px_#B8914F] ${chairs[i] ? (needs[chairs[i]!]?.length ? "bg-[#9A3F2B]" : "bg-champagne-600") : "bg-champagne-100"}`
                        : chairs[i]
                        ? needs[chairs[i]!]?.length
                          ? "border-[#9A3F2B] bg-[#9A3F2B]"
                          : "border-champagne-600 bg-champagne-600"
                        : "border-champagne-400 bg-white"
                    }`}
                  />
                ))}
                <span className="pointer-events-none flex h-full flex-col items-center justify-center px-1 leading-tight">
                  <span className="line-clamp-2 max-w-full break-words text-center text-xs font-medium leading-tight text-ink">{t.name}</span>
                  <span className={`text-xs ${over ? "font-medium text-champagne-600" : "text-stone"}`}>
                    {sitting}/{t.capacity}
                    {over && " over"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div data-nopan className="glass-card absolute bottom-3 right-3 hidden items-center gap-0.5 rounded-full p-1 lg:flex">
          <button type="button" aria-label="Zoom out" onClick={() => zoomFromCentre(1 / 1.25)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-champagne-100">
            <Minus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Fit the room to the screen"
            onClick={fitAll}
            className="h-9 min-w-14 rounded-full px-2 text-sm tabular-nums text-ink hover:bg-champagne-100"
          >
            {Math.round(view.z * 100)}%
          </button>
          <button type="button" aria-label="Zoom in" onClick={() => zoomFromCentre(1.25)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-champagne-100">
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
        </div>
        </div>
      </div>

      {tables.length > 0 && unseated.length > 0 && (
        <section className="mt-6 lg:hidden">
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
        <p className="mt-6 text-sm text-stone lg:hidden">Everyone coming has a seat.</p>
      )}
      </div>

      <FloorPlanPanel
        tables={tables.map((t) => {
          const people = atTable(t.id);
          return {
            id: t.id,
            name: t.name,
            shape: shapes[t.id] ?? "round",
            capacity: t.capacity,
            sitting: people.length,
            diets: people.filter((g) => needs[g.id]?.length).length,
          };
        })}
        unseated={unseated.map((g) => ({ id: g.id, name: fullName(g), initials: [g.first_name, g.last_name].filter(Boolean).map((n) => n!.trim().charAt(0).toUpperCase()).join("") }))}
        parties={openGroups.map((g) => ({ id: g.id, name: g.name, kind: g.kind, waiting: g.waiting }))}
        needs={needs}
        selectedGuest={selectedGuest}
        selectedGroup={selectedGroup}
        capacity={newCapacity}
        onCapacity={setNewCapacity}
        drag={dragProps}
        onPlace={placeNext}
        onOpenTable={setSelectedTable}
        onPickGuest={(id) => {
          setSelectedGroup(null);
          setSelectedGuest((current) => (current === id ? null : id));
        }}
        onPickGroup={(id) => {
          setSelectedGuest(null);
          setSelectedGroup((current) => (current === id ? null : id));
        }}
        activeTable={selectedTable}
        everyoneSeated={tables.length > 0 && unseated.length === 0}
      />

      {ghost && (
        <div
          aria-hidden
          style={{ left: ghost.x, top: ghost.y }}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 -rotate-2 rounded-full border border-champagne-400 bg-white px-3.5 py-1.5 text-sm text-ink shadow-[0_12px_24px_-10px_rgba(60,50,40,0.45)]"
        >
          {ghost.kind === "table" ? `New ${ghost.label.toLowerCase()} table` : ghost.label}
        </div>
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

