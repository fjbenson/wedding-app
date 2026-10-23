"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AreaTiles, DateCard } from "@/components/visual-form";
import { formatDayMonth, formatLongDate } from "@/lib/dates";
import type { AreaOption } from "@/lib/areas";

/**
 * The parts every item card shares (owner, 23 Oct 2026, canvas 4 "Cards ·
 * Rounds 1–10"): the signature (the date as a stamp, the name large, the
 * area as a tag at the top right), the black main action under it, and
 * "Open the [area] page ›" at the foot.
 */

/**
 * The date stamp, the name and the area tag. Tap the stamp for the date,
 * the tag for the area: each opens its picker under the signature and saves
 * at once (taps save, typing gets a small Save, as everywhere on a card).
 */
export function ItemSignature({
  titleEditor,
  date,
  dateName,
  onDate,
  weddingDate,
  quick,
  clearable,
  area,
  areaOptions,
  onArea,
  areaRound = 0,
  otherValue = "other",
  dateNote = "",
}: {
  /** The name, large, tap to rename (`TitleEditor`; passed in so this file doesn't import the bodies). */
  titleEditor: ReactNode;
  /** The one date on the card, "YYYY-MM-DD", or "" for none. */
  date: string;
  dateName: string;
  onDate: (v: string) => void;
  weddingDate?: string | null;
  quick?: boolean;
  clearable?: boolean;
  /** The area's key, or "" for none. */
  area: string;
  areaOptions: AreaOption[];
  onArea: (v: string) => void;
  /** Changes when something outside picks the area (a supplier's), so the tiles redraw. */
  areaRound?: number;
  /** What the "Other" tile saves: "other", or "" where no area is how a card says other (to-dos). */
  otherValue?: string;
  /** Before the weekday under the name: "Due ", "Paid ". */
  dateNote?: string;
}) {
  const [picking, setPicking] = useState<"date" | "area" | null>(null);
  const toggle = (which: "date" | "area") => setPicking((p) => (p === which ? null : which));
  const areaLabel = areaOptions.find((a) => a.key === area)?.label ?? (area ? "Other" : null);
  const [day, month] = date ? formatDayMonth(date).split(" ") : ["", ""];

  return (
    <>
      <div className="mt-1 flex items-start gap-3.5">
        <button
          type="button"
          onClick={() => toggle("date")}
          aria-expanded={picking === "date"}
          aria-label={date ? `Change the date, ${formatLongDate(date)}` : "Add a date"}
          className={`flex w-16 shrink-0 flex-col items-center rounded-[14px] py-2 ${
            date ? "bg-champagne-100" : "border border-dashed border-champagne-600/50"
          }`}
        >
          <span className={`font-display text-[32px] font-light leading-none tabular-nums ${date ? "text-ink" : "text-champagne-600"}`}>{date ? day : "+"}</span>
          <span className="mt-0.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-champagne-600">{date ? month : "Date"}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toggle("area")}
              aria-expanded={picking === "area"}
              className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                areaLabel ? "bg-champagne-100 text-champagne-600" : "border border-dashed border-champagne-600/50 text-champagne-600"
              }`}
            >
              <span className="truncate">{areaLabel ?? "+ Area"}</span>
              <ChevronDown aria-hidden className={`h-3.5 w-3.5 shrink-0 transition ${picking === "area" ? "rotate-180" : ""}`} strokeWidth={1.8} />
            </button>
          </div>
          <div className="mt-1">
            {titleEditor}
          </div>
          {date && <p className="mt-1 text-[14px] text-stone">{dateNote}{formatLongDate(date).split(",")[0]}</p>}
        </div>
      </div>

      {picking === "date" && (
        <div className="mt-3">
          <DateCard name={dateName} value={date} onChange={onDate} weddingDate={weddingDate} quick={quick} clearable={clearable} />
        </div>
      )}
      {picking === "area" && (
        <div className="mt-3">
          <AreaTiles
            key={areaRound}
            name="area"
            areas={areaOptions}
            otherValue={otherValue}
            value={area}
            onChange={(v) => {
              onArea(v);
              setPicking(null);
            }}
          />
        </div>
      )}
    </>
  );
}

/**
 * The card's main action, a black pill under the signature (black is for the
 * main action only). Once done it turns champagne with a tick and says so.
 */
export function ItemAction({
  label,
  doneLabel,
  done,
  pending,
  mark,
  onClick,
}: {
  label: string;
  doneLabel: string;
  done: boolean;
  pending?: boolean;
  /** What sits in the small circle before it's done: "£" for a payment. */
  mark?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      aria-pressed={done}
      className={`mt-4 flex h-12 items-center gap-2.5 rounded-full pl-2 pr-5 text-[15px] transition disabled:opacity-60 ${
        done ? "bg-champagne-100 text-champagne-600" : "bg-ink text-ivory hover:bg-ink/90"
      }`}
    >
      <span
        className={`flex h-[32px] w-[32px] items-center justify-center rounded-full font-display text-[15px] ${
          done ? "bg-champagne-600 text-white" : "border-[1.5px] border-ivory/60 text-ivory"
        }`}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden /> : (mark ?? null)}
      </span>
      {done ? doneLabel : label}
    </button>
  );
}

/** "Open the Photos page ›" at the foot of a card that belongs to an area; nothing when it has none. */
export function AreaPageLink({ areaKey, areas }: { areaKey: string; areas: AreaOption[] }) {
  const area = areas.find((a) => a.key === areaKey);
  if (!area) return null;
  return (
    <Link
      href={`/area/${encodeURIComponent(area.key)}`}
      className="mt-6 flex h-12 items-center justify-center rounded-full border border-champagne-400 text-[15px] text-ink hover:bg-cream"
    >
      Open the {area.label} page ›
    </Link>
  );
}
