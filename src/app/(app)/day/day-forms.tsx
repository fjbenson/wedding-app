"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import type { RunSheetItem, TransportRun } from "@/types/db";

type Action = (formData: FormData) => void | Promise<void>;

/** One line of the run sheet (screen 25). */
export function RunSheetForm({ action, item }: { action: Action; item?: RunSheetItem }) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-[7.5rem_1fr] items-end gap-3">
        <Field label="Time">
          <input name="at_time" type="time" required defaultValue={item?.at_time.slice(0, 5) ?? ""} className={INPUT} />
        </Field>
        <Field label="What happens">
          <input name="title" required defaultValue={item?.title} placeholder="e.g. Ceremony begins" className={INPUT} />
        </Field>
      </div>
      <Field label="Where" hint="optional">
        <input name="location" defaultValue={item?.location ?? ""} placeholder="e.g. The orchard" className={INPUT} />
      </Field>
      <Field label="Who's in charge" hint="optional">
        <input name="who" defaultValue={item?.who ?? ""} placeholder="e.g. Jo (maid of honour), the band" className={INPUT} />
      </Field>
      <Field label="Notes" hint="optional">
        <textarea
          name="notes"
          rows={3}
          defaultValue={item?.notes ?? ""}
          placeholder="e.g. Ushers hand out order of service"
          className={INPUT}
        />
      </Field>
      <SubmitButton label={item ? "Save" : "Add to the run sheet"} />
    </form>
  );
}

/** One run of a car or coach (screen 28). Passengers are added on the Transport tab. */
export function TransportForm({ action, run }: { action: Action; run?: TransportRun }) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-[7.5rem_1fr] items-end gap-3">
        <Field label="Leaves at">
          <input name="at_time" type="time" required defaultValue={run?.at_time.slice(0, 5) ?? ""} className={INPUT} />
        </Field>
        <Field label="Vehicle">
          <input name="vehicle" required defaultValue={run?.vehicle} placeholder="e.g. Car 2, The coach" className={INPUT} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From" hint="optional">
          <input name="from_place" defaultValue={run?.from_place ?? ""} placeholder="e.g. The Bensons' house" className={INPUT} />
        </Field>
        <Field label="To" hint="optional">
          <input name="to_place" defaultValue={run?.to_place ?? ""} placeholder="e.g. St Mary's" className={INPUT} />
        </Field>
      </div>
      <Field label="Notes" hint="optional">
        <textarea name="notes" rows={3} defaultValue={run?.notes ?? ""} placeholder="e.g. Driver: Mike, 07700 900555" className={INPUT} />
      </Field>
      <SubmitButton label={run ? "Save" : "Add"} />
    </form>
  );
}
