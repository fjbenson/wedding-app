import Link from "next/link";
import JotForm from "@/components/jot-form";
import NoteText from "@/components/note-text";
import { formatDayMonth } from "@/lib/dates";
import type { Note } from "@/types/db";

/** How many unsorted notes the home screen shows. */
const LIST_LENGTH = 3;

/** "Today", "Yesterday", "3 days ago", then "12 Oct". */
function when(createdAt: string, today: string): string {
  const day = createdAt.slice(0, 10);
  const days = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDayMonth(day);
}

/**
 * "Your notes", straight under the ring (design canvas 2, "Home · Under the
 * ring", option B, 11 Oct 2026): jotting something down to come back to is
 * the thing people do most here. Below the box, the first few notes still
 * to sort; sorting itself happens in the inbox.
 */
export default function HomeNotes({ unfiled, today }: { unfiled: Note[]; today: string }) {
  const shown = unfiled.slice(0, LIST_LENGTH);

  return (
    <section className="relative px-5 lg:px-0">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="section-label">Your notes</h2>
        <Link href="/inbox" className="label hover:text-ink">
          All notes
        </Link>
      </div>

      <div className="glass-card mt-2.5 rounded-[22px] p-[18px]">
        <JotForm />

        {shown.length > 0 && (
          <>
            <p className="type-meta mt-5">To sort · {unfiled.length}</p>
            <ul className="mt-1">
              {shown.map((note) => (
                <li key={note.id} className="flex items-start gap-3 border-t border-linen py-3.5 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <NoteText note={note} />
                    <p className="type-meta mt-1.5">{when(note.created_at, today)}</p>
                  </div>
                  <Link
                    href={`/inbox#note-${note.id}`}
                    className="flex h-9 shrink-0 items-center rounded-full border border-champagne-400 bg-white/70 px-3 text-[13px] text-champagne-600 hover:text-ink"
                  >
                    File it
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
