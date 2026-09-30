"use client";

import { useState } from "react";
import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import type { Contact, Household } from "@/types/db";

/** Add or edit one guest. `guest` is missing when adding. */
export default function GuestForm({
  action,
  households,
  guest,
}: {
  action: (formData: FormData) => void | Promise<void>;
  households: Household[];
  guest?: Contact;
}) {
  // A new guest usually starts a new household; an existing one keeps theirs.
  const [household, setHousehold] = useState(
    guest ? (guest.household_id ?? "none") : "new",
  );

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <input name="first_name" required defaultValue={guest?.first_name} className={INPUT} />
        </Field>
        <Field label="Last name">
          <input name="last_name" defaultValue={guest?.last_name ?? ""} className={INPUT} />
        </Field>
      </div>

      <Field label="Household" hint="who shares an invitation">
        <select
          name="household"
          value={household}
          onChange={(event) => setHousehold(event.target.value)}
          className={INPUT}
        >
          <option value="new">+ New household</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
          <option value="none">Not in a household yet</option>
        </select>
      </Field>

      {household === "new" && (
        <Field label="Household name" hint="optional">
          <input name="new_household" placeholder="e.g. The Bensons" className={INPUT} />
        </Field>
      )}

      <div className="space-y-3">
        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="is_child"
            defaultChecked={guest?.is_child}
            className="h-5 w-5 accent-ink"
          />
          This guest is a child
        </label>
        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="bridal_party"
            defaultChecked={guest?.contact_type === "bridal_party"}
            className="h-5 w-5 accent-ink"
          />
          Part of the wedding party
        </label>
      </div>

      <Field label="Email" hint="optional">
        <input
          name="email"
          type="email"
          defaultValue={guest?.email ?? ""}
          autoComplete="off"
          className={INPUT}
        />
      </Field>

      <Field label="Phone" hint="optional">
        <input name="phone" type="tel" defaultValue={guest?.phone ?? ""} className={INPUT} />
      </Field>

      <Field label="Notes" hint="optional">
        <textarea
          name="notes"
          rows={3}
          defaultValue={guest?.notes ?? ""}
          placeholder="e.g. Sam's university friend"
          className={INPUT}
        />
      </Field>

      <SubmitButton label={guest ? "Save changes" : "Add to the list"} />
    </form>
  );
}
