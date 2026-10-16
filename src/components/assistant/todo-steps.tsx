"use client";

import type { Proposal, TodoStepsBlock } from "@/lib/assistant/blocks";
import { formatLongDate } from "@/lib/dates";
import { type Flow, type StepBodyProps, type StepsState } from "./steps-flow";
import { AreaPills, DateStep } from "./steps-bits";

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

function Body({ block, state, setValues, stepKey }: StepBodyProps<TodoStepsBlock, Values>) {
  const v = state.values;
  if (stepKey === "date") {
    return <DateStep value={v.date} onChange={(date) => setValues({ date })} today={block.options.today} weddingDate={block.options.weddingDate} />;
  }
  if (stepKey === "area") return <AreaPills areas={block.options.areas} value={v.area} onChange={(area) => setValues({ area })} />;
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
