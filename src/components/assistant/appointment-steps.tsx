"use client";

import type { AppointmentStepsBlock, Proposal } from "@/lib/assistant/blocks";
import { formatLongDate, formatTime } from "@/lib/dates";
import { FIELD, type Flow, type StepBodyProps, type StepsState } from "./steps-flow";
import { AreaPills, DateStep, SupplierSelect } from "./steps-bits";

/**
 * Adding an appointment, a step at a time (see steps-flow.tsx). Steps: the
 * day, the time, where and who with, and the area. When the day and time are
 * known (or it's said to have no set time) it goes straight to the check
 * card; the rest is optional. A supplier's area is used if none is picked.
 */

interface Values {
  date: string;
  /** "14:30", or "" */
  time: string;
  location: string;
  /** "" nothing chosen · "none" nobody · otherwise a supplier's id */
  supplier: string;
  area: string;
}

type Key = "date" | "time" | "where" | "area";
const KEYS: Key[] = ["date", "time", "where", "area"];

function initial(block: AppointmentStepsBlock): StepsState<Values> {
  const p = block.prefill;
  const values: Values = {
    date: p.date ?? "",
    time: p.time ?? "",
    location: p.location ?? "",
    supplier: p.supplierId ?? "",
    area: p.area ?? "",
  };
  const marks: StepsState["marks"] = {};
  if (p.date) marks.date = "answered";
  if (p.time) marks.time = "answered";
  else if (p.noTime) marks.time = "skipped";
  if (p.location || p.supplierId) marks.where = "answered";
  if (p.area) marks.area = "answered";
  if (marks.date && marks.time) {
    for (const k of KEYS) marks[k] ??= "skipped";
    return { phase: "review", index: KEYS.length - 1, marks, editing: false, values };
  }
  return { phase: "asking", index: KEYS.findIndex((k) => !marks[k]), marks, editing: false, values };
}

function answer(block: AppointmentStepsBlock, v: Values, key: string): string | null {
  switch (key as Key) {
    case "date":
      return v.date ? formatLongDate(v.date) : null;
    case "time":
      return v.time ? formatTime(v.time) : null;
    case "where": {
      const supplier = block.options.suppliers.find((s) => s.id === v.supplier);
      const parts = [v.location.trim(), supplier ? `with ${supplier.name}` : ""].filter(Boolean);
      return parts.length > 0 ? parts.join(" · ") : null;
    }
    case "area":
      return v.area === "other" ? "Other" : (block.options.areas.find((a) => a.key === v.area)?.label ?? null);
  }
  return null;
}

function clear(v: Values, key: string): Values {
  switch (key as Key) {
    case "date":
      return { ...v, date: "" };
    case "time":
      return { ...v, time: "" };
    case "where":
      return { ...v, location: "", supplier: "" };
    case "area":
      return { ...v, area: "" };
  }
  return v;
}

function proposal(block: AppointmentStepsBlock, v: Values): Proposal {
  const supplier = block.options.suppliers.find((s) => s.id === v.supplier);
  return {
    kind: "add_appointment",
    input: {
      title: block.prefill.title,
      onDate: v.date,
      atTime: v.time || null,
      location: v.location.trim() || null,
      supplierId: supplier?.id ?? null,
      // No area picked: the supplier's, as on the appointment form.
      area: v.area || supplier?.area || null,
      notes: block.prefill.notes,
    },
  };
}

export const appointmentFlow: Flow<AppointmentStepsBlock, Values> = {
  keys: () => KEYS,
  initial,
  answer,
  clear,
  proposal,
  subject: (b) => b.prefill.title,
  intro: () => "A few quick questions. Skip any you like.",
  question: (_b, key) =>
    ({ date: "What day is it?", time: "What time?", where: "Where, and who with?", area: "Which area is it for?" })[key as Key] ?? "",
  heading: (_b, key) => ({ date: "What day?", time: "What time?", where: "Where and who with?", area: "Which area?" })[key as Key] ?? "",
  label: (key) => ({ date: "Day", time: "Time", where: "Where", area: "Area" })[key as Key] ?? key,
  action: "Add to the plan",
  closing: () => "That’s everything. Shall I add it?",
  yes: () => "Add it",
  seeIt: "See it ›",
  cancelled: "Cancelled. Nothing was added.",
  fixed: (b) => (b.prefill.notes ? [["Notes", b.prefill.notes]] : []),
  missing: (_b, v) => (v.date ? null : "Add the day first: tap the Day line."),
  Body,
};

function Body({ block, state, setValues, stepKey }: StepBodyProps<AppointmentStepsBlock, Values>) {
  const v = state.values;
  switch (stepKey as Key) {
    case "date":
      return <DateStep value={v.date} onChange={(date) => setValues({ date })} today={block.options.today} weddingDate={block.options.weddingDate} picks="visit" />;
    case "time":
      return (
        <label className="block">
          <span className="sr-only">Time</span>
          <input type="time" value={v.time} onChange={(e) => setValues({ time: e.target.value })} className={FIELD} />
        </label>
      );
    case "where":
      return (
        <div className="space-y-2.5">
          <label className="block">
            <span className="sr-only">Where</span>
            <input value={v.location} onChange={(e) => setValues({ location: e.target.value })} placeholder="Where" autoComplete="off" className={FIELD} />
          </label>
          <SupplierSelect
            suppliers={block.options.suppliers}
            value={v.supplier}
            onChange={(supplier) => setValues({ supplier })}
            none="Nobody in particular"
            placeholder="Who with?"
          />
        </div>
      );
    default:
      return <AreaPills areas={block.options.areas} value={v.area} onChange={(area) => setValues({ area })} />;
  }
}
