import Link from "next/link";
import { BLANKS, noteWords } from "@/components/hub-tiles";
import type { Note } from "@/types/db";

/**
 * The top of the laptop Hub's right-hand column (canvas 4 "Laptop · Round
 * 13", C, owner's pick 23 Oct 2026: "a bit more fun"): the three latest
 * pictures as a mood board, the latest note taped over its corner. The phone
 * keeps its two tiles (HubTiles).
 */
export default function HubBoard({
  note,
  toSort,
  pictures,
  ideas,
}: {
  /** The latest note still to sort, else the latest note; null with none, undefined with no notes table yet. */
  note: Note | null | undefined;
  toSort: number;
  /** Up to three picture links, newest first. */
  pictures: (string | null)[];
  ideas: number;
}) {
  const words = noteWords(note);
  const square = (i: number, className: string) =>
    pictures[i] ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={i} src={pictures[i]!} alt="" className={`h-full w-full rounded-xl object-cover ${className}`} />
    ) : (
      <span key={i} aria-hidden className={`block h-full rounded-xl ${className}`} style={{ background: BLANKS[i] }} />
    );

  return (
    <section className="glass-card hidden rounded-[22px] px-5 pb-4 pt-4 lg:block">
      <div className="flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-2.5">
        <h2 className="section-label whitespace-nowrap">Inspo &amp; notes</h2>
        <Link href="/inspo" className="type-meta whitespace-nowrap !text-champagne-600 hover:!text-ink">
          {ideas ? `All ${ideas} ›` : "Save one ›"}
        </Link>
      </div>
      <div className="relative mt-3.5">
        <Link href="/inspo" aria-label="Inspo" className="grid h-[210px] grid-cols-[2fr_1fr] grid-rows-2 gap-1.5">
          {square(0, "row-span-2")}
          {square(1, "")}
          {square(2, "")}
        </Link>
        {note !== undefined && (
          <Link
            href="/inbox"
            className="absolute -bottom-3.5 left-3.5 block w-[46%] max-w-[190px] px-3.5 pb-3 pt-5 shadow-[0_10px_20px_-12px_rgb(60_45_20/0.45)]"
            style={{ background: "#FFFDF8", transform: "rotate(-3deg)" }}
          >
            <span aria-hidden className="absolute left-1/2 top-[-8px] h-4 w-11 -translate-x-1/2 -rotate-3 bg-[#F1E7D4]/90" />
            <span className={`line-clamp-3 font-display text-[15px] italic leading-snug ${words ? "text-ink" : "text-stone/70"}`}>
              {words ? `“${words}”` : "A thought for later…"}
            </span>
          </Link>
        )}
      </div>
      <Link href="/inbox" className="type-meta mt-4 block text-right hover:!text-ink">
        {toSort ? `${toSort} ${toSort === 1 ? "note" : "notes"} to sort ›` : note ? "All sorted ›" : "Jot one down ›"}
      </Link>
    </section>
  );
}
