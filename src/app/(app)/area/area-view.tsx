import Link from "next/link";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Plus, PoundSterling, Users, type LucideIcon } from "lucide-react";
import AddButton from "@/components/add-button";
import BudgetBar from "@/components/budget-bar";
import CopyText from "@/components/copy-text";
import { catererText, type AreaGuestFacts } from "@/lib/area-guests";
import AreaIcon from "./area-icon";
import { InlineSubmit, RemoveButton } from "@/components/form-bits";
import NoteText from "@/components/note-text";
import RichText from "@/components/rich-text";
import { areaStage, STAGES } from "@/lib/area-stage";
import { unscheduledBalances, type Money } from "@/lib/budget";
import { formatClock, formatDayMonth, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import type { InspoWithPicture } from "@/lib/db/inspo";
import type { Supplier } from "@/lib/db/suppliers";
import { formatMoney } from "@/lib/money";
import { supplierStatusLabel } from "@/lib/supplier-status";
import type { Appointment, AreaRow, Milestone, Note, Payment, RunSheetItem } from "@/types/db";
import { markPaidAction } from "../money/actions";
import { AppointmentRow } from "../plan/appointment-row";
import { MilestoneRow } from "../plan/milestone-row";
import { SupplierCards, SupplierLink } from "../people/supplier-cards";
import { StageIcon } from "../people/supplier-list";
import { areaIcon, type AreaOption } from "@/lib/areas";
import { planDate } from "@/lib/plan";
import {
  addAreaNoteAction,
  deleteAreaNoteAction,
  saveAreaDetailsAction,
  saveAreaNoteAction,
  setAreaAction,
  setAreaStageFlagAction,
} from "./actions";

const isOpen = (m: Milestone) => m.status === "todo" || m.status === "in_progress";

/** Soonest first; undated after dated. */
const byDate = (a: string | null, b: string | null) => (a ?? "9999").localeCompare(b ?? "9999");

function supplierName(s: Supplier) {
  return s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** Booked first, then quoted, then asked; not taken last. */
const STATUS_ORDER = { booked: 0, quoted: 1, enquired: 2, researching: 2, cancelled: 3 } as const;

/**
 * The cover's four tiles (one tall, two stacked, one tall). With no photos
 * saved yet these soft colours stand in for them, so every area still has a
 * cover; photos fill the tiles in order as they're saved.
 */
const PLACEHOLDERS = [
  "linear-gradient(170deg, #EDD9CE, #D3AA97)",
  "linear-gradient(170deg, #DDE4D5, #AFBFA3)",
  "linear-gradient(170deg, #F3E4DA, #E2C3B3)",
  "linear-gradient(170deg, #F5EDE1, #DCC7AC)",
];

function Tile({ photo, index }: { photo?: InspoWithPicture; index: number }) {
  if (photo?.picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo.picture} alt={photo.title ?? photo.note ?? "A saved idea"} className="h-full min-h-0 w-full object-cover" />
    );
  }
  return <span aria-hidden className="block h-full w-full" style={{ background: PLACEHOLDERS[index] }} />;
}

/** The box notes and key facts are typed into. */
const NOTE_BOX =
  "w-full resize-y rounded-xl border border-linen bg-ivory px-3 py-2 text-[15px] leading-relaxed text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30";

const glassButton = "glass-card flex h-11 items-center justify-center rounded-full text-ink hover:border-champagne-400";

/**
 * The top of the page: the area's saved pictures as a collage, the name on a
 * fade at the bottom. Tapping the collage opens the area's Inspo folder; with
 * nothing saved, a camera in the middle invites the first one. The "⋯" holds
 * the rarely-used "take off the hub" and "stop planning this".
 */
function AreaCover({
  area,
  photos,
  ideaCount,
  canDiy,
}: {
  area: AreaRow;
  photos: InspoWithPicture[];
  ideaCount: number;
  /** Nothing booked yet, so "We're doing this ourselves" is on offer in the ⋯ menu. */
  canDiy: boolean;
}) {
  const from = encodeURIComponent(`/area/${area.key}`);
  const saveHref = `/inspo/new?folder=${encodeURIComponent(area.key)}&from=${from}`;
  const galleryHref = `/inspo?folder=${encodeURIComponent(area.key)}`;

  const collage = (
    <span className="absolute inset-0 grid grid-cols-3 gap-[3px]">
      <Tile photo={photos[0]} index={0} />
      <span className="grid min-h-0 grid-rows-2 gap-[3px]">
        <Tile photo={photos[1]} index={1} />
        <Tile photo={photos[2]} index={2} />
      </span>
      <Tile photo={photos[3]} index={3} />
    </span>
  );

  return (
    <div className={`relative -mx-[var(--gutter)] -mt-[max(2.5rem,env(safe-area-inset-top))] overflow-hidden md:mx-0 md:mt-0 md:rounded-3xl ${
        // Shorter until there are pictures (owner, 16 Oct 2026): empty tiles shouldn't take a third of the screen.
        photos.length > 0 ? "h-[300px] md:h-[360px]" : "h-[220px] md:h-[240px]"
      }`}>
      {/* Nothing saved yet: the soft tiles open "Save an idea" too (the button up top does the same). */}
      <Link
        href={photos.length > 0 ? galleryHref : saveHref}
        aria-label={photos.length > 0 ? `See all ${plural(ideaCount, "saved idea")}` : "Save an idea"}
      >
        {collage}
      </Link>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-b from-[#FBF7F0]/0 via-[#FBF7F0]/85 to-[#FAF5EE]"
      />

      <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] flex justify-between gap-2">
        <Link href="/" aria-label="Back to the hub" className={`${glassButton} w-11`}>
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </Link>
        <div className="flex gap-2">
          <Link href={saveHref} className={`${glassButton} gap-1.5 px-4 text-sm`}>
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Save an idea
          </Link>
          {(area.show_on_hub || canDiy) && (
            <details className="relative">
              <summary aria-label="More" className={`${glassButton} w-11 cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
              </summary>
              <div className="absolute right-0 top-full z-10 mt-2 w-60 rounded-[18px] bg-white p-2 shadow-[0_18px_40px_-16px_rgba(60,50,40,0.45)]">
                {canDiy && (
                  <form action={setAreaStageFlagAction.bind(null, area.id, area.key, "diy", true)}>
                    <button type="submit" className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-cream">
                      We&apos;re doing this ourselves
                    </button>
                  </form>
                )}
                {area.show_on_hub && (
                <>
                <form action={setAreaAction.bind(null, area.id, area.key, "hide")}>
                  <button type="submit" className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-cream">
                    Take off the hub
                  </button>
                </form>
                <form action={setAreaAction.bind(null, area.id, area.key, "stop")}>
                  <button type="submit" className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-cream">
                    Stop planning this
                  </button>
                </form>
                </>
                )}
              </div>
            </details>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-6 bottom-2 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AreaIcon id={area.id} areaKey={area.key} icon={area.icon ?? null} />
          <h1 className="type-display min-w-0 text-[48px] leading-none md:text-6xl">{area.label}</h1>
        </div>
        {ideaCount > 0 && (
          <Link href={galleryHref} className="pointer-events-auto mb-2 shrink-0 text-[13px] text-champagne-600 hover:text-ink">
            {plural(ideaCount, "idea")} ›
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Dream · Compare · Book · Pay · Ready: small dots on a hairline, labelled in
 * the type system's capitals. Done is champagne, now is ink with a soft halo,
 * still to come is a fine gold ring.
 */
function StageStrip({ done, current }: { done: boolean[]; current: number }) {
  const filled = Math.max(done.lastIndexOf(true), 0);
  return (
    <div className="relative">
      <div aria-hidden className="absolute left-[10%] right-[10%] top-[5px] h-px bg-champagne-400/70" />
      <div aria-hidden className="absolute left-[10%] top-[5px] h-px bg-champagne-600" style={{ width: `${filled * 20}%` }} />
      <ol className="relative grid grid-cols-5">
        {STAGES.map((name, i) => {
          const now = i === current;
          return (
            <li key={name} aria-current={now ? "step" : undefined} className="flex flex-col items-center">
              <span
                aria-hidden
                className={`h-[11px] w-[11px] rounded-full ${
                  done[i]
                    ? "bg-champagne-600"
                    : now
                      ? "bg-ink shadow-[0_0_0_4px_theme(colors.champagne.100)]"
                      : "border border-champagne-400 bg-ivory"
                }`}
              />
              <span
                className={`mt-2.5 text-xs font-medium uppercase tracking-[0.03em] min-[360px]:tracking-[0.1em] ${
                  done[i] ? "text-champagne-600" : now ? "text-ink" : "text-stone"
                }`}
              >
                {name}
                {done[i] && <span className="sr-only"> (done)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * A section of the area page, headed like the tab it comes from (canvas 2
 * "Area page · Made of the tabs", option A, owner's pick 12 Oct 2026): the
 * tab's icon from the menu bar (owner, 12 Oct 2026 — in place of the title
 * drawings, and no line of explanation under the name), its name, and a way
 * through to the tab itself. The page is the tabs, filtered to one area.
 */
function Section({
  id,
  title,
  icon: Icon,
  seeHref,
  seeLabel,
  add,
  empty = false,
  children,
}: {
  id?: string;
  title: string;
  /** The tab's icon from the menu bar, or the area's own for its extras. */
  icon: LucideIcon;
  /** The tab narrowed to this area: the heading itself opens it. */
  seeHref?: string;
  seeLabel?: string;
  /** The round black + beside the heading (owner, 16 Oct 2026, in place of "In People ›"). */
  add?: { href: string; label: string; stays?: boolean };
  /** Nothing to show yet: just the heading and its +, no empty card. */
  empty?: boolean;
  children?: React.ReactNode;
}) {
  const heading = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0 text-champagne-600" strokeWidth={1.7} aria-hidden />
      <h2 className="label min-w-0">{title}</h2>
    </>
  );
  return (
    <section id={id} className="mt-7 scroll-mt-6">
      <div className="mb-2.5 flex min-h-10 items-center gap-2.5 px-1">
        {seeHref ? (
          <Link href={seeHref} aria-label={seeLabel} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 hover:opacity-80">
            {heading}
            <ChevronRight className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5">{heading}</div>
        )}
        {add && <AddButton href={add.href} label={add.label} scroll={add.stays ? false : undefined} />}
      </div>
      {!empty && (
        <div className="glass-card relative overflow-hidden rounded-[22px] px-4 py-0.5 [--row-bleed:16px]">{children}</div>
      )}
    </section>
  );
}

/** The "+ Add …" links at the foot of a section's card. */
function Adds({ links }: { links: { href: string; label: string; stays?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-6 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-linen">
      {links.map((l) => (
        <Link key={l.href} href={l.href} scroll={!l.stays} className="flex min-h-12 items-center text-[15px] text-champagne-600 hover:text-ink">
          <span aria-hidden>+&nbsp;</span>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

/** One line of quiet text in a card with nothing in it yet. */
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-stone">{children}</p>;
}

/** Rows folded away under one line ("2 not taken", "4 done"), opened in place. */
function Folded({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-linen">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 text-[15px] text-stone">{label}</span>
        <ChevronRight className="h-4 w-4 text-stone transition group-open:rotate-90" strokeWidth={1.8} aria-hidden />
      </summary>
      <div className="pb-1">{children}</div>
    </details>
  );
}

/**
 * A supplier on the area page: initials with the stage as a badge (like the
 * Suppliers list), the name with room to breathe, the quote on the right.
 */
function SupplierRow({ s }: { s: Supplier }) {
  const d = s.supplier_details;
  const status = d?.status ?? "enquired";
  const name = supplierName(s);
  const letters = name
    .replace(/[^\p{L} ]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <li className="border-b border-linen last:border-b-0">
      <SupplierLink id={s.id} className="flex w-full items-center gap-3 py-3">
        <span aria-hidden className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-linen bg-white font-display text-sm text-champagne-600">
          {letters}
          <span className="absolute -bottom-1 -right-1.5">
            <StageIcon status={status} badge />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={`type-item block truncate ${status === "cancelled" ? "!text-stone line-through" : ""}`}>{name}</span>
          <span className="mt-0.5 block text-[13px] text-stone">{supplierStatusLabel(status)}</span>
        </span>
        <span className="type-figure shrink-0 text-right text-xl">
          {d?.quoted_cost != null ? formatMoney(d.quoted_cost) : <span className="text-stone">—</span>}
        </span>
      </SupplierLink>
    </li>
  );
}

/** One big figure with its word, tapping through to the list it counts. */
function Figure({ value, word, href }: { value: number; word: string; href?: string }) {
  const inner = (
    <>
      <span className="type-figure block text-[34px] leading-none !font-light">{value}</span>
      <span className="type-meta mt-1 block">{word}</span>
    </>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80">
      {inner}
    </Link>
  ) : (
    <span className="block">{inner}</span>
  );
}

/** A row that opens a filtered list: a dashed circle when it's something still to sort. */
function FactRow({ href, title, line, dashed = false }: { href: string; title: string; line?: string; dashed?: boolean }) {
  return (
    <Link href={href} className="row-press flex items-center gap-3 border-t border-linen py-3">
      {dashed && <span aria-hidden className="h-6 w-6 shrink-0 rounded-full border-[1.5px] border-dashed border-champagne-400" />}
      <span className="min-w-0 flex-1">
        <span className="type-item block">{title}</span>
        {line && <span className="type-meta mt-0.5 block truncate">{line}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
    </Link>
  );
}

/**
 * Facts from the guest list, for Food & drink, Stationery and Transport
 * (canvas 2 "Area page · Facts from the guest list", option B, owner's pick
 * 12 Oct 2026): headed like People (or The Day, for transport), so the page
 * stays "the tabs, filtered to this area". Every figure opens the list it
 * counts.
 */
function GuestsSection({ facts, supplier, couple }: { facts: AreaGuestFacts; supplier?: string; couple: string }) {
  const people = "/people";
  if (facts.kind === "food") {
    const most = Math.max(1, ...facts.meals.map((m) => m.count), facts.notPicked);
    const names = facts.dietary.slice(0, 2).map((d) => `${d.name.split(" ")[0]} · ${d.note}`);
    return (
      <Section title="Guests" icon={Users} seeHref={people} seeLabel="The guest list">
        <div className={`grid gap-2 pb-3.5 pt-3.5 ${facts.eveningEventId ? "grid-cols-3" : "grid-cols-2"}`}>
          <Figure value={facts.day} word={facts.eveningEventId ? "day, coming" : "coming"} href={`${people}?show=attending${facts.dayEventId ? `&of=${facts.dayEventId}` : ""}`} />
          {facts.eveningEventId && <Figure value={facts.evening} word="evening" href={`${people}?show=attending&of=${facts.eveningEventId}`} />}
          <Figure value={facts.children} word={facts.children === 1 ? "child" : "children"} href={`${people}?show=attending&f=children`} />
        </div>
        {facts.meals.length + facts.notPicked > 0 && (
          <div className="border-t border-linen py-3.5">
            <h3 className="section-label">Meals</h3>
            <ul className="mt-2.5 grid gap-2 text-[14px]">
              {facts.meals.map((m) => (
                <li key={m.name} className="flex items-center gap-3">
                  <span className="w-[5.5rem] shrink-0 truncate">{m.name}</span>
                  <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-linen">
                    <span className="block h-1.5 rounded-full bg-champagne-600" style={{ width: `${(m.count / most) * 100}%` }} />
                  </span>
                  <span className="type-figure w-7 shrink-0 text-right text-base">{m.count}</span>
                </li>
              ))}
              {facts.notPicked > 0 && (
                <li>
                  <Link href={`${people}?show=attending`} className="flex items-center gap-3 text-champagne-600">
                    <span className="w-[5.5rem] shrink-0">Not picked</span>
                    <span aria-hidden className="h-1 flex-1 rounded-full border border-dashed border-champagne-400" />
                    <span className="type-figure w-7 shrink-0 text-right text-base !text-champagne-600">{facts.notPicked}</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
        {facts.dietary.length > 0 ? (
          <FactRow
            href={`${people}?f=dietary`}
            title={facts.dietary.length === 1 ? "1 dietary need" : `${facts.dietary.length} dietary needs`}
            line={[...names, facts.dietary.length > 2 ? `+${facts.dietary.length - 2} more` : ""].filter(Boolean).join(", ")}
          />
        ) : (
          <p className="border-t border-linen py-3.5 text-sm text-stone">No dietary needs recorded yet.</p>
        )}
        <div className="border-t border-linen">
          <CopyText text={catererText(facts, couple)} label={supplier ? `Copy the list for ${supplier}` : "Copy the list for the caterer"} />
        </div>
      </Section>
    );
  }
  if (facts.kind === "stationery") {
    return (
      <Section title="Guests" icon={Users} seeHref={people} seeLabel="The guest list">
        <div className="grid grid-cols-3 gap-2 pb-3.5 pt-3.5">
          <Figure value={facts.households} word={facts.households === 1 ? "household" : "households"} href={`${people}?view=households`} />
          <Figure value={facts.invited} word="invited" href={`${people}?show=pending`} />
          <Figure value={facts.toInvite} word="to invite" href={`${people}?show=to_invite`} />
        </div>
        {facts.noAddress.length > 0 ? (
          <FactRow
            href={`${people}?f=noaddress`}
            title={`${facts.noAddress.length} with no address yet`}
            line={[...facts.noAddress.slice(0, 3), facts.noAddress.length > 3 ? `+${facts.noAddress.length - 3}` : ""].filter(Boolean).join(", ")}
            dashed
          />
        ) : (
          facts.households > 0 && <p className="border-t border-linen py-3.5 text-sm text-stone">Every household has an address.</p>
        )}
        {facts.addresses && (
          <div className="border-t border-linen">
            <CopyText text={facts.addresses} label="Copy every address for the envelopes" />
          </div>
        )}
      </Section>
    );
  }
  return null;
}

/**
 * The area's part of the day (owner, 12 Oct 2026): its run sheet moments in
 * time order, headed like The Day with the menu's clock, "In The Day ›"
 * opening the run sheet narrowed to this area. Transport's cars and coaches,
 * and day guests still without a lift, sit here too.
 */
function DaySection({ areaKey, moments, facts }: { areaKey: string; moments: RunSheetItem[]; facts: AreaGuestFacts | null }) {
  const transport = facts?.kind === "transport" ? facts : null;
  return (
    <Section
      id="day"
      title="The Day"
      icon={Clock}
      seeHref={`/day?area=${encodeURIComponent(areaKey)}`}
      seeLabel="The Day, just this area"
      add={{ href: `/day/run-sheet/new?area=${encodeURIComponent(areaKey)}&from=area`, label: "Add a moment" }}
      empty={moments.length === 0 && !transport}
    >
      {moments.length > 0 && (
        <ul>
          {moments.map((m) => (
            <li key={m.id}>
              <Link href={`/day/run-sheet/${m.id}`} className="row-press flex items-center gap-3 border-b border-linen py-3">
                <span className="type-figure w-12 shrink-0 text-lg text-champagne-600">{formatClock(m.at_time)}</span>
                <span className="min-w-0 flex-1">
                  <span className="type-item block truncate">{m.title}</span>
                  {(m.location || m.who) && (
                    <span className="type-meta mt-0.5 block truncate">{[m.location, m.who].filter(Boolean).join(" · ")}</span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {transport && transport.runs.length > 0 && (
        <ul>
          {transport.runs.map((r) => (
            <li key={r.id}>
              <Link href={`/day/transport/${r.id}`} className="row-press flex items-center gap-3 border-b border-linen py-3">
                <span className="type-figure w-12 shrink-0 text-lg">{r.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="type-item block truncate">{r.vehicle}</span>
                  <span className="type-meta mt-0.5 block truncate">
                    {[r.route, r.people === 1 ? "1 person" : `${r.people} people`].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {transport && transport.withoutLift > 0 && (
        <FactRow
          href="/day?tab=travel"
          title={transport.withoutLift === 1 ? "1 day guest without a lift" : `${transport.withoutLift} day guests without a lift`}
          line="Tap to put them on a car"
          dashed
        />
      )}
      {transport && <Adds links={[{ href: "/day/transport/new", label: "Add a car or coach" }]} />}
    </Section>
  );
}

/**
 * One area of the wedding (screens 5 and 6 in docs/information-architecture.md):
 * the same template for every area, including ones a couple invents.
 *
 * The collage cover and the five stages ("Area page · Round 4 · One
 * template"), then the tabs, filtered to this area (canvas 2 "Area page ·
 * Made of the tabs", option A, 12 Oct 2026): People (its suppliers), Plan
 * (to-dos and appointments by date), Money (budget, agreed, paid, then the
 * payments), and the extras only an area has — key facts, notes, pictures.
 * The old supplier / to-pay / next-appointment tiles folded into those.
 */
export default function AreaView({
  area,
  milestones,
  suppliers,
  money,
  payments,
  appointments,
  notes,
  photos,
  ideaCount,
  editing,
  error,
  detail,
  areas,
  guestFacts,
  moments,
  couple,
}: {
  /** This area's run sheet moments, in time order (0017_run_sheet_area.sql). */
  moments: RunSheetItem[];
  /** Facts from the guest list, for the areas that show them (src/lib/area-guests.ts). */
  guestFacts: AreaGuestFacts | null;
  couple: string;
  area: AreaRow;
  /** The wedding's areas with their budgets, for the supplier card. */
  areas: (AreaOption & { budget?: number | null })[];
  milestones: Milestone[];
  suppliers: Supplier[];
  /** Budget, committed and paid, counted as the Money tab counts them. */
  money: Money;
  /** Payments for this area, or for one of its suppliers. */
  payments: Payment[];
  /** Appointments for this area, oldest first. */
  appointments: Appointment[];
  /** Captures filed under this area (screens 35–36). */
  notes: Note[];
  /** The latest saved ideas with a picture, for the cover (up to four). */
  photos: InspoWithPicture[];
  /** Everything in this area's Inspo folder, pictures or not. */
  ideaCount: number;
  /**
   * A box to type in, open in the Notes card: `?edit=facts` (key facts),
   * `?edit=note` (a new note) or `?edit=note:<id>` (changing that note).
   */
  editing: string | null;
  error?: string;
  detail?: string;
}) {
  const today = todayISO();
  const key = encodeURIComponent(area.key);
  const stage = areaStage(area, suppliers, money, ideaCount);

  const sorted = [...suppliers].sort(
    (a, b) => STATUS_ORDER[a.supplier_details?.status ?? "enquired"] - STATUS_ORDER[b.supplier_details?.status ?? "enquired"],
  );
  const booked = sorted.filter((s) => s.supplier_details?.status === "booked");
  const live = sorted.filter((s) => s.supplier_details?.status !== "cancelled");
  // Once someone's booked, everyone else folds away; before that, only the ones not taken.
  const shown = booked.length > 0 ? booked : live;
  const folded = sorted.filter((s) => !shown.includes(s));

  const openTodos = milestones.filter(isOpen).sort((a, b) => byDate(planDate(a), planDate(b)));
  const doneTodos = milestones.filter((m) => !isOpen(m));

  const upcoming = appointments.filter((a) => a.on_date >= today);
  const past = appointments.filter((a) => a.on_date < today).reverse();
  // Plan, as the Plan tab has it: to-dos and appointments in one list by date.
  type PlanEntry = { kind: "todo"; date: string | null; m: Milestone } | { kind: "appointment"; date: string; a: Appointment };
  const planNow: PlanEntry[] = [
    ...openTodos.map((m) => ({ kind: "todo" as const, date: planDate(m), m })),
    ...upcoming.map((a) => ({ kind: "appointment" as const, date: a.on_date, a })),
  ].sort((x, y) => byDate(x.date, y.date) || (x.kind === y.kind ? 0 : x.kind === "appointment" ? -1 : 1));
  const planDone = doneTodos.length + past.length;

  const supplierIds = new Set(suppliers.map((s) => s.id));
  const deposits = live.filter((s) => (s.supplier_details?.deposit_paid ?? 0) > 0);
  const schedule = [...payments].sort((a, b) =>
    !!a.paid_on !== !!b.paid_on ? (a.paid_on ? -1 : 1) : byDate(a.paid_on ?? a.due_date, b.paid_on ?? b.due_date),
  );
  const unscheduled = unscheduledBalances(booked, payments.filter((p) => p.contact_id && supplierIds.has(p.contact_id)));
  const toPay = Math.max(money.committed - money.paid, 0);
  const free = money.budget !== null ? money.budget - money.committed : null;
  const anyMoney = money.budget !== null || money.committed > 0 || money.paid > 0;

  const supplierNames = new Map(suppliers.map((s) => [s.id, supplierName(s)]));
  const appointmentRow = (a: Appointment, been: boolean) => (
    <AppointmentRow key={a.id} appointment={a} been={been} supplier={a.contact_id ? supplierNames.get(a.contact_id) : undefined} />
  );

  return (
    <SupplierCards suppliers={suppliers} areas={areas} payments={payments}>
    <main className="page relative pb-28 lg:pb-16">
      <AreaCover area={area} photos={photos} ideaCount={ideaCount} canDiy={booked.length === 0 && !area.diy} />

      <div className="relative mt-5 flex flex-col gap-3.5">
        {error && (
          <p role="alert" className="rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
            {error}
            {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
          </p>
        )}

        {!area.show_on_hub && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-champagne-400 px-5 py-4">
            <p className="text-sm text-ink">{area.enabled ? "Not on your hub." : "You're not planning this one."}</p>
            <form action={setAreaAction.bind(null, area.id, area.key, "bring-back")}>
              <InlineSubmit label="Put it back on the hub" pendingLabel="Adding…" />
            </form>
          </div>
        )}

        <StageStrip done={stage.done} current={stage.current} />

        {stage.current === STAGES.length - 1 && (
          <form
            action={setAreaStageFlagAction.bind(null, area.id, area.key, "ready", true)}
            className="glass-card flex items-center gap-3 rounded-[22px] px-4 py-3.5"
          >
            <p className="flex-1 text-sm text-ink">Booked and paid. Anything left to sort?</p>
            <InlineSubmit label="We're ready" pendingLabel="Saving…" primary />
          </form>
        )}
        {area.ready && (
          <form action={setAreaStageFlagAction.bind(null, area.id, area.key, "ready", false)} className="-mt-1 text-center">
            <button type="submit" className="py-1 text-xs text-stone underline underline-offset-4 hover:text-ink">
              Not ready after all
            </button>
          </form>
        )}

        <Section
          title="People"
          icon={Users}
          seeHref={`/people?tab=suppliers&f=${encodeURIComponent(`area:${area.key}`)}`}
          seeLabel={`Suppliers for ${area.label}`}
          add={{ href: `/people/suppliers/new?category=${key}`, label: "Add a supplier" }}
          empty={shown.length === 0 && folded.length === 0 && !area.diy}
        >
          {shown.length > 0 ? (
            <ul>
              {shown.map((s) => (
                <SupplierRow key={s.id} s={s} />
              ))}
            </ul>
          ) : (
            area.diy && <Empty>You&apos;re doing this yourselves.</Empty>
          )}
          {folded.length > 0 && (
            <Folded label={booked.length > 0 && folded.some((s) => s.supplier_details?.status !== "cancelled") ? plural(folded.length, "other") : `${folded.length} not taken`}>
              <ul>
                {folded.map((s) => (
                  <SupplierRow key={s.id} s={s} />
                ))}
              </ul>
            </Folded>
          )}
          {booked.length === 0 && area.diy && (
            <form
              action={setAreaStageFlagAction.bind(null, area.id, area.key, "diy", !area.diy)}
              className="border-t border-linen py-2"
            >
              <button type="submit" className="py-1.5 text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                We need a supplier after all
              </button>
            </form>
          )}
        </Section>

        {guestFacts && <GuestsSection facts={guestFacts} supplier={booked[0] ? supplierName(booked[0]) : undefined} couple={couple} />}

        <Section
          title="Plan"
          icon={CalendarDays}
          seeHref={`/plan?view=list&area=${key}`}
          seeLabel={`The plan for ${area.label}`}
          add={{ href: `/plan/new?area=${key}`, label: "Add a to-do or appointment" }}
          empty={planNow.length === 0 && planDone === 0}
        >
          {planNow.length > 0 ? (
            <ul>
              {planNow.map((e) =>
                e.kind === "todo" ? (
                  <MilestoneRow key={e.m.id} milestone={e.m} overdue={!!e.m.due_date && e.m.due_date < today} />
                ) : (
                  appointmentRow(e.a, false)
                ),
              )}
            </ul>
          ) : null}
          {planDone > 0 && (
            <Folded label={`${planDone} done`}>
              <ul>
                {doneTodos.map((m) => (
                  <MilestoneRow key={m.id} milestone={m} overdue={false} />
                ))}
                {past.map((a) => appointmentRow(a, true))}
              </ul>
            </Folded>
          )}
        </Section>

        <Section
          id="payments"
          title="Money"
          icon={PoundSterling}
          seeHref={`/money?view=month&area=${key}`}
          seeLabel={`Payments for ${area.label}`}
          add={{ href: `/money/payments/new?area=${key}`, label: "Add a payment" }}
        >
          {anyMoney ? (
            <Link href="/money/budget" className="block border-b border-linen pb-3.5 pt-3.5">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="type-figure text-[36px] leading-none !font-light">{formatMoney(money.committed)}</span>
                <span className="text-sm text-stone">
                  {money.budget !== null ? `of ${formatMoney(money.budget)} agreed` : "agreed · no budget set"}
                </span>
              </span>
              <span className="mt-3 block">
                <BudgetBar money={money} />
              </span>
              <span className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
                <span>
                  <span className="block text-champagne-600">Paid</span>
                  <span className="type-figure block text-lg !font-light !text-champagne-600">{formatMoney(money.paid)}</span>
                </span>
                <span>
                  <span className="block text-stone">To pay</span>
                  <span className="type-figure block text-lg !font-light">{formatMoney(toPay)}</span>
                </span>
                <span>
                  <span className="block text-stone">{free !== null && free < 0 ? "Over" : "Still free"}</span>
                  <span className={`type-figure block text-lg !font-light ${free !== null && free < 0 ? "!text-[#9A3F2B]" : ""}`}>
                    {free === null ? "—" : free < 0 ? `▲ ${formatMoney(-free)}` : formatMoney(free)}
                  </span>
                </span>
              </span>
            </Link>
          ) : (
            <Link href="/money/budget" className="flex items-center justify-between gap-3 border-b border-linen py-3.5">
              <span className="text-sm text-stone">No budget for {area.label} yet.</span>
              <span className="shrink-0 text-[13px] text-champagne-600">Set it ›</span>
            </Link>
          )}
          {deposits.length + schedule.length + unscheduled.length > 0 ? (
            <ul>
              {deposits.map((s) => (
                <li key={`deposit-${s.id}`} className="flex items-center gap-3 border-b border-linen py-3.5 last:border-b-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne-600 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                  </span>
                  <SupplierLink id={s.id} className="min-w-0 flex-1">
                    <span className="type-item block truncate">Deposit</span>
                    <span className="type-meta mt-1 block truncate">Paid · {supplierName(s)}</span>
                  </SupplierLink>
                  <span className="type-figure text-lg !text-stone">{formatMoney(s.supplier_details?.deposit_paid ?? 0)}</span>
                </li>
              ))}
              {schedule.map((p) => {
                const overdue = !p.paid_on && !!p.due_date && p.due_date < today;
                return (
                  <li key={p.id} className="flex items-center gap-3 border-b border-linen py-3.5 last:border-b-0">
                    <form action={markPaidAction.bind(null, p.id, !p.paid_on)}>
                      <button
                        type="submit"
                        aria-label={p.paid_on ? `Mark "${p.description}" as not paid` : `Mark "${p.description}" as paid`}
                        className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                          p.paid_on ? "bg-champagne-600 text-white" : "border border-champagne-400 bg-white hover:bg-champagne-100"
                        }`}
                      >
                        {p.paid_on && <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />}
                      </button>
                    </form>
                    <Link href={`/money/payments/${p.id}`} className="min-w-0 flex-1">
                      <span className="type-item block truncate">{p.description}</span>
                      <span className={`type-meta mt-1 block truncate ${overdue ? "!text-ink" : ""}`}>
                        {p.paid_on
                          ? `Paid ${formatDayMonth(p.paid_on)}`
                          : p.due_date
                            ? `${overdue ? "Overdue · was due" : "Due"} ${formatWeekdayDayMonth(p.due_date)}`
                            : "No date yet"}
                      </span>
                    </Link>
                    <span className={`type-figure text-lg ${p.paid_on ? "!text-stone" : ""}`}>{formatMoney(p.amount)}</span>
                  </li>
                );
              })}
              {unscheduled.map(({ supplier: s, balance }) => (
                <li key={`balance-${s.id}`} className="flex items-center gap-3 border-b border-linen py-3.5 last:border-b-0">
                  <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-champagne-400" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="type-item block truncate">Balance, not scheduled</span>
                    <Link
                      href={`/money/payments/new?supplier=${s.id}&amount=${balance}`}
                      className="block text-xs text-champagne-600 underline underline-offset-4 hover:text-ink"
                    >
                      Add a due date
                    </Link>
                  </span>
                  <span className="type-figure text-lg">{formatMoney(balance)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

        <DaySection areaKey={area.key} moments={moments} facts={guestFacts} />

        <Section
          id="notes"
          title={`Just for ${area.label}`}
          icon={areaIcon(area.key, area.icon)}
          add={{ href: `/area/${area.key}?edit=note#notes`, label: "Add a note", stays: true }}
        >
          <div className={notes.length > 0 || editing === "note" ? "border-b border-linen" : ""}>
            <div className="flex items-baseline justify-between pt-3.5">
              <h3 className="label">Key facts</h3>
              {editing !== "facts" && (
                <Link href={`/area/${area.key}?edit=facts#notes`} scroll={false} className="py-1 text-[13px] text-champagne-600 hover:text-ink">
                  {area.details ? "Edit" : "Write"}
                </Link>
              )}
            </div>
            {editing === "facts" ? (
              <form action={saveAreaDetailsAction.bind(null, area.id, area.key)} className="py-3">
                <textarea
                  name="details"
                  rows={5}
                  autoFocus
                  defaultValue={area.details ?? ""}
                  aria-label={`Key facts about ${area.label}`}
                  placeholder={"Colours, numbers, who's deciding.\n- Start a line with a dash for a bullet"}
                  className={NOTE_BOX}
                />
                <div className="mt-2 flex items-center justify-end gap-4">
                  <Link href={`/area/${area.key}#notes`} scroll={false} className="text-sm text-stone hover:text-ink">
                    Cancel
                  </Link>
                  <InlineSubmit label="Save" pendingLabel="Saving…" />
                </div>
              </form>
            ) : area.details ? (
              <RichText text={area.details} className="pb-3.5 pt-2" />
            ) : (
              <p className="pb-3.5 pt-1.5 text-sm text-stone/70">Colours, numbers, what you&apos;ve ruled out.</p>
            )}
          </div>
          {editing === "note" && (
            <form action={addAreaNoteAction.bind(null, area.key)} className="border-b border-linen py-3">
              <textarea
                name="body"
                rows={4}
                autoFocus
                aria-label={`A note about ${area.label}`}
                placeholder={"A thought, a link, a list.\n- Start a line with a dash for a bullet"}
                className={NOTE_BOX}
              />
              <div className="mt-2 flex items-center justify-end gap-4">
                <Link href={`/area/${area.key}#notes`} scroll={false} className="text-sm text-stone hover:text-ink">
                  Cancel
                </Link>
                <InlineSubmit label="Save note" pendingLabel="Saving…" />
              </div>
            </form>
          )}
          {notes.length > 0 && (
            <ul>
              {notes.map((n) =>
                editing === `note:${n.id}` ? (
                  <li key={n.id} className="border-b border-linen py-3 last:border-b-0">
                    <form action={saveAreaNoteAction.bind(null, area.key, n.id, n.body && n.url ? n.url : null)}>
                      <textarea
                        name="body"
                        rows={4}
                        autoFocus
                        defaultValue={n.body ?? n.url ?? ""}
                        aria-label="This note"
                        className={NOTE_BOX}
                      />
                      <div className="mt-2 flex items-center justify-end gap-4">
                        <Link href={`/area/${area.key}#notes`} scroll={false} className="text-sm text-stone hover:text-ink">
                          Cancel
                        </Link>
                        <InlineSubmit label="Save" pendingLabel="Saving…" />
                      </div>
                    </form>
                    <RemoveButton
                      action={deleteAreaNoteAction.bind(null, area.key, n.id)}
                      label="Remove this note"
                      question="Remove this note?"
                    />
                  </li>
                ) : (
                  <li key={n.id} className="flex items-start gap-3 border-b border-linen py-3.5 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <NoteText note={n} />
                    </div>
                    <Link href={`/area/${area.key}?edit=note:${n.id}#notes`} scroll={false} className="shrink-0 py-0.5 text-[13px] text-champagne-600 hover:text-ink">
                      Edit
                    </Link>
                  </li>
                ),
              )}
            </ul>
          )}
          <Link
            href={ideaCount > 0 ? `/inspo?folder=${key}` : `/inspo/new?folder=${key}&from=${encodeURIComponent(`/area/${area.key}`)}`}
            className="flex items-center justify-between gap-3 border-t border-linen py-3.5"
          >
            <span className="text-sm text-ink">{ideaCount > 0 ? `${plural(ideaCount, "idea")} in Inspo` : "No pictures yet"}</span>
            <span className="shrink-0 text-[13px] text-champagne-600">{ideaCount > 0 ? "See them ›" : "Save one ›"}</span>
          </Link>
        </Section>
      </div>
    </main>
    </SupplierCards>
  );
}
