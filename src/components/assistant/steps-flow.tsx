"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { Check, ChevronLeft, X } from "lucide-react";
import type { Proposal } from "@/lib/assistant/blocks";

/**
 * The assistant doing a job a step at a time (canvas 3 "Your assistant ·
 * Steps in the chat", owner's picks 17 Oct 2026). The chat stays on screen;
 * a small card rises where the message box is, with a step marker, one
 * question and Back · Skip · Next ("Skip the rest and review"). Each answer
 * becomes a message in the conversation, a skipped step a faded "Skipped".
 * At the end a check card lists every line (tap one to change it) and only
 * Yes saves.
 *
 * This file is the shared frame; each job (a guest, a to-do…) is a `Flow`
 * that says what its steps are. Everything runs on the phone: no further
 * calls to the AI, and what's typed or picked in the steps is never sent to
 * it.
 */

export type Mark = "answered" | "skipped";

export interface StepsState<V = unknown> {
  phase: "asking" | "review" | "saving" | "saved" | "error" | "cancelled";
  /** Which step the tray is on. */
  index: number;
  marks: Record<string, Mark>;
  /** Changing one line from the check card: Next goes straight back to it. */
  editing: boolean;
  values: V;
  link?: string;
  note?: string;
  error?: string;
}

export interface StepBodyProps<B, V> {
  block: B;
  state: StepsState<V>;
  setValues: (change: Partial<V>) => void;
  stepKey: string;
}

export interface Flow<B extends { id: string }, V> {
  keys(block: B): string[];
  initial(block: B): StepsState<V>;
  /** What the answer reads as; null when there isn't one. */
  answer(block: B, values: V, key: string): string | null;
  clear(values: V, key: string): V;
  proposal(block: B, values: V): Proposal;
  /** Names the thing in the notes to the assistant: "Amy Latham". */
  subject(block: B): string;
  intro(block: B): string;
  /** The assistant's line in the chat. */
  question(block: B, key: string): string;
  /** The tray's big heading. */
  heading(block: B, key: string): string;
  label(key: string): string;
  /** Under the card's title: "Add to the guest list". */
  action: string;
  closing(block: B): string;
  yes(block: B): string;
  /** After saving: "See them ›". */
  seeIt: string;
  cancelled: string;
  /** Lines on the check card that aren't steps. */
  fixed(block: B): [string, string][];
  Body: ComponentType<StepBodyProps<B, V>>;
  /** A line on the check card that is changed in place rather than by a step. */
  Extra?: ComponentType<{ block: B; state: StepsState<V>; setValues: (change: Partial<V>) => void; editable: boolean }>;
}

// ── In the conversation ─────────────────────────────────────────────────

export function StepsChat<B extends { id: string }, V>({
  flow,
  block,
  state,
  onYes,
  onCancel,
  onEdit,
  onGo,
  setValues,
}: {
  flow: Flow<B, V>;
  block: B;
  state: StepsState<V>;
  onYes: () => void;
  onCancel: () => void;
  onEdit: (key: string) => void;
  onGo: () => void;
  setValues: (change: Partial<V>) => void;
}) {
  const keys = flow.keys(block);
  const current = state.phase === "asking" ? keys[state.index] : null;
  const reviewing = ["review", "saving", "error", "saved"].includes(state.phase);
  const editable = state.phase === "review";
  const Extra = flow.Extra;

  return (
    <div className="mt-3.5">
      <p className="max-w-[92%] text-[16px] leading-relaxed text-ink">{flow.intro(block)}</p>

      {keys.map((key) => {
        const mark = state.marks[key];
        if (!mark && key !== current) return null;
        const text = mark === "answered" ? flow.answer(block, state.values, key) : null;
        return (
          <div key={key}>
            <p className="mt-4 font-display text-[19px] font-light leading-snug text-ink">{flow.question(block, key)}</p>
            {mark && (
              <div className="mt-2 flex justify-end">
                {text ? (
                  <p className="max-w-[78%] rounded-[20px_20px_6px_20px] bg-champagne-100 px-4 py-2 text-[15px] leading-snug text-ink">{text}</p>
                ) : (
                  <p className="rounded-2xl border border-dashed border-stone/50 px-3.5 py-1.5 text-sm italic text-stone">Skipped</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {reviewing && (
        <>
          <p className="mt-4 font-display text-[19px] font-light leading-snug text-ink">{flow.closing(block)}</p>
          <div className="mt-3 overflow-hidden rounded-[18px] border border-linen bg-white">
            <div className="px-4 py-3.5">
              <span className="block font-display text-[18px] leading-tight text-ink">{flow.subject(block)}</span>
              <span className="type-meta mt-1 block">{flow.action}</span>
            </div>
            {keys.map((key) => {
              const text = flow.answer(block, state.values, key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!editable}
                  onClick={() => onEdit(key)}
                  className="flex w-full justify-between gap-4 border-t border-linen px-4 py-2.5 text-left text-sm disabled:cursor-default"
                >
                  <span className="shrink-0 text-stone">{flow.label(key)}</span>
                  <span className={`text-right ${text ? "text-ink" : "italic text-stone/70"}`}>{text ?? "Skipped"}</span>
                </button>
              );
            })}
            {Extra && <Extra block={block} state={state} setValues={setValues} editable={editable} />}
            {flow.fixed(block).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-t border-linen px-4 py-2.5 text-sm">
                <span className="shrink-0 text-stone">{label}</span>
                <span className="text-right text-ink">{value}</span>
              </div>
            ))}
            {state.phase !== "saved" && (
              <div className="flex gap-2 border-t border-linen px-4 py-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={state.phase === "saving"}
                  className="h-[46px] w-24 shrink-0 rounded-full border border-linen bg-white text-[15px] text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onYes}
                  disabled={state.phase === "saving"}
                  className="h-[46px] flex-1 rounded-full bg-ink text-[15px] text-ivory disabled:opacity-60"
                >
                  {state.phase === "saving" ? "Saving…" : flow.yes(block)}
                </button>
              </div>
            )}
          </div>
          {state.phase === "review" && <p className="mt-2 text-xs text-stone">Tap any line to change it.</p>}
          {state.phase === "saved" && (
            <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-champagne-600">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-champagne-600 text-white">
                <Check className="h-3 w-3" strokeWidth={2.6} aria-hidden />
              </span>
              Done
              {state.link && (
                <>
                  {" · "}
                  <Link href={state.link} onClick={onGo} className="underline underline-offset-4 hover:text-ink">
                    {flow.seeIt}
                  </Link>
                </>
              )}
            </p>
          )}
          {state.phase === "saved" && state.note && <p className="mt-1.5 text-sm text-stone">{state.note}</p>}
          {state.phase === "error" && <p className="mt-2 text-sm text-[#9A3F2B]">{state.error}</p>}
        </>
      )}

      {state.phase === "cancelled" && <p className="mt-3 text-sm italic text-stone">{flow.cancelled}</p>}
    </div>
  );
}

// ── The tray ────────────────────────────────────────────────────────────

/** The card that rises where the message box is: marker, one question, Back · Skip · Next. */
export function StepsTray<B extends { id: string }, V>({
  flow,
  block,
  state,
  update,
  onCancel,
}: {
  flow: Flow<B, V>;
  block: B;
  state: StepsState<V>;
  update: (change: (state: StepsState<V>) => StepsState<V>) => void;
  onCancel: () => void;
}) {
  const keys = flow.keys(block);
  const key = keys[state.index];
  const last = state.index === keys.length - 1;
  const setValues = (change: Partial<V>) => update((s) => ({ ...s, values: { ...s.values, ...change } }));

  /** Marks this step and moves on: to the next, or to the check card at the end or when changing one line. */
  function finish(skip: boolean) {
    update((s) => {
      const answered = !skip && flow.answer(block, s.values, key) !== null;
      const marks = { ...s.marks, [key]: answered ? ("answered" as const) : ("skipped" as const) };
      const values = answered ? s.values : flow.clear(s.values, key);
      if (s.editing || last) return { ...s, marks, values, editing: false, phase: "review" };
      return { ...s, marks, values, index: s.index + 1 };
    });
  }

  function skipRest() {
    update((s) => {
      const marks = { ...s.marks };
      let values = s.values;
      keys.forEach((k, i) => {
        if (i < s.index || (marks[k] && i !== s.index)) return;
        const keep = i === s.index && flow.answer(block, values, k) !== null;
        marks[k] = keep ? "answered" : "skipped";
        if (!keep) values = flow.clear(values, k);
      });
      return { ...s, marks, values, editing: false, phase: "review" };
    });
  }

  const Body = flow.Body;

  return (
    <div className="shrink-0 rounded-t-[28px] bg-white pt-3 shadow-[0_-16px_40px_-18px_rgb(60_45_20/0.35)] lg:rounded-bl-[28px]">
      <div className="mx-auto mb-2.5 h-[5px] w-10 rounded-full bg-linen" aria-hidden />
      <div className="flex items-center gap-1.5 px-5">
        {keys.map((k, i) => {
          const mark = state.marks[k];
          const here = i === state.index;
          return (
            <div key={k} className="flex flex-1 items-center gap-1.5 last:flex-none">
              <span
                className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-xs ${
                  here
                    ? "bg-ink font-semibold text-ivory"
                    : mark === "answered"
                      ? "bg-champagne-400 text-white"
                      : mark === "skipped"
                        ? "border-[1.5px] border-dashed border-stone/50 text-stone"
                        : "border-[1.5px] border-linen bg-white text-stone"
                }`}
              >
                {here ? i + 1 : mark === "answered" ? <Check className="h-3 w-3" strokeWidth={2.6} aria-hidden /> : mark === "skipped" ? "–" : i + 1}
              </span>
              {i < keys.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${mark === "answered" ? "bg-champagne-400" : "bg-linen"}`} />}
            </div>
          );
        })}
        <span className="ml-1.5 whitespace-nowrap text-xs text-stone">
          {state.index + 1} of {keys.length}
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <div className="max-h-[44dvh] overflow-y-auto overscroll-contain px-5 pt-4">
        <p className="font-display text-[26px] font-light leading-[1.1] tracking-[-0.02em] text-ink">{flow.heading(block, key)}</p>
        <div className="mt-3.5">
          <Body block={block} state={state} setValues={setValues} stepKey={key} />
        </div>
      </div>

      <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex gap-2">
          {state.index > 0 && (
            <button
              type="button"
              onClick={() => update((s) => ({ ...s, index: s.index - 1, editing: false }))}
              aria-label="Back"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-linen bg-white text-stone hover:text-ink"
            >
              <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
            </button>
          )}
          <button type="button" onClick={() => finish(true)} className="h-12 w-[88px] shrink-0 rounded-full border border-linen bg-white text-[15px] text-ink">
            Skip
          </button>
          <button type="button" onClick={() => finish(false)} className="h-12 flex-1 rounded-full bg-ink text-base text-ivory">
            {last || state.editing ? "Review" : "Next"}
          </button>
        </div>
        {!last && !state.editing && (
          <p className="mt-2.5 text-center">
            <button type="button" onClick={skipRest} className="text-[13px] text-champagne-600 underline underline-offset-4 hover:text-ink">
              Skip the rest and review
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Shared look for the steps' answers ──────────────────────────────────

export const PILL = "h-10 rounded-full border px-4 text-sm transition";
export const PILL_ON = "border-champagne-400 bg-champagne-100 text-ink";
export const PILL_OFF = "border-linen bg-white text-ink hover:border-champagne-400";
export const FIELD =
  "block h-[52px] w-full rounded-2xl border border-linen bg-white px-4 text-[17px] text-ink placeholder:text-stone/70 focus:border-champagne-400 focus:outline-none";
