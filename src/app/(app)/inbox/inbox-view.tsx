import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { InlineSubmit, RemoveButton } from "@/components/form-bits";
import NoteText from "@/components/note-text";
import { areaName, type AreaOption } from "@/lib/areas";
import { formatDayMonth } from "@/lib/dates";
import type { Note } from "@/types/db";
import { deleteNoteAction, fileNoteAction, noteToTodoAction } from "../capture/actions";

export const metadata = { title: "Inbox — Wedding App" };

function InboxItem({ note, areas }: { note: Note; areas: AreaOption[] }) {
  return (
    <li className="rounded-2xl border border-linen bg-white p-4">
      <NoteText note={note} />
      <p className="mt-2 text-xs text-stone">{formatDayMonth(note.created_at.slice(0, 10))}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-linen pt-3">
        <form action={fileNoteAction.bind(null, note.id)} className="flex items-center gap-2">
          <select
            name="area"
            required
            defaultValue=""
            aria-label="File under"
            className="h-9 rounded-full border border-linen bg-ivory px-3 text-sm text-ink focus:border-champagne-400 focus:outline-none"
          >
            <option value="" disabled>
              File under…
            </option>
            {areas.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
          <InlineSubmit label="File" pendingLabel="Filing…" />
        </form>
        <form action={noteToTodoAction.bind(null, note.id)}>
          <InlineSubmit label="Make a to-do" pendingLabel="Adding…" />
        </form>
        <div className="ml-auto">
          <RemoveButton action={deleteNoteAction.bind(null, note.id)} label="Remove" question="Remove this?" />
        </div>
      </div>
    </li>
  );
}

/** The capture inbox (screen 36): everything not yet filed, then what was filed lately. */
export default function InboxView({
  notes,
  areas,
  error,
  detail,
}: {
  /** null until 0008_notes.sql has been run. */
  notes: Note[] | null;
  areas: AreaOption[];
  error?: string;
  detail?: string;
}) {
  const unfiled = (notes ?? []).filter((n) => !n.area_key);
  const filed = (notes ?? []).filter((n) => n.area_key).slice(0, 12);

  return (
    <main className="page pb-28 lg:pb-16">
      <Link href="/" className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-stone hover:text-ink">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Hub
      </Link>
      <p className="label mt-4">Inbox</p>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {unfiled.length === 0 ? "All sorted." : `${unfiled.length} to sort`}
      </h1>
      <p className="mt-2 text-sm text-stone">
        Ideas and links you&apos;ve captured. File each under an area, or turn it into a to-do.
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
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90 lg:w-fit lg:px-6"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Capture something
      </Link>

      {unfiled.length > 0 && (
        <ul className="mt-8 space-y-3">
          {unfiled.map((n) => (
            <InboxItem key={n.id} note={n} areas={areas} />
          ))}
        </ul>
      )}

      {filed.length > 0 && (
        <section className="mt-12">
          <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">Filed lately</h2>
          <ul>
            {filed.map((n) => (
              <li key={n.id} className="border-b border-linen py-3 last:border-b-0">
                <NoteText note={n} />
                <p className="mt-1 text-xs text-stone">
                  <Link href={`/area/${encodeURIComponent(n.area_key!)}`} className="underline underline-offset-4 hover:text-ink">
                    {areaName(n.area_key, areas)}
                  </Link>{" "}
                  · {formatDayMonth(n.created_at.slice(0, 10))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
