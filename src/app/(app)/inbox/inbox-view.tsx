import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AddButton from "@/components/add-button";
import type { AreaOption } from "@/lib/areas";
import type { InspoWithPicture } from "@/lib/db/inspo";
import type { Note } from "@/types/db";
import { toSort } from "@/lib/notes";
import { InspoTile } from "../inspo/inspo-view";
import NoteWall from "./note-wall";

export const metadata = { title: "Your notes — Wedding App" };

/**
 * The capture inbox (screen 36), shown as "Your notes": every note as a wall
 * of paper notes (`note-wall.tsx`) — filed ones carry their area's name and
 * stay here too — then unsorted Inspo pictures.
 */
export default function InboxView({
  notes,
  pictures,
  areas,
  today,
  openNote,
  error,
  detail,
}: {
  /** null until 0008_notes.sql has been run. */
  notes: Note[] | null;
  /** Unsorted Inspo — the plan's inbox holds "notes and unsorted images together". */
  pictures: InspoWithPicture[];
  areas: AreaOption[];
  today: string;
  /** ?note= — a note to open straight away (the home screen's "File it"). */
  openNote?: string;
  error?: string;
  detail?: string;
}) {
  const unfiled = (notes ?? []).filter(toSort);

  return (
    <main className="page pb-40 lg:max-w-[1180px] lg:pb-16">
      <Link href="/" className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-stone hover:text-ink">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Hub
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">Your notes</h1>
        {/* One kind of note: words, bullets and tick-boxes mixed (canvas 3 "Notes · Round 1", A, owner 19 Oct 2026). */}
        <AddButton href="/capture?from=/inbox" label="Write a note" />
      </div>
      <p className="mt-2 text-sm text-stone">
        {(notes ?? []).length === 0
          ? "Nothing jotted yet."
          : `${(notes ?? []).length} ${(notes ?? []).length === 1 ? "note" : "notes"}${unfiled.length ? ` · ${unfiled.length} to sort` : " · all sorted"}`}
      </p>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}
      {notes === null && (
        <p className="mt-5 rounded-xl border border-dashed border-champagne-400 px-4 py-3 text-sm text-ink">
          The inbox needs one more database step: run <span className="font-mono text-xs">supabase/migrations/0008_notes.sql</span> in
          Supabase.
        </p>
      )}


      {notes !== null && (
        <div className="mt-8">
          <NoteWall notes={notes ?? []} areas={areas} today={today} initialOpen={openNote} />
        </div>
      )}

      {pictures.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="section-label">Unsorted pictures</h2>
            <Link href="/inspo?folder=unsorted" className="label hover:text-ink">
              Sort them in Inspo
            </Link>
          </div>
          <div className="mt-4 columns-3 gap-3 sm:columns-4">
            {pictures.slice(0, 8).map((item) => (
              <InspoTile key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
