"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, MoreHorizontal, Plus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { areaIcon, type AreaOption } from "@/lib/areas";
import { formatLongDate, todayISO } from "@/lib/dates";
import { areaStepsInfoAction } from "@/app/(app)/area/actions";
import AreaSteps from "@/app/(app)/area/new/area-steps";

/*
 * The pieces of the "visual" forms (owner, 12 Oct 2026: the add-a-supplier
 * form is "super visual to fill in" — do the same for the Plan forms): a big
 * title box, picture tiles instead of drop-downs, short glass cards with an
 * icon per line, and the extras folded away.
 */

/** A glass card holding a few lines. */
export const CARD =
  "mt-2.5 overflow-hidden rounded-[22px] border-[0.5px] border-white/70 bg-white/55 shadow-[0_0_0_0.5px_rgb(60_50_40/0.06),0_18px_40px_-24px_rgb(60_50_40/0.32)]";

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
    ...areas.filter((a) => a.key !== "other").map((a) => ({ value: a.key, label: a.label, icon: areaIcon(a.key, a.icon) })),
    { value: otherValue, label: "Other", icon: MoreHorizontal },
  ];
}

/**
 * The wedding's areas as tiles, Other, then a dashed **+ Add an area** tile
 * (owner, 12 Oct 2026: wherever an area is picked, you can add one). It opens
 * the same three steps as the ring's + (name, icon, budget — `AreaSteps`) full
 * screen over the form, so nothing typed is lost; the new area comes back
 * picked. Controlled (`value` + `onChange`) or not (`defaultValue`).
 */
export function AreaTiles({
  name,
  areas,
  otherValue,
  value,
  defaultValue,
  onChange,
  folded: startFolded = false,
}: {
  name: string;
  areas: AreaOption[];
  /** What Other is stored as: "" (no area) or "other". */
  otherValue: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /**
   * A saved item rather than a new one (owner, 13 Oct 2026: the grid "takes
   * up way too much space" once it's chosen): the choice shows as one small
   * pill — its icon and name — and tapping it opens the tiles to change it.
   * Adding always shows the tiles.
   */
  folded?: boolean;
}) {
  const [own, setOwn] = useState(defaultValue ?? "\u0000");
  const [isFolded, setFolded] = useState(startFolded);
  const picked = value ?? own;
  const pick = (v: string) => {
    setOwn(v);
    onChange?.(v);
    // A saved item folds back to its pill once a new area's picked.
    if (startFolded) setFolded(true);
  };
  const [added, setAdded] = useState<AreaOption[]>([]);
  const [adding, setAdding] = useState(false);
  const tile = useRef<HTMLButtonElement>(null);
  const [info, setInfo] = useState<{ hidden: string[]; stillFree: number | null }>({ hidden: [], stillFree: null });
  const all = [...areas, ...added.filter((a) => !areas.some((b) => b.key === a.key))];

  const open = () => {
    setAdding(true);
    areaStepsInfoAction()
      .then(setInfo)
      .catch(() => undefined);
  };

  // The page behind doesn't scroll while the steps are open.
  useEffect(() => {
    if (!adding) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [adding]);

  const options = areaTiles(all, otherValue);
  const chosen = options.find((o) => o.value === picked);
  if (isFolded && chosen) {
    const Icon = chosen.icon;
    return (
      <>
        {/* The radios aren't drawn while folded, so this carries the choice. */}
        <input type="hidden" name={name} value={picked} />
        <button
          type="button"
          onClick={() => setFolded(false)}
          aria-label={`${chosen.label} — change the area`}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-full border border-linen bg-white/80 pl-3.5 pr-3 text-[15px] text-ink transition hover:border-champagne-400"
        >
          <Icon aria-hidden className="h-[18px] w-[18px] text-champagne-600" strokeWidth={1.6} />
          {chosen.label}
          <span className="ml-1 text-[13px] text-stone">Change</span>
          <ChevronDown aria-hidden className="h-4 w-4 text-stone" strokeWidth={1.8} />
        </button>
      </>
    );
  }

  return (
    <Tiles name={name} options={options} value={picked} onChange={pick}>
      <button
        ref={tile}
        type="button"
        onClick={open}
        className="flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-champagne-400/80 px-1.5 py-2.5 text-center text-[13px] leading-tight text-champagne-600 transition hover:bg-white/60"
      >
        <Plus aria-hidden className="h-5 w-5" strokeWidth={1.6} />
        Add an area
      </button>
      {adding &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label="Add an area" className="fixed inset-0 z-50 overflow-y-auto bg-ivory">
            <div className="page">
              <AreaSteps
                hidden={info.hidden}
                stillFree={info.stillFree}
                sheet={{
                  onClose: () => setAdding(false),
                  onAdded: (area) => {
                    setAdded((list) => [...list, area]);
                    pick(area.key);
                    setAdding(false);
                    // Tell the form something changed (its Save shows on change, SubmitBar).
                    requestAnimationFrame(() => tile.current?.closest("form")?.dispatchEvent(new Event("change", { bubbles: true })));
                  },
                }}
              />
            </div>
          </div>,
          document.body,
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
 * Oct 2026) — and the calendar for anything else. The quick picks only
 * show while there's no date (owner, 12 Oct 2026); once one's picked, tap
 * the date to change it in the phone's calendar, or ✕ to take it off and
 * get the quick picks back.
 */
export function DateCard({
  name,
  value,
  onChange,
  weddingDate,
  required,
  quick = true,
  clearable = true,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  weddingDate?: string | null;
  required?: boolean;
  quick?: boolean;
  /** false: no ✕ (an appointment always has a day). */
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
        {value && clearable && (
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
      {quick && !value && (
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

/** One-tap ideas under a title box: tap one to fill it in. Wraps rather than scrolls. */
export function Ideas({ ideas, value, onPick }: { ideas: string[]; value: string; onPick: (idea: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {ideas.map((idea) => (
        <button
          key={idea}
          type="button"
          onClick={() => onPick(idea)}
          className={`h-9 rounded-full border px-3.5 text-[13px] transition ${
            value === idea ? "border-ink bg-ink text-ivory" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
          }`}
        >
          {idea}
        </button>
      ))}
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
