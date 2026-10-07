import Link from "next/link";
import { Camera, ChevronLeft, ChevronRight, Mail, Phone, Plus } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { areaIcon } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { daysUntil, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import type { Money } from "@/lib/budget";
import type { InspoWithPicture } from "@/lib/db/inspo";
import { formatMoney } from "@/lib/money";
import { supplierStatusLabel } from "@/lib/supplier-status";
import NoteText from "@/components/note-text";
import type { AreaRow, Milestone, Note } from "@/types/db";
import { toggleMilestoneAction } from "../plan/actions";
import { MilestoneRow } from "../plan/milestone-row";
import { saveAreaDetailsAction, setAreaAction } from "./actions";

const isOpen = (m: Milestone) => m.status === "todo" || m.status === "in_progress";

/** Soonest first; undated to-dos after dated ones. */
const byDue = (a: Milestone, b: Milestone) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");

function supplierName(s: Supplier) {
  return s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "Due Sat 1 Nov · in 25 days" */
function dueLine(date: string) {
  const days = daysUntil(date);
  const when = days < 0 ? "overdue" : days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  return `Due ${formatWeekdayDayMonth(date)} · ${when}`;
}

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
      <img
        src={photo.picture}
        alt={photo.title ?? photo.note ?? "A saved idea"}
        className="h-full w-full min-h-0 object-cover"
      />
    );
  }
  return <span aria-hidden className="block h-full w-full" style={{ background: PLACEHOLDERS[index] }} />;
}

/**
 * The top of the page: the area's saved pictures as a collage (round 2, "D",
 * on the design canvas), the name set on a fade at the bottom. Tapping the
 * collage opens the area's Inspo folder; with nothing saved, a camera in the
 * middle invites the first one instead.
 */
function AreaCover({
  area,
  photos,
  ideaCount,
  summary,
}: {
  area: AreaRow;
  photos: InspoWithPicture[];
  ideaCount: number;
  summary: string;
}) {
  const Icon = areaIcon(area.key);
  const from = encodeURIComponent(`/area/${area.key}`);
  const saveHref = `/inspo/new?folder=${encodeURIComponent(area.key)}&from=${from}`;
  const galleryHref = `/inspo?folder=${encodeURIComponent(area.key)}`;
  const glassButton =
    "glass-card flex h-11 items-center justify-center rounded-full text-ink hover:border-champagne-400";

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
    <div className="relative -mx-5 -mt-[max(2.5rem,env(safe-area-inset-top))] h-[340px] overflow-hidden md:mx-0 md:mt-0 md:h-[380px] md:rounded-3xl">
      {photos.length > 0 ? (
        <Link href={galleryHref} aria-label={`See all ${plural(ideaCount, "saved idea")}`}>
          {collage}
        </Link>
      ) : (
        collage
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-b from-[#FBF7F0]/0 via-[#FBF7F0]/85 to-[#FAF5EE]"
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

      <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] flex justify-between">
        <Link href="/" aria-label="Back to the hub" className={`${glassButton} w-11`}>
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </Link>
        <Link href={saveHref} className={`${glassButton} gap-1.5 px-4 text-sm`}>
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          Save an idea
        </Link>
      </div>

      <div className="absolute inset-x-6 bottom-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label flex items-center gap-2 tracking-[0.3em]">
            <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="truncate">{summary}</span>
          </p>
          <h1 className="mt-2 font-display text-[52px] font-light leading-[0.95] tracking-[-0.035em] text-ink md:text-6xl">
            {area.label}
          </h1>
        </div>
        {ideaCount > 0 && (
          <Link href={galleryHref} className="label mb-1.5 shrink-0 hover:text-ink">
            {plural(ideaCount, "idea")} ›
          </Link>
        )}
      </div>
    </div>
  );
}

/** A small capitals heading above a card. */
function CardHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="-mb-1.5 mt-2 px-1.5 text-xs font-medium uppercase tracking-[0.3em] text-stone">{children}</h2>;
}

/** One row of "Everything else" that opens in place. */
function Drawer({ title, count, children }: { title: string; count: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-linen last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-[15px] [&::-webkit-details-marker]:hidden">
        <span className="flex-1 font-display text-lg text-ink">{title}</span>
        <span className="text-[13px] text-stone">{count}</span>
        <ChevronRight className="h-4 w-4 text-stone transition group-open:rotate-90" strokeWidth={1.8} aria-hidden />
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  );
}

const addLink = "inline-flex items-center gap-1 py-2 text-sm text-champagne-600 hover:text-ink";

/**
 * One area of the wedding (screens 5 and 6 in docs/information-architecture.md):
 * the same template for every area, including ones a couple invents. It
 * gathers what's already tagged with the area elsewhere — to-dos from Plan,
 * suppliers from People — plus a plain key-facts block and the cost so far.
 * Notes are quick captures filed here; saved ideas are its Inspo folder.
 *
 * Laid out as round 2's "D" on the design canvas: a collage cover, then
 * glass cards — the next job, who's booked, what's left to pay, key facts —
 * and everything else folded away underneath.
 */
export default function AreaView({
  area,
  milestones,
  suppliers,
  money,
  notes,
  photos,
  ideaCount,
  editingFacts,
  error,
  detail,
}: {
  area: AreaRow;
  milestones: Milestone[];
  suppliers: Supplier[];
  /** Budget, committed and paid, counted as the Money tab counts them. */
  money: Money;
  /** Captures filed under this area (screens 35–36). */
  notes: Note[];
  /** The latest saved ideas with a picture, for the cover (up to four). */
  photos: InspoWithPicture[];
  /** Everything in this area's Inspo folder, pictures or not. */
  ideaCount: number;
  /** `?edit=facts`: the key-facts card shows its box to type in. */
  editingFacts: boolean;
  error?: string;
  detail?: string;
}) {
  const today = todayISO();
  const from = encodeURIComponent(`/area/${area.key}`);
  const openTodos = milestones.filter(isOpen).sort(byDue);
  const todos = [...openTodos, ...milestones.filter((m) => !isOpen(m))];
  const next = openTodos[0];

  const live = suppliers.filter((s) => s.supplier_details?.status !== "cancelled");
  const booked = live.find((s) => s.supplier_details?.status === "booked");
  const bookedCount = live.filter((s) => s.supplier_details?.status === "booked").length;
  const toPay = Math.max(money.committed - money.paid, 0);
  const paidShare = money.committed > 0 ? Math.min(money.paid / money.committed, 1) : 0;

  const summary =
    [
      openTodos.length > 0 ? `${openTodos.length} to do` : milestones.length > 0 ? "All done" : null,
      booked ? "Booked" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Not started";

  /** Nothing filed here at all: offer three ways in rather than a page of empty cards. */
  const blank =
    milestones.length === 0 &&
    suppliers.length === 0 &&
    notes.length === 0 &&
    !area.details &&
    money.committed === 0 &&
    money.paid === 0;

  const card = "glass-card relative rounded-[22px]";

  return (
    <main className="page relative pb-28 lg:pb-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-[560px] h-72 w-72 rounded-full bg-[#E6D9C4] blur-[55px]" />
        <div className="absolute -right-16 top-[900px] h-64 w-64 rounded-full bg-[#EFE3D3] blur-[55px]" />
      </div>

      <AreaCover area={area} photos={photos} ideaCount={ideaCount} summary={summary} />

      <div className="relative mt-4 flex flex-col gap-3.5">
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

        {next && (
          <>
            <CardHeading>Next up</CardHeading>
            <div className={`${card} flex items-start gap-3.5 p-[18px]`}>
              <form action={toggleMilestoneAction.bind(null, next.id, true)}>
                <button
                  type="submit"
                  aria-label={`Mark "${next.title}" as done`}
                  className="mt-0.5 flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-champagne-400 bg-white/60 hover:bg-champagne-100"
                />
              </form>
              <Link href={`/plan/${next.id}`} className="min-w-0 flex-1">
                <span className="block font-display text-[21px] leading-tight text-ink">{next.title}</span>
                {next.due_date && (
                  <span
                    className={`mt-1.5 block text-xs font-medium uppercase tracking-[0.2em] ${
                      next.due_date < today ? "text-ink" : "text-champagne-600"
                    }`}
                  >
                    {dueLine(next.due_date)}
                  </span>
                )}
              </Link>
            </div>
          </>
        )}

        {blank && !editingFacts ? (
          <>
            <CardHeading>Where to start</CardHeading>
            <div className={`${card} px-[18px] py-1`}>
              {[
                { title: "A to-do", hint: "Something to get done", href: `/plan/new?area=${encodeURIComponent(area.key)}` },
                {
                  title: "A supplier",
                  hint: "Someone you're talking to, or have booked",
                  href: `/people/suppliers/new?category=${encodeURIComponent(area.key)}`,
                },
                { title: "Key facts", hint: "Colours, numbers, who's deciding", href: `/area/${area.key}?edit=facts` },
              ].map((s) => (
                <Link key={s.title} href={s.href} className="flex items-center gap-3.5 border-b border-linen py-[15px] last:border-b-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                    <Plus className="h-4 w-4 text-champagne-600" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span>
                    <span className="block font-display text-lg text-ink">{s.title}</span>
                    <span className="mt-0.5 block text-xs text-stone">{s.hint}</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
        <div className="grid grid-cols-2 gap-3">
          {booked ? (
            <div className={`${card} flex flex-col p-4`}>
              <span className="label">Booked</span>
              <Link href={`/people/${booked.id}`} className="mt-2 font-display text-xl leading-tight text-ink hover:underline">
                {supplierName(booked)}
              </Link>
              {booked.supplier_details?.company_name && (booked.first_name || booked.last_name) && (
                <span className="mt-1 text-xs text-stone">{[booked.first_name, booked.last_name].filter(Boolean).join(" ")}</span>
              )}
              {(booked.phone || booked.email) && (
                <span className="mt-auto flex gap-2 pt-3.5">
                  {booked.phone && (
                    <a
                      href={`tel:${booked.phone}`}
                      aria-label={`Call ${supplierName(booked)}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink hover:bg-cream"
                    >
                      <Phone className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                    </a>
                  )}
                  {booked.email && (
                    <a
                      href={`mailto:${booked.email}`}
                      aria-label={`Email ${supplierName(booked)}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink hover:bg-cream"
                    >
                      <Mail className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                    </a>
                  )}
                </span>
              )}
            </div>
          ) : (
            <Link
              href={`/people/suppliers/new?category=${encodeURIComponent(area.key)}`}
              className={`${card} flex flex-col p-4 hover:border-champagne-400`}
            >
              <span className="label">Booked</span>
              <span className="mt-2 font-display text-xl leading-tight text-ink">No one yet</span>
              <span className="mt-1 text-xs text-stone">
                {live.length > 0 ? `${plural(live.length, "supplier")} in the running` : "Add who you're talking to"}
              </span>
              <span className="mt-auto inline-flex items-center gap-1 pt-3.5 text-sm text-champagne-600">
                <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                Supplier
              </span>
            </Link>
          )}

          <Link href="/money" className={`${card} flex flex-col p-4 hover:border-champagne-400`}>
            <span className="label">To pay</span>
            {money.committed > 0 || money.paid > 0 ? (
              <>
                <span className="mt-2.5 font-display text-[34px] font-light leading-none tracking-[-0.03em] text-ink">
                  {formatMoney(toPay)}
                </span>
                <span className="mt-4 block h-1 overflow-hidden rounded-full bg-linen">
                  <span className="block h-1 bg-champagne-600" style={{ width: `${Math.round(paidShare * 100)}%` }} />
                </span>
                <span className="mt-2 text-xs text-stone">
                  {formatMoney(money.paid)} of {formatMoney(money.committed)} paid
                </span>
              </>
            ) : (
              <span className="mt-2 font-display text-xl leading-tight text-ink">Nothing yet</span>
            )}
            <span className="mt-0.5 text-xs text-stone">
              {money.budget !== null ? `Budget ${formatMoney(money.budget)}` : "No budget set"}
            </span>
          </Link>
        </div>

        <section className={`${card} px-[18px] py-4`}>
          <div className="flex items-baseline justify-between">
            <h2 className="label">Key facts</h2>
            {!editingFacts && (
              <Link href={`/area/${area.key}?edit=facts`} className="label hover:text-ink">
                {area.details ? "Edit" : "Add"}
              </Link>
            )}
          </div>
          {editingFacts ? (
            <form action={saveAreaDetailsAction.bind(null, area.id, area.key)} className="mt-3">
              <textarea
                name="details"
                rows={4}
                autoFocus
                defaultValue={area.details ?? ""}
                aria-label={`Key facts about ${area.label}`}
                placeholder="Anything worth having to hand — colours, a budget, who's deciding, what you've ruled out."
                className="w-full resize-y rounded-xl border border-linen bg-ivory px-3 py-2 text-[15px] leading-relaxed text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
              />
              <div className="mt-2 flex items-center justify-end gap-4">
                <Link href={`/area/${area.key}`} className="text-sm text-stone hover:text-ink">
                  Cancel
                </Link>
                <InlineSubmit label="Save" pendingLabel="Saving…" />
              </div>
            </form>
          ) : area.details ? (
            <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{area.details}</p>
          ) : (
            <p className="mt-2.5 text-sm text-stone">Colours, numbers, who&apos;s deciding, what you&apos;ve ruled out.</p>
          )}
        </section>

        <CardHeading>Everything else</CardHeading>
        <div className={`${card} px-[18px] py-1`}>
          <Drawer
            title="To-dos"
            count={
              milestones.length === 0
                ? "None yet"
                : [openTodos.length > 0 && `${openTodos.length} open`, todos.length > openTodos.length && `${todos.length - openTodos.length} done`]
                    .filter(Boolean)
                    .join(" · ")
            }
          >
            {todos.length > 0 && (
              <ul>
                {todos.map((m) => (
                  <MilestoneRow key={m.id} milestone={m} overdue={isOpen(m) && !!m.due_date && m.due_date < today} />
                ))}
              </ul>
            )}
            <Link href={`/plan/new?area=${encodeURIComponent(area.key)}`} className={addLink}>
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Add a to-do
            </Link>
          </Drawer>

          <Drawer
            title="Suppliers"
            count={
              suppliers.length === 0
                ? "None yet"
                : [bookedCount > 0 && `${bookedCount} booked`, live.length > bookedCount && `${live.length - bookedCount} more`]
                    .filter(Boolean)
                    .join(" · ") || plural(suppliers.length, "supplier")
            }
          >
            {suppliers.length > 0 && (
              <ul>
                {suppliers.map((s) => {
                  const d = s.supplier_details;
                  const cancelled = d?.status === "cancelled";
                  return (
                    <li key={s.id} className="border-b border-linen last:border-b-0">
                      <Link href={`/people/${s.id}`} className="flex items-center gap-3 py-3 hover:bg-cream/60">
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[15px] ${cancelled ? "text-stone line-through" : "text-ink"}`}>
                            {supplierName(s)}
                          </span>
                          {d && <span className="mt-0.5 block text-xs text-stone">{supplierStatusLabel(d.status)}</span>}
                        </span>
                        {d?.quoted_cost != null && (
                          <span className="shrink-0 font-display text-lg text-ink">{formatMoney(d.quoted_cost)}</span>
                        )}
                        <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link href={`/people/suppliers/new?category=${encodeURIComponent(area.key)}`} className={addLink}>
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Add a supplier
            </Link>
          </Drawer>

          <div className="border-b border-linen last:border-b-0">
            <Link href={`/inspo?folder=${encodeURIComponent(area.key)}`} className="flex items-center gap-3 py-[15px]">
              <span className="flex-1 font-display text-lg text-ink">Saved ideas</span>
              <span className="text-[13px] text-stone">{ideaCount > 0 ? ideaCount : "None yet"}</span>
              <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
            </Link>
          </div>

          <Drawer title="Notes" count={notes.length > 0 ? String(notes.length) : "None yet"}>
            {notes.length > 0 && (
              <ul>
                {notes.map((n) => (
                  <li key={n.id} className="border-b border-linen py-3 last:border-b-0">
                    <NoteText note={n} />
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/capture?area=${encodeURIComponent(area.key)}&from=${from}`} className={addLink}>
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Add a note
            </Link>
          </Drawer>
        </div>

        <div className="mt-1 grid grid-cols-3 gap-2">
          {[
            { label: "To-do", href: `/plan/new?area=${encodeURIComponent(area.key)}` },
            { label: "Supplier", href: `/people/suppliers/new?category=${encodeURIComponent(area.key)}` },
            { label: "Note", href: `/capture?area=${encodeURIComponent(area.key)}&from=${from}` },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-champagne-400 px-1 py-3 text-xs text-ink hover:bg-white/40"
            >
              <Plus className="h-[18px] w-[18px] text-champagne-600" strokeWidth={1.6} aria-hidden />
              <span>
                <span className="sr-only">Add a </span>
                {a.label}
              </span>
            </Link>
          ))}
        </div>
          </>
        )}

        {area.show_on_hub && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[13px]">
            <form action={setAreaAction.bind(null, area.id, area.key, "hide")}>
              <button type="submit" className="py-2 text-stone underline underline-offset-4 hover:text-ink">
                Take off the hub
              </button>
            </form>
            <form action={setAreaAction.bind(null, area.id, area.key, "stop")}>
              <button type="submit" className="py-2 text-stone underline underline-offset-4 hover:text-ink">
                We&apos;re not planning this
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
