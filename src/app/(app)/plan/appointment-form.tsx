"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import type { AreaOption } from "@/lib/areas";
import type { Appointment } from "@/types/db";

/** Add or edit one appointment (screen 21). `appointment` is missing when adding. */
export default function AppointmentForm({
  action,
  appointment,
  suppliers,
  areas,
  defaultArea,
}: {
  action: (formData: FormData) => void | Promise<void>;
  appointment?: Appointment;
  suppliers: { id: string; name: string }[];
  areas: AreaOption[];
  defaultArea?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <Field label="What is it?">
        <input
          name="title"
          required
          defaultValue={appointment?.title}
          placeholder="e.g. Dress fitting, Menu tasting"
          className={INPUT}
        />
      </Field>

      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="Date">
          <input name="on_date" type="date" required defaultValue={appointment?.on_date ?? ""} className={INPUT} />
        </Field>
        <Field label="Time" hint="optional">
          <input name="at_time" type="time" defaultValue={appointment?.at_time?.slice(0, 5) ?? ""} className={INPUT} />
        </Field>
      </div>

      <Field label="Where" hint="optional">
        <input name="location" defaultValue={appointment?.location ?? ""} placeholder="e.g. The Bridal Room, Southwell" className={INPUT} />
      </Field>

      <Field label="With" hint="optional">
        <select name="supplier" defaultValue={appointment?.contact_id ?? ""} className={INPUT}>
          <option value="">No particular supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Area" hint="optional">
        <select name="area" defaultValue={appointment?.area_key ?? defaultArea ?? ""} className={INPUT}>
          <option value="">—</option>
          {areas.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes" hint="optional">
        <textarea
          name="notes"
          rows={3}
          defaultValue={appointment?.notes ?? ""}
          placeholder="e.g. Bring the shoes. Ask about the veil."
          className={INPUT}
        />
      </Field>

      <SubmitButton label={appointment ? "Save" : "Add appointment"} />
    </form>
  );
}
