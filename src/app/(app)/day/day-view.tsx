import PageTitle from "@/components/page-title";
import Link from "next/link";
import { X } from "lucide-react";
import AddButton from "@/components/add-button";
import CornerSwitch from "@/components/corner-switch";
import ViewTabs from "@/components/view-tabs";
import { InlineSubmit } from "@/components/form-bits";
import { coupleName as setCoupleName } from "@/lib/couple-name";
import { formatClock, formatLongDate, nowInLondon } from "@/lib/dates";
import type { Contact, Rsvp, RunSheetItem, Seat, SeatingTable, Stay, TransportPassenger, TransportRun } from "@/types/db";
import {
  addTableAction,
  deleteTableAction,
  seatGuestAction,
  unseatGuestAction,
  updateTableAction,
} from "./actions";
import FloorPlan from "./floor-plan";
import FilterMenu from "@/components/filter-menu";
import { areaFilterRows, areaName, type AreaOption } from "@/lib/areas";
import PrintButton from "./print-button";
import Travel from "./travel";

export type DayTab = "run-sheet" | "seating" | "travel";

interface DayData {
  runSheet: RunSheetItem[];
  tables: SeatingTable[];
  seats: Seat[];
  runs: TransportRun[];
  passengers: TransportPassenger[];
}

function fullName(g: Contact) {
  return [g.first_name, g.last_name].filter(Boolean).join(" ");
}

const pill =
  "h-9 min-w-0 rounded-full border border-linen bg-ivory px-3 text-sm text-ink focus:border-champagne-400 focus:outline-none";

/**
 * The Day (screens 25–28): the choreography of the day itself, as opposed to
 * the planning of the run-up. It sits near-empty for months and matters
 * enormously for a fortnight. Seating opens on the floor plan (screen 26,
 * `floor-plan.tsx`); the list of tables is the other view, and where tables
 * are renamed or removed.
 */
export default function DayView({
  tab,
  stays,
  groups,
  open,
  seatingView,
  coupleName,
  weddingDate,
  day,
  guests,
  rsvps,
  areas,
  area,
  error,
  detail,
}: {
  tab: DayTab;
  /** Travel's places to stay (empty until 0020_travel.sql is run). */
  stays: Stay[];
  /** Groups of guests, for seating a group together (Seating only). */
  groups: { id: string; name: string; members: string[] }[];
  /** Travel's open card (`?open=`). */
  open: string | null;
  seatingView: "plan" | "list";
  coupleName: string;
  weddingDate: string | null;
  /** null until 0009_the_day.sql has been run. */
  day: DayData | null;
  guests: Contact[];
  rsvps: Rsvp[];
  areas: AreaOption[];
  /** The run sheet narrowed to one area (`?area=<key>`, or `none` for Other). */
  area: string | null;
  error?: string;
  detail?: string;
}) {
  const data: DayData = day ?? { runSheet: [], tables: [], seats: [], runs: [], passengers: [] };

  return (
    <main className="page pb-40 lg:pb-16 print:p-0">
      <div className="print:hidden">
        <CornerSwitch
          label="The Day"
          tabs={[
            { label: "Run sheet", href: "/day", active: tab === "run-sheet" },
            { label: "Seating", href: "/day?tab=seating", active: tab === "seating" },
            { label: "Travel", href: "/day?tab=travel", active: tab === "travel" },
          ]}
        />
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}
      {day === null && (
        <p className="mt-5 rounded-xl border border-dashed border-champagne-400 px-4 py-3 text-sm text-ink">
          The Day needs one more database step: run <span className="font-mono text-xs">supabase/migrations/0009_the_day.sql</span> in
          Supabase.
        </p>
      )}

      {tab === "seating" ? (
        <Seating data={data} guests={guests} rsvps={rsvps} groups={groups} view={seatingView} />
      ) : tab === "travel" ? (
        <Travel
          stays={stays}
          runs={data.runs}
          passengers={data.passengers}
          guests={comingGuests(guests, rsvps)}
          open={open}
          ready={guests.length === 0 || guests[0].own_way !== undefined}
        />
      ) : (
        <RunSheet items={data.runSheet} coupleName={coupleName} weddingDate={weddingDate} areas={areas} area={area} />
      )}
    </main>
  );
}

/** The parts of the day the run sheet is set under, by the clock. */
const PARTS = [
  { name: "The morning", until: "12:00" },
  { name: "The afternoon", until: "18:00" },
  { name: "The evening", until: "24:00" },
];

/**
 * The run sheet (canvas 2, "The Day · Signature look", option D, owner's
 * pick 11 Oct 2026): set like the order of service — a white card with a gold
 * border, the couple and the date at the top, the day in parts — but read
 * like a timetable: the time on the left, a gold thread with a dot per
 * moment, the moment on the right. On the day itself, the moment under way
 * is marked Now.
 */
function RunSheet({
  items: all,
  coupleName,
  weddingDate,
  areas,
  area,
}: {
  items: RunSheetItem[];
  coupleName: string;
  weddingDate: string | null;
  areas: AreaOption[];
  area: string | null;
}) {
  // Narrowed to one area (12 Oct 2026): what an area page's "In The Day ›"
  // opens, and a copy to print for that supplier.
  const items =
    area === null ? all : all.filter((i) => (area === "none" ? !i.area_key || i.area_key === "other" : i.area_key === area));
  const forWhom = area === "none" ? "Other" : area ? areaName(area, areas) : null;
  const now = nowInLondon();
  const isTheDay = weddingDate === now.date;
  const nowId = isTheDay ? items.filter((i) => i.at_time.slice(0, 5) <= now.time).at(-1)?.id : undefined;
  let from = "00:00";
  const parts = PARTS.map((p) => {
    const theirs = items.filter((i) => i.at_time.slice(0, 5) >= from && i.at_time.slice(0, 5) < p.until);
    from = p.until;
    return { name: p.name, items: theirs };
  }).filter((p) => p.items.length > 0);

  return (
    <>
      <PageTitle drawing="day" className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">
        The day
      </PageTitle>
      {items.length === 0 && (
        <p className="mt-2 text-sm text-stone">Hour by hour — who needs to be where, and when. It gets printed and handed round.</p>
      )}

      {/* Filter on the left, Print and the round black + on its right (owner, 13 Oct 2026). */}
      {(() => {
        const buttons = (
          <>
            {items.length > 0 && <PrintButton />}
            <AddButton
              href={area && area !== "none" ? `/day/run-sheet/new?area=${encodeURIComponent(area)}` : "/day/run-sheet/new"}
              label="Add a moment"
            />
          </>
        );
        return all.length > 0 ? (
          <FilterMenu base="/day" groups={[{ param: "area", current: area, rows: areaFilterRows(areas) }]} end={buttons} />
        ) : (
          <div className="mt-5 flex items-center justify-end gap-2 print:hidden">{buttons}</div>
        );
      })()}
      {forWhom && items.length === 0 && <p className="mt-6 font-display text-xl italic text-ink">Nothing on the day for {forWhom} yet.</p>}

      {items.length > 0 && (
        <article className="mt-6 rounded bg-white p-2.5 shadow-[0_1px_2px_rgb(60_45_20/0.06),0_14px_34px_rgb(60_45_20/0.10)] lg:max-w-xl print:shadow-none">
          <div className="border border-champagne-400 px-[18px] pb-3 pt-7 outline outline-1 -outline-offset-[5px] outline-champagne-100">
            <header className="text-center">
              <p className="label">{forWhom ? `The order of the day · ${forWhom}` : "The order of the day"}</p>
              <p className="type-display mt-2 text-[30px] leading-[1.05]">{setCoupleName(coupleName)}</p>
              {weddingDate && <p className="type-meta mt-2">{formatLongDate(weddingDate)}</p>}
              <Flourish />
            </header>

            {parts.map((part, i) => (
              <section key={part.name}>
                <h2 className="type-display mb-2.5 mt-6 text-center text-[26px]">{part.name}</h2>
                <ol className="relative">
                  <span className="absolute bottom-0 left-[65px] top-0 w-px bg-champagne-100" aria-hidden />
                  {part.items.map((item) => {
                    const isNow = item.id === nowId;
                    return (
                      <li key={item.id}>
                        <Link
                          href={`/day/run-sheet/${item.id}`}
                          aria-current={isNow ? "time" : undefined}
                          className="relative grid grid-cols-[52px_1fr] gap-x-[26px] pb-[18px] hover:opacity-80"
                        >
                          <span className="type-figure text-right text-[20px] leading-[1.15] text-champagne-600">
                            {formatClock(item.at_time)}
                          </span>
                          <span className="min-w-0">
                            <span className={`block font-display leading-[1.25] text-ink ${isNow ? "text-[21px] italic" : "text-[19px]"}`}>
                              {item.title}
                            </span>
                            {(item.location || item.who) && (
                              <span className="mt-0.5 block font-display text-[15px] italic text-stone">
                                {[item.location, item.who].filter(Boolean).join(" · ")}
                              </span>
                            )}
                            {item.notes && <span className="mt-1 block whitespace-pre-wrap text-sm text-stone">{item.notes}</span>}
                            {isNow && (
                              <span className="mt-1.5 inline-block rounded-full bg-ink px-2.5 py-[3px] text-xs font-medium uppercase tracking-[0.2em] text-ivory">
                                Now
                              </span>
                            )}
                          </span>
                          <span
                            aria-hidden
                            className={`absolute rounded-full ${
                              isNow
                                ? "left-[58px] top-1 h-[15px] w-[15px] border-[3px] border-champagne-100 bg-ink shadow-[0_0_0_1px_#B8914F]"
                                : "left-[61px] top-[7px] h-[9px] w-[9px] border-[1.5px] border-champagne-400 bg-white"
                            }`}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
                {i < parts.length - 1 && (
                  <svg viewBox="0 0 40 10" width="40" height="10" className="mx-auto mt-1 block" fill="none" stroke="#B8914F" strokeOpacity="0.6" aria-hidden>
                    <path d="M20 1l4 4-4 4-4-4z" />
                  </svg>
                )}
              </section>
            ))}
          </div>
        </article>
      )}
    </>
  );
}

/** The little gold flourish under the names, as on a printed order of service. */
function Flourish() {
  return (
    <svg viewBox="0 0 120 20" width="120" height="20" className="mx-auto mt-2.5 block" fill="none" stroke="#B8914F" strokeWidth="1" strokeLinecap="round" aria-hidden>
      <path d="M0 10h44M76 10h44M60 3c-6 0-9 7-3 7s3-7-3-7M60 17c6 0 9-7 3-7s-3 7 3 7M50 10h-3M70 10h3" />
    </svg>
  );
}

/** Everyone except those who've said no to everything they were asked to. */
function comingGuests(guests: Contact[], rsvps: Rsvp[]): Contact[] {
  return guests.filter((g) => {
    const theirs = rsvps.filter((r) => r.contact_id === g.id);
    return theirs.length === 0 || theirs.some((r) => r.status !== "declined");
  });
}

function Seating({
  data,
  guests,
  rsvps,
  groups,
  view,
}: {
  data: DayData;
  guests: Contact[];
  rsvps: Rsvp[];
  groups: { id: string; name: string; members: string[] }[];
  view: "plan" | "list";
}) {
  const coming = comingGuests(guests, rsvps);
  const tableOf = new Map(data.seats.map((s) => [s.contact_id, s.table_id]));
  const unseated = coming.filter((g) => !tableOf.has(g.id));
  const seats = data.tables.reduce((sum, t) => sum + t.capacity, 0);
  const seated = coming.length - unseated.length;

  return (
    <>
      <PageTitle drawing="day" className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">
        Seating
      </PageTitle>
      <p className="mt-2 text-sm text-stone">
        {data.tables.length === 0
          ? "Add your tables, then sit people at them."
          : `${seated} of ${coming.length} seated · ${data.tables.length} ${data.tables.length === 1 ? "table" : "tables"} · ${seats} seats`}
      </p>

      <form action={addTableAction} className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-linen bg-white p-4">
        {/* On a small phone the name takes its own line; the seats and button sit below. */}
        <input
          name="name"
          placeholder={`Name, e.g. Table ${data.tables.length + 1}`}
          aria-label="Table name"
          className={`${pill} basis-full sm:basis-auto sm:flex-1`}
        />
        <label className="flex items-center gap-2 text-sm text-stone">
          <input name="capacity" type="number" min={1} max={40} defaultValue={8} aria-label="Seats" className={`${pill} w-16`} />
          seats
        </label>
        {/* Round to start with (most tables are); tap Long to change it. */}
        <div role="radiogroup" aria-label="Table shape" className="inline-grid grid-cols-2 rounded-full border border-linen bg-cream/60 p-1">
          {(["round", "long"] as const).map((shape) => (
            <label
              key={shape}
              className="cursor-pointer rounded-full px-3.5 py-1.5 text-sm capitalize text-stone has-[:checked]:bg-white has-[:checked]:text-ink has-[:checked]:shadow-[0_1px_2px_rgb(30_27_24/0.08)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-champagne-400"
            >
              <input type="radio" name="shape" value={shape} defaultChecked={shape === "round"} className="sr-only" />
              {shape}
            </label>
          ))}
        </div>
        <InlineSubmit label="Add table" pendingLabel="Adding…" />
      </form>

      <ViewTabs
        label="Seating view"
        tabs={[
          { label: "Floor plan", href: "/day?tab=seating", active: view === "plan" },
          { label: "List", href: "/day?tab=seating&view=list", active: view === "list" },
        ]}
      />

      {view === "plan" ? (
        <FloorPlan tables={data.tables} seats={data.seats} guests={coming} groups={groups} />
      ) : (
        <SeatingList data={data} coming={coming} unseated={unseated} tableOf={tableOf} />
      )}
    </>
  );
}

function SeatingList({
  data,
  coming,
  unseated,
  tableOf,
}: {
  data: DayData;
  coming: Contact[];
  unseated: Contact[];
  tableOf: Map<string, string>;
}) {
  return (
    <>
      {unseated.length > 0 && data.tables.length > 0 && (
        <p className="mt-6 text-sm text-stone">
          <span className="text-ink">Not seated yet ({unseated.length}):</span> {unseated.map(fullName).join(", ")}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {data.tables.map((table) => {
          const atTable = coming.filter((g) => tableOf.get(g.id) === table.id);
          const over = atTable.length > table.capacity;
          return (
            <section key={table.id} className="min-w-0 rounded-2xl border border-linen bg-white p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl text-ink">{table.name}</h2>
                <span className={`text-xs uppercase tracking-[0.14em] ${over ? "font-medium text-champagne-600" : "text-stone"}`}>
                  {atTable.length} / {table.capacity}
                  {over && " · over"}
                </span>
              </div>

              <ul className="mt-2">
                {atTable.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 border-b border-linen py-1.5 last:border-b-0">
                    <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
                      {fullName(g)}
                      {g.role_on_the_day && <span className="ml-2 text-xs text-champagne-600">{g.role_on_the_day}</span>}
                    </span>
                    <form action={unseatGuestAction.bind(null, g.id)}>
                      <button type="submit" aria-label={`Take ${g.first_name} off ${table.name}`} className="p-1.5 text-stone hover:text-ink">
                        <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>

              {unseated.length > 0 && (
                <form action={seatGuestAction.bind(null, table.id)} className="mt-3 flex gap-2">
                  <select name="guest" required defaultValue="" aria-label={`Sit someone at ${table.name}`} className={`${pill} flex-1`}>
                    <option value="" disabled>
                      Sit someone here…
                    </option>
                    {unseated.map((g) => (
                      <option key={g.id} value={g.id}>
                        {fullName(g)}
                      </option>
                    ))}
                  </select>
                  <InlineSubmit label="Add" pendingLabel="…" />
                </form>
              )}

              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-stone underline underline-offset-4 hover:text-ink">Change table</summary>
                <form action={updateTableAction.bind(null, table.id)} className="mt-2 flex flex-wrap items-center gap-2">
                  <input name="name" required defaultValue={table.name} aria-label="Table name" className={`${pill} flex-1`} />
                  <input name="capacity" type="number" min={1} max={40} defaultValue={table.capacity} aria-label="Seats" className={`${pill} w-16`} />
                  <InlineSubmit label="Save" pendingLabel="Saving…" />
                </form>
                <form action={deleteTableAction.bind(null, table.id)} className="mt-2">
                  <button type="submit" className="text-stone underline underline-offset-4 hover:text-ink">
                    Remove this table (its guests become unseated)
                  </button>
                </form>
              </details>
            </section>
          );
        })}
      </div>
    </>
  );
}
