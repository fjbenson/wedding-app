"use client";

import { useState } from "react";
import { Clock, MapPin, NotebookPen, UsersRound } from "lucide-react";
import { ReturnTo } from "@/components/back-link";
import { SubmitBar } from "@/components/form-bits";
import { BARE, CARD, DateCard, Folded, Line, Part, TITLE_INPUT, Tiles, AreaTiles } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import type { Appointment } from "@/types/db";

/** Tap one to fill in the name — the usual wedding appointments. */
const IDEAS = ["Venue visit", "Menu tasting", "Cake tasting", "Dress fitting", "Suit fitting", "Hair trial", "Make-up trial", "Florist meeting", "Meet the photographer", "Ceremony rehearsal"];

/** Taps on the hour for the time card. */
const TIMES = ["10:00", "11:00", "12:00", "14:00", "15:00", "18:00"];

/**
 * Add or edit one appointment (screen 21; `appointment` is missing when
 * adding). Made visual like the add-a-supplier form (owner, 12 Oct 2026):
 * the name large, with the usual appointments as one-tap ideas; the date as
 * a card with quick picks; the time with quick taps; where and who on a glass
 * card (picking a supplier picks their area); the area as picture tiles;
 * notes folded away.
 */
export default function AppointmentForm({
  action,
  appointment,
  suppliers,
  areas,
  defaultArea,
  defaultDate,
  weddingDate,
}: {
  action: (formData: FormData) => void | Promise<void>;
  appointment?: Appointment;
  suppliers: { id: string; name: string; area?: string | null }[];
  areas: AreaOption[];
  defaultArea?: string;
  /** Adding from a day on the calendar: start with that date. */
  defaultDate?: string;
  weddingDate?: string | null;
}) {
  const [title, setTitle] = useState(appointment?.title ?? "");
  const [date, setDate] = useState(appointment?.on_date ?? defaultDate ?? "");
  const [time, setTime] = useState(appointment?.at_time?.slice(0, 5) ?? "");
  const [area, setArea] = useState(appointment?.area_key ?? defaultArea ?? "");
  const known = new Set(areas.map((a) => a.key));
  // An area that's since been switched off keeps its tile, so saving doesn't drop it.
  const original = appointment?.area_key;
  const options =
    original && original !== "other" && !known.has(original) ? [...areas, { key: original, label: original }] : areas;

  return (
    <form action={action}>
      <ReturnTo href="/plan" />
      <input
        name="title"
        required
        autoFocus={!appointment}
        autoComplete="off"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="What is it?"
        placeholder="What is it?"
        className={TITLE_INPUT}
      />
      {!appointment && (
        <div className="-mx-[var(--gutter)] mt-3 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 [scrollbar-width:none]">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setTitle(idea)}
              className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] transition ${
                title === idea ? "border-champagne-600 bg-champagne-100 text-champagne-600" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
              }`}
            >
              {idea}
            </button>
          ))}
        </div>
      )}

      <Part label="When">
        <DateCard name="on_date" value={date} onChange={setDate} weddingDate={weddingDate} required />
        <div className={CARD}>
          <Line icon={Clock} label="Time">
            <input
              name="at_time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`${BARE} ${time ? "" : "text-stone/60"}`}
            />
            {time && (
              <button type="button" onClick={() => setTime("")} className="text-xs text-stone hover:text-ink">
                No time
              </button>
            )}
          </Line>
          <div className="flex gap-2 overflow-x-auto border-t border-linen px-4 py-3 [scrollbar-width:none]">
            {TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] tabular-nums transition ${
                  time === t ? "border-champagne-600 bg-champagne-100 text-champagne-600" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Part>

      <Part label="Where and who">
        <div className={CARD}>
          <Line icon={MapPin} label="Where">
            <input
              name="location"
              autoComplete="off"
              defaultValue={appointment?.location ?? ""}
              placeholder="Where — e.g. The Bridal Room, Southwell"
              className={BARE}
            />
          </Line>
          <Line icon={UsersRound} label="With">
            <select
              name="supplier"
              defaultValue={appointment?.contact_id ?? ""}
              onChange={(e) => {
                // Picking a supplier picks their area too, unless one's already chosen.
                const s = suppliers.find((x) => x.id === e.target.value);
                if (s?.area && !area) setArea(known.has(s.area) ? s.area : "other");
              }}
              className={`${BARE} appearance-none`}
            >
              <option value="">With a supplier? (optional)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Line>
        </div>
      </Part>

      <Part label="Area">
        <AreaTiles name="area" areas={options} otherValue="other" value={area} onChange={setArea} folded={!!appointment?.area_key} />
      </Part>

      <Folded label="Add notes" open={!!appointment?.notes}>
        <section className="mt-7">
          <h2 className="section-label font-body">Notes</h2>
          <div className={CARD}>
            <Line icon={NotebookPen} label="Notes" top>
              <textarea
                name="notes"
                rows={3}
                defaultValue={appointment?.notes ?? ""}
                placeholder="e.g. Bring the shoes. Ask about the veil."
                className={`${BARE} w-full resize-none`}
              />
            </Line>
          </div>
        </section>
      </Folded>

      <SubmitBar label={appointment ? "Save changes" : "Add appointment"} whenChanged={!!appointment} />
    </form>
  );
}
