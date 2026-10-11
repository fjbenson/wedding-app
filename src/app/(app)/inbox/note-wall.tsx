"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { CircleCheck, Link2, PenLine, Plus, Trash2 } from "lucide-react";
import NoteText, { host } from "@/components/note-text";
import { areaName, type AreaOption } from "@/lib/areas";
import { formatAgo } from "@/lib/dates";
import type { Note } from "@/types/db";
import { fileInboxNoteAction, inboxNoteToTodoAction, removeInboxNoteAction, saveInboxNoteAction } from "../capture/actions";

/** Soft papers, in turn: ivory, champagne, blush, sage. */
const PAPERS = ["#FFFDF8", "#F6EEDD", "#F3E6E1", "#EEF0E6"];
/** A slight, uneven tilt, in degrees — the canvas's "slight". */
const TURNS = [-1, 0.8, -0.4, 1, 0.5, -0.9];

/**
 * Until there are four real notes, faded blank notes fill the wall so it
 * reads as a wall of sticky notes from day one (owner, 11 Oct 2026). Never
 * saved — each is an invitation, and tapping one opens Jot something down.
 */
const WALL_MIN = 4;
const BLANKS = ["A thought for later", "Something to ask", "A link to keep", "A name to remember"];

type Result = { error?: string };

/** After a deploy a page left open can call an action that's gone; say so rather than blank the screen. */
async function safely(work: () => Promise<Result>): Promise<Result> {
  try {
    return (await work()) ?? {};
  } catch (error) {
    console.error("inbox action failed", error);
    return { error: "That didn't work. Reload the page and try again." };
  }
}

/**
 * The inbox as a wall of paper notes (canvas 2, "Inbox · Sticky-note wall",
 * option A, owner's pick 11 Oct 2026): two columns on a phone, three on a
 * laptop, each slightly turned with a strip of tape. Tap one and a panel
 * comes up to file it under an area, make it a to-do, edit or remove it.
 * Filing only tags a note (owner, 11 Oct 2026): it stays on the wall with
 * its area's name, and shows on that area's page as well.
 */
export default function NoteWall({
  notes,
  areas,
  today,
  initialOpen,
}: {
  notes: Note[];
  areas: AreaOption[];
  today: string;
  /** A note to open straight away — the home screen's "File it". */
  initialOpen?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(notes.some((n) => n.id === initialOpen) ? initialOpen! : null);
  const open = notes.find((n) => n.id === openId);

  return (
    <>
      <ul className="columns-2 gap-3.5 pt-2 lg:columns-3">
        {notes.map((note, index) => (
          <li key={note.id} className="mb-6 break-inside-avoid pt-2">
            <button
              type="button"
              onClick={() => setOpenId(note.id)}
              className="relative block w-full rounded-[4px] px-4 pb-3.5 pt-[22px] text-left shadow-[0_1px_2px_rgb(60_45_20/0.08),0_10px_22px_-14px_rgb(60_45_20/0.35)] transition active:scale-[0.98] motion-reduce:transform-none"
              style={{ background: PAPERS[index % PAPERS.length], transform: `rotate(${TURNS[index % TURNS.length]}deg)` }}
            >
              <span
                aria-hidden
                className="absolute -top-2 left-1/2 h-4 w-[54px] -translate-x-1/2 border-x border-dashed border-white/60 bg-[rgb(225_205_165/0.55)]"
              />
              {/* Plain words here: a link can't sit inside a button. The panel has the real link. */}
              {note.body && (
                <span className="line-clamp-[8] block whitespace-pre-wrap font-display text-[17px] italic leading-snug text-ink">
                  {note.body}
                </span>
              )}
              {note.url && (
                <span className={`${note.body ? "mt-2" : ""} flex items-center gap-1.5 text-[13px] text-champagne-600`}>
                  <Link2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
                  <span className="truncate">{host(note.url)}</span>
                </span>
              )}
              <span className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                <span className="type-meta">{formatAgo(note.created_at, today)}</span>
                {/* Filed: tagged with its area, and on that area's page too — it stays here as well. */}
                {note.area_key && (
                  <span className="rounded-full bg-white/75 px-2 py-0.5 text-[12px] font-medium text-champagne-600 shadow-[inset_0_0_0_1px_rgb(205_183_142/0.6)]">
                    {areaName(note.area_key, areas)}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
        {BLANKS.slice(0, Math.max(0, WALL_MIN - notes.length)).map((prompt, i) => {
          const index = notes.length + i;
          return (
            <li key={prompt} className="mb-6 break-inside-avoid pt-2">
              <Link
                href="/capture?from=/inbox"
                className="relative block rounded-[4px] px-4 pb-3.5 pt-[22px] opacity-60 shadow-[0_1px_2px_rgb(60_45_20/0.06),0_10px_22px_-16px_rgb(60_45_20/0.3)] transition hover:opacity-90"
                style={{ background: PAPERS[index % PAPERS.length], transform: `rotate(${TURNS[index % TURNS.length]}deg)` }}
              >
                <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-[54px] -translate-x-1/2 border-x border-dashed border-white/60 bg-[rgb(225_205_165/0.55)]" />
                <span className="flex items-start gap-2 font-display text-[17px] italic leading-snug text-stone">
                  <Plus className="mt-1 h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
                  {prompt}
                </span>
                <span className="type-meta mt-3 block">Tap to jot</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {open && <NotePanel key={open.id} note={open} areas={areas} today={today} onClose={() => setOpenId(null)} />}
    </>
  );
}

const ROW = "flex min-h-14 w-full items-center gap-3 border-t border-linen px-1 text-left text-base text-ink disabled:opacity-60";

/** The panel a tapped note opens: a sheet from the bottom on a phone, a card in the middle on a laptop. */
function NotePanel({ note, areas, today, onClose }: { note: Note; areas: AreaOption[]; today: string; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [area, setArea] = useState(note.area_key ?? "");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.body ?? "");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Done: the note has left the inbox (or changed), so close and let the page refresh.
  const run = (work: () => Promise<Result>, closeAfter = true) =>
    start(async () => {
      const result = await safely(work);
      setError(result.error);
      if (!result.error) (closeAfter ? onClose() : setEditing(false));
    });

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-label="Note">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="relative w-full max-w-lg rounded-t-[28px] bg-ivory px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_40px_rgb(30_27_24/0.2)] lg:rounded-[28px] lg:pb-6">
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E0D3BC] lg:hidden" />

        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run(() => saveInboxNoteAction(note.id, text, note.url), false);
            }}
          >
            <label className="block">
              <span className="sr-only">The note</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                autoFocus
                className="block w-full resize-none rounded-xl border border-linen bg-white px-4 py-3 font-display text-[19px] leading-snug text-ink focus:border-champagne-400 focus:outline-none"
              />
            </label>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="h-11 rounded-xl px-4 text-sm text-stone hover:text-ink">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="h-11 rounded-xl bg-ink px-5 text-sm text-ivory disabled:opacity-60">
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <NoteText note={note} className="font-display text-[21px] italic leading-snug" />
        )}
        <p className="type-meta mt-2">{formatAgo(note.created_at, today)}</p>

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-champagne-400 bg-cream px-4 py-2.5 text-sm text-ink">
            {error}
          </p>
        )}

        <form
          className="mt-4 flex min-h-14 items-center gap-2 border-t border-linen px-1"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => fileInboxNoteAction(note.id, area));
          }}
        >
          <label htmlFor="file-under" className="flex-1 text-base text-ink">
            {note.area_key ? "Filed under" : "File under"}
          </label>
          <select
            id="file-under"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            className="h-10 max-w-[45%] rounded-full border border-[#E0D3BC] bg-white px-3 text-[15px] text-ink focus:border-champagne-400 focus:outline-none"
          >
            <option value="">{note.area_key ? "Not filed" : "Choose an area"}</option>
            {areas.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
          {area !== (note.area_key ?? "") && (
            <button type="submit" disabled={pending} className="h-10 rounded-full bg-ink px-4 text-sm text-ivory disabled:opacity-60">
              {area ? "File" : "Save"}
            </button>
          )}
        </form>
        <button type="button" disabled={pending} onClick={() => run(() => inboxNoteToTodoAction(note.id))} className={ROW}>
          <CircleCheck className="h-5 w-5 text-champagne-600" strokeWidth={1.8} aria-hidden />
          Make it a to-do
        </button>
        {!editing && (
          <button type="button" disabled={pending} onClick={() => setEditing(true)} className={ROW}>
            <PenLine className="h-5 w-5 text-champagne-600" strokeWidth={1.8} aria-hidden />
            Edit
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => confirm("Remove this note?") && run(() => removeInboxNoteAction(note.id))}
          className={`${ROW} text-stone`}
        >
          <Trash2 className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          Remove
        </button>
      </div>
    </div>
  );
}
