"use client";

import type { Proposal, TodoStepsBlock } from "@/lib/assistant/blocks";
import { formatLongDate } from "@/lib/dates";
import { FIELD, PILL, PILL_OFF, PILL_ON, type Flow, type StepBodyProps, type StepsState } from "./steps-flow";

/**
 * Adding a to-do, a step at a time (see steps-flow.tsx). Steps: when, which
 * area, anything to add. Whatever the couple already said is answered for
 * them; when the date and the area are both known it goes straight to the
 * check card. Neither is required: a to-do can have no date and no area.
 */

interface Values {
  /** yyyy-mm-dd, or "" */
  date: string;
  /** An area's key, "other", or "" */
  area: string;
  notes: string;
}

type Key = "date" | "area" | "notes";

const KEYS: Key[] = ["date", "area", "notes"];

function initial(block: TodoStepsBlock): StepsState<Values> {
  const p = block.prefill;
  const values: Values = { date: p.dueDate ?? "", area: p.area ?? "", notes: p.notes ?? "" };
  const marks: StepsState["marks"] = {};
  if (p.dateKnown) marks.date = "answered";
  if (p.areaKnown) marks.area = "answered";
  if (p.notes) marks.notes = "answered";
  if (marks.date && marks.area) {
    marks.notes ??= "skipped";
    return { phase: "review", index: KEYS.length - 1, marks, editing: false, values };
  }
  return { phase: "asking", index: KEYS.findIndex((k) => !marks[k]), marks, editing: false, values };
}

function answer(block: TodoStepsBlock, v: Values, key: string): string | null {
  switch (key as Key) {
    case "date":
      return v.date ? formatLongDate(v.date) : null;
    case "area":
      return v.area === "other" ? "Other" : (block.options.areas.find((a) => a.key === v.area)?.label ?? null);
    case "notes":
      return v.notes.trim() || null;
  }
  return null;
}

function clear(v: Values, key: string): Values {
  return { ...v, [key]: "" };
}

function proposal(block: TodoStepsBlock, v: Values): Proposal {
  return {
    kind: "add_todo",
    input: { title: block.prefill.title, dueDate: v.date || null, area: v.area || null, notes: v.notes.trim() || null },
  };
}

export const todoFlow: Flow<TodoStepsBlock, Values> = {
  keys: () => KEYS,
  initial,
  answer,
  clear,
  proposal,
  subject: (b) => b.prefill.title,
  intro: () => "A couple of quick questions. Skip any you like.",
  question: (_b, key) => ({ date: "When’s it due?", area: "Which area is it for?", notes: "Anything to add?" })[key as Key] ?? "",
  heading: (_b, key) => ({ date: "When’s it due?", area: "Which area?", notes: "Anything to add?" })[key as Key] ?? "",
  label: (key) => ({ date: "When", area: "Area", notes: "Notes" })[key as Key] ?? key,
  action: "Add to the plan",
  closing: () => "That’s everything. Shall I add it?",
  yes: () => "Add it",
  seeIt: "See it ›",
  cancelled: "Cancelled. Nothing was added.",
  fixed: () => [],
  Body,
};

// ── The steps' answers ──────────────────────────────────────────────────

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const addMonths = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

function Body({ block, state, setValues, stepKey }: StepBodyProps<TodoStepsBlock, Values>) {
  const v = state.values;
  if (stepKey === "date") {
    const { today, weddingDate } = block.options;
    const picks: [string, string][] = [
      ["Next week", addDays(today, 7)],
      ["Next month", addMonths(today, 1)],
      ["In 3 months", addMonths(today, 3)],
    ];
    if (weddingDate && weddingDate > today) picks.push(["A week before the day", addDays(weddingDate, -7)]);
    return (
      <div className="space-y-3">
        {v.date && <p className="font-display text-[22px] font-light leading-tight text-ink">{formatLongDate(v.date)}</p>}
        <div className="flex flex-wrap gap-2">
          {picks.map(([label, date]) => (
            <button key={label} type="button" aria-pressed={v.date === date} onClick={() => setValues({ date })} className={`${PILL} ${v.date === date ? PILL_ON : PILL_OFF}`}>
              {label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="sr-only">Pick a date</span>
          <input type="date" value={v.date} onChange={(e) => setValues({ date: e.target.value })} className={FIELD} />
        </label>
      </div>
    );
  }
  if (stepKey === "area") {
    const areas = [...block.options.areas, { key: "other", label: "Other" }];
    return (
      <div className="flex flex-wrap gap-2">
        {areas.map((a) => (
          <button key={a.key} type="button" aria-pressed={v.area === a.key} onClick={() => setValues({ area: v.area === a.key ? "" : a.key })} className={`${PILL} ${v.area === a.key ? PILL_ON : PILL_OFF}`}>
            {a.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <label className="block">
      <span className="sr-only">Notes</span>
      <textarea
        value={v.notes}
        onChange={(e) => setValues({ notes: e.target.value })}
        rows={3}
        placeholder="Notes"
        className="block w-full resize-none rounded-2xl border border-linen bg-white px-4 py-3 text-[17px] leading-snug text-ink placeholder:text-stone/70 focus:border-champagne-400 focus:outline-none"
      />
    </label>
  );
}
