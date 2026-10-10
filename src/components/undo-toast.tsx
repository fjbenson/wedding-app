"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A small note that appears after ticking something off — "Ticked off ·
 * Undo" — for a few seconds, in case of a slip (owner's ask, 10 Oct 2026).
 * Anything can raise it with `announceUndo()`; it lives once in the app's
 * frame, just above the phone menu bar.
 */

type Undoable = { label: string; undo: () => Promise<unknown> };

const EVENT = "wedding-undo";
const SHOW_FOR_MS = 5000;

export function announceUndo(detail: Undoable) {
  window.dispatchEvent(new CustomEvent<Undoable>(EVENT, { detail }));
}

export default function UndoToast() {
  const [note, setNote] = useState<(Undoable & { error?: boolean }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showFor = (next: typeof note) => {
    clearTimeout(timer.current);
    setNote(next);
    if (next) timer.current = setTimeout(() => setNote(null), SHOW_FOR_MS);
  };

  useEffect(() => {
    const onUndoable = (event: Event) => showFor((event as CustomEvent<Undoable>).detail);
    window.addEventListener(EVENT, onUndoable);
    return () => {
      window.removeEventListener(EVENT, onUndoable);
      clearTimeout(timer.current);
    };
  }, []);

  if (!note) return null;

  const undo = async () => {
    const current = note;
    showFor(null);
    try {
      await current.undo();
    } catch (error) {
      // An action left over from before a deploy, or no connection: say so
      // rather than letting the error blank the screen (CLAUDE.md, Conventions).
      console.error("undo failed", error);
      showFor({ ...current, label: "That didn't undo — try again", error: true });
    }
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+104px)] z-50 flex justify-center px-4 lg:bottom-8 lg:left-60"
    >
      <div className="flex min-h-12 items-center gap-4 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-sm text-ivory shadow-[0_12px_30px_-12px_rgb(20_12_5/0.5)]">
        <span>{note.label}</span>
        {!note.error && (
          <button
            type="button"
            onClick={undo}
            className="h-9 rounded-full px-4 font-medium text-champagne-100 hover:bg-ivory/10"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
