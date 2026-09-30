"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import type { WeddingEvent } from "@/types/db";

/** Add or rename one part of the wedding. `event` is missing when adding. */
export default function EventForm({
  action,
  event,
}: {
  action: (formData: FormData) => void | Promise<void>;
  event?: WeddingEvent;
}) {
  return (
    <form action={action} className="space-y-5">
      <Field label="What's it called?">
        <input
          name="name"
          required
          defaultValue={event?.name}
          placeholder="e.g. The evening, Sunday brunch"
          className={INPUT}
        />
      </Field>

      <Field label="Where" hint="optional">
        <input
          name="location"
          defaultValue={event?.location ?? ""}
          placeholder="e.g. Hazel Gap Barn"
          className={INPUT}
        />
      </Field>

      <SubmitButton label={event ? "Save" : "Add it"} />
    </form>
  );
}
