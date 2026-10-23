"use client";

import { useState } from "react";
import { Clock, MapPin, NotebookPen, Plus, UsersRound } from "lucide-react";
import { ReturnTo } from "@/components/back-link";
import { SubmitBar } from "@/components/form-bits";
import { AreaTiles, BARE, CARD, DateCard, Line, Part, TITLE_INPUT } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import PeoplePicker from "../people/people-picker";

type Kind = "todo" | "appointment";
type Action = (formData: FormData) => void | Promise<void>;

/**
 * Adding to the plan: a to-do or an appointment, picked from the + first.
 * The name, the date (with quick picks — where suggestions help most), the
 * area, then for an appointment where and who, then notes. Both can have a
 * time (to-dos since 23 Oct 2026, owner: "they should").
 * Since 16 Oct 2026 (owner): no name or time suggestions — free text and the
 * phone's own time picker — and the area comes before "With", so the
 * supplier list is that area's.
 */
export default function PlanAddForm({
  kind: startKind,
  saveTodo,
  saveAppointment,
  suppliers,
  guests,
  areas,
  defaultArea,
  defaultDate,
  weddingDate,
}: {
  kind: Kind;
  saveTodo: Action;
  saveAppointment: Action;
  suppliers: { id: string; name: string; area?: string | null }[];
  guests: { id: string; name: string }[];
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
  const [supplier, setSupplier] = useState("");
  const [tagging, setTagging] = useState(false);
  // The area comes first, so "With" lists that area's suppliers (owner, 16 Oct
  // 2026: pick Photos, then choose from the photographers). No area, or an
  // area with none yet: everyone.
  const inArea = suppliers.filter((s) => area && area !== "other" && s.area === area);
  const picked = suppliers.find((s) => s.id === supplier);
  const areaSuppliers =
    inArea.length === 0 ? suppliers : picked && !inArea.includes(picked) ? [picked, ...inArea] : inArea;
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

      <Part label="When">
        <DateCard name={appt ? "on_date" : "when"} value={date} onChange={setDate} weddingDate={weddingDate} required={appt} />
        {(appt || date) && (
          <div className={CARD}>
            <Line icon={Clock} label="Time">
              <input
                name={appt ? "at_time" : "due_time"}
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
          </div>
        )}
      </Part>

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

      {appt && (
        <Part label="Where and who">
          <div className={CARD}>
            <Line icon={MapPin} label="Where">
              <input name="location" autoComplete="off" placeholder="Where — e.g. The Bridal Room, Southwell" className={BARE} />
            </Line>
            <Line icon={UsersRound} label="With">
              <select
                name="supplier"
                value={supplier}
                onChange={(e) => {
                  setSupplier(e.target.value);
                  // Picking a supplier picks their area too, unless one's already chosen.
                  const s = suppliers.find((x) => x.id === e.target.value);
                  if (s?.area && !area) setArea(known.has(s.area) ? s.area : "other");
                }}
                className={`${BARE} appearance-none`}
              >
                <option value="">With a supplier? (optional)</option>
                {areaSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Line>
          </div>
        </Part>
      )}

      {/* Guests tagged on it (0021_involved.sql) — folded until wanted. */}
      {guests.length > 0 && (
        <Part label="Who's involved">
          {tagging ? (
            <div className="mt-1">
              <PeoplePicker people={guests} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTagging(true)}
              className="mt-1 flex h-9 items-center gap-1.5 rounded-full border border-dashed border-champagne-400 px-3.5 text-[15px] text-champagne-600 hover:bg-champagne-100"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Add a guest
            </button>
          )}
        </Part>
      )}

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
