"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import type { Household } from "@/types/db";

/** A household's name and where its invitation gets posted. */
export default function HouseholdForm({
  action,
  household,
}: {
  action: (formData: FormData) => void | Promise<void>;
  household: Household;
}) {
  return (
    <form action={action} className="space-y-5">
      <Field label="Household name" hint="as it'll go on the envelope">
        <input name="name" required defaultValue={household.name} className={INPUT} />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm text-ink">Address</legend>
        <input
          name="address_line1"
          aria-label="Address line 1"
          autoComplete="address-line1"
          defaultValue={household.address_line1 ?? ""}
          placeholder="House and street"
          className={INPUT}
        />
        <input
          name="address_line2"
          aria-label="Address line 2"
          autoComplete="address-line2"
          defaultValue={household.address_line2 ?? ""}
          placeholder="Flat, area (optional)"
          className={INPUT}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="city"
            aria-label="Town or city"
            autoComplete="address-level2"
            defaultValue={household.city ?? ""}
            placeholder="Town or city"
            className={INPUT}
          />
          <input
            name="postcode"
            aria-label="Postcode"
            autoComplete="postal-code"
            defaultValue={household.postcode ?? ""}
            placeholder="Postcode"
            className={INPUT}
          />
        </div>
        <input
          name="country"
          aria-label="Country"
          autoComplete="country-name"
          defaultValue={household.country ?? ""}
          placeholder="Country (if not the UK)"
          className={INPUT}
        />
      </fieldset>

      <SubmitButton label="Save" />
    </form>
  );
}
