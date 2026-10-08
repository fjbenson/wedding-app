"use client";

import { useState } from "react";
import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import { GUEST_ROLES, rolesOf } from "@/lib/guest-roles";
import type { Contact, Household } from "@/types/db";

/** Add or edit one guest. `guest` is missing when adding. */
export default function GuestForm({
  action,
  households,
  guest,
  defaultHousehold,
}: {
  action: (formData: FormData) => void | Promise<void>;
  households: Household[];
  guest?: Contact;
  /** Adding from a household's page: start in that household, and go back there. */
  defaultHousehold?: string;
}) {
  // Their roles, plus any they have that aren't among the suggestions.
  const saved = guest ? rolesOf(guest) : [];
  const choices = [...GUEST_ROLES, ...saved.filter((r) => !GUEST_ROLES.includes(r))];

  // A new guest usually starts a new household; an existing one keeps theirs.
  const [household, setHousehold] = useState(
    guest ? (guest.household_id ?? "none") : (defaultHousehold ?? "new"),
  );

  return (
    <form action={action} className="space-y-5">
      {defaultHousehold && (
        <input type="hidden" name="return_to" value={`/people/household/${defaultHousehold}`} />
      )}
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

      <fieldset>
        <legend className="text-sm text-ink">
          Role on the day <span className="text-stone">(as many as apply)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {choices.map((r) => (
            <label key={r} className="cursor-pointer">
              <input type="checkbox" name="roles" value={r} defaultChecked={saved.includes(r)} className="peer sr-only" />
              <span className="flex h-9 items-center rounded-full border border-linen bg-white px-3.5 text-sm text-ink transition peer-checked:border-champagne-600 peer-checked:bg-champagne-100 peer-checked:font-medium peer-checked:text-champagne-600 peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400">
                {r}
              </span>
            </label>
          ))}
        </div>
        <input
          name="custom_role"
          placeholder="Or your own, e.g. Chief dog handler"
          aria-label="Another role"
          className={INPUT}
        />
      </fieldset>

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
