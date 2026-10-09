"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import type { Rsvp, RsvpStatus } from "@/types/db";

const ANSWERS: { status: RsvpStatus; label: string }[] = [
  { status: "attending", label: "Coming" },
  { status: "declined", label: "Not coming" },
  { status: "pending", label: "Invited" },
  { status: "to_invite", label: "To invite" },
];

/** One person's answer for one event, with their meal and dietary needs. */
export default function RsvpForm({
  action,
  rsvp,
  eventName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  rsvp: Rsvp;
  eventName: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <fieldset>
        <legend className="text-sm text-ink">{eventName}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ANSWERS.map((answer) => (
            <label key={answer.status} className="cursor-pointer">
              <input
                type="radio"
                name="status"
                value={answer.status}
                defaultChecked={rsvp.status === answer.status}
                className="peer sr-only"
              />
              <span className="flex h-12 items-center justify-center rounded-xl border border-linen bg-white px-2 text-center text-sm text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400/40">
                {answer.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Meal choice" hint="optional">
        <input
          name="meal_choice"
          defaultValue={rsvp.meal_choice ?? ""}
          placeholder="e.g. Beef, Fish, Vegetarian"
          className={INPUT}
        />
      </Field>

      <Field label="Dietary needs" hint="optional">
        <textarea
          name="dietary_notes"
          rows={3}
          defaultValue={rsvp.dietary_notes ?? ""}
          placeholder="e.g. Nut allergy, no pork"
          className={INPUT}
        />
      </Field>

      <SubmitButton label="Save" />
    </form>
  );
}
