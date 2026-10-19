import Link from "next/link";
import { Armchair, Car, Clock, Palette, type LucideIcon } from "lucide-react";

/*
 * The Day as one day with its pieces (canvas 3 "The Day · Round 2",
 * option 1, owner's pick): the run sheet is the whole day; Seating, Travel
 * and Decor are its pieces, shown as three tiles under its numbers. A piece
 * opened has "The Day ›" above its title and the others at its foot.
 */

type Piece = "seating" | "travel" | "decor";

const PIECES: { key: Piece; title: string; href: string; icon: LucideIcon }[] = [
  { key: "seating", title: "Seating", href: "/day?tab=seating", icon: Armchair },
  { key: "travel", title: "Travel", href: "/day?tab=travel", icon: Car },
  { key: "decor", title: "Decor", href: "/day/decor", icon: Palette },
];

/** The three pieces as tiles, each with its one fact. */
export function PieceTiles({ facts, className = "" }: { facts: Record<Piece, string>; className?: string }) {
  return (
    <section aria-label="Pieces of the day" className={className}>
      <h2 className="section-label">Pieces of the day</h2>
      <div className="mt-2.5 grid grid-cols-3 gap-2 lg:gap-3">
        {PIECES.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.key}
              href={p.href}
              className="card-white row-press flex min-w-0 flex-col rounded-[18px] p-3 [--row-bleed:0px] lg:p-4"
            >
              <span aria-hidden className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span className="mt-2.5 text-[15px] font-medium text-ink">{p.title}</span>
              <span className="mt-0.5 text-[12px] leading-snug text-stone">{facts[p.key]}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Above a piece's title: the way back to the whole day (no back arrow). */
export function DayPill() {
  return (
    <Link
      href="/day"
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-champagne-100 pl-2 pr-3 text-[13px] font-medium text-champagne-600 hover:text-ink print:hidden"
    >
      <Clock className="h-4 w-4" strokeWidth={1.6} aria-hidden />
      The Day ›
    </Link>
  );
}

/** At a piece's foot: the whole day and the other pieces. */
export function AlsoInTheDay({ current }: { current: Piece }) {
  const pill = "inline-flex h-9 items-center rounded-full border border-linen bg-white/70 px-3.5 text-[13.5px] text-ink hover:border-champagne-400";
  return (
    <nav aria-label="Also in the day" className="mt-8 print:hidden">
      <h2 className="section-label">Also in the day</h2>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Link href="/day" className={pill}>The whole day</Link>
        {PIECES.filter((p) => p.key !== current).map((p) => (
          <Link key={p.key} href={p.href} className={pill}>{p.title}</Link>
        ))}
      </div>
    </nav>
  );
}
