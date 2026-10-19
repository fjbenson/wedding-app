import Link from "next/link";
import CardLink from "@/components/card-link";
import QuoteCompare from "@/components/quote-compare";
import AddMenu, { type AddChoice } from "@/components/add-menu";
import { planChoices } from "@/components/add-choices";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, ImagePlus, ListChecks, MoreHorizontal, Music, NotebookPen, Plus, PoundSterling, Undo2, UtensilsCrossed, Users, WheatOff, Wine, type LucideIcon } from "lucide-react";
import OpenOnHash from "./open-on-hash";
import PaymentRow from "@/components/payment-row";
import DateStamp from "@/components/date-stamp";
import BudgetBar from "@/components/budget-bar";
import CopyText from "@/components/copy-text";
import { catererText, type AreaGuestFacts } from "@/lib/area-guests";
import AreaIcon from "./area-icon";
import { InlineSubmit, RemoveButton } from "@/components/form-bits";
import NoteText from "@/components/note-text";
import RichText from "@/components/rich-text";
import { areaStage, STAGES } from "@/lib/area-stage";
import { decorNextUp } from "@/lib/decor";
import type { DecorWithHelpers } from "@/lib/db/decor";
import type { DecorPerson } from "../decor/decor-people";
import { DecorThings } from "../decor/decor-things";
import type { ListWithItems } from "@/lib/db/lists";
import { ListCard, ListRows } from "../lists/list-bits";
import { startSoundCheckAction } from "../lists/actions";
import { musicTitle, playedByLabel, SOUND_CHECK } from "@/lib/music";
import { unscheduledBalances, type Money } from "@/lib/budget";
import { formatClock, formatDayMonth, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import type { InspoWithPicture } from "@/lib/db/inspo";
import type { Supplier } from "@/lib/db/suppliers";
import { formatMoney } from "@/lib/money";
import { supplierStatusLabel } from "@/lib/supplier-status";
import type { Appointment, AreaRow, Milestone, Note, Payment, RunSheetItem } from "@/types/db";
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
  unbookSupplierAction,
} from "./actions";

/** A quiet "go back a stage" button: a small back arrow and the words (feedback item 1, 19 Oct 2026). */
function StepBack({ label }: { label: string }) {
  return (
    <button type="submit" className="mt-2 flex items-center gap-1.5 py-1 text-[13px] text-stone hover:text-ink">
      <Undo2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
      <span className="underline underline-offset-4">{label}</span>
    </button>
  );
}

const isOpen = (m: Milestone) => m.status === "todo" || m.status === "in_progress";

/** Soonest first; undated after dated. */
const byDate = (a: string | null, b: string | null) => (a ?? "9999").localeCompare(b ?? "9999");

function supplierName(s: Supplier) {
  return s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");
}

const dishCount = (n: number) => `${n} ${n === 1 ? "dish" : "dishes"}`;

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
  const k = encodeURIComponent(area.key);
  const addChoices: AddChoice[] = [
    { icon: <Users />, title: "A supplier", line: "Someone to ask for a quote", href: `/people/suppliers/new?category=${k}` },
    ...planChoices({ area: area.key }),
    { icon: <PoundSterling />, title: "A payment", line: "Something to pay, or already paid", href: `/money/payments/new?area=${k}` },
    { icon: <Clock />, title: "A moment on the day", line: "For the run sheet", href: `/day/run-sheet/new?area=${k}&from=area` },
    { icon: <ImagePlus />, title: "An idea", line: "A picture or a link", href: saveHref },
    { icon: <NotebookPen />, title: "A note", line: `Just for ${area.label}`, href: `/area/${k}?edit=note#notes` },
  ];

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
        {/* The page's one black +: pick what to add to this area (owner, 17 Oct 2026). */}
        <span className="pointer-events-auto mb-1 shrink-0">
          <AddMenu label={`Add to ${area.label}`} title={`Add to ${area.label}`} choices={addChoices} />
        </span>
      </div>
    </div>
  );
}

/**
 * One line of "Everything for …" (canvas 3 "Area page · Round 5", A's cards,
 * owner 17 Oct 2026): the tab's icon, its name and a one-line summary;
 * tapping opens what it holds in place, with a way through to the tab
 * narrowed to this area and its add link at the foot. The page's one black +
 * sits by the area's name; these adds are quiet links.
 */
export interface FoodSummary {
  courses: { id: string; name: string; time: string | null; dishes: number }[];
  drinks: { id: string; name: string; quantity: number | null; unit: string | null; status: string }[];
}

function Everything({
  id,
  icon: Icon,
  title,
  line,
  see,
  add,
  open = false,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  line: string;
  see?: { href: string; label: string };
  add?: { href: string; label: string; stays?: boolean };
  open?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <details id={id} open={open} className="group scroll-mt-6 border-b border-ink/[0.12] last:border-b-0">
      <summary className="row-press flex cursor-pointer list-none items-center gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
          <Icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="type-item block truncate">{title}</span>
          <span className="mt-0.5 block truncate text-[13px] text-stone">{line}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-stone transition group-open:rotate-180" strokeWidth={1.8} aria-hidden />
      </summary>
      <div className="pb-2">
        {children}
        {(add || see) && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 border-t border-linen">
            {add ? (
              <Link href={add.href} scroll={!add.stays} className="flex min-h-12 items-center text-[15px] text-champagne-600 hover:text-ink">
                <span aria-hidden>+&nbsp;</span>
                {add.label}
              </Link>
            ) : (
              <span />
            )}
            {see && (
              <Link href={see.href} className="flex min-h-12 items-center text-[13px] text-stone hover:text-ink">
                {see.label} ›
              </Link>
            )}
          </div>
        )}
      </div>
    </details>
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
      <>
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
            href={`${people}?f=dietary&view=diet`}
            title={facts.dietary.length === 1 ? "1 dietary need" : `${facts.dietary.length} dietary needs`}
            line={[...names, facts.dietary.length > 2 ? `+${facts.dietary.length - 2} more` : ""].filter(Boolean).join(", ")}
          />
        ) : (
          <p className="border-t border-linen py-3.5 text-sm text-stone">No dietary needs recorded yet.</p>
        )}
        <div className="border-t border-linen">
          <CopyText text={catererText(facts, couple)} label={supplier ? `Copy the list for ${supplier}` : "Copy the list for the caterer"} />
        </div>
      </>
    );
  }
  if (facts.kind === "stationery") {
    return (
      <>
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
      </>
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
function DaySection({
  moments,
  facts,
  musicFor,
  areaKey,
  areaLabels = {},
  soundCheck,
}: {
  moments: RunSheetItem[];
  facts: AreaGuestFacts | null;
  /** The Music area: the couple's names, for "Copy for the band or DJ" (owner, 19 Oct 2026: music belongs in The Day). */
  musicFor?: string | null;
  /** This page's area, so a moment from another one says which (Cake, Venue…). */
  areaKey?: string;
  areaLabels?: Record<string, string>;
  /** The Music area: its Sound check list, or null to offer one (undefined elsewhere). */
  soundCheck?: ListWithItems | null;
}) {
  const withMusic = moments.filter((m) => m.music || m.music_url);
  const transport = facts?.kind === "transport" ? facts : null;
  return (
    <>
      {moments.length > 0 && (
        <ul>
          {moments.map((m) => (
            <li key={m.id}>
              <CardLink href={`/day/run-sheet/${m.id}`} className="row-press flex items-center gap-3 border-b border-linen py-3">
                <span className="type-figure w-12 shrink-0 text-lg text-champagne-600">{formatClock(m.at_time)}</span>
                <span className="min-w-0 flex-1">
                  <span className="type-item block truncate">{m.title}</span>
                  {(m.location || m.who) && (
                    <span className="type-meta mt-0.5 block truncate">{[m.location, m.who].filter(Boolean).join(" · ")}</span>
                  )}
                  {m.music && (
                    <span className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-champagne-600">
                      <Music className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-label="Music" />
                      {musicTitle(m)}
                    </span>
                  )}
                  {/* How it's played, and the moment's own area when it isn't this one (owner, 19 Oct 2026). */}
                  {musicFor && (m.music_played || m.music_who || (m.area_key && m.area_key !== areaKey)) && (
                    <span className="type-meta mt-0.5 block truncate">
                      {[playedByLabel(m.music_played), m.music_who && `${m.music_who} presses play`, m.area_key && m.area_key !== areaKey ? areaLabels[m.area_key] ?? null : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
              </CardLink>
            </li>
          ))}
        </ul>
      )}
      {musicFor && withMusic.length > 0 && (
        <div className="py-3">
          <CopyText
            text={[
              `Music for ${musicFor}`,
              "",
              ...withMusic.map((m) =>
                [
                  `${formatClock(m.at_time)}  ${m.title}: ${musicTitle(m) ?? ""}`,
                  [playedByLabel(m.music_played) && `Played by: ${playedByLabel(m.music_played)}`, m.music_who && `Presses play: ${m.music_who}`, m.music_url].filter(Boolean).join("  "),
                ]
                  .filter(Boolean)
                  .join("\n      "),
              ),
            ].join("\n")}
            label="Copy for the band or DJ"
          />
        </div>
      )}
      {/* The backup plan (owner, 19 Oct 2026: is there a backup if the sound fails?). */}
      {soundCheck !== undefined &&
        (soundCheck ? (
          <ListRows lists={[soundCheck]} />
        ) : (
          <form action={startSoundCheckAction.bind(null, areaKey ?? "music")} className="border-t border-linen">
            <button type="submit" className="flex min-h-12 w-full items-center gap-2 text-left text-[15px] text-champagne-600 hover:text-ink">
              <ListChecks className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Start a sound check list
              <span className="text-[13px] text-stone">· backups, offline playlists, a mic</span>
            </button>
          </form>
        ))}
      {transport && transport.runs.length > 0 && (
        <ul>
          {transport.runs.map((r) => (
            <li key={r.id}>
              <Link href={`/day?tab=travel&open=run:${r.id}`} className="row-press flex items-center gap-3 border-b border-linen py-3">
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
    </>
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
  food,
  moments,
  couple,
  decor,
  music,
  lists = [],
}: {
  /** Lists filed under this area (0029_lists.sql); they live with Your notes. */
  lists?: ListWithItems[];
  /** The Music area: its The Day part also holds every moment with a song (0028). */
  music?: boolean;
  /** The Decor area only: its things, in place of the five stages (0027_decor.sql). */
  decor?: { items: DecorWithHelpers[]; people: DecorPerson[]; weddingDate: string | null } | null;
  /** This area's run sheet moments, in time order (0017_run_sheet_area.sql). */
  moments: RunSheetItem[];
  /** Facts from the guest list, for the areas that show them (src/lib/area-guests.ts). */
  guestFacts: AreaGuestFacts | null;
  /** Food & drink only: the menu's courses and the drinks, for their two lines (0024). */
  food?: FoodSummary | null;
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
  // Two or more quotes in and no one booked yet: compare them against the budget.
  const quotes =
    booked.length === 0
      ? live
          .filter((s) => s.supplier_details?.status === "quoted" && (s.supplier_details?.quoted_cost ?? 0) > 0)
          .map((s) => ({ id: s.id, name: supplierName(s), quote: Number(s.supplier_details!.quoted_cost) }))
      : [];

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

  // ── The page's summary (canvas 3 "Area page · Round 5", B + A, owner 17 Oct 2026) ──
  const statusOf = (s: Supplier) => s.supplier_details?.status ?? "enquired";
  const quoted = live.filter((s) => statusOf(s) === "quoted");
  const inTouch = live.filter((s) => statusOf(s) === "enquired" || statusOf(s) === "researching");
  const room = money.budget !== null ? money.budget - money.committed : null;
  const unpaid = schedule.filter((p) => !p.paid_on);
  const paidList = schedule.filter((p) => p.paid_on);
  const vsBudget = (amount: number) =>
    room === null ? formatMoney(amount) : amount > room ? `${formatMoney(amount)}, ${formatMoney(amount - room)} over budget` : `${formatMoney(amount)}, ${formatMoney(room - amount)} under budget`;
  const quietLink = "text-[15px] text-champagne-600 hover:text-ink";

  // What to do next: one line, worked out from the stage you're at.
  let next: { title: string; line?: string; action?: React.ReactNode };
  if (stage.current === 0) {
    next = {
      title: "Save a first idea",
      line: "A picture, a link, or a few key facts.",
      action: (
        <Link href={`/inspo/new?folder=${key}&from=${encodeURIComponent(`/area/${area.key}`)}`} className={quietLink}>
          Save an idea ›
        </Link>
      ),
    };
  } else if (stage.current === 1) {
    next =
      inTouch.length > 0
        ? {
            title: `Get a quote from ${supplierName(inTouch[0])}`,
            line: inTouch.length > 1 ? `And ${plural(inTouch.length - 1, "other")} you're in touch with.` : undefined,
            action: <SupplierLink id={inTouch[0].id} className={quietLink}>Open their card ›</SupplierLink>,
          }
        : {
            title: `Find someone for ${area.label.toLowerCase()}`,
            line: "Add a supplier you'd like a quote from.",
            action: <Link href={`/people/suppliers/new?category=${key}`} className={quietLink}>Add a supplier ›</Link>,
          };
  } else if (stage.current === 2) {
    const q = quotes[0];
    next =
      quotes.length >= 2
        ? {
            title: `Pick between your ${quotes.length} quotes`,
            line: (() => {
              const cheapest = [...quotes].sort((a, b) => a.quote - b.quote)[0];
              return `Cheapest: ${cheapest.name}, ${vsBudget(cheapest.quote)}.`;
            })(),
          }
        : q
          ? {
              title: `Book ${q.name}, or get another quote`,
              line: `${vsBudget(q.quote)}.`,
              action: <SupplierLink id={q.id} className={quietLink}>Open their card ›</SupplierLink>,
            }
          : { title: "Book a supplier", line: "Open their card and set them to Booked." };
  } else if (stage.current === 3) {
    const p = unpaid[0];
    next = p
      ? {
          title: `Pay ${p.description}`,
          line: `${formatMoney(p.amount)}${p.due_date ? ` by ${formatWeekdayDayMonth(p.due_date)}` : ""}.`,
          action: <CardLink href={`/money/payments/${p.id}`} className={quietLink}>Open it ›</CardLink>,
        }
      : unscheduled[0]
        ? {
            title: `Put a date on ${supplierName(unscheduled[0].supplier)}'s balance`,
            line: `${formatMoney(unscheduled[0].balance)} still to pay.`,
            action: (
              <Link href={`/money/payments/new?supplier=${unscheduled[0].supplier.id}&amount=${unscheduled[0].balance}`} className={quietLink}>
                Add a due date ›
              </Link>
            ),
          }
        : { title: "Add what you owe", line: "The deposit and balance, with their dates." };
  } else if (stage.current === 4) {
    next = { title: "Anything left to sort?", line: "When it's all in hand, tap We're ready under Ready." };
  } else {
    next = { title: "All sorted. Ready to dance.", line: undefined };
  }
  // The Decor area's Next up comes from its things, not the stages.
  const shownNext: { title: string; line?: string; action?: React.ReactNode } = decor ? decorNextUp(decor.items, decor.people) : next;
  const soon = planNow[0];
  const then = soon
    ? soon.kind === "todo"
      ? `${soon.m.title}${soon.date ? ` · ${formatDayMonth(soon.date)}` : ""}`
      : `${soon.a.title} · ${formatWeekdayDayMonth(soon.a.on_date)}${soon.a.at_time ? `, ${formatClock(soon.a.at_time)}` : ""}`
    : null;

  // One line per stage when it's closed, and what it holds when open.
  const withQuote = live.filter((s) => (statusOf(s) === "quoted" || statusOf(s) === "booked") && (s.supplier_details?.quoted_cost ?? 0) > 0);
  const stages: { name: string; id: string; line: string; content: React.ReactNode }[] = [
    {
      name: STAGES[0],
      id: "ideas",
      line: ideaCount > 0 ? `${plural(ideaCount, "idea")}${area.details ? " · key facts" : ""}` : area.details ? "Key facts" : "Nothing yet",
      content: (
        <>
          {photos.length > 0 && (
            <Link href={`/inspo?folder=${key}`} aria-label={`See all ${plural(ideaCount, "idea")}`} className="grid grid-cols-4 gap-1 overflow-hidden rounded-2xl">
              {photos.map((ph, n) => (
                <span key={ph.id} className="aspect-square">
                  <Tile photo={ph} index={n} />
                </span>
              ))}
            </Link>
          )}
          <p className="mt-2 flex gap-4 px-1">
            <Link href={`/inspo/new?folder=${key}&from=${encodeURIComponent(`/area/${area.key}`)}`} className="text-[13px] text-champagne-600 hover:text-ink">
              + Save an idea
            </Link>
            {ideaCount > 0 && (
              <Link href={`/inspo?folder=${key}`} className="text-[13px] text-champagne-600 hover:text-ink">
                All {plural(ideaCount, "idea")} ›
              </Link>
            )}
          </p>
          <div className="glass-card mt-3 rounded-[22px] px-4">
          <div>
            <div className="flex items-baseline justify-between pt-3.5">
              <h3 className="label">Key facts</h3>
              {editing !== "facts" && (
                <Link href={`/area/${area.key}?edit=facts#ideas`} scroll={false} className="py-1 text-[13px] text-champagne-600 hover:text-ink">
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
                  <Link href={`/area/${area.key}#ideas`} scroll={false} className="text-sm text-stone hover:text-ink">
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
          </div>
        </>
      ),
    },
    {
      name: STAGES[1],
      id: "quotes",
      line: area.diy ? "Doing it ourselves" : withQuote.length > 0 ? `${plural(withQuote.length, "quote")} in` : inTouch.length > 0 ? `${inTouch.length} in touch` : "No one yet",
      content: area.diy ? (
        <div className="glass-card rounded-[22px] px-4">
          <Empty>You&apos;re doing this yourselves.</Empty>
          {booked.length === 0 && (
            <form action={setAreaStageFlagAction.bind(null, area.id, area.key, "diy", false)} className="border-t border-linen py-2">
              <button type="submit" className="py-1.5 text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                We need a supplier after all
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
          {[...quoted, ...inTouch].length > 0 && (
            <ul>
              {[...quoted, ...inTouch].map((s) => (
                <SupplierRow key={s.id} s={s} />
              ))}
            </ul>
          )}
          <Link href={`/people/suppliers/new?category=${key}`} className={`flex min-h-12 items-center text-[15px] text-champagne-600 hover:text-ink ${quoted.length + inTouch.length > 0 ? "border-t border-linen" : ""}`}>
            + Add a supplier
          </Link>
        </div>
      ),
    },
    {
      name: STAGES[2],
      id: "booked",
      line: booked.length > 0 ? booked.map(supplierName).join(", ") : area.diy ? "Doing it ourselves" : "Not yet",
      content:
        booked.length > 0 ? (
          <>
            <div className="glass-card overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
              <ul>
                {booked.map((s) => (
                  <SupplierRow key={s.id} s={s} />
                ))}
              </ul>
            </div>
            {/* Going back a stage (feedback item 1, 19 Oct 2026). */}
            {booked.map((s) => (
              <form key={s.id} action={unbookSupplierAction.bind(null, area.key, s.id, (s.supplier_details?.quoted_cost ?? 0) > 0)} className="px-1">
                <StepBack label={booked.length > 1 ? `${supplierName(s)} isn't booked after all` : "Not booked after all"} />
              </form>
            ))}
          </>
        ) : area.diy ? (
          <form action={setAreaStageFlagAction.bind(null, area.id, area.key, "diy", false)} className="px-1">
            <p className="text-sm text-stone">You&apos;re doing this yourselves.</p>
            <StepBack label="We need a supplier after all" />
          </form>
        ) : quotes.length >= 2 ? (
          <QuoteCompare
            quotes={quotes}
            room={room}
            row={(id, className, children) => (
              <SupplierLink id={id} className={className}>
                {children}
              </SupplierLink>
            )}
          />
        ) : (
          <p className="px-1 text-sm text-stone">
            {quotes.length === 1 ? `Open ${quotes[0].name}'s card and set them to Booked.` : "Once a quote's in, book them from their card."}
          </p>
        ),
    },
    {
      name: STAGES[3],
      id: "paid",
      line: money.committed > 0 ? `${formatMoney(money.paid)} of ${formatMoney(money.committed)} paid` : "Nothing agreed yet",
      content: (
        <>
        {unpaid.length + unscheduled.length > 0 ? (
          <ul className="glass-card overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
            {unpaid.slice(0, 3).map((p) => (
              <PaymentRow key={p.id} payment={p} today={today} />
            ))}
            {unscheduled.map(({ supplier: s, balance }) => (
              <li key={`balance-${s.id}`} className="flex items-center gap-3 border-b border-ink/[0.12] py-3 last:border-b-0">
                <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-champagne-400" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="type-item block truncate">Balance · {supplierName(s)}</span>
                  <Link href={`/money/payments/new?supplier=${s.id}&amount=${balance}`} className="block text-xs text-champagne-600 underline underline-offset-4 hover:text-ink">
                    Add a due date
                  </Link>
                </span>
                <span className="type-figure text-lg">{formatMoney(balance)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-sm text-stone">{money.committed > 0 && money.paid >= money.committed ? "All paid." : "Nothing to pay yet."}</p>
        )}
        {/* What's paid, so a payment marked by mistake can be taken back: tap its gold tick (feedback item 1). */}
        {paidList.length > 0 && (
          <>
            <p className="type-meta mt-4 px-1">Paid · tap a tick to undo</p>
            <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
              {paidList.map((p) => (
                <PaymentRow key={p.id} payment={p} today={today} />
              ))}
            </ul>
          </>
        )}
        </>
      ),
    },
    {
      name: STAGES[4],
      id: "ready",
      line: area.ready ? "Ready" : stage.current === 4 ? "Your tap" : "When it's all sorted",
      content: area.ready ? (
        <form action={setAreaStageFlagAction.bind(null, area.id, area.key, "ready", false)} className="px-1">
          <StepBack label="Not ready after all" />
        </form>
      ) : (
        <form action={setAreaStageFlagAction.bind(null, area.id, area.key, "ready", true)} className="glass-card flex items-center gap-3 rounded-[22px] px-4 py-3.5">
          <p className="flex-1 text-sm text-ink">{stage.current === 4 ? "Booked and paid. Anything left to sort?" : "Tap this once everything's in hand."}</p>
          <InlineSubmit label="We're ready" pendingLabel="Saving…" primary={stage.current === 4} />
        </form>
      ),
    },
  ];
  const openStage = editing === "facts" ? 0 : Math.min(stage.current, STAGES.length - 1);

  // The summary lines of "Everything for …".
  const suppliersLine =
    booked.length > 0
      ? `${booked.map(supplierName).join(", ")} booked`
      : live.length > 0
        ? [withQuote.length > 0 && `${plural(withQuote.length, "quote")} in`, inTouch.length > 0 && `${inTouch.length} in touch`].filter(Boolean).join(" · ")
        : area.diy ? "Doing it ourselves" : "None yet";
  const guestsLine =
    guestFacts?.kind === "food"
      ? `${guestFacts.day + guestFacts.evening} coming · ${plural(guestFacts.dietary.length, "dietary need")}`
      : guestFacts?.kind === "stationery"
        ? `${plural(guestFacts.households, "household")} · ${guestFacts.noAddress.length} with no address`
        : "";
  const planLine =
    planNow.length > 0
      ? `${planNow.length} to come${soon?.date ? ` · next ${formatDayMonth(soon.date)}` : ""}`
      : planDone > 0 ? `${planDone} done` : "Nothing planned";
  const moneyLine = anyMoney
    ? `${formatMoney(money.committed)}${money.budget !== null ? ` of ${formatMoney(money.budget)}` : ""} agreed`
    : "No budget yet";
  const transportRuns = guestFacts?.kind === "transport" ? guestFacts.runs.length : 0;
  const dayLine =
    moments.length > 0
      ? `${moments[0].title} · ${formatClock(moments[0].at_time)}${moments.length > 1 ? ` · +${moments.length - 1}` : ""}`
      : transportRuns > 0 ? plural(transportRuns, "journey") : "Nothing yet";
  const notesLine =
    notes.length + lists.length > 0
      ? [notes.length > 0 && plural(notes.length, "note"), lists.length > 0 && plural(lists.length, "list")].filter(Boolean).join(" · ")
      : "Nothing yet";

  return (
    <SupplierCards suppliers={suppliers} areas={areas} payments={payments}>
    <main className="page relative pb-40 lg:pb-16">
      <AreaCover area={area} photos={photos} ideaCount={ideaCount} canDiy={booked.length === 0 && !area.diy} />

      <div className="relative mt-5 flex flex-col gap-3.5">
        <OpenOnHash />
        {/* Outside the folded notes, so a new list's card opens even with them closed. */}
        <ListCard lists={lists} areas={areas} />
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

        {/* What to do next (canvas 3 "Area page · Round 5", B + A, owner's pick 17 Oct 2026). */}
        <section aria-label="Next up" className="card-white rounded-[22px] p-4">
          <p className="type-meta !text-champagne-600">{!decor && stage.current >= STAGES.length ? "All done" : "Next up"}</p>
          <p className="mt-1.5 font-display text-[22px] font-light leading-tight text-ink">{shownNext.title}</p>
          {shownNext.line && <p className="mt-1 text-sm text-stone">{shownNext.line}</p>}
          {shownNext.action && <div className="mt-2.5">{shownNext.action}</div>}
          {then && (
            <p className="mt-3 border-t border-linen pt-2.5 text-[13px] text-stone">
              Then: {then}
            </p>
          )}
        </section>

        {/* Decor is its own special area: its things in place of the stages (canvas 3 "Decor · Round 2", owner 19 Oct 2026). */}
        {decor ? (
          <div className="mt-3">
            <DecorThings items={decor.items} people={decor.people} areaKey={area.key} weddingDate={decor.weddingDate} />
          </div>
        ) : (
        /* The five stages down a gold line; tap any to open it (the others close). */
        <ol aria-label="Stages" className="mt-3">
          {stages.map((st, i) => {
            const done = stage.done[i];
            const now = i === stage.current;
            return (
              <li key={st.name} className="relative pl-10">
                {i < stages.length - 1 && (
                  <span aria-hidden className={`absolute bottom-0 left-[13px] top-7 w-0.5 ${done ? "bg-champagne-600" : "bg-linen"}`} />
                )}
                <details name="area-stages" open={i === openStage} id={st.id} className="group scroll-mt-6 pb-5">
                  <summary className="flex min-h-7 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                    <span
                      aria-hidden
                      className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${
                        done
                          ? "bg-champagne-600 text-white"
                          : now
                            ? "border-2 border-champagne-600 bg-white font-display text-champagne-600"
                            : "border-[1.5px] border-dashed border-champagne-400 bg-ivory"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : now ? i + 1 : null}
                    </span>
                    <span className={`label ${done ? "!text-champagne-600" : now ? "!text-ink" : "!text-stone"}`}>
                      {st.name}
                      {now && <span className="normal-case tracking-normal"> · now</span>}
                      {done && <span className="sr-only"> (done)</span>}
                    </span>
                    <span className="flex min-w-0 items-center gap-1 text-[13px] text-stone">
                      <span className="truncate">{st.line}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 transition group-open:rotate-90" strokeWidth={1.8} aria-hidden />
                    </span>
                  </summary>
                  <div className="mt-3">{st.content}</div>
                </details>
              </li>
            );
          })}
        </ol>
        )}

        {/* Everything for this area, one line each, opening in place (A's cards). */}
        <section aria-label={`Everything for ${area.label}`} className="mt-3">
          <h2 className="type-meta px-1">Everything for {area.label}</h2>
          <div className="glass-card mt-2.5 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
            <Everything
              id="suppliers"
              icon={Users}
              title="Suppliers"
              line={suppliersLine}
              see={{ href: `/people?tab=suppliers&f=${encodeURIComponent(`area:${area.key}`)}`, label: "In People" }}
              add={{ href: `/people/suppliers/new?category=${key}`, label: "Add a supplier" }}
            >
              {shown.length > 0 && (
                <ul>
                  {shown.map((s) => (
                    <SupplierRow key={s.id} s={s} />
                  ))}
                </ul>
              )}
              {area.diy && shown.length === 0 && <Empty>You&apos;re doing this yourselves.</Empty>}
              {folded.length > 0 && (
                <Folded label={booked.length > 0 && folded.some((s) => s.supplier_details?.status !== "cancelled") ? plural(folded.length, "other") : `${folded.length} not taken`}>
                  <ul>
                    {folded.map((s) => (
                      <SupplierRow key={s.id} s={s} />
                    ))}
                  </ul>
                </Folded>
              )}
            </Everything>

            {guestFacts && guestFacts.kind !== "transport" && (
              <Everything id="guests" icon={Users} title="Guests" line={guestsLine} see={{ href: "/people", label: "The guest list" }}>
                <GuestsSection facts={guestFacts} supplier={booked[0] ? supplierName(booked[0]) : undefined} couple={couple} />
              </Everything>
            )}

            {guestFacts?.kind === "food" && (
              <Everything
                id="dietary"
                icon={WheatOff}
                title="Dietary needs"
                line={
                  guestFacts.dietary.length === 0
                    ? "None recorded yet"
                    : `${plural(guestFacts.dietary.length, "guest")} · ${[...new Set(guestFacts.dietary.flatMap((d) => d.note.split(" · ")))].join(", ")}`
                }
                see={{ href: "/people?f=dietary&view=diet", label: "In the guest list" }}
              >
                {guestFacts.dietary.length > 0 && (
                  <ul>
                    {guestFacts.dietary.map((d, i) => (
                      <li key={i} className="flex items-baseline justify-between gap-3 py-2 text-[15px]">
                        <span className="truncate">{d.name}</span>
                        <span className="shrink-0 text-right text-[13px] text-[#9A3F2B]">{d.note}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Everything>
            )}

            {food && (
              <>
                <Everything
                  id="menu"
                  icon={UtensilsCrossed}
                  title="The menu"
                  line={
                    food.courses.length === 0
                      ? "Not started"
                      : `${plural(food.courses.length, "course")} · ${dishCount(food.courses.reduce((n, c) => n + c.dishes, 0))}`
                  }
                  see={{ href: "/menu", label: "The menu" }}
                  add={{ href: "/menu", label: "Add a dish" }}
                >
                  {food.courses.length > 0 && (
                    <ul>
                      {food.courses.map((c) => (
                        <li key={c.id} className="flex items-baseline justify-between gap-3 py-2 text-[15px]">
                          <span className="truncate">{c.name}</span>
                          <span className="shrink-0 text-[13px] tabular-nums text-stone">
                            {[c.time && formatClock(c.time), dishCount(c.dishes)].filter(Boolean).join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Everything>
                <Everything
                  id="drinks"
                  icon={Wine}
                  title="Drinks"
                  line={
                    food.drinks.length === 0
                      ? "Not started"
                      : `${plural(food.drinks.length, "drink")}${food.drinks.some((d) => d.status === "undecided") ? ` · ${food.drinks.filter((d) => d.status === "undecided").length} to decide` : ""}`
                  }
                  see={{ href: "/drinks", label: "Drinks" }}
                  add={{ href: "/drinks", label: "Add a drink" }}
                >
                  {food.drinks.length > 0 && (
                    <ul>
                      {food.drinks.map((d) => (
                        <li key={d.id} className="flex items-baseline justify-between gap-3 py-2 text-[15px]">
                          <span className="truncate">{d.name}</span>
                          <span className="shrink-0 text-[13px] tabular-nums text-stone">
                            {d.quantity !== null ? `${d.quantity}${d.unit ? ` ${d.unit}` : ""}` : "–"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Everything>
              </>
            )}

            <Everything
              id="plan"
              icon={CalendarDays}
              title="Plan"
              line={planLine}
              see={{ href: `/plan?view=list&area=${key}`, label: "In Plan" }}
              add={{ href: `/plan/new?area=${key}`, label: "Add a to-do" }}
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
            </Everything>

            <Everything
              id="payments"
              icon={PoundSterling}
              title="Money"
              line={moneyLine}
              see={{ href: `/money?view=month&area=${key}`, label: "In Money" }}
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
                <li key={`deposit-${s.id}`} className="flex items-center gap-3.5 border-b border-ink/[0.12] py-3 last:border-b-0">
                  {/* Laid out like the payment rows: no date kept for a deposit, so the dash. */}
                  <SupplierLink id={s.id} className="flex min-w-0 flex-1 items-center gap-3.5">
                    <DateStamp date={null} today={today} done />
                    <span className="min-w-0 flex-1">
                      <span className="type-item block truncate !text-stone">Deposit</span>
                      <span className="type-meta mt-1 block truncate">Paid · {supplierName(s)}</span>
                    </span>
                    <span className="type-figure shrink-0 text-[18px] !text-stone">{formatMoney(s.supplier_details?.deposit_paid ?? 0)}</span>
                  </SupplierLink>
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-champagne-600 text-white" aria-hidden>
                    <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
                </li>
              ))}
              {schedule.map((p) => (
                <PaymentRow key={p.id} payment={p} today={today} />
              ))}
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
            </Everything>


            <Everything
              id="day"
              icon={Clock}
              title="The Day"
              line={dayLine}
              see={{ href: `/day?area=${encodeURIComponent(area.key)}`, label: "In The Day" }}
              add={{ href: `/day/run-sheet/new?area=${key}&from=area`, label: "Add a moment" }}
            >
              <DaySection
                moments={moments}
                facts={guestFacts}
                musicFor={music ? couple : null}
                areaKey={area.key}
                areaLabels={Object.fromEntries(areas.map((a) => [a.key, a.label]))}
                soundCheck={music ? lists.find((l) => l.name === SOUND_CHECK.name) ?? null : undefined}
              />
            </Everything>

            <Everything
              id="notes"
              icon={areaIcon(area.key, area.icon)}
              title={`${area.label} notes`}
              line={notesLine}
              open={!!editing && editing !== "facts"}
              add={editing === "note" ? undefined : { href: `/area/${area.key}?edit=note#notes`, label: "Add a note", stays: true }}
            >
          {/* Lists filed under this area (owner, 19 Oct 2026), then its notes. */}
          {lists.length > 0 && <ListRows lists={lists} />}
          {editing !== "note" && (
            <Link
              href={`/lists/new?back=${encodeURIComponent(`/area/${area.key}`)}&area=${encodeURIComponent(area.key)}`}
              className="flex min-h-12 items-center border-b border-linen text-[15px] text-champagne-600 hover:text-ink"
            >
              <span aria-hidden>+&nbsp;</span>
              Add a list
            </Link>
          )}
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
            </Everything>
          </div>
        </section>
      </div>
    </main>
    </SupplierCards>
  );
}
