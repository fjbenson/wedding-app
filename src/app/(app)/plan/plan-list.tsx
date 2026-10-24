"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, LayoutList, Search, X } from "lucide-react";
import AddMenu from "@/components/add-menu";
import { planChoices } from "@/components/add-choices";
import FilterMenu from "@/components/filter-menu";
import { areaFilterRows, areaName, type AreaOption } from "@/lib/areas";
import { formatMonthYear } from "@/lib/dates";
import { isNudge, planDate } from "@/lib/plan";
import { replaceQuery } from "@/lib/url-state";
import type { Appointment, Milestone } from "@/types/db";
import { AppointmentRow } from "./appointment-row";
import { Fold, FoldGroup } from "./fold";
import { MilestoneRow, isOpen } from "./milestone-row";
import PlanBoard, { type BoardEntry } from "./plan-board";
import PlanTiles from "./plan-tiles";
import { WHEN_CHOICES, type When } from "./when";

type Show = "todos" | "appointments";
type SortBy = "date" | "area" | "az";
const SORTS: { key: SortBy; label: string; short: string }[] = [
  { key: "date", label: "Date", short: "by date" },
  { key: "area", label: "Area", short: "by area" },
  { key: "az", label: "Name, A–Z", short: "a–z" },
];
const SORT_KEY = "plan-list-sort";

/** "2026-10-12" → "2027-01-12": three months on, for "Next 3 months". */
function threeMonthsOn(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + 3, d)).toISOString().slice(0, 10);
}

type Entry = {
  key: string;
  title: string;
  /** For sorting: the day it's due or happens; null for none. */
  date: string | null;
  area: string | null;
  overdue: boolean;
  /** Words search looks through. */
  words: string;
  row: React.ReactNode;
  /** The same row for the laptop's board: the weekday under the day, not the month. */
  board: BoardEntry;
};

/**
 * Plan's List (`?view=list`), shaped like the guest list (owner, 16 Oct
 * 2026): a search box with the round black + at its end, then Filter on the
 * left and Sort on the right, then one list of **to-dos and appointments
 * together** — search finds both ("florist" brings up the to-do and the
 * meeting). Filter (in the address, so the area page can link here
 * narrowed): Show (`&show=todos|appointments`), When (`&when=`), Area
 * (`&area=`). Search (`?q=`) lives in the address too; Sort (date, area,
 * A–Z) is a preference kept on the phone. Done to-dos and appointments that
 * have been fold away at the foot.
 */
export default function PlanList({
  milestones,
  appointments,
  suppliers,
  areas,
  area,
  when,
  show,
  initialQuery,
  today,
}: {
  milestones: Milestone[];
  appointments: Appointment[];
  suppliers: { id: string; name: string; area: string | null }[];
  areas: AreaOption[];
  area: string | null;
  when: When | null;
  show: Show | null;
  initialQuery: string;
  today: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  useEffect(() => {
    replaceQuery({ q: query.trim() || null });
  }, [query]);
  const [sort, setSort] = useState<SortBy>("date");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SORT_KEY) as SortBy | null;
      if (saved && SORTS.some((s) => s.key === saved)) setSort(saved);
    } catch {
      // No storage (private window): the default is fine.
    }
  }, []);
  const pickSort = (s: SortBy) => {
    setSort(s);
    try {
      window.localStorage.setItem(SORT_KEY, s);
    } catch {
      // As above.
    }
  };

  const thisMonth = today.slice(0, 7);
  const soon = threeMonthsOn(today);
  const supplier = (id: string | null) => suppliers.find((s) => s.id === id);
  const inArea = (key: string | null) => (area === null ? true : area === "none" ? !key || key === "other" : key === area);
  // A nudge whose month has come is "start now", never overdue (src/lib/plan.ts).
  const late = (m: Milestone) => !isNudge(m) && !!m.due_date && m.due_date < today;
  const fits = (date: string | null, overdue: boolean) => {
    if (when === null) return true;
    if (when === "overdue") return overdue;
    if (when === "none") return !date;
    if (!date || overdue) return false;
    if (when === "month") return date.slice(0, 7) <= thisMonth;
    return date < soon;
  };
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const found = (e: Entry) => words.every((w) => e.words.includes(w));
  const named = (key: string | null) => (key ? (areaName(key, areas) ?? key) : "Other");
  const showArea = !(area && area !== "none") && sort !== "area";

  const todo = (m: Milestone, done: boolean): Entry => ({
    key: `t-${m.id}`,
    title: m.title,
    date: planDate(m),
    area: m.category,
    overdue: !done && late(m),
    words: [m.title, m.description, named(m.category)].filter(Boolean).join(" ").toLowerCase(),
    row: <MilestoneRow key={`t-${m.id}`} milestone={m} overdue={!done && late(m)} area={showArea || done ? areaName(m.category, areas) : null} />,
    board: {
      key: `t-${m.id}`,
      id: m.id,
      date: planDate(m),
      overdue: !done && late(m),
      movable: !!m.due_date && !isNudge(m),
      row: <MilestoneRow key={`t-${m.id}`} milestone={m} overdue={!done && late(m)} area={areaName(m.category, areas)} dateUnder="weekday" />,
    },
  });
  const appointmentArea = (a: Appointment) => a.area_key ?? supplier(a.contact_id)?.area ?? null;
  const visit = (a: Appointment, been: boolean): Entry => ({
    key: `a-${a.id}`,
    title: a.title,
    date: a.on_date,
    area: appointmentArea(a),
    overdue: false,
    words: [a.title, a.location, a.notes, supplier(a.contact_id)?.name, named(appointmentArea(a))].filter(Boolean).join(" ").toLowerCase(),
    row: (
      <AppointmentRow
        key={`a-${a.id}`}
        appointment={a}
        been={been}
        supplier={supplier(a.contact_id)?.name}
        area={showArea || been ? areaName(appointmentArea(a), areas) : null}
      />
    ),
    board: {
      key: `a-${a.id}`,
      id: a.id,
      date: a.on_date,
      overdue: false,
      movable: false,
      row: <AppointmentRow key={`a-${a.id}`} appointment={a} been={false} supplier={supplier(a.contact_id)?.name} area={areaName(appointmentArea(a), areas)} dateUnder="weekday" />,
    },
  });

  const todos = show === "appointments" ? [] : milestones.filter((m) => inArea(m.category));
  const visits = show === "todos" ? [] : appointments.filter((a) => inArea(appointmentArea(a)));
  const openTodos = todos.filter(isOpen).map((m) => todo(m, false)).filter((e) => fits(e.date, e.overdue));
  const coming = visits.filter((a) => a.on_date >= today).map((a) => visit(a, false)).filter((e) => fits(e.date, false));
  const open = [...openTodos, ...coming].filter(found);
  const done = [
    ...todos.filter((m) => !isOpen(m)).map((m) => todo(m, true)),
    ...visits.filter((a) => a.on_date < today).map((a) => visit(a, true)),
  ]
    .filter(found)
    .sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""));

  const byDate = (x: Entry, y: Entry) => Number(y.overdue) - Number(x.overdue) || (x.date ?? "9999").localeCompare(y.date ?? "9999");
  const sorted = [...open].sort(sort === "az" ? (x, y) => x.title.localeCompare(y.title, undefined, { sensitivity: "base" }) : byDate);
  // By area: the wedding's areas in their order, then anything else, then Other.
  const groups =
    sort === "area"
      ? [...areas.map((a) => a.key), ...new Set(sorted.map((e) => e.area).filter((k): k is string => !!k && k !== "other" && !areas.some((a) => a.key === k))), ""]
          .map((k) => ({ key: k, title: k ? named(k) : "Other", entries: sorted.filter((e) => (k ? e.area === k : !e.area || e.area === "other")) }))
          .filter((g) => g.entries.length > 0)
      : [{ key: "all", title: "", entries: sorted }];

  const nTodos = open.filter((e) => e.key.startsWith("t-")).length;
  const nVisits = open.length - nTodos;
  const count = [
    show !== "appointments" && `${nTodos} to do`,
    show !== "todos" && `${nVisits} ${nVisits === 1 ? "appointment" : "appointments"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  // Laptops list by date as a board of months; View › Area or Name keeps the list.
  const board = sort === "date" && open.length > 0;
  const base = `/plan?view=list${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ""}`;
  // The laptop's tiles, the same four as the calendar's (owner, 24 Oct 2026), over the whole plan, not the filtered list.
  const allOpen = milestones.filter(isOpen);
  // A month header on the board, tapped, puts that month in the tiles' second figure (owner, 24 Oct 2026).
  const [focus, setFocus] = useState<string | null>(null);
  const tileMonth = focus ?? thisMonth;
  const inThisMonth = (m: Milestone) => planDate(m)?.slice(0, 7) === tileMonth;
  const upcoming = appointments.filter((a) => a.on_date >= today);
  const lateOnes = allOpen.filter(late);
  const router = useRouter();
  const tilePicked = show === "todos" ? "todos" : show === "appointments" ? "appointments" : when === "overdue" ? "overdue" : when === "none" ? "undated" : null;
  const pickTile = (pick: "overdue" | "todos" | "appointments" | "undated") => {
    const same = tilePicked === pick;
    const params = [
      !same && (pick === "todos" || pick === "appointments") && `show=${pick}`,
      !same && (pick === "overdue" || pick === "undated") && `when=${pick === "undated" ? "none" : "overdue"}`,
      area && `area=${encodeURIComponent(area)}`,
      query.trim() && `q=${encodeURIComponent(query.trim())}`,
    ].filter(Boolean);
    router.replace(`/plan?view=list${params.length ? `&${params.join("&")}` : ""}`, { scroll: false });
  };
  const tiles = (
    <PlanTiles
      tiles={[
        { pick: "overdue", value: lateOnes.length, month: lateOnes.filter(inThisMonth).length },
        { pick: "todos", value: allOpen.length, month: allOpen.filter((m) => !late(m) && inThisMonth(m)).length },
        { pick: "appointments", value: upcoming.length, month: upcoming.filter((a) => a.on_date.slice(0, 7) === tileMonth).length },
        { pick: "undated", value: allOpen.filter((m) => !planDate(m)).length, month: null },
      ]}
      monthName={formatMonthYear(`${tileMonth}-01`).split(" ").filter((_, i) => i === 0 || tileMonth.slice(0, 4) !== today.slice(0, 4)).join(" ")}
      active={tilePicked}
      onPick={pickTile}
    />
  );

  return (
    <FoldGroup initiallyOpen={[]}>
      <div className={board ? "" : "lg:max-w-[1180px]"}>
      <div className="min-w-0">
      <div className="mt-5 hidden room-md:block">{tiles}</div>
      {/* Find or add, like the guest list: the + at the end of the search. */}
      <div className="mt-5 flex items-center gap-3">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
          <Search className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a to-do or appointment"
            aria-label="Find a to-do or appointment"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear the search" className="-mr-1 flex h-8 w-8 items-center justify-center text-stone hover:text-ink">
              <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </button>
          )}
        </label>
        <AddMenu label="Add to the plan" title="Add to the plan" choices={planChoices()} />
      </div>

      <FilterMenu
        base={base}
        groups={[
          { param: "show", title: "Show", current: show, rows: [{ key: "todos", label: "To-dos" }, { key: "appointments", label: "Appointments" }] },
          { param: "when", title: "When", current: when, rows: WHEN_CHOICES.map(([key, label]) => ({ key, label })) },
          { param: "area", title: "Area", current: area, rows: areaFilterRows(areas) },
        ]}
        start={<SortMenu sort={sort} onSort={pickSort} />}
        expandable={{ results: open.length, noun: "item" }}
      />

      <p className="type-meta mt-5 px-1">{count}</p>

      {open.length === 0 ? (
        <p className="mt-3 px-1 font-display text-xl italic text-ink">
          {words.length > 0
            ? `Nothing matches “${query.trim()}”.`
            : milestones.length === 0 && appointments.length === 0
              ? "Nothing planned yet."
              : area || when || show
                ? "Nothing here with those filters."
                : "Everything's done. Lovely."}
        </p>
      ) : (
        <>
        {board && (
          <div className="hidden lg:block">
            <PlanBoard entries={sorted.map((e) => e.board)} today={today} everyMonth={!area && !when && !show && words.length === 0} focus={focus} onFocus={setFocus} />
          </div>
        )}
        <div className={board ? "lg:hidden" : ""}>
        {groups.map((g) => (
          <section key={g.key}>
            {g.title && (
              <p className="mt-5 flex items-baseline justify-between gap-3 px-1">
                <span className="section-label">{g.title}</span>
                <span className="type-meta">{g.entries.length === 1 ? "1 item" : `${g.entries.length} items`}</span>
              </p>
            )}
            <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 py-1 [--row-bleed:16px]">{g.entries.map((e) => e.row)}</ul>
          </section>
        ))}
        </div>
        </>
      )}

      {done.length > 0 && (
        <Fold
          id="list-done"
          className="mt-10 border-t border-linen pt-4"
          header={
            <span className="flex items-baseline justify-between gap-3">
              <span className="section-label">Done</span>
              <span className="type-meta">{done.length === 1 ? "1 item" : `${done.length} items`}</span>
            </span>
          }
        >
          <ul className="mt-1">{done.map((e) => e.row)}</ul>
        </Fold>
      )}
      </div>
      </div>
    </FoldGroup>
  );
}

/** Sort, drawn like the guest list's: the order in words, a small menu under it. */
function SortMenu({ sort, onSort }: { sort: SortBy; onSort: (s: SortBy) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const current = SORTS.find((s) => s.key === sort)!;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`View: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        className="type-meta flex h-9 items-center gap-1.5 hover:text-ink"
      >
        <LayoutList className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
        {current.label.replace(", A–Z", "")}
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[15rem] rounded-[20px] border border-linen bg-white px-4 pb-1.5 pt-2.5 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]">
          <span className="section-label block py-1">View</span>
          <ul>
            {SORTS.map((s) => (
              <li key={s.key} className="border-t border-linen first:border-t-0">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={sort === s.key}
                  onClick={() => {
                    onSort(s.key);
                    setOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center gap-3 text-left text-sm text-ink"
                >
                  <span className="flex-1">{s.label}</span>
                  {sort === s.key && <Check className="h-4 w-4 text-ink" strokeWidth={2.4} aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
