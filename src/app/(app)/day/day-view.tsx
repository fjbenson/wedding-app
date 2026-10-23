import PageTitle from "@/components/page-title";
import { AlsoInTheDay, DayPill, PiecePills, PieceTiles } from "./day-pieces";
import { musicTitle } from "@/lib/music";
import Link from "next/link";
import CardLink from "@/components/card-link";
import { ChevronLeft, ChevronRight, Music, WheatOff, X } from "lucide-react";
import AddButton from "@/components/add-button";
import ViewMenu from "@/components/view-menu";
import NumbersCard from "@/components/numbers-card";
import UrlSearch from "@/components/url-search";
import SeatingSearch from "./seating-search";
import { InlineSubmit } from "@/components/form-bits";
import { coupleName as setCoupleName } from "@/lib/couple-name";
import { formatClock, formatLongDate, nowInLondon } from "@/lib/dates";
import type { Contact, Rsvp, RunSheet, RunSheetItem, Seat, SeatingTable, Stay, TransportPassenger, TransportRun } from "@/types/db";
import {
  deleteTableAction,
  seatGuestAction,
  unseatGuestAction,
  updateTableAction,
} from "./actions";
import FloorPlan from "./floor-plan";
import SendToVenue from "./send-to-venue";
import { arrangeSeats, defaultSpot } from "@/lib/seating";
import DietLine from "@/components/diet-line";
import CopyText from "@/components/copy-text";
import { needsOf } from "@/lib/dietary";
import { SheetCarousel, SheetSwipe } from "./sheet-carousel";
import FilterMenu from "@/components/filter-menu";
import { areaFilterRows, areaName, type AreaOption } from "@/lib/areas";
import PrintButton from "./print-button";
import SendSchedule from "./send-schedule";
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
  households,
  open,
  seatingView,
  coupleName,
  weddingDate,
  day,
  guests,
  rsvps,
  areas,
  area,
  sheets,
  sheet,
  query,
  error,
  detail,
  decor,
}: {
  /** The run sheets besides the main one, "The day" (0035). */
  sheets: RunSheet[];
  /** The one showing (`?sheet=<id>`); none is the main one. */
  sheet: string | null;
  /** Decor's figures for its tile: how many things, how many still to get (0027_decor.sql). */
  decor: { all: number; toGet: number };
  /** The run sheet's search (`?q=`). */
  query: string;
  tab: DayTab;
  /** Travel's places to stay (empty until 0020_travel.sql is run). */
  stays: Stay[];
  /** Groups of guests, for seating a group together (Seating only). */
  groups: { id: string; name: string; members: string[] }[];
  /** Households, for seating one together (Seating only). */
  households: { id: string; name: string }[];
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
    <main className={`page pb-40 lg:pb-16 print:p-0 ${tab === "run-sheet" ? "lg:max-w-[1640px] lg:px-12" : tab === "seating" && seatingView === "plan" ? "lg:max-w-none" : tab === "travel" ? "lg:max-w-[1040px]" : ""}`}>

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
        <Seating
          data={data}
          guests={guests}
          rsvps={rsvps}
          groups={groups}
          households={households}
          view={seatingView}
          couple={setCoupleName(coupleName)}
          date={weddingDate ? formatLongDate(weddingDate) : null}
        />
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
        <RunSheet
          items={data.runSheet}
          coupleName={coupleName}
          weddingDate={weddingDate}
          areas={areas}
          area={area}
          sheets={sheets}
          sheet={sheet}
          groups={groups}
          guests={guests}
          query={query}
          pieces={{ ...pieces(data, guests, rsvps), decor }}
        />
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
  sheets,
  sheet,
  groups,
  guests,
  query,
  pieces,
}: {
  sheets: RunSheet[];
  sheet: string | null;
  groups: { id: string; name: string; members: string[] }[];
  guests: Contact[];
  /** For the laptop's Seating and Travel tiles beside the numbers. */
  pieces: { coming: number; seated: number; noLift: number; decor: { all: number; toGet: number } };
  query: string;
  items: RunSheetItem[];
  coupleName: string;
  weddingDate: string | null;
  areas: AreaOption[];
  area: string | null;
}) {
  // The run sheet showing (0035): the main one, "The day", or another with its own moments.
  const current = sheet ? sheets.find((x) => x.id === sheet) : undefined;
  const onSheet = all.filter((i) => (i.sheet_id ?? null) === (current?.id ?? null));
  const sheetName = current?.name ?? "The day";
  // Narrowed to one area (12 Oct 2026): what an area page's "In The Day ›"
  // opens, and a copy to print for that supplier.
  const inArea =
    area === null ? onSheet : onSheet.filter((i) => (area === "none" ? !i.area_key || i.area_key === "other" : i.area_key === area));
  // The search (`?q=`): what happens, where, who, or the notes.
  const needle = query.toLowerCase();
  const items = needle
    ? inArea.filter((i) => [i.title, i.location, i.who, i.notes, i.music].some((t) => t?.toLowerCase().includes(needle)))
    : inArea;
  const areaLabel = area === "none" ? "Other" : area ? areaName(area, areas) : null;
  const forWhom = [current?.name ?? null, areaLabel].filter(Boolean).join(" · ") || null;
  // A sheet tied to a group can be emailed to them.
  const theGroup = current?.group_id ? groups.find((g) => g.id === current.group_id) : undefined;
  const groupText = theGroup
    ? [
        `${sheetName}: the order of the day`,
        `${setCoupleName(coupleName)}${weddingDate ? ` · ${formatLongDate(weddingDate)}` : ""}`,
        "",
        ...items.map((i) => `${formatClock(i.at_time)}  ${i.title}${i.location ? ` · ${i.location}` : ""}${i.notes ? `\n        ${i.notes.replace(/\n/g, " ")}` : ""}`),
      ].join("\n")
    : "";
  const groupEmails = theGroup
    ? [...new Set(guests.filter((g) => theGroup.members.includes(g.id)).map((g) => g.email?.trim()).filter((e): e is string => !!e))]
    : [];
  const sheetParam = current ? `sheet=${current.id}` : "";
  const pieceFacts = {
    seating: `${pieces.seated} of ${pieces.coming} seated`,
    travel: pieces.noLift === 0 ? "Everyone has a lift" : `${pieces.noLift} without a lift`,
    decor: pieces.decor.all === 0 ? "Nothing yet" : pieces.decor.toGet === 0 ? "All got" : `${pieces.decor.toGet} still to get`,
  };
  const addMomentHref = `/day/run-sheet/new${[area && area !== "none" ? `area=${encodeURIComponent(area)}` : "", sheetParam].filter(Boolean).length ? `?${[area && area !== "none" ? `area=${encodeURIComponent(area)}` : "", sheetParam].filter(Boolean).join("&")}` : ""}`;
  // The carousel's order: The day, then the others as listed.
  const order = [{ id: null as string | null, name: "The day" }, ...sheets.map((x) => ({ id: x.id as string | null, name: x.name }))];
  const at = order.findIndex((x) => x.id === (current?.id ?? null));
  // They go round, so the sheet you're on always has one either side from three sheets up
  // (owner, 21 Oct 2026: the main sheet sat alone at the left end); with two, just the other one.
  const n = order.length;
  const before = n >= 3 ? order[(at - 1 + n) % n] : n === 2 && at === 1 ? order[0] : undefined;
  const after = n >= 3 ? order[(at + 1) % n] : n === 2 && at === 0 ? order[1] : undefined;
  const sheetHref = (id: string | null) => (id ? `/day?sheet=${id}` : "/day");
  const momentsOf = (id: string | null) =>
    all.filter((i) => (i.sheet_id ?? null) === id).sort((a, b) => a.at_time.localeCompare(b.at_time));
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
      {/* Laptops (canvas 4 "Laptop · Round 9", 3b): the pieces as slim pills beside the title; the sheets, filter, print and + are by the sheet below. */}
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-6">
        <PageTitle drawing="day" className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">
          The Day
        </PageTitle>
        <PiecePills facts={pieceFacts} />
      </div>
      {/* Search with the black +, then Filter and Print (canvas 3 "The Day · Round 1", A, owner 17 Oct 2026). */}
      <div className="print:hidden lg:hidden">
      {/* No numbers card here (owner, 20 Oct 2026: the run sheet doesn't need KPIs). What's left is the doorway to the day's pieces (canvas 3 "The Day · Round 2", option 1). */}
      <PieceTiles
        className="mt-4 lg:max-w-xl"
        facts={pieceFacts}
      />
      <SheetCarousel
        at={at}
        sheets={order.map((x) => ({
          href: sheetHref(x.id),
          name: x.name,
          line: `${momentsOf(x.id).length} ${momentsOf(x.id).length === 1 ? "moment" : "moments"}${x.id === null ? " · everyone's" : ""}`,
        }))}
      />
      <div className="lg:mt-6 lg:flex lg:items-center lg:gap-6 lg:[&>*:first-child]:w-[520px] lg:[&>*]:mt-0">
      <UrlSearch
        initial={query}
        placeholder="Find a moment"
        end={
          <AddButton
            href={addMomentHref}
            label="Add a moment"
          />
        }
      />
      <div className="lg:flex-1">
        <FilterMenu
          base={`/day${[sheetParam, query ? `q=${encodeURIComponent(query)}` : ""].filter(Boolean).length ? `?${[sheetParam, query ? `q=${encodeURIComponent(query)}` : ""].filter(Boolean).join("&")}` : ""}`}
          start={<span aria-hidden />}
          groups={[{ param: "area", title: "Area", current: area, rows: areaFilterRows(areas) }]}
          expandable={{ results: items.length, noun: "moment" }}
          end={items.length > 0 ? <PrintButton /> : undefined}
        />
      </div>
      </div>
      </div>
      {needle && items.length === 0 && <p className="mt-6 px-1 text-sm text-stone">No moment matches that.</p>}
      {current && items.length === 0 && !needle && !area && (
        <p className="mt-6 font-display text-xl italic text-ink">Nothing on {current.name} yet. Add a moment with the +, or copy one from The day.</p>
      )}
      {forWhom && area && items.length === 0 && !needle && <p className="mt-6 font-display text-xl italic text-ink">Nothing on the day for {forWhom} yet.</p>}

      {/* Laptops: the run sheets as a carousel (canvas 4 "Laptop · Round 9", 3b,
          owner's pick 21 Oct 2026) — their names along the top, the one you're
          on in the middle, the sheets either side peeking in to flip to. */}
        <nav aria-label="Run sheets" className="mt-5 hidden flex-wrap justify-center gap-x-7 gap-y-2 lg:flex print:hidden">
          {order.map((x) => (
            <Link
              key={x.id ?? "main"}
              href={sheetHref(x.id)}
              aria-current={x.id === (current?.id ?? null) ? "page" : undefined}
              className={`border-b-[1.5px] py-1.5 text-sm ${x.id === (current?.id ?? null) ? "border-champagne-400 font-medium text-ink" : "border-transparent text-stone hover:text-ink"}`}
            >
              {x.name}
            </Link>
          ))}
          <Link href="/day/sheets/new" className="py-1.5 text-sm text-champagne-600 hover:text-ink">
            + New run sheet
          </Link>
        </nav>
      <SheetSwipe prev={n >= 2 ? sheetHref(order[(at - 1 + n) % n].id) : undefined} next={n >= 2 ? sheetHref(order[(at + 1) % n].id) : undefined}>
      <div className="relative lg:mt-5 lg:[overflow-x:clip]">
        <SheetPeek side="before" sheet={before} items={before ? momentsOf(before.id) : []} href={before ? sheetHref(before.id) : ""} />
        {/* z-10 only on a laptop: on a phone it floated over the menu bar (owner, 23 Oct 2026). */}
        <div className="relative min-w-0 lg:z-10 lg:mx-auto lg:max-w-xl">
          {/* Laptops: Filter, Print and the + by the sheet, not in a row of their own. */}
          <div className="hidden items-center justify-end gap-1 pb-3 lg:flex print:hidden">
            <FilterMenu
              base={`/day${[sheetParam, query ? `q=${encodeURIComponent(query)}` : ""].filter(Boolean).length ? `?${[sheetParam, query ? `q=${encodeURIComponent(query)}` : ""].filter(Boolean).join("&")}` : ""}`}
              start={<span aria-hidden />}
              groups={[{ param: "area", title: "Area", current: area, rows: areaFilterRows(areas) }]}
              expandable={{ results: items.length, noun: "moment" }}
            />
            {items.length > 0 && <PrintButton />}
            <span className="ml-2">
              <AddButton href={addMomentHref} label="Add a moment" />
            </span>
          </div>
      {items.length > 0 && (
        <article className="mt-6 rounded bg-white p-2.5 shadow-[0_1px_2px_rgb(60_45_20/0.06),0_14px_34px_rgb(60_45_20/0.10)] lg:mx-0 lg:max-w-none print:shadow-none">
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
                        <CardLink
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
                            {item.music && (
                              <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-champagne-600">
                                <Music className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-label="Music" />
                                {musicTitle(item)}
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
                        </CardLink>
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
        </div>
        <SheetPeek side="after" sheet={after} items={after ? momentsOf(after.id) : []} href={after ? sheetHref(after.id) : ""} />
        {before && <SheetArrow side="before" name={before.name} href={sheetHref(before.id)} />}
        {after && <SheetArrow side="after" name={after.name} href={sheetHref(after.id)} />}
      </div>
      </SheetSwipe>
      {theGroup && items.length > 0 && (
        <div className="mx-auto mt-4 max-w-xl print:hidden">
          <SendSchedule group={theGroup.name} subject={`${sheetName}: the order of the day`} text={groupText} emails={groupEmails} />
        </div>
      )}
      {current && (
        <p className="mt-4 text-center print:hidden">
          <Link href={`/day/sheets/${current.id}`} className="text-[14px] text-champagne-600 underline underline-offset-4 hover:text-ink">
            Edit this run sheet ›
          </Link>
        </p>
      )}
    </>
  );
}

/**
 * A neighbouring run sheet tucked behind the one you're on (laptops only;
 * canvas 4 "Laptop · Round 9", 3b): its name and its first moments, faded
 * towards the foot, the part beyond the main sheet showing. The whole of it
 * flips to that sheet.
 */
function SheetPeek({
  side,
  sheet,
  items,
  href,
}: {
  side: "before" | "after";
  sheet?: { id: string | null; name: string };
  items: RunSheetItem[];
  href: string;
}) {
  if (!sheet) return null;
  const shown = items.slice(0, 8);
  return (
    <Link
      href={href}
      aria-label={`${side === "before" ? "Previous" : "Next"} run sheet: ${sheet.name}`}
      className={`absolute top-10 hidden h-[34rem] w-[24rem] overflow-hidden rounded-[20px] bg-white/70 py-7 opacity-60 shadow-[0_14px_34px_rgb(60_45_20/0.08)] transition [mask-image:linear-gradient(to_bottom,black_55%,transparent)] hover:opacity-90 lg:block [html[data-card-beside]_&]:max-[1719px]:!hidden print:!hidden ${
        side === "before" ? "right-[calc(50%+8rem)] pl-7 pr-[11rem]" : "left-[calc(50%+8rem)] pl-[11rem] pr-7"
      }`}
    >
      <span className="block truncate font-display text-[24px] italic text-ink">{sheet.name}</span>
      <span className="mt-4 block space-y-2.5">
        {shown.map((i) => (
          <span key={i.id} className="flex gap-3 text-sm text-stone">
            <span className="tabular-nums text-champagne-600">{formatClock(i.at_time)}</span>
            <span className="min-w-0 truncate">{i.title}</span>
          </span>
        ))}
        {items.length === 0 && <span className="block text-sm italic text-stone">Nothing on it yet</span>}
      </span>
    </Link>
  );
}

/** The round ‹ › on the main sheet's edges that flip to the sheet either side. */
function SheetArrow({ side, name, href }: { side: "before" | "after"; name: string; href: string }) {
  const Icon = side === "before" ? ChevronLeft : ChevronRight;
  return (
    <Link
      href={href}
      aria-label={`${side === "before" ? "Previous" : "Next"} run sheet: ${name}`}
      className={`absolute top-[20rem] z-20 hidden h-11 w-11 items-center justify-center rounded-full border border-linen bg-white text-ink shadow-[0_8px_20px_-10px_rgb(60_50_40/0.4)] hover:border-champagne-400 lg:flex print:!hidden ${
        side === "before" ? "left-[calc(50%-18rem-3.25rem)]" : "right-[calc(50%-18rem-3.25rem)]"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
    </Link>
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
/** The Seating and Travel figures for the laptop's tiles beside the run sheet's numbers. */
function pieces(data: DayData, guests: Contact[], rsvps: Rsvp[]) {
  const coming = comingGuests(guests, rsvps);
  const seatedIds = new Set(data.seats.map((s) => s.contact_id));
  const onBoard = new Set(data.passengers.map((p) => p.contact_id));
  return {
    coming: coming.length,
    seated: coming.filter((g) => seatedIds.has(g.id)).length,
    noLift: coming.filter((g) => !onBoard.has(g.id) && !g.own_way).length,
  };
}

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
  households,
  view,
  couple,
  date,
}: {
  data: DayData;
  guests: Contact[];
  rsvps: Rsvp[];
  groups: { id: string; name: string; members: string[] }[];
  households: { id: string; name: string }[];
  /** For the plan sent to the venue. */
  couple: string;
  date: string | null;
  view: "plan" | "list";
}) {
  const coming = comingGuests(guests, rsvps);
  const tableOf = new Map(data.seats.map((s) => [s.contact_id, s.table_id]));
  const unseated = coming.filter((g) => !tableOf.has(g.id));
  const seats = data.tables.reduce((sum, t) => sum + t.capacity, 0);
  const seated = coming.length - unseated.length;
  // Each guest's dietary needs (on whichever answer holds them, as the caterer's list does).
  const needs: Record<string, string[]> = {};
  for (const r of rsvps) {
    const list = needsOf(r.dietary_notes);
    if (list.length && !needs[r.contact_id]) needs[r.contact_id] = list;
  }
  // The plan for the venue: each table where it stands, its guests chair by chair.
  const person = (g: Contact) => ({ name: fullName(g), needs: needs[g.id] ?? [] });
  const chairOf = new Map(data.seats.map((s) => [s.contact_id, s.seat_no ?? null]));
  const venueTables = data.tables.map((t, i) => {
    const here = coming
      .filter((g) => tableOf.get(g.id) === t.id)
      .sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }));
    const byId = new Map(here.map((g) => [g.id, g]));
    const spot = t.pos_x != null && t.pos_y != null ? { x: t.pos_x, y: t.pos_y } : defaultSpot(i);
    return {
      name: t.name,
      shape: t.shape ?? "round",
      capacity: t.capacity,
      x: spot.x,
      y: spot.y,
      guests: arrangeSeats(here.map((g) => g.id), chairOf, t.capacity).flatMap((id) => (id ? [person(byId.get(id)!)] : [])),
    };
  });

  const plan = view === "plan";
  const viewMenu = (
    <ViewMenu
      options={[
        { label: "Floor plan", href: "/day?tab=seating", active: view === "plan" },
        { label: "List", href: "/day?tab=seating&view=list", active: view === "list" },
      ]}
    />
  );

  return (
    <>
      {/* On a laptop the floor plan gets the whole screen (canvas 4 "Laptop · Round 11", A): one header row, no numbers card or search above it. */}
      <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div>
          <DayPill />
          <PageTitle drawing="day" spacing="mt-3" className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">
            Seating
          </PageTitle>
        </div>
        {plan && (
          <div className="hidden items-center gap-5 lg:flex">
            {viewMenu}
            <span className="text-sm tabular-nums text-stone">
              {seated} of {coming.length} seated
            </span>
            {data.tables.length > 0 && <SendToVenue couple={couple} date={date} tables={venueTables} unseated={unseated.map(person)} />}
            <AddButton href="/day/tables/new" label="Add a table" />
          </div>
        )}
      </div>
      {/* The tab's numbers, search with the black +, then View (canvas 3 "The Day · Round 1", A, owner 17 Oct 2026). */}
      <div className={plan ? "lg:hidden" : ""}>
        <NumbersCard
          big={{ label: "Seated", value: seated, sub: `of ${coming.length} coming` }}
          rows={[
            { value: unseated.length, label: "To seat" },
            { value: data.tables.length, label: data.tables.length === 1 ? "Table" : "Tables" },
            { value: Math.max(seats - seated, 0), label: "Seats free" },
          ]}
        />
        <SeatingSearch
          guests={coming.map((g) => {
            const t = tableOf.get(g.id);
            return { id: g.id, name: fullName(g), table: t ? (data.tables.find((x) => x.id === t)?.name ?? null) : null };
          })}
          tables={data.tables.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity, count: coming.filter((g) => tableOf.get(g.id) === t.id).length }))}
        />
      </div>
      <div className={`mt-3 flex min-h-9 items-center justify-between gap-3 px-1 ${plan ? "lg:hidden" : ""}`}>
        {viewMenu}
        {data.tables.length > 0 && <SendToVenue couple={couple} date={date} tables={venueTables} unseated={unseated.map(person)} />}
      </div>

      {view === "plan" ? (
        <FloorPlan tables={data.tables} seats={data.seats} guests={coming} groups={groups} households={households} needs={needs} />
      ) : (
        <SeatingList data={data} coming={coming} unseated={unseated} tableOf={tableOf} needs={needs} />
      )}
      <DietaryByTable tables={data.tables} coming={coming} tableOf={tableOf} needs={needs} />
      <AlsoInTheDay current="seating" />
    </>
  );
}

/**
 * Every dietary need, table by table — what the venue's kitchen has to know
 * (owner, 19 Oct 2026: "really, really important"). Copy it to send on.
 * Health data: for the catering only.
 */
function DietaryByTable({
  tables,
  coming,
  tableOf,
  needs,
}: {
  tables: SeatingTable[];
  coming: Contact[];
  tableOf: Map<string, string>;
  needs: Record<string, string[]>;
}) {
  const withNeeds = coming.filter((g) => needs[g.id]?.length);
  if (withNeeds.length === 0) return null;
  const blocks = [
    ...tables.map((t) => ({ name: t.name, guests: withNeeds.filter((g) => tableOf.get(g.id) === t.id) })),
    { name: "Not seated yet", guests: withNeeds.filter((g) => !tableOf.has(g.id)) },
  ].filter((b) => b.guests.length > 0);
  const text = [
    "Dietary needs by table",
    ...blocks.map((b) => [b.name, ...b.guests.map((g) => `- ${fullName(g)}: ${needs[g.id].join(", ")}`)].join("\n")),
  ].join("\n\n");

  return (
    <section className="glass-card mt-8 rounded-[22px] px-4 pb-1 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="section-label">Dietary needs by table</h2>
        <span className="text-[13px] text-stone">{withNeeds.length === 1 ? "1 guest" : `${withNeeds.length} guests`}</span>
      </div>
      {/* Laptop: a table to a column (owner, 23 Oct 2026). */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
      {blocks.map((b) => (
        <div key={b.name} className="mt-3 border-t border-ink/[0.12] pt-2.5">
          <p className="font-display text-[17px] text-ink">{b.name}</p>
          <ul className="mt-1 space-y-1.5 pb-1">
            {b.guests.map((g) => (
              <li key={g.id} className="text-[15px] text-ink">
                {fullName(g)}
                <DietLine needs={needs[g.id]} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      </div>
      <CopyText text={text} label="Copy for the venue" className="mt-1 border-t border-ink/[0.12]" />
    </section>
  );
}

function SeatingList({
  data,
  coming,
  unseated,
  tableOf,
  needs,
}: {
  data: DayData;
  coming: Contact[];
  unseated: Contact[];
  tableOf: Map<string, string>;
  needs: Record<string, string[]>;
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
              {atTable.some((g) => needs[g.id]?.length) && (
                <p className="mt-1 flex items-center gap-1 text-[13px] text-[#9A3F2B]">
                  <WheatOff aria-hidden className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {atTable.filter((g) => needs[g.id]?.length).length} with dietary needs
                </p>
              )}

              <ul className="mt-2">
                {atTable.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 border-b border-linen py-1.5 last:border-b-0">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-ink">
                        {fullName(g)}
                        {g.role_on_the_day && <span className="ml-2 text-xs text-champagne-600">{g.role_on_the_day}</span>}
                      </span>
                      {needs[g.id]?.length ? <DietLine needs={needs[g.id]} /> : null}
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
