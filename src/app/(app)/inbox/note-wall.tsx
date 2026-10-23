"use client";

import Link from "next/link";
import CardLink from "@/components/card-link";
import CardSheet from "@/components/card-sheet";
import { useEffect, useState, useTransition } from "react";
import { Check, ChevronDown, ChevronRight, CircleCheck, Link2, PenLine, Plus, Trash2 } from "lucide-react";
import { DateInput } from "@/components/form-bits";
import { AreaTiles } from "@/components/visual-form";
import { host } from "@/components/note-text";
import NoteEditor from "@/components/note-editor";
import TickableNote from "@/components/tickable-note";
import { parseNote, tickCount } from "@/lib/note-lines";
import { areaName, type AreaOption } from "@/lib/areas";
import { formatAgo } from "@/lib/dates";
import type { Note } from "@/types/db";
import { AreaPageLink, AreaTagRow } from "../plan/item-parts";
import { fileInboxNoteAction, inboxNoteToTodoAction, removeInboxNoteAction, saveInboxNoteAction } from "../capture/actions";

/** Soft papers: ivory, champagne, blush, sage. */
const PAPERS = ["#FFFDF8", "#F6EEDD", "#F3E6E1", "#EEF0E6"];

/** A number from a note's id, so each note keeps its own paper and tilt. */
function seed(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * A paper for each note, looking random rather than in turn (owner, 16 Oct
 * 2026: in turn, the two columns read as pairs — two white, two beige…).
 * Picked from the note's id, so it stays the same every visit, and never
 * the same as either of the two before it on the wall.
 */
function papersFor(keys: string[]) {
  const picked: number[] = [];
  for (const key of keys) {
    let p = seed(key) % PAPERS.length;
    while (p === picked[picked.length - 1] || p === picked[picked.length - 2]) p = (p + 1) % PAPERS.length;
    picked.push(p);
  }
  return picked.map((p) => PAPERS[p]);
}
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
 * its area's name, and shows on that area's page as well. Making it a to-do
 * asks when, keeps the note with a "To-do" tag that opens it, and says
 * "Added to your plan · See it".
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
  // After "Make it a to-do": say where it went, with a way there.
  const [added, setAdded] = useState<string | null>(null);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(null), 8000);
    return () => clearTimeout(timer);
  }, [added]);

  const blanks = BLANKS.slice(0, Math.max(0, WALL_MIN - notes.length));
  const papers = papersFor([...notes.map((n) => n.id), ...blanks]);
  const first = 0;

  return (
    <>
      <ul className="columns-2 gap-3.5 pt-2 lg:columns-3">
        {notes.map((note, index) => (
          <li key={note.id} className="mb-6 break-inside-avoid pt-2">
            <button
              type="button"
              onClick={() => setOpenId(note.id)}
              className="relative block w-full rounded-[4px] px-4 pb-3.5 pt-[22px] text-left shadow-[0_1px_2px_rgb(60_45_20/0.08),0_10px_22px_-14px_rgb(60_45_20/0.35)] transition active:scale-[0.98] motion-reduce:transform-none"
              style={{ background: papers[first + index], transform: `rotate(${TURNS[seed(note.id) % TURNS.length]}deg)` }}
            >
              <span
                aria-hidden
                className="absolute -top-2 left-1/2 h-4 w-[54px] -translate-x-1/2 border-x border-dashed border-white/60 bg-[rgb(225_205_165/0.55)]"
              />
              {/* Plain words here: a link can't sit inside a button. The panel has the real link. */}
              {note.body && <WallBody body={note.body} />}
              {note.url && (
                <span className={`${note.body ? "mt-2" : ""} flex items-center gap-1.5 text-[13px] text-champagne-600`}>
                  <Link2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
                  <span className="truncate">{host(note.url)}</span>
                </span>
              )}
              <span className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                <span className="type-meta">{tickLabel(note.body) ?? formatAgo(note.created_at, today)}</span>
                {/* Filed: tagged with its area, and on that area's page too — it stays here as well. */}
                {(note.area_key || note.milestone_id) && (
                  <span className="flex flex-wrap gap-1">
                    {note.area_key && (
                      <span className="rounded-full bg-white/75 px-2 py-0.5 text-[12px] font-medium text-champagne-600 shadow-[inset_0_0_0_1px_rgb(205_183_142/0.6)]">
                        {areaName(note.area_key, areas)}
                      </span>
                    )}
                    {/* Made into a to-do: it stays here too, and the panel opens it. */}
                    {note.milestone_id && (
                      <span className="flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-[12px] font-medium text-ivory">
                        <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                        To-do
                      </span>
                    )}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
        {blanks.map((prompt, i) => {
          const index = first + notes.length + i;
          return (
            <li key={prompt} className="mb-6 break-inside-avoid pt-2">
              <Link
                href="/capture?from=/inbox"
                className="relative block rounded-[4px] px-4 pb-3.5 pt-[22px] opacity-60 shadow-[0_1px_2px_rgb(60_45_20/0.06),0_10px_22px_-16px_rgb(60_45_20/0.3)] transition hover:opacity-90"
                style={{ background: papers[index], transform: `rotate(${TURNS[seed(prompt) % TURNS.length]}deg)` }}
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

      {open && (
        <NotePanel key={open.id} note={open} areas={areas} today={today} onClose={() => setOpenId(null)} onAdded={setAdded} />
      )}

      {added && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] z-30 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-ivory shadow-lg lg:bottom-8"
        >
          <Check className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
          <span className="flex-1">Added to your plan.</span>
          <CardLink href={`/plan/${added}`} className="font-medium underline underline-offset-4">
            See it
          </CardLink>
        </div>
      )}
    </>
  );
}

const ROW = "flex min-h-14 w-full items-center gap-3 border-t border-linen px-1 text-left text-base text-ink disabled:opacity-60";

/** The panel a tapped note opens: a sheet from the bottom on a phone, a card in the middle on a laptop. */
function NotePanel({
  note,
  areas,
  today,
  onClose,
  onAdded,
}: {
  note: Note;
  areas: AreaOption[];
  today: string;
  onClose: () => void;
  onAdded: (milestoneId: string) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [area, setArea] = useState(note.area_key ?? "");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.body ?? "");
  // Making it a to-do asks when, like the to-do form: done by, start around, or no date yet.
  const [asking, setAsking] = useState(false);
  const [whenDate, setWhenDate] = useState("");

  // Done: the note has left the inbox (or changed), so close and let the page refresh.
  const run = (work: () => Promise<Result>, closeAfter = true) =>
    start(async () => {
      const result = await safely(work);
      setError(result.error);
      if (!result.error) (closeAfter ? onClose() : setEditing(false));
    });

  return (
    // The same frame and order as every item card (owner, 23 Oct 2026, canvas 4 "Cards · Rounds 1–10"): the area a tag at the top right, the note as the signature, a black main action, then the quiet Remove.
    <CardSheet label="Note" onClose={onClose} top={<span className="label">Note</span>}>
      <AreaTagRow
        area={area}
        areaOptions={areas}
        disabled={pending}
        onArea={(value) => {
          setArea(value);
          run(() => fileInboxNoteAction(note.id, value));
        }}
        under={
          note.area_key && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setArea("");
                run(() => fileInboxNoteAction(note.id, ""));
              }}
              className="mt-2 h-10 text-sm text-stone underline underline-offset-4 hover:text-ink"
            >
              Set it back to Not filed
            </button>
          )
        }
      />

      <div className="mt-3">
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run(() => saveInboxNoteAction(note.id, text, note.url), false);
            }}
          >
            <label className="block">
              <span className="sr-only">The note</span>
              <div className="rounded-xl border border-linen bg-white px-4 py-3">
                <NoteEditor name="note" initial={note.body} autoFocus onChange={setText} />
              </div>
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
          <TickableNote note={note} className="font-display text-[21px] italic leading-snug" />
        )}
        <p className="type-meta mt-2">{formatAgo(note.created_at, today)}</p>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-champagne-400 bg-cream px-4 py-2.5 text-sm text-ink">
          {error}
        </p>
      )}

      {note.milestone_id ? (
        <CardLink
          href={`/plan/${note.milestone_id}`}
          className="mt-4 flex h-12 items-center gap-2.5 rounded-full bg-champagne-100 px-5 text-[15px] text-champagne-600"
        >
          <CircleCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          <span className="flex-1">On your plan as a to-do</span>
          <span className="flex items-center text-sm">
            See it
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </span>
        </CardLink>
      ) : !asking ? (
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => setAsking(true)}
            className="flex h-12 items-center gap-2.5 rounded-full bg-ink px-5 text-[15px] text-ivory hover:bg-ink/90 disabled:opacity-60"
          >
            <CircleCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            Make it a to-do
          </button>
          {!editing && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(true)}
              className="flex h-12 items-center gap-2 rounded-full border border-linen bg-white px-5 text-[15px] text-ink hover:border-champagne-400 disabled:opacity-60"
            >
              <PenLine className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Edit
            </button>
          )}
        </div>
      ) : (
        <form
          className="mt-4 rounded-2xl border border-linen bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              const result = await safely(() => inboxNoteToTodoAction(note.id, { kind: whenDate ? "due" : "none", date: whenDate || null }));
              setError(result.error);
              const id = (result as { milestoneId?: string }).milestoneId;
              if (!result.error && id) {
                onAdded(id);
                onClose();
              }
            });
          }}
        >
          <p className="flex items-center gap-3 text-base text-ink">
            <CircleCheck className="h-5 w-5 text-champagne-600" strokeWidth={1.8} aria-hidden />
            Make it a to-do
          </p>
          {/* Just an optional date (owner, 12 Oct 2026: no Done by / Start around). */}
          <label className="mt-3.5 block text-sm text-ink">
            <span className="sr-only">Date (optional)</span>
            <DateInput
              value={whenDate}
              onChange={(event) => setWhenDate(event.target.value)}
              className="block h-12 w-full rounded-xl border border-linen bg-white px-4 text-[16px] text-ink focus:border-champagne-400 focus:outline-none"
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setAsking(false)} className="h-11 rounded-xl px-4 text-sm text-stone hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="h-11 rounded-xl bg-ink px-5 text-sm text-ivory disabled:opacity-50">
              {pending ? "Adding…" : "Add to the plan"}
            </button>
          </div>
        </form>
      )}

      <AreaPageLink areaKey={area} areas={areas} />

      <button
        type="button"
        disabled={pending}
        onClick={() => confirm("Remove this note?") && run(() => removeInboxNoteAction(note.id))}
        className="mt-4 block w-full min-h-11 py-3 text-center text-sm text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
      >
        Remove this note
      </button>
    </CardSheet>
  );
}

/** "1 of 4 ticked" when a note has tick-boxes, else nothing. */
function tickLabel(body: string | null): string | null {
  const { ticks, done } = tickCount(body);
  return ticks ? `${done} of ${ticks} ticked` : null;
}

/** A note on the wall: its first few lines, with bullets and tick-boxes drawn small. */
function WallBody({ body }: { body: string }) {
  const lines = parseNote(body).filter((l) => l.text.trim() || l.kind !== "text");
  const shown = lines.slice(0, 8);
  return (
    <span className="block space-y-1">
      {shown.map((l, i) =>
        l.kind === "text" ? (
          <span key={i} className="block font-display text-[17px] italic leading-snug text-ink">
            {l.text}
          </span>
        ) : (
          <span key={i} className={`flex items-start gap-2 text-[14px] leading-snug ${l.done ? "text-stone line-through" : "text-ink"}`}>
            {l.kind === "bullet" ? (
              <span aria-hidden className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-champagne-600" />
            ) : (
              <span
                aria-hidden
                className={`mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${l.done ? "border-champagne-600 bg-champagne-600 text-white" : "border-champagne-400"}`}
              >
                {l.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
            )}
            <span className="min-w-0">{l.text}</span>
          </span>
        ),
      )}
      {lines.length > shown.length && <span className="block text-[13px] text-stone">and {lines.length - shown.length} more</span>}
    </span>
  );
}
