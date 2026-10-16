"use client";

import { ChevronDown } from "lucide-react";
import { formatLongDate } from "@/lib/dates";
import { FIELD, PILL, PILL_OFF, PILL_ON } from "./steps-flow";

/** Small pieces the steps share (steps-flow.tsx): a date with quick picks, an area, a supplier. */

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

/** The day written out, quick picks that wrap, then the phone's own date box. */
export function DateStep({
  value,
  onChange,
  today,
  weddingDate,
  picks = "ahead",
}: {
  value: string;
  onChange: (date: string) => void;
  today: string;
  weddingDate: string | null;
  /** "ahead" for things due; "tomorrow" for visits. */
  picks?: "ahead" | "visit";
}) {
  const list: [string, string][] =
    picks === "visit"
      ? [
          ["Tomorrow", addDays(today, 1)],
          ["Next week", addDays(today, 7)],
          ["In 2 weeks", addDays(today, 14)],
          ["Next month", addMonths(today, 1)],
        ]
      : [
          ["Next week", addDays(today, 7)],
          ["Next month", addMonths(today, 1)],
          ["In 3 months", addMonths(today, 3)],
        ];
  if (picks === "ahead" && weddingDate && weddingDate > today) list.push(["A week before the day", addDays(weddingDate, -7)]);
  return (
    <div className="space-y-3">
      {value && <p className="font-display text-[22px] font-light leading-tight text-ink">{formatLongDate(value)}</p>}
      <div className="flex flex-wrap gap-2">
        {list.map(([label, date]) => (
          <button key={label} type="button" aria-pressed={value === date} onClick={() => onChange(date)} className={`${PILL} ${value === date ? PILL_ON : PILL_OFF}`}>
            {label}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="sr-only">Pick a date</span>
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} />
      </label>
    </div>
  );
}

/** The wedding's areas, then Other: tap again to take it off. */
export function AreaPills({ areas, value, onChange }: { areas: { key: string; label: string }[]; value: string; onChange: (key: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[...areas, { key: "other", label: "Other" }].map((a) => (
        <button key={a.key} type="button" aria-pressed={value === a.key} onClick={() => onChange(value === a.key ? "" : a.key)} className={`${PILL} ${value === a.key ? PILL_ON : PILL_OFF}`}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

/** A drop-down of the suppliers, with a last choice for none. */
export function SupplierSelect({
  suppliers,
  value,
  onChange,
  none,
  placeholder,
}: {
  suppliers: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  none: string;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">Supplier</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${FIELD} appearance-none pr-11`}>
        <option value="">{placeholder}</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value="none">{none}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" strokeWidth={1.8} aria-hidden />
    </label>
  );
}
