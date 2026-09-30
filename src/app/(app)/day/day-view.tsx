import Link from "next/link";
import { ChevronRight, Plus, X } from "lucide-react";
import ViewTabs from "@/components/view-tabs";
import { InlineSubmit } from "@/components/form-bits";
import { formatLongDate, formatTime } from "@/lib/dates";
import type { Contact, Rsvp, RunSheetItem, Seat, SeatingTable, TransportPassenger, TransportRun } from "@/types/db";
import {
  addPassengerAction,
  removePassengerAction,
  addTableAction,
  deleteTableAction,
  seatGuestAction,
  unseatGuestAction,
  updateTableAction,
} from "./actions";
import PrintButton from "./print-button";

export type DayTab = "run-sheet" | "seating" | "transport";

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
 * enormously for a fortnight. Seating is a list of tables here — the
 * drag-about floor plan (screen 26) is a later step.
 */
export default function DayView({
  tab,
  weddingDate,
  day,
  guests,
  rsvps,
  error,
  detail,
}: {
  tab: DayTab;
  weddingDate: string | null;
  /** null until 0009_the_day.sql has been run. */
  day: DayData | null;
  guests: Contact[];
  rsvps: Rsvp[];
  error?: string;
  detail?: string;
}) {
  const data: DayData = day ?? { runSheet: [], tables: [], seats: [], runs: [], passengers: [] };

  return (
    <main className="page pb-28 lg:pb-16 print:p-0">
      <p className="label">The Day</p>
      <div className="print:hidden">
        <ViewTabs
          label="The Day"
          tabs={[
            { label: "Run sheet", href: "/day", active: tab === "run-sheet" },
            { label: "Seating", href: "/day?tab=seating", active: tab === "seating" },
            { label: "Transport", href: "/day?tab=transport", active: tab === "transport" },
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
        <Seating data={data} guests={guests} rsvps={rsvps} />
      ) : tab === "transport" ? (
        <Transport data={data} guests={guests} />
      ) : (
        <RunSheet items={data.runSheet} weddingDate={weddingDate} />
      )}
    </main>
  );
}

function RunSheet({ items, weddingDate }: { items: RunSheetItem[]; weddingDate: string | null }) {
  return (
    <>
      <h1 className="mt-8 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {weddingDate ? formatLongDate(weddingDate) : "The order of the day"}
      </h1>
      <p className="mt-2 text-sm text-stone">
        {items.length === 0
          ? "Hour by hour — who needs to be where, and when. It gets printed and handed round."
          : `${items.length} ${items.length === 1 ? "moment" : "moments"}, ${formatTime(items[0].at_time)} to ${formatTime(items[items.length - 1].at_time)}`}
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row print:hidden">
        <Link
          href="/day/run-sheet/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90 sm:px-6"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          Add a moment
        </Link>
        {items.length > 0 && <PrintButton />}
      </div>

      {items.length > 0 && (
        <ol className="mt-10 border-t border-champagne-400">
          {items.map((item) => (
            <li key={item.id} className="border-b border-linen">
              <Link href={`/day/run-sheet/${item.id}`} className="flex gap-4 py-4 hover:bg-cream/60">
                <span className="w-20 shrink-0 font-display text-2xl leading-tight text-champagne-600">
                  {formatTime(item.at_time)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-ink">{item.title}</span>
                  {(item.location || item.who) && (
                    <span className="mt-0.5 block text-sm text-stone">{[item.location, item.who].filter(Boolean).join(" · ")}</span>
                  )}
                  {item.notes && <span className="mt-1 block whitespace-pre-wrap text-sm text-stone">{item.notes}</span>}
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone print:hidden" strokeWidth={1.8} aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function Seating({ data, guests, rsvps }: { data: DayData; guests: Contact[]; rsvps: Rsvp[] }) {
  // Everyone except those who've said no to everything they were asked to.
  const coming = guests.filter((g) => {
    const theirs = rsvps.filter((r) => r.contact_id === g.id);
    return theirs.length === 0 || theirs.some((r) => r.status !== "declined");
  });
  const tableOf = new Map(data.seats.map((s) => [s.contact_id, s.table_id]));
  const unseated = coming.filter((g) => !tableOf.has(g.id));
  const seats = data.tables.reduce((sum, t) => sum + t.capacity, 0);
  const seated = coming.length - unseated.length;

  return (
    <>
      <h1 className="mt-8 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">Seating</h1>
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
        <InlineSubmit label="Add table" pendingLabel="Adding…" />
      </form>

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

function Transport({ data, guests }: { data: DayData; guests: Contact[] }) {
  return (
    <>
      <h1 className="mt-8 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">Transport</h1>
      <p className="mt-2 text-sm text-stone">
        {data.runs.length === 0 ? "Cars, the coach, pickups — and who travels with whom." : `${data.runs.length} ${data.runs.length === 1 ? "run" : "runs"} on the day`}
      </p>

      <Link
        href="/day/transport/new"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90 lg:w-fit lg:px-6"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Add a car or coach
      </Link>

      <div className="mt-8 space-y-4">
        {data.runs.map((run) => {
          const aboard = guests.filter((g) => data.passengers.some((p) => p.run_id === run.id && p.contact_id === g.id));
          const others = guests.filter((g) => !aboard.includes(g));
          return (
            <section key={run.id} className="rounded-2xl border border-linen bg-white p-4">
              <Link href={`/day/transport/${run.id}`} className="flex items-baseline gap-4 hover:opacity-80">
                <span className="w-20 shrink-0 font-display text-2xl leading-tight text-champagne-600">{formatTime(run.at_time)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-ink">{run.vehicle}</span>
                  {(run.from_place || run.to_place) && (
                    <span className="block text-sm text-stone">{[run.from_place, run.to_place].filter(Boolean).join(" → ")}</span>
                  )}
                  {run.notes && <span className="mt-1 block text-sm text-stone">{run.notes}</span>}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 self-center text-stone" strokeWidth={1.8} aria-hidden />
              </Link>

              {aboard.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {aboard.map((g) => (
                    <li key={g.id} className="flex items-center gap-1 rounded-full bg-cream py-1 pl-3 pr-1 text-sm text-ink">
                      {fullName(g)}
                      <form action={removePassengerAction.bind(null, run.id, g.id)}>
                        <button type="submit" aria-label={`Take ${g.first_name} off ${run.vehicle}`} className="p-1 text-stone hover:text-ink">
                          <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              {others.length > 0 && (
                <form action={addPassengerAction.bind(null, run.id)} className="mt-3 flex gap-2">
                  <select name="guest" required defaultValue="" aria-label={`Add someone to ${run.vehicle}`} className={`${pill} flex-1`}>
                    <option value="" disabled>
                      Who&apos;s travelling?
                    </option>
                    {others.map((g) => (
                      <option key={g.id} value={g.id}>
                        {fullName(g)}
                      </option>
                    ))}
                  </select>
                  <InlineSubmit label="Add" pendingLabel="…" />
                </form>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
