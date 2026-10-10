"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import { areaName, type AreaOption } from "@/lib/areas";
import { isNudge, planDate } from "@/lib/plan";
import type { Milestone } from "@/types/db";

/** Add or edit one to-do. `milestone` is missing when adding. */
export default function MilestoneForm({
  action,
  milestone,
  areas,
  defaultArea,
}: {
  action: (formData: FormData) => void | Promise<void>;
  milestone?: Milestone;
  /** The wedding's own areas (src/lib/areas.ts, areaOptions). */
  areas: AreaOption[];
  /** Adding from an area's group in "By area": start with that area picked. */
  defaultArea?: string;
}) {
  // A to-do tagged with an area that's since been switched off (or an older
  // "Guests" tag) keeps it as an option, so saving doesn't quietly drop it.
  const current = milestone?.category;
  const nudge = !!milestone && isNudge(milestone);
  const options =
    current && !areas.some((a) => a.key === current)
      ? [...areas, { key: current, label: areaName(current, areas) ?? current }]
      : areas;

  return (
    <form action={action} className="space-y-5">
      <Field label="What needs doing?">
        <input
          name="title"
          required
          defaultValue={milestone?.title}
          placeholder="e.g. Book the florist"
          className={INPUT}
        />
      </Field>

      {/* "Done by" a date, or a nudge to "start around" one (src/lib/plan.ts). */}
      <fieldset>
        <legend className="mb-2 text-sm text-ink">
          When <span className="text-stone">(optional)</span>
        </legend>
        <div className="mb-2.5 grid grid-cols-2 rounded-full bg-cream p-[3px]">
          {[
            { value: "due", label: "Done by" },
            { value: "start", label: "Start around" },
          ].map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="when_kind"
                value={option.value}
                defaultChecked={option.value === (nudge ? "start" : "due")}
                className="peer sr-only"
              />
              <span className="flex h-9 items-center justify-center rounded-full text-sm text-stone transition peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-[0_1px_4px_rgb(60_50_40/0.12)] peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <input
          name="when"
          type="date"
          aria-label="Date"
          defaultValue={milestone ? (planDate(milestone) ?? "") : ""}
          className={INPUT}
        />
      </fieldset>

      <Field label="Area" hint="optional">
        <select name="category" defaultValue={current ?? defaultArea ?? ""} className={INPUT}>
          <option value="">No particular area</option>
          {options.map((area) => (
            <option key={area.key} value={area.key}>
              {area.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes" hint="optional">
        <textarea
          name="description"
          rows={3}
          defaultValue={milestone?.description ?? ""}
          placeholder="e.g. Ask about seasonal flowers for June"
          className={INPUT}
        />
      </Field>

      <SubmitButton label={milestone ? "Save changes" : "Add to the plan"} />
    </form>
  );
}
