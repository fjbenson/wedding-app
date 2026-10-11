import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
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
    <main className="page pb-28 lg:pb-16">
      <Link href="/" className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-stone hover:text-ink">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Hub
      </Link>
      <h1 className="type-display mt-3 text-[40px] leading-[1.05] tracking-[-0.02em]">Your notes</h1>
      <p className="mt-2 text-sm text-stone">
        {(notes ?? []).length === 0
          ? "Jot something down and it waits here, until you file it under an area or make it a to-do."
          : `${(notes ?? []).length} ${(notes ?? []).length === 1 ? "note" : "notes"}${unfiled.length ? ` · ${unfiled.length} to sort` : ", all sorted"}. Tap one to file it under an area, or make it a to-do.`}
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

      <Link
        href="/capture?from=/inbox"
        className="mt-5 flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-ink px-4 text-[15px] text-ivory transition hover:bg-ink/90 lg:w-fit lg:px-6"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Jot something down
      </Link>

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
