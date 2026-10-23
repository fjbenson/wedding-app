import Link from "next/link";
import { host } from "@/components/note-text";
import type { Note } from "@/types/db";

/** Soft colours for the collage's empty squares, before there are pictures. */
export const BLANKS = ["#EADCC3", "#EBD7D1", "#DFE4D6", "#EFE6D6"];

/** A note as plain words for a tile: tick-box and bullet marks dropped, else its link's site. */
export function noteWords(note: Note | null | undefined): string {
  return note ? note.body?.replace(/^\s*(\[( |x|X)\]|[-*•])\s?/gm, "").trim() || (note.url ? host(note.url) : "") : "";
}

/**
 * Your notes and Inspo as two tiles side by side under This week (canvas 2,
 * "Home · Round 3", option A, owner's pick 13 Oct 2026): the latest note on
 * a taped scrap of paper, like the notes wall, and the four latest pictures
 * as a little collage. Notes are quick words, Inspo the pictures (owner).
 */
export default function HubTiles({
  note,
  toSort,
  pictures,
  ideas,
}: {
  /** The latest note still to sort, else the latest note; null with none (or no notes table yet). */
  note: Note | null | undefined;
  toSort: number;
  /** Up to four picture links, newest first. */
  pictures: (string | null)[];
  ideas: number;
}) {
  const words = noteWords(note);

  return (
    <div className="relative mx-5 mt-4 grid grid-cols-2 gap-3 lg:mx-0 lg:mt-0">
      {note !== undefined && (
        <Link href="/inbox" className="glass-card row-press flex flex-col rounded-[22px] p-3.5 [--row-bleed:0px]">
          <span className="section-label !text-[11px] !tracking-[0.22em]">Your notes</span>
          <span
            className="relative mt-4 block min-h-[88px] flex-1 px-3 pb-3 pt-5 shadow-[0_10px_20px_-12px_rgb(60_45_20/0.45)]"
            style={{ background: "#FFFDF8", transform: "rotate(-2deg)" }}
          >
            <span aria-hidden className="absolute left-1/2 top-[-8px] h-4 w-11 -translate-x-1/2 -rotate-3 bg-[#F1E7D4]/90" />
            <span className={`line-clamp-3 font-display text-[15px] italic leading-snug ${words ? "text-ink" : "text-stone/70"}`}>
              {words ? `“${words}”` : "A thought for later…"}
            </span>
          </span>
          <span className="type-meta mt-3.5">{toSort ? `${toSort} to sort ›` : note ? "All sorted ›" : "Jot one down ›"}</span>
        </Link>
      )}
      <Link href="/inspo" className="glass-card row-press flex flex-col rounded-[22px] p-3.5 [--row-bleed:0px]">
        <span className="section-label !text-[11px] !tracking-[0.22em]">Inspo</span>
        <span className="mt-3 grid grid-cols-2 gap-[5px]">
          {[0, 1, 2, 3].map((i) =>
            pictures[i] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={pictures[i]!} alt="" className="aspect-square w-full rounded-[9px] object-cover" />
            ) : (
              <span key={i} aria-hidden className="block aspect-square rounded-[9px]" style={{ background: BLANKS[i] }} />
            ),
          )}
        </span>
        <span className="type-meta mt-3">{ideas ? `${ideas} ${ideas === 1 ? "idea" : "ideas"} ›` : "Save one ›"}</span>
      </Link>
    </div>
  );
}
