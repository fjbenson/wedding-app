"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import { areaName, type AreaOption } from "@/lib/areas";
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

      <Field label="By when" hint="optional">
        <input
          name="due_date"
          type="date"
          defaultValue={milestone?.due_date ?? ""}
          className={INPUT}
        />
      </Field>

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
