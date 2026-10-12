"use client";

import { useState } from "react";
import { CalendarCheck, CircleDashed, NotebookPen, Sprout } from "lucide-react";
import { ReturnTo } from "@/components/back-link";
import { SubmitButton } from "@/components/form-bits";
import { BARE, CARD, DateCard, Folded, Line, Part, TITLE_INPUT, Tiles, areaTiles } from "@/components/visual-form";
import { areaName, type AreaOption } from "@/lib/areas";
import { WHEN_TITLE, isNudge, planDate } from "@/lib/plan";
import type { Milestone } from "@/types/db";

type WhenKind = "due" | "start" | "none";

const WHEN_TILES = [
  { value: "due", label: "Done by", icon: CalendarCheck },
  { value: "start", label: "Start around", icon: Sprout },
  { value: "none", label: "No date", icon: CircleDashed },
];

/**
 * Add or edit one to-do (`milestone` is missing when adding). Made visual
 * like the add-a-supplier form (owner, 12 Oct 2026): the to-do large like a
 * title, "when" as three tiles — Done by · Start around (a nudge,
 * src/lib/plan.ts) · No date — then the date as a card with quick picks, the
 * area as picture tiles, and notes folded away.
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
  const [whenKind, setWhenKind] = useState<WhenKind>(
    milestone && isNudge(milestone) ? "start" : milestone && !startDate ? "none" : "due",
  );
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
        <Tiles
          name="when_kind"
          options={WHEN_TILES}
          value={whenKind}
          onChange={(v) => setWhenKind(v as WhenKind)}
          columns="grid-cols-3"
        />
        {whenKind !== "none" && (
          <div className="mt-4">
            <p className="type-meta">{WHEN_TITLE[whenKind]}</p>
            <DateCard name="when" value={date} onChange={setDate} weddingDate={weddingDate} />
          </div>
        )}
      </Part>

      <Part label="Area">
        {/* Other is stored as no area, as before (owner: "always have that other option"). */}
        <Tiles name="category" options={areaTiles(options, "")} defaultValue={current ?? defaultArea} />
      </Part>

      <Folded label="Add notes" open={!!milestone?.description}>
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
      </Folded>

      <div className="mt-8">
        <SubmitButton label={milestone ? "Save changes" : "Add to the plan"} />
      </div>
    </form>
  );
}
