"use client";

import { useState, useTransition } from "react";
import { CalendarDays, ChevronDown, MoreHorizontal, Plus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { areaIcon, type AreaOption } from "@/lib/areas";
import { formatLongDate, todayISO } from "@/lib/dates";
import { quickAddAreaAction } from "@/app/(app)/area/actions";

/*
 * The pieces of the "visual" forms (owner, 12 Oct 2026: the add-a-supplier
 * form is "super visual to fill in" — do the same for the Plan forms): a big
 * title box, picture tiles instead of drop-downs, short glass cards with an
 * icon per line, and the extras folded away.
 */

/** A glass card holding a few lines. */
export const CARD =
  "mt-2.5 overflow-hidden rounded-[22px] border border-white/85 bg-white/60 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4),inset_0_1px_0_rgb(255_255_255/0.9)]";

/** A box inside one of the cards: no border of its own, the card is the frame. */
export const BARE =
  "min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-ink placeholder:text-stone/60 focus:outline-none";

/** The first box — the name of the thing. Large, but under the page title (owner, 12 Oct 2026: 30px was as big as the title). */
export const TITLE_INPUT =
  "w-full border-b border-champagne-400 bg-transparent pb-2 font-display !text-[24px] font-light leading-tight tracking-[-0.02em] text-ink placeholder:italic placeholder:text-stone/50 focus:border-ink focus:outline-none";

/**
 * One line of a card: an icon, then the box. Hairlines between. `top` puts
 * the icon level with the first line of a box that grows (notes), rather
 * than the middle of it.
 */
export function Line({
  icon: Icon,
  label,
  top = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  top?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex gap-3 border-b border-linen px-4 last:border-b-0 ${top ? "items-start" : "items-center"}`}>
      <Icon aria-hidden className={`h-[18px] w-[18px] shrink-0 text-champagne-600 ${top ? "mt-[17px]" : ""}`} strokeWidth={1.6} />
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}

/** A labelled part of the form. */
export function Part({ label, children, className = "mt-7" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="section-label">{label}</legend>
      {children}
    </fieldset>
  );
}

/** Choices as tiles with an icon. The picked one goes ink. */
export function Tiles({
  name,
  options,
  value,
  defaultValue,
  onChange,
  columns = "grid-cols-3 sm:grid-cols-4",
  children,
}: {
  name: string;
  options: { value: string; label: string; icon: LucideIcon }[];
  /** Controlled, when the form needs to know (or set) the choice. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  columns?: string;
  /** Anything after the tiles, in the same grid (the "Add an area" tile). */
  children?: React.ReactNode;
}) {
  return (
    <div className={`mt-3 grid gap-2 ${columns}`}>
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              {...(value !== undefined
                ? { checked: value === o.value, onChange: () => onChange?.(o.value) }
                : { defaultChecked: o.value === defaultValue, onChange: () => onChange?.(o.value) })}
              className="peer sr-only"
            />
            <span className="flex h-full min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-linen bg-white/70 px-1.5 py-2.5 text-center text-[13px] leading-tight text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400 peer-checked:[&>svg]:text-champagne-100">
              <Icon aria-hidden className="h-5 w-5 text-champagne-600" strokeWidth={1.6} />
              {o.label}
            </span>
          </label>
        );
      })}
      {children}
    </div>
  );
}

/** The wedding's areas as tiles, ending with Other (stored as `otherValue`). */
export function areaTiles(areas: AreaOption[], otherValue: string) {
  return [
    ...areas.filter((a) => a.key !== "other").map((a) => ({ value: a.key, label: a.label, icon: areaIcon(a.key) })),
    { value: otherValue, label: "Other", icon: MoreHorizontal },
  ];
}

/**
 * The wedding's areas as tiles, Other, then a dashed **+ Add an area** tile
 * (owner, 12 Oct 2026: wherever an area is picked, you can add one). It opens
 * a name box in place; the new area is added to the wedding (and the ring)
 * and picked, without leaving the form. Controlled (`value` + `onChange`) or
 * not (`defaultValue`).
 */
export function AreaTiles({
  name,
  areas,
  otherValue,
  value,
  defaultValue,
  onChange,
}: {
  name: string;
  areas: AreaOption[];
  /** What Other is stored as: "" (no area) or "other". */
  otherValue: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const [own, setOwn] = useState(defaultValue ?? "\u0000");
  const picked = value ?? own;
  const pick = (v: string) => {
    setOwn(v);
    onChange?.(v);
  };
  const [added, setAdded] = useState<AreaOption[]>([]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const all = [...areas, ...added.filter((a) => !areas.some((b) => b.key === a.key))];

  const add = () =>
    start(async () => {
      let result: { key?: string; label?: string; error?: string };
      try {
        result = await quickAddAreaAction(label);
      } catch {
        result = { error: "That didn't add it. Reload the page and try again." };
      }
      if (result.error || !result.key) return setError(result.error);
      setAdded((list) => [...list, { key: result.key!, label: result.label ?? label }]);
      pick(result.key);
      setAdding(false);
      setLabel("");
      setError(undefined);
    });

  return (
    <Tiles name={name} options={areaTiles(all, otherValue)} value={picked} onChange={pick}>
      {adding ? (
        <div className="col-span-full rounded-2xl border border-dashed border-champagne-400 bg-white/70 p-2">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                // Enter adds the area rather than sending the whole form.
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (label.trim()) add();
                }
              }}
              maxLength={40}
              aria-label="The new area's name"
              placeholder="e.g. Fireworks"
              className="h-11 min-w-0 flex-1 bg-transparent px-2 text-[16px] text-ink placeholder:text-stone/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={add}
              disabled={pending || !label.trim()}
              className="h-11 shrink-0 rounded-xl bg-ink px-4 text-sm text-ivory disabled:opacity-40"
            >
              {pending ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(undefined);
              }}
              aria-label="Cancel"
              className="flex h-11 w-9 shrink-0 items-center justify-center text-stone hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </button>
          </div>
          {error && <p className="px-2 pb-1 text-sm text-champagne-600">{error}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-champagne-400/80 px-1.5 py-2.5 text-center text-[13px] leading-tight text-champagne-600 transition hover:bg-white/60"
        >
          <Plus aria-hidden className="h-5 w-5" strokeWidth={1.6} />
          Add an area
        </button>
      )}
    </Tiles>
  );
}

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const addMonths = (iso: string, months: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
};

/**
 * A date as a card: the day written out large, quick picks (next week,
 * next month, … the month before the wedding) wrapping onto as many lines
 * as they need — not a sideways scroll, which hid half of them (owner, 12
 * Oct 2026) — and the calendar for anything else. `clearable` adds a ✕ to
 * take the date off again.
 */
export function DateCard({
  name,
  value,
  onChange,
  weddingDate,
  required,
  quick = true,
  clearable = false,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  weddingDate?: string | null;
  required?: boolean;
  quick?: boolean;
  clearable?: boolean;
}) {
  const today = todayISO();
  const picks = [
    { label: "Next week", date: addDays(today, 7) },
    { label: "Next month", date: addMonths(today, 1) },
    { label: "In 3 months", date: addMonths(today, 3) },
    ...(weddingDate && weddingDate > today
      ? [
          { label: "6 months before the day", date: addMonths(weddingDate, -6) },
          { label: "A month before the day", date: addMonths(weddingDate, -1) },
          { label: "The week before", date: addDays(weddingDate, -7) },
        ].filter((p) => p.date > today)
      : []),
  ];

  return (
    <div className={CARD}>
      <label className="relative flex items-center gap-3 px-4 py-3.5">
        <CalendarDays aria-hidden className="h-[18px] w-[18px] shrink-0 text-champagne-600" strokeWidth={1.6} />
        <span className="min-w-0 flex-1">
          <span className={`block font-display text-[21px] font-light leading-tight ${value ? "text-ink" : "italic text-stone/60"}`}>
            {value ? formatLongDate(value) : "Pick a date"}
          </span>
        </span>
        {/* The real date box sits over the line, invisible, so a tap anywhere opens the phone's calendar. */}
        <input
          type="date"
          name={name}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Date"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {clearable && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Take the date off"
            className="relative z-10 -mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
        )}
      </label>
      {quick && (
        <div className="flex flex-wrap gap-2 border-t border-linen px-4 py-3">
          {picks.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.date)}
              className={`h-9 rounded-full border px-3.5 text-[13px] transition ${
                value === p.date ? "border-ink bg-ink text-ivory" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Extras folded under one line until asked for. */
export function Folded({ label, open: startOpen = false, children }: { label: string; open?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(startOpen);
  return open ? (
    <>{children}</>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="mt-5 flex h-11 items-center gap-2 text-sm text-champagne-600 hover:text-ink">
      <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      {label}
      <ChevronDown className="h-4 w-4" strokeWidth={1.8} aria-hidden />
    </button>
  );
}
