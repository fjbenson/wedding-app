"use client";

import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import type { AreaOption } from "@/lib/areas";
import { SUPPLIER_STATUSES } from "@/lib/supplier-status";
import type { Supplier } from "@/lib/db/suppliers";

/** "£" in front of an amount box. */
function MoneyInput({ name, value }: { name: string; value: number | null | undefined }) {
  return (
    <span className="relative mt-2 block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone">£</span>
      <input
        name={name}
        inputMode="decimal"
        defaultValue={value ?? ""}
        placeholder="0"
        className={`${INPUT.replace("mt-2 ", "")} pl-8`}
      />
    </span>
  );
}

/** Add or edit one supplier. `supplier` is missing when adding. */
export default function SupplierForm({
  action,
  supplier,
  categories,
  defaultCategory,
}: {
  action: (formData: FormData) => void | Promise<void>;
  supplier?: Supplier;
  /** The wedding's areas plus "Other" (src/lib/areas.ts, supplierCategories). */
  categories: AreaOption[];
  /** Adding from an area's page: start with that area picked. */
  defaultCategory?: string;
}) {
  const d = supplier?.supplier_details;
  // When the business had no named person, its name was stored as theirs.
  const person =
    supplier && [supplier.first_name, supplier.last_name].filter(Boolean).join(" ");
  const contactName = person && person !== d?.company_name ? person : "";

  return (
    <form action={action} className="space-y-5">
      <Field label="Business name">
        <input
          name="company_name"
          required
          defaultValue={d?.company_name ?? person ?? ""}
          placeholder="e.g. Marigold Studio"
          className={INPUT}
        />
      </Field>

      <Field label="What they do">
        <select name="category" defaultValue={d?.category ?? defaultCategory ?? ""} className={INPUT}>
          <option value="">Choose…</option>
          {/* Keep a category that's since been switched off, so saving doesn't drop it. */}
          {d?.category && !categories.some((c) => c.key === d.category) && (
            <option value={d.category}>{d.category}</option>
          )}
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="text-sm text-ink">Where you&apos;re up to</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SUPPLIER_STATUSES.map((s) => (
            <label key={s.status} className="cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s.status}
                defaultChecked={(d?.status ?? "researching") === s.status}
                className="peer sr-only"
              />
              <span className="flex h-11 items-center justify-center rounded-xl border border-linen bg-white px-2 text-sm text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400/40">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Aligned by the boxes, so a label that wraps on a small phone doesn't
          push one box lower than the other. */}
      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="Quote" hint="optional">
          <MoneyInput name="quoted_cost" value={d?.quoted_cost} />
        </Field>
        <Field label="Deposit paid" hint="optional">
          <MoneyInput name="deposit_paid" value={d?.deposit_paid} />
        </Field>
      </div>

      <Field label="Contact person" hint="optional">
        <input name="contact_name" defaultValue={contactName} placeholder="e.g. Hannah Reid" className={INPUT} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone" hint="optional">
          <input name="phone" type="tel" defaultValue={supplier?.phone ?? ""} className={INPUT} />
        </Field>
        <Field label="Email" hint="optional">
          <input name="email" type="email" defaultValue={supplier?.email ?? ""} className={INPUT} />
        </Field>
      </div>

      <Field label="Contract" hint="a link, optional">
        <input
          name="contract_url"
          type="url"
          defaultValue={d?.contract_url ?? ""}
          placeholder="https://…"
          className={INPUT}
        />
      </Field>

      <Field label="Notes" hint="optional">
        <textarea name="notes" rows={3} defaultValue={supplier?.notes ?? ""} className={INPUT} />
      </Field>

      <SubmitButton label={supplier ? "Save" : "Add supplier"} />
    </form>
  );
}
