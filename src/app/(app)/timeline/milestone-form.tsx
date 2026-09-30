"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import { AREAS } from "@/lib/areas";
import type { Milestone } from "@/types/db";

/** Add or edit one to-do. `milestone` is missing when adding. */
export default function MilestoneForm({
  action,
  milestone,
}: {
  action: (formData: FormData) => void | Promise<void>;
  milestone?: Milestone;
}) {
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
        <select name="category" defaultValue={milestone?.category ?? ""} className={INPUT}>
          <option value="">No particular area</option>
          {AREAS.map((area) => (
            <option key={area.id} value={area.id}>
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

      <SubmitButton label={milestone ? "Save changes" : "Add to the timeline"} />
    </form>
  );
}
