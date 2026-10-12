"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { ReturnTo } from "@/components/back-link";
import { SubmitButton } from "@/components/form-bits";
import { BARE, CARD, DateCard, Line, Part, TITLE_INPUT, Tiles, areaTiles } from "@/components/visual-form";
import { areaName, type AreaOption } from "@/lib/areas";
import { planDate } from "@/lib/plan";
import type { Milestone } from "@/types/db";

/**
 * Add or edit one to-do (`milestone` is missing when adding). Made visual
 * like the add-a-supplier form, then simplified (owner, 12 Oct 2026): what
 * needs doing, a date (optional — the card with quick picks, ✕ to take it
 * off), the area as picture tiles, and notes, always open. No "Done by /
 * Start around" choice any more, and no nudges (src/lib/plan.ts): "Start
 * thinking about flowers" says it in the name; saving an old nudge makes it
 * an ordinary to-do.
 */
export default function MilestoneForm({
  action,
  milestone,
  areas,
  defaultArea,
  defaultDate,
  weddingDate,
}: {
  action: (formData: FormData) => void | Promise<void>;
  milestone?: Milestone;
  /** The wedding's own areas (src/lib/areas.ts, areaOptions). */
  areas: AreaOption[];
  /** Adding from an area's list: start with that area picked. */
  defaultArea?: string;
  /** Adding from a day on the calendar: start with that date. */
  defaultDate?: string;
  /** For the "a month before the day" quick picks. */
  weddingDate?: string | null;
}) {
  const startDate = milestone ? (planDate(milestone) ?? "") : (defaultDate ?? "");
  const [date, setDate] = useState(startDate);

  // A to-do tagged with an area that's since been switched off (or an older
  // "Guests" tag) keeps it as a tile, so saving doesn't quietly drop it.
  const current = milestone?.category;
  const options =
    current && !areas.some((a) => a.key === current)
      ? [...areas, { key: current, label: areaName(current, areas) ?? current }]
      : areas;

  return (
    <form action={action}>
      <ReturnTo href="/plan" />
      <input
        name="title"
        required
        autoFocus={!milestone}
        autoComplete="off"
        defaultValue={milestone?.title}
        aria-label="What needs doing?"
        placeholder="What needs doing?"
        className={TITLE_INPUT}
      />

      <Part label="When">
        <DateCard name="when" value={date} onChange={setDate} weddingDate={weddingDate} clearable />
      </Part>

      <Part label="Area">
        {/* Other is stored as no area, as before (owner: "always have that other option"). */}
        <Tiles name="category" options={areaTiles(options, "")} defaultValue={current ?? defaultArea} />
      </Part>

      <section className="mt-7">
        <h2 className="section-label font-body">Notes</h2>
        <div className={CARD}>
          <Line icon={NotebookPen} label="Notes">
            <textarea
              name="description"
              rows={3}
              defaultValue={milestone?.description ?? ""}
              placeholder="e.g. Ask about seasonal flowers for June"
              className={`${BARE} w-full resize-none`}
            />
          </Line>
        </div>
      </section>

      <div className="mt-8">
        <SubmitButton label={milestone ? "Save changes" : "Add to the plan"} />
      </div>
    </form>
  );
}
