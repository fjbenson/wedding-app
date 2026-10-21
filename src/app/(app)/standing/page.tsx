import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Check, ChevronDown, ChevronRight, CircleDot, Clock, PoundSterling, Users, type LucideIcon } from "lucide-react";
import { getCurrentWedding } from "@/lib/db/weddings";
import { daysUntil } from "@/lib/dates";
import { loadStanding } from "@/lib/standing-data";
import type { Line, Section } from "@/lib/where-things-stand";

export const metadata = { title: "Where things stand — Wedding App" };

const ICONS: Record<Section["key"], LucideIcon> = {
  people: Users,
  money: PoundSterling,
  plan: CalendarDays,
  day: Clock,
  areas: CircleDot,
};

/**
 * Where things stand (canvas 2 "Where things stand · Round 2", option 1,
 * with a cream line on top — owner's pick 13 Oct 2026). Opened from the
 * heart of the hub ring. The figures are in src/lib/where-things-stand.ts.
 */
export default async function StandingPage() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { sections, doneSoFar } = await loadStanding(wedding);

  const days = wedding.wedding_date ? daysUntil(wedding.wedding_date) : null;
  const countdown =
    days === null ? null : days > 1 ? `${days} days to go` : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Married";
  const madeOf = [
    doneSoFar.todos && `${doneSoFar.todos} ${doneSoFar.todos === 1 ? "to-do" : "to-dos"}`,
    doneSoFar.payments && `${doneSoFar.payments} ${doneSoFar.payments === 1 ? "payment" : "payments"}`,
    doneSoFar.booked && `${doneSoFar.booked} ${doneSoFar.booked === 1 ? "supplier" : "suppliers"} booked`,
  ].filter(Boolean);

  return (
    <main className="page pb-40 lg:pb-16">
      <Link href="/" className="inline-flex h-11 items-center text-sm text-stone">
        ‹ Hub
      </Link>
      {countdown && <p className="label mt-3">{countdown}</p>}
      <h1 className="mt-2 font-display text-[40px] font-light leading-[1.02] tracking-[-0.02em] text-ink">
        Where things <span className="italic">stand</span>
      </h1>

      {/* The cream line: a pat on the back before the jobs (owner, 13 Oct 2026). */}
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#E3D3B3] bg-[#FFFDF8] px-4 py-3.5 shadow-[0_14px_30px_-22px_rgb(110_80_30/0.45)]">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-champagne-400 text-white">
          <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
        </span>
        <p className="min-w-0">
          <span className="block font-display text-[19px] italic leading-tight text-ink">
            {doneSoFar.total ? `${doneSoFar.total} ${doneSoFar.total === 1 ? "thing" : "things"} done so far` : "Nothing ticked off yet"}
          </span>
          {madeOf.length > 0 && <span className="mt-0.5 block text-xs text-stone">{madeOf.join(" · ")}</span>}
        </p>
      </div>

      <div className="mt-5 space-y-3.5 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {sections.map((section) => (
          <SectionCard key={section.key} section={section} />
        ))}
      </div>
    </main>
  );
}

function SectionCard({ section }: { section: Section }) {
  const Icon = ICONS[section.key];
  const { progress } = section;
  return (
    <section className="glass-card overflow-hidden rounded-[22px] [--row-bleed:0px]">
      {/* The heading itself opens the tab, as on area pages ("In People ›" went, audit 20 Oct 2026). */}
      <Link href={section.link.href} aria-label={section.link.label} className="flex items-center gap-2.5 px-4 pb-1 pt-3.5">
        <Icon className="h-5 w-5 text-champagne-600" strokeWidth={1.6} aria-hidden />
        <h2 className="font-display text-xl text-ink">{section.title}</h2>
        <ChevronRight className="h-4 w-4 text-stone/70" strokeWidth={1.8} aria-hidden />
      </Link>

      <div className="px-4 pb-3.5 pt-1">
        <p className="flex items-baseline gap-1.5">
          <span className="type-figure text-[30px] leading-none text-champagne-600">{progress.figure}</span>
          <span className="text-[13px] text-stone">{progress.words}</span>
        </p>
        {progress.share !== null && (
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E9E1D3]"
            role="img"
            aria-label={`${Math.round(progress.share * 100)}% done`}
          >
            <div className="h-full rounded-full bg-champagne-400" style={{ width: `${Math.round(progress.share * 100)}%` }} />
          </div>
        )}
      </div>

      {section.needs.map((line, i) => (
        <LineRow key={i} line={line} />
      ))}

      {section.needs.length === 0 && section.done.length === 0 && (
        <p className="border-t border-linen px-4 py-3 text-sm italic text-stone">Nothing here yet</p>
      )}

      {section.done.length > 0 && (
        <details className="group border-t border-linen bg-champagne-100/45">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm text-stone [&::-webkit-details-marker]:hidden">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne-400 text-white">
              <Check className="h-3 w-3" strokeWidth={2.6} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate">
              <b className="font-semibold text-champagne-600">{section.done.length} done</b> · {section.done[0].text}
              {section.done.length > 1 && "…"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" strokeWidth={1.6} aria-hidden />
          </summary>
          {section.done.map((line, i) => (
            <LineRow key={i} line={line} done />
          ))}
        </details>
      )}
    </section>
  );
}

function LineRow({ line, done = false }: { line: Line; done?: boolean }) {
  return (
    <Link
      href={line.href}
      className={`row-press flex min-h-11 items-center gap-3 border-t border-linen px-4 py-2.5 text-[15px] leading-snug ${done ? "text-stone" : "text-ink"}`}
    >
      {done ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne-400 text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
        </span>
      ) : line.over ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9A3F2B] text-[10px] text-white" aria-hidden>
          ▲
        </span>
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 text-xs font-semibold text-champagne-600" aria-hidden>
          !
        </span>
      )}
      <span className="min-w-0 flex-1">
        {line.over ? (
          <>
            {line.text} <b className="font-semibold text-[#9A3F2B]">{line.figure}</b>
          </>
        ) : (
          <>
            {line.figure && <b className="font-semibold">{line.figure} </b>}
            {line.text}
          </>
        )}
      </span>
      <span className="text-lg text-champagne-400" aria-hidden>
        ›
      </span>
    </Link>
  );
}
