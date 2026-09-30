import { ExternalLink } from "lucide-react";
import type { Note } from "@/types/db";

/** "pinterest.co.uk/pin/123…" → "pinterest.co.uk" */
function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** A captured thought or link, as it reads in the inbox or on an area page. */
export default function NoteText({ note }: { note: Note }) {
  return (
    <>
      {note.body && <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{note.body}</p>}
      {note.url && (
        <a
          href={note.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${note.body ? "mt-2" : ""} inline-flex max-w-full items-center gap-1.5 text-sm text-champagne-600 underline underline-offset-4 hover:text-ink`}
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
          <span className="truncate">{host(note.url)}</span>
        </a>
      )}
    </>
  );
}
