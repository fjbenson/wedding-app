"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { parseNote, writeNote, type LineKind, type NoteLine } from "@/lib/note-lines";

/**
 * Writing a note (canvas 3 "Notes · Round 1", A, owner's pick 19 Oct 2026):
 * one box you just type in, and a small toolbar that turns the line you're
 * on into a bullet or a tick-box (tap again to turn it back). Enter carries
 * on in the same style; Enter on an empty bullet or tick-box goes back to
 * words. One note can mix all three. The text goes in a hidden `name` input,
 * so it works inside an ordinary form; `onChange` also hears it.
 */
export default function NoteEditor({
  name = "body",
  initial,
  autoFocus = false,
  placeholder = "What's on your mind?",
  onChange,
  textClass = "font-display text-[19px] italic leading-snug",
  fill = false,
}: {
  /** Fill its box: the writing space grows to the toolbar, and a tap anywhere in it writes (a full-screen note). */
  fill?: boolean;
  name?: string;
  initial?: string | null;
  autoFocus?: boolean;
  placeholder?: string;
  onChange?: (body: string) => void;
  textClass?: string;
}) {
  const [lines, setLines] = useState<NoteLine[]>(() => {
    const parsed = parseNote(initial);
    return parsed.length ? parsed : [{ kind: "text", text: "", done: false }];
  });
  const [focus, setFocus] = useState(0);
  const boxes = useRef<(HTMLTextAreaElement | null)[]>([]);
  const want = useRef<{ index: number; at: number } | null>(null);
  const body = writeNote(lines);

  useEffect(() => {
    onChange?.(body);
  }, [body, onChange]);
  // Put the caret where the last key press wanted it.
  useEffect(() => {
    const w = want.current;
    if (!w) return;
    const el = boxes.current[w.index];
    if (el) {
      el.focus();
      el.setSelectionRange(w.at, w.at);
    }
    want.current = null;
  });
  useEffect(() => {
    if (autoFocus) boxes.current[0]?.focus();
  }, [autoFocus]);

  const set = (i: number, patch: Partial<NoteLine>) => setLines((all) => all.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const turn = (kind: LineKind) => {
    const i = Math.min(focus, lines.length - 1);
    set(i, { kind: lines[i].kind === kind ? "text" : kind, done: false });
    want.current = { index: i, at: lines[i].text.length };
  };

  // The toolbar: the line you're on becomes a bullet or a tick-box. On a
  // full-screen note it sits on top, where the phone's keyboard can't cover
  // it (owner, 21 Oct 2026).
  const toolbar = (
      <div className={fill ? "mb-3 flex gap-2 border-b border-ink/10 pb-3" : "mt-4 flex gap-2 border-t border-ink/10 pt-3"}>
        {(
          [
            ["bullet", "Bullet", "M9 7h11M9 12h11M9 17h11"],
            ["tick", "Tick-box", "M12 7h9M12 17h9"],
          ] as const
        ).map(([kind, label, path]) => {
          const on = lines[Math.min(focus, lines.length - 1)]?.kind === kind;
          return (
            <button
              key={kind}
              type="button"
              // Keep the caret in the line while tapping the button.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => turn(kind)}
              aria-pressed={on}
              className={`flex h-10 items-center gap-2 rounded-xl px-3 text-[13px] transition ${on ? "bg-champagne-100 text-champagne-600" : "text-ink hover:bg-white/70"}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {kind === "bullet" ? (
                  <>
                    <circle cx="5" cy="7" r="1" />
                    <circle cx="5" cy="12" r="1" />
                    <circle cx="5" cy="17" r="1" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="4" width="6" height="6" rx="1.5" />
                    <path d="M4.5 7l1 1 2-2" />
                    <rect x="3" y="14" width="6" height="6" rx="1.5" />
                  </>
                )}
                <path d={path} />
              </svg>
              {label}
            </button>
          );
        })}
      </div>
  );

  return (
    <div className={fill ? "flex flex-1 flex-col" : undefined}>
      <input type="hidden" name={name} value={body} />
      {fill && toolbar}
      <div
        className={fill ? "flex-1 cursor-text space-y-1" : "space-y-1"}
        // A tap in the empty space below the lines carries on the last one.
        onClick={(e) => {
          if (!fill || e.target !== e.currentTarget) return;
          const last = lines.length - 1;
          want.current = { index: last, at: lines[last].text.length };
          setFocus(last);
        }}
      >
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {line.kind === "bullet" && <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-champagne-600" />}
            {line.kind === "tick" && (
              <button
                type="button"
                aria-label={line.done ? "Untick" : "Tick"}
                aria-pressed={line.done}
                onClick={() => set(i, { done: !line.done })}
                className={`mt-[0.3em] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${line.done ? "border-champagne-600 bg-champagne-600 text-white" : "border-champagne-400 bg-white"}`}
              >
                {line.done && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
              </button>
            )}
            <textarea
              ref={(el) => {
                boxes.current[i] = el;
              }}
              value={line.text}
              rows={1}
              aria-label={i === 0 ? "The note" : `Line ${i + 1}`}
              placeholder={i === 0 && lines.length === 1 ? placeholder : ""}
              onFocus={() => setFocus(i)}
              onChange={(e) => {
                const value = e.target.value;
                // A paste of several lines: each becomes its own line.
                if (value.includes("\n")) {
                  const parts = parseNote(value);
                  setLines((all) => [...all.slice(0, i), { ...parts[0], kind: parts[0].kind === "text" ? line.kind : parts[0].kind }, ...parts.slice(1), ...all.slice(i + 1)]);
                  want.current = { index: i + parts.length - 1, at: parts[parts.length - 1].text.length };
                  return;
                }
                set(i, { text: value });
              }}
              onKeyDown={(e) => {
                const el = e.currentTarget;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  // Enter on an empty bullet or tick-box goes back to words.
                  if (!line.text && line.kind !== "text") return set(i, { kind: "text" });
                  const at = el.selectionStart ?? line.text.length;
                  const before = line.text.slice(0, at);
                  const after = line.text.slice(at);
                  setLines((all) => [...all.slice(0, i), { ...line, text: before }, { kind: line.kind, text: after, done: false }, ...all.slice(i + 1)]);
                  want.current = { index: i + 1, at: 0 };
                } else if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
                  if (line.kind !== "text") {
                    e.preventDefault();
                    set(i, { kind: "text" });
                  } else if (i > 0) {
                    e.preventDefault();
                    const prev = lines[i - 1];
                    setLines((all) => [...all.slice(0, i - 1), { ...prev, text: prev.text + line.text }, ...all.slice(i + 1)]);
                    want.current = { index: i - 1, at: prev.text.length };
                  }
                }
              }}
              className={`block min-w-0 flex-1 resize-none bg-transparent text-ink [field-sizing:content] placeholder:text-stone/50 focus:outline-none ${
                line.kind === "tick" && line.done ? "text-stone line-through" : ""
              } ${line.kind === "text" ? textClass : "text-[16px] leading-snug"}`}
            />
          </div>
        ))}
      </div>
      {!fill && toolbar}
    </div>
  );
}
