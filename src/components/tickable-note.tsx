"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import NoteText from "@/components/note-text";
import { toggleLine } from "@/lib/note-lines";
import { saveInboxNoteAction } from "@/app/(app)/capture/actions";
import type { Note } from "@/types/db";

/**
 * A note whose tick-boxes can be ticked right where it's shown — the notes
 * panel, an area page (owner, 19 Oct 2026). A tick saves at once; it shows
 * straight away and the page catches up.
 */
export default function TickableNote({ note, className, titled }: { note: Note; className?: string; titled?: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState(note.body ?? "");
  const [error, setError] = useState<string>();
  const [, start] = useTransition();
  return (
    <>
      <NoteText
        note={{ ...note, body }}
        className={className}
        titled={titled}
        onToggle={(index) => {
          const next = toggleLine(body, index);
          setBody(next);
          start(async () => {
            let result: { error?: string };
            try {
              result = await saveInboxNoteAction(note.id, next, note.url);
            } catch {
              result = { error: "That didn't save. Reload the page and try again." };
            }
            setError(result.error);
            if (!result.error) router.refresh();
          });
        }}
      />
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
    </>
  );
}
