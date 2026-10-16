"use client";

import { useState } from "react";
import { Clock, MapPin, NotebookPen, UsersRound } from "lucide-react";
import { ReturnTo } from "@/components/back-link";
import { SubmitBar } from "@/components/form-bits";
import { AreaTiles, BARE, CARD, DateCard, Line, Part, TITLE_INPUT } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";

type Kind = "todo" | "appointment";
type Action = (formData: FormData) => void | Promise<void>;

/** Tap one to fill in the name — the usual wedding appointments. */
const IDEAS = ["Venue visit", "Menu tasting", "Cake tasting", "Dress fitting", "Suit fitting", "Hair trial", "Make-up trial", "Florist meeting", "Meet the photographer", "Ceremony rehearsal"];

/** Taps on the hour for the time card. */
const TIMES = ["10:00", "11:00", "12:00", "14:00", "15:00", "18:00"];

/**
 * Adding to the plan, one form for both (owner, 12 Oct 2026: one black + on
 * Plan, "where you choose if it's a to-do or an appointment"): a To-do |
 * Appointment switch at the top, then what's shared — the name, the date,
 * the area, notes — with an appointment adding the time, where and who, and
 * one-tap name ideas. What's typed stays when switching. Each kind still
 * saves through its own action; editing one uses its own form
 * (milestone-form.tsx, appointment-form.tsx).
 */
export default function PlanAddForm({
  kind: startKind,
  saveTodo,
  saveAppointment,
  suppliers,
  areas,
  defaultArea,
  defaultDate,
  weddingDate,
}: {
  kind: Kind;
  saveTodo: Action;
  saveAppointment: Action;
  suppliers: { id: string; name: string; area?: string | null }[];
  areas: AreaOption[];
  defaultArea?: string;
  defaultDate?: string;
  weddingDate?: string | null;
}) {
  // Picked before the form opens (the + asks first, owner 16 Oct 2026).
  const kind = startKind;
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [time, setTime] = useState("");
  const [area, setArea] = useState(defaultArea ?? "");
  const [notes, setNotes] = useState("");
  const known = new Set(areas.map((a) => a.key));
  const appt = kind === "appointment";

  return (
    <form action={appt ? saveAppointment : saveTodo}>
      <ReturnTo href="/plan" />

      <input
        name="title"
        required
        autoFocus
        autoComplete="off"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label={appt ? "What is it?" : "What needs doing?"}
        placeholder={appt ? "What is it?" : "What needs doing?"}
        className={TITLE_INPUT}
      />
      {appt && (
        <div className="mt-3 flex flex-wrap gap-2">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setTitle(idea)}
              className={`h-9 rounded-full border px-3.5 text-[13px] transition ${
                title === idea ? "border-ink bg-ink text-ivory" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
              }`}
            >
              {idea}
            </button>
          ))}
        </div>
      )}

      <Part label="When">
        <DateCard name={appt ? "on_date" : "when"} value={date} onChange={setDate} weddingDate={weddingDate} required={appt} />
        {appt && (
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
            {!time && (
              <div className="flex flex-wrap gap-2 border-t border-linen px-4 py-3">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className="h-9 rounded-full border border-linen bg-white/80 px-3.5 text-[13px] tabular-nums text-ink transition hover:border-champagne-400"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Part>

      {appt && (
        <Part label="Where and who">
          <div className={CARD}>
            <Line icon={MapPin} label="Where">
              <input name="location" autoComplete="off" placeholder="Where — e.g. The Bridal Room, Southwell" className={BARE} />
            </Line>
            <Line icon={UsersRound} label="With">
              <select
                name="supplier"
                defaultValue=""
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
      )}

      <Part label="Area">
        {/* One set of tiles for both; each kind is sent the way its action reads it
            (a to-do stores Other as no area, an appointment as "other"). */}
        <AreaTiles name="area_pick" areas={areas} otherValue="other" value={area} onChange={setArea} />
        {appt ? (
          <input type="hidden" name="area" value={area} />
        ) : (
          <input type="hidden" name="category" value={area === "other" ? "" : area} />
        )}
      </Part>

      <section className="mt-7">
        <h2 className="section-label font-body">Notes</h2>
        <div className={CARD}>
          <Line icon={NotebookPen} label="Notes" top>
            <textarea
              name={appt ? "notes" : "description"}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={appt ? "e.g. Bring the shoes. Ask about the veil." : "e.g. Ask about seasonal flowers for June"}
              className={`${BARE} w-full resize-none`}
            />
          </Line>
        </div>
      </section>

      <SubmitBar label={appt ? "Add appointment" : "Add to the plan"} />
    </form>
  );
}
