import Link from "next/link";
import { Camera, Check, ChevronLeft, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import ContactButtons from "@/components/contact-buttons";
import { InlineSubmit, RemoveButton } from "@/components/form-bits";
import NoteText from "@/components/note-text";
import RichText from "@/components/rich-text";
import { areaStage, STAGES } from "@/lib/area-stage";
import { unscheduledBalances, type Money } from "@/lib/budget";
import { formatDayMonth, formatTime, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import type { InspoWithPicture } from "@/lib/db/inspo";
import type { Supplier } from "@/lib/db/suppliers";
import { formatMoney } from "@/lib/money";
import { supplierStatusLabel } from "@/lib/supplier-status";
import type { Appointment, AreaRow, Milestone, Note, Payment } from "@/types/db";
import { markPaidAction } from "../money/actions";
import { MilestoneRow } from "../plan/milestone-row";
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
function AreaCover({ area, photos, ideaCount }: { area: AreaRow; photos: InspoWithPicture[]; ideaCount: number }) {
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
    <div className="relative -mx-5 -mt-[max(2.5rem,env(safe-area-inset-top))] h-[300px] overflow-hidden md:mx-0 md:mt-0 md:h-[360px] md:rounded-3xl">
      {photos.length > 0 ? (
        <Link href={galleryHref} aria-label={`See all ${plural(ideaCount, "saved idea")}`}>
          {collage}
        </Link>
      ) : (
        collage
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-b from-[#FBF7F0]/0 via-[#FBF7F0]/85 to-[#FAF5EE]"
      />

      {photos.length === 0 && (
        <Link
          href={saveHref}
          aria-label="Add a photo"
          className="glass-card absolute left-1/2 top-[38%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-ink hover:border-champagne-400"
        >
          <Camera className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </Link>
      )}

      <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] flex justify-between gap-2">
        <Link href="/" aria-label="Back to the hub" className={`${glassButton} w-11`}>
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </Link>
        <div className="flex gap-2">
          <Link href={saveHref} className={`${glassButton} gap-1.5 px-4 text-sm`}>
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Save an idea
          </Link>
          {area.show_on_hub && (
            <details className="relative">
              <summary aria-label="More" className={`${glassButton} w-11 cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
              </summary>
              <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-[18px] bg-white p-2 shadow-[0_18px_40px_-16px_rgba(60,50,40,0.45)]">
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
              </div>
            </details>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-6 bottom-2 flex items-end justify-between gap-3">
        <h1 className="type-display min-w-0 text-[48px] leading-none md:text-6xl">
          {area.label}
        </h1>
        {ideaCount > 0 && (
          <Link href={galleryHref} className="label pointer-events-auto mb-2 shrink-0 hover:text-ink">
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

/** A section: a small heading with "+ Add", over one glass card. */
function Section({
  id,
  title,
  addHref,
  addLabel,
  addStays = false,
  children,
}: {
  id?: string;
  title: string;
  addHref?: string;
  addLabel?: string;
  /** "+ Add" opens something on this page: keep the scroll where it is. */
  addStays?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-3 scroll-mt-6">
      <div className="mb-2 flex items-baseline justify-between px-1.5">
        <h2 className="section-label">{title}</h2>
        {addHref && (
          <Link href={addHref} scroll={!addStays} className="label py-1 hover:text-ink">
            <span aria-hidden>+ </span>
            {addLabel ?? "Add"}
          </Link>
        )}
      </div>
      <div className="glass-card relative rounded-[22px] px-[18px] py-0.5">{children}</div>
    </section>
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
        <span className="type-meta flex-1">{label}</span>
        <ChevronRight className="h-4 w-4 text-stone transition group-open:rotate-90" strokeWidth={1.8} aria-hidden />
      </summary>
      <div className="pb-1">{children}</div>
    </details>
  );
}

function DateBox({ date }: { date: string }) {
  const [day, month] = formatDayMonth(date).split(" ");
  return (
    <span aria-hidden className="w-10 shrink-0 text-center">
      <span className="type-figure block text-2xl leading-none">{day}</span>
      <span className="mt-1 block text-xs font-medium uppercase tracking-[0.12em] text-champagne-600">{month}</span>
    </span>
  );
}

function appointmentLine(a: Appointment) {
  return [a.at_time && formatTime(a.at_time), a.location].filter(Boolean).join(" · ");
}

function SupplierRow({ s }: { s: Supplier }) {
  const d = s.supplier_details;
  const status = d?.status ?? "enquired";
  const strong = status === "booked" || status === "quoted";
  return (
    <li className="border-b border-linen last:border-b-0">
      <Link href={`/people/${s.id}`} className="flex items-center gap-3 py-3.5">
        <span className={`type-item min-w-0 flex-1 truncate ${status === "cancelled" ? "!text-stone" : ""}`}>
          {supplierName(s)}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-[0.08em] ${
            strong ? "bg-champagne-100 text-champagne-600" : "bg-cream text-stone"
          }`}
        >
          {supplierStatusLabel(status)}
        </span>
        <span className="type-figure w-[4.5rem] shrink-0 text-right text-xl">
          {d?.quoted_cost != null ? formatMoney(d.quoted_cost) : <span className="text-stone">—</span>}
        </span>
      </Link>
    </li>
  );
}

/**
 * One area of the wedding (screens 5 and 6 in docs/information-architecture.md):
 * the same template for every area, including ones a couple invents.
 *
 * Laid out as "Area page · Round 4 · One template" on the design canvas: the
 * collage cover, the five stages, tiles for the supplier, the money and the
 * next appointment, then always the same five sections in the same order —
 * Suppliers, Appointments, To-dos, Payment schedule, Notes. Only what's in
 * them changes as the area moves through its stages.
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
}: {
  area: AreaRow;
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
  const quotes = live.map((s) => s.supplier_details?.quoted_cost).filter((q): q is number => q != null);
  const quoteCount = live.filter((s) => s.supplier_details?.status === "quoted").length;
  // Once someone's booked, everyone else folds away; before that, only the ones not taken.
  const shown = booked.length > 0 ? booked : live;
  const folded = sorted.filter((s) => !shown.includes(s));
  const lead = booked[0];

  const openTodos = milestones.filter(isOpen).sort((a, b) => byDate(a.due_date, b.due_date));
  const doneTodos = milestones.filter((m) => !isOpen(m));

  const upcoming = appointments.filter((a) => a.on_date >= today);
  const past = appointments.filter((a) => a.on_date < today).reverse();
  const nextAppointment = upcoming[0];

  const supplierIds = new Set(suppliers.map((s) => s.id));
  const deposits = live.filter((s) => (s.supplier_details?.deposit_paid ?? 0) > 0);
  const schedule = [...payments].sort((a, b) =>
    !!a.paid_on !== !!b.paid_on ? (a.paid_on ? -1 : 1) : byDate(a.paid_on ?? a.due_date, b.paid_on ?? b.due_date),
  );
  const unscheduled = unscheduledBalances(booked, payments.filter((p) => p.contact_id && supplierIds.has(p.contact_id)));
  const toPay = Math.max(money.committed - money.paid, 0);
  const paidShare = money.committed > 0 ? Math.min(money.paid / money.committed, 1) : 0;

  const tile = "glass-card relative flex flex-col rounded-[22px] p-4";

  return (
    <main className="page relative pb-28 lg:pb-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-[520px] h-72 w-72 rounded-full bg-[#E6D9C4] blur-[55px]" />
        <div className="absolute -right-16 top-[1000px] h-64 w-64 rounded-full bg-[#EFE3D3] blur-[55px]" />
      </div>

      <AreaCover area={area} photos={photos} ideaCount={ideaCount} />

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
            className="glass-card flex items-center gap-3 rounded-[22px] px-[18px] py-3.5"
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

        <div className="mt-1 grid grid-cols-2 gap-3">
          {/* Who: the booked supplier, or where the choosing is up to. Above the
              tiles after it so its contact pop-up isn't covered. */}
          <div className={`${tile} z-10`}>
            {lead ? (
              <>
                <span className="label">Supplier</span>
                <Link href={`/people/${lead.id}`} className="type-item mt-2 hover:underline">
                  {supplierName(lead)}
                </Link>
                <span className="type-meta mt-1.5">
                  {["Booked", lead.supplier_details?.company_name && [lead.first_name, lead.last_name].filter(Boolean).join(" ")]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <div className="mt-auto pt-3.5">
                  <ContactButtons name={supplierName(lead)} phone={lead.phone} email={lead.email} />
                </div>
              </>
            ) : area.diy ? (
              <>
                <span className="label">Supplier</span>
                <span className="type-item mt-2">Doing it ourselves</span>
                <span className="type-meta mt-1.5">No one to book</span>
              </>
            ) : (
              <>
                <span className="label">Supplier</span>
                <span className="type-item mt-2">Not chosen yet</span>
                <span className="type-meta mt-1.5">
                  {live.length === 0
                    ? "No one asked"
                    : [`${live.length} asked`, quoteCount > 0 && `${plural(quoteCount, "quote")} in`].filter(Boolean).join(" · ")}
                </span>
              </>
            )}
          </div>

          <Link href="/money" className={`${tile} hover:border-champagne-400`}>
            {money.committed > 0 || money.paid > 0 ? (
              <>
                <span className="label">To pay</span>
                <span className="type-figure mt-2.5 text-[34px] leading-none">
                  {formatMoney(toPay)}
                </span>
                <span className="mt-4 block h-1 overflow-hidden rounded-full bg-linen">
                  <span className="block h-1 bg-champagne-600" style={{ width: `${Math.round(paidShare * 100)}%` }} />
                </span>
                <span className="mt-2 text-[13px] text-stone">
                  {formatMoney(money.paid)} of {formatMoney(money.committed)} paid
                </span>
                {money.budget !== null && <span className="text-[13px] text-stone">Budget {formatMoney(money.budget)}</span>}
              </>
            ) : (
              <>
                <span className="label">Budget</span>
                <span className="type-figure mt-2.5 text-[34px] leading-none">
                  {money.budget !== null ? formatMoney(money.budget) : "—"}
                </span>
                <span className="mt-4 block h-1 rounded-full bg-linen" />
                <span className="mt-2 text-[13px] text-stone">{money.budget !== null ? "Nothing committed" : "No budget set"}</span>
                {quotes.length > 0 && (
                  <span className="text-[13px] text-stone">
                    {quotes.length > 1 ? "Quotes from" : "Quote"} {formatMoney(Math.min(...quotes))}
                  </span>
                )}
              </>
            )}
          </Link>
        </div>

        {nextAppointment && (
          <Link href={`/plan/appointments/${nextAppointment.id}`} className="glass-card flex items-center gap-3.5 rounded-[22px] px-[18px] py-3.5 hover:border-champagne-400">
            <DateBox date={nextAppointment.on_date} />
            <span className="min-w-0 flex-1">
              <span className="label block">Next appointment</span>
              <span className="type-item mt-1.5 block truncate">{nextAppointment.title}</span>
              <span className="type-meta mt-1 block truncate">
                {[formatWeekdayDayMonth(nextAppointment.on_date), appointmentLine(nextAppointment)].filter(Boolean).join(" · ")}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
          </Link>
        )}

        <Section title="Suppliers" addHref={`/people/suppliers/new?category=${key}`}>
          {shown.length > 0 ? (
            <ul>
              {shown.map((s) => (
                <SupplierRow key={s.id} s={s} />
              ))}
            </ul>
          ) : (
            <Empty>{area.diy ? "No supplier needed — you're doing this yourselves." : "No one yet. Add who you're asking for quotes."}</Empty>
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
          {booked.length === 0 && (
            <form
              action={setAreaStageFlagAction.bind(null, area.id, area.key, "diy", !area.diy)}
              className="border-t border-linen py-2"
            >
              <button type="submit" className="py-1.5 text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                {area.diy ? "We need a supplier after all" : "We're doing this ourselves"}
              </button>
            </form>
          )}
        </Section>

        <Section title="Appointments" addHref={`/plan/appointments/new?area=${key}`}>
          {upcoming.length > 0 ? (
            <ul>
              {upcoming.map((a) => (
                <li key={a.id} className="border-b border-linen last:border-b-0">
                  <Link href={`/plan/appointments/${a.id}`} className="flex items-center gap-3.5 py-3.5">
                    <DateBox date={a.on_date} />
                    <span className="min-w-0 flex-1">
                      <span className="type-item block truncate">{a.title}</span>
                      <span className="type-meta mt-1 block truncate">
                        {appointmentLine(a) || formatWeekdayDayMonth(a.on_date)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nothing booked in. Consultations, tastings and fittings go here.</Empty>
          )}
          {past.length > 0 && (
            <Folded label={`${past.length} been`}>
              <ul>
                {past.map((a) => (
                  <li key={a.id}>
                    <Link href={`/plan/appointments/${a.id}`} className="flex items-center gap-3.5 py-2.5 text-stone">
                      <DateBox date={a.on_date} />
                      <span className="min-w-0 flex-1 truncate text-[15px]">{a.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Folded>
          )}
        </Section>

        <Section title="To-dos" addHref={`/plan/new?area=${key}`}>
          {openTodos.length > 0 ? (
            <ul>
              {openTodos.map((m) => (
                <MilestoneRow key={m.id} milestone={m} overdue={!!m.due_date && m.due_date < today} />
              ))}
            </ul>
          ) : (
            <Empty>{doneTodos.length > 0 ? "All done." : "Nothing to do here yet."}</Empty>
          )}
          {doneTodos.length > 0 && (
            <Folded label={`${doneTodos.length} done`}>
              <ul>
                {doneTodos.map((m) => (
                  <MilestoneRow key={m.id} milestone={m} overdue={false} />
                ))}
              </ul>
            </Folded>
          )}
        </Section>

        <Section title="Payment schedule" addHref={`/money/payments/new?area=${key}`}>
          {deposits.length + schedule.length + unscheduled.length > 0 ? (
            <ul>
              {deposits.map((s) => (
                <li key={`deposit-${s.id}`} className="flex items-center gap-3 border-b border-linen py-3.5 last:border-b-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne-600 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                  </span>
                  <Link href={`/people/${s.id}`} className="min-w-0 flex-1">
                    <span className="type-item block truncate">Deposit</span>
                    <span className="type-meta mt-1 block truncate">Paid · {supplierName(s)}</span>
                  </Link>
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
          ) : (
            <Empty>Nothing to pay yet. The deposit and balance go here once you book.</Empty>
          )}
        </Section>

        <Section id="notes" title="Notes" addHref={`/area/${area.key}?edit=note#notes`} addStays>
          <div className={notes.length > 0 || editing === "note" ? "border-b border-linen" : ""}>
            <div className="flex items-baseline justify-between pt-3.5">
              <h3 className="label">Key facts</h3>
              {editing !== "facts" && (
                <Link href={`/area/${area.key}?edit=facts#notes`} scroll={false} className="label py-1 hover:text-ink">
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
              <p className="pb-3.5 pt-1.5 text-sm text-stone">The things worth having to hand: colours, numbers, what you&apos;ve ruled out.</p>
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
                    <Link href={`/area/${area.key}?edit=note:${n.id}#notes`} scroll={false} className="label shrink-0 py-0.5 hover:text-ink">
                      Edit
                    </Link>
                  </li>
                ),
              )}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}
