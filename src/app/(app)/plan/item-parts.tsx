"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Clock, MapPin } from "lucide-react";
import { AreaTiles, DateCard } from "@/components/visual-form";
import { formatDayMonth, formatHowFar, formatLongDate, formatTime } from "@/lib/dates";
import { editorKeys, FIELD, SaveCancel, useSaver } from "../people/guest-card";
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
  slip,
  time,
  onTime,
  stamp,
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
  /**
   * A payment's top as a bill (owner, 24 Oct 2026, canvas 5 "Payment card ·
   * Round 25", B): who it's to and the area along the top, the name and the
   * amount across the middle, when it's due along its foot (tap for the date).
   */
  slip?: { head: ReactNode; amount: ReactNode; howFar: boolean };
  /** "14:00" or "": an appointment's time sits in a gold band at the foot of the stamp (owner, 23 Oct 2026, Round 9, A). Left out, the card has no time. */
  time?: string;
  onTime?: (v: string) => void;
  /** A card that has no date of its own (a moment: its time, on the day) says what the stamp shows and what opens under it. */
  stamp?: { big: string; small: string; sub?: string; panel: ReactNode };
}) {
  const [picking, setPicking] = useState<"date" | "area" | null>(null);
  const toggle = (which: "date" | "area") => setPicking((p) => (p === which ? null : which));
  const areaLabel = areaOptions.find((a) => a.key === area)?.label ?? (area ? "Other" : null);
  const [day, month] = stamp ? [stamp.big, stamp.small] : date ? formatDayMonth(date).split(" ") : ["", ""];
  const hasStamp = stamp ? true : !!date;

  const areaPill = (
    <button
      type="button"
      onClick={() => toggle("area")}
      aria-expanded={picking === "area"}
      className={`inline-flex max-w-[60%] shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        areaLabel ? "bg-champagne-100 text-champagne-600" : "border border-dashed border-champagne-600/50 text-champagne-600"
      }`}
    >
      <span className="truncate">{areaLabel ?? "+ Area"}</span>
      <ChevronDown aria-hidden className={`h-3.5 w-3.5 shrink-0 transition ${picking === "area" ? "rotate-180" : ""}`} strokeWidth={1.8} />
    </button>
  );
  const far = slip?.howFar && date ? formatHowFar(date) : "";

  return (
    <>
      {slip ? (
        <div className="mt-1 rounded-[10px] bg-[#FFFDF8] px-[18px] pt-[18px] shadow-[0_18px_34px_-20px_rgb(60_45_20/0.5),0_0_0_1px_#EDE4D3]">
          <div className="flex items-center justify-between gap-2">
            {slip.head}
            {areaPill}
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <div className="min-w-0 flex-1 basis-40">{titleEditor}</div>
            {slip.amount}
          </div>
          <button
            type="button"
            onClick={() => toggle("date")}
            aria-expanded={picking === "date"}
            className="-mx-[18px] mt-4 flex w-[calc(100%+36px)] items-center justify-between gap-3 border-t border-dashed border-[#E0D3BA] px-[18px] py-3 text-left text-[14px] text-stone hover:text-ink"
          >
            {date ? (
              <>
                <span>
                  {dateNote}
                  {formatLongDate(date).replace(/^\w+, /, "")}
                </span>
                {far && <span className={far.endsWith("late") ? "text-[#9A3F2B]" : ""}>{far.charAt(0).toUpperCase() + far.slice(1)}</span>}
              </>
            ) : (
              <span className="text-champagne-600">+ Due date</span>
            )}
          </button>
        </div>
      ) : (
      <div className="mt-1 flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => toggle("date")}
          aria-expanded={picking === "date"}
          aria-label={stamp ? `Change the time, ${stamp.big}` : date ? `Change the date, ${formatLongDate(date)}${time ? ` at ${formatTime(time)}` : ""}` : "Add a date"}
          className={`flex w-16 shrink-0 flex-col items-center overflow-hidden rounded-[14px] ${
            hasStamp ? "bg-champagne-100" : "border border-dashed border-champagne-600/50"
          }`}
        >
          <span className="flex flex-col items-center py-2">
            <span className={`font-display font-light leading-none tabular-nums ${day.length > 2 ? "text-[23px]" : "text-[32px]"} ${hasStamp ? "text-ink" : "text-champagne-600"}`}>{hasStamp ? day : "+"}</span>
            <span className="mt-0.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-champagne-600">{hasStamp ? month : "Date"}</span>
          </span>
          {date && time && <span className="w-full bg-champagne-600 py-1 text-center text-[13px] font-semibold text-white">{formatTime(time)}</span>}
        </button>

        {/* The name level with the date; its grey line below with the area pill at the
            end (owner, 24 Oct 2026, canvas 5 "Payment card · Round 24", B). */}
        <div className="min-w-0 flex-1">
          {titleEditor}
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="min-w-0 text-[14px] text-stone">
              {stamp ? stamp.sub : date ? `${dateNote}${formatLongDate(date).split(",")[0]}` : null}
            </p>
            {areaPill}
          </div>
        </div>
      </div>
      )}

      {picking === "date" && stamp && <div className="mt-3">{stamp.panel}</div>}
      {picking === "date" && !stamp && (
        <div className="mt-3">
          <DateCard name={dateName} value={date} onChange={onDate} weddingDate={weddingDate} quick={quick} clearable={clearable} />
          {onTime && (
            <label className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-linen bg-white px-4">
              <Clock aria-hidden className="h-[18px] w-[18px] shrink-0 text-champagne-600" strokeWidth={1.6} />
              <span className="sr-only">Time</span>
              <input
                type="time"
                defaultValue={time ?? ""}
                onBlur={(e) => e.target.value !== (time ?? "") && onTime(e.target.value)}
                aria-label="Time"
                className={`min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none ${time ? "text-ink" : "text-stone/60"}`}
              />
              {time && (
                <button type="button" onClick={() => onTime("")} className="text-xs text-stone hover:text-ink">
                  No time
                </button>
              )}
            </label>
          )}
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
  wide,
  onClick,
}: {
  label: string;
  doneLabel: string;
  done: boolean;
  pending?: boolean;
  /** What sits in the small circle before it's done: "£" for a payment. */
  mark?: string;
  /** Right across the card, under a payment's bill (Round 25, B). */
  wide?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      aria-pressed={done}
      className={`mt-4 flex h-12 items-center gap-2.5 rounded-full pl-2 pr-5 text-[15px] transition disabled:opacity-60 ${wide ? "w-full justify-center" : ""} ${
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

/**
 * Where it happens: a rounded row with a gold pin and the place, the one
 * style on every card that has a place (owner, 23 Oct 2026, canvas 4 "Cards ·
 * Round 4"). Tap to change; typing gets a small Save.
 */
export function WhereRow({ value, onSave, add = "Add where", startEditing = false }: { value: string | null; onSave: (v: string) => Promise<{ error?: string }>; add?: string; startEditing?: boolean }) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(value ?? "");
  const { pending, error, setError, run } = useSaver();
  const submit = () => run(() => onSave(draft), () => setEditing(false));
  const pin = (
    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
      <MapPin className="h-[18px] w-[18px]" strokeWidth={1.6} />
    </span>
  );
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? "");
          setError(undefined);
          setEditing(true);
        }}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-linen bg-white px-3.5 text-left text-[15px] hover:border-champagne-400"
      >
        {pin}
        <span className={value ? "text-ink" : "text-champagne-600"}>{value || add}</span>
      </button>
    );
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-champagne-400 bg-white px-3.5 py-2">
        {pin}
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={editorKeys(submit, () => setEditing(false))}
          aria-label="Where"
          className={`${FIELD} !border-0 !px-0 !py-1.5 !ring-0`}
        />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
    </form>
  );
}

/**
 * The area tag on its own, right-aligned, with the area tiles under it when
 * tapped: for the cards whose signature isn't a date stamp (a note, an Inspo
 * idea). Nothing picked reads "Add to an area" (owner, 23 Oct 2026).
 */
export function AreaTagRow({
  area,
  areaOptions,
  onArea,
  otherValue = "other",
  empty = "Add to an area",
  disabled,
  under,
}: {
  area: string;
  areaOptions: AreaOption[];
  onArea: (v: string) => void;
  otherValue?: string;
  empty?: string;
  disabled?: boolean;
  /** Shown under the tiles when they're open (a note's "Set it back to Not filed"). */
  under?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const label = areaOptions.find((a) => a.key === area)?.label ?? (area ? "Other" : null);
  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold disabled:opacity-60 ${
            label ? "bg-champagne-100 text-champagne-600" : "border border-dashed border-champagne-600/50 text-champagne-600"
          }`}
        >
          <span className="truncate">{label ?? empty}</span>
          <ChevronDown aria-hidden className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} strokeWidth={1.8} />
        </button>
      </div>
      {open && (
        <div className="mt-3">
          <AreaTiles
            name="area"
            areas={areaOptions}
            otherValue={otherValue}
            value={area || "\u0000"}
            onChange={(v) => {
              setOpen(false);
              onArea(v);
            }}
          />
          {under}
        </div>
      )}
    </div>
  );
}
