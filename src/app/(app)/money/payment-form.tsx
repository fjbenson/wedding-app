"use client";

import { useState } from "react";
import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import type { AreaOption } from "@/lib/areas";
import type { Payment } from "@/types/db";

/** "£" in front of an amount box. */
function MoneyInput({ name, value, required }: { name: string; value?: number | null; required?: boolean }) {
  return (
    <span className="relative mt-2 block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone">£</span>
      <input
        name={name}
        required={required}
        inputMode="decimal"
        defaultValue={value ?? ""}
        placeholder="0"
        className={`${INPUT.replace("mt-2 ", "")} pl-8`}
      />
    </span>
  );
}

/** Add or edit one payment (screen 24). `payment` is missing when adding. */
export default function PaymentForm({
  action,
  payment,
  suppliers,
  areas,
  prefill,
}: {
  action: (formData: FormData) => void | Promise<void>;
  payment?: Payment;
  suppliers: { id: string; name: string }[];
  areas: AreaOption[];
  /** From "Add as a payment" on an unscheduled balance. */
  prefill?: { supplier?: string; amount?: number; description?: string };
}) {
  const [paid, setPaid] = useState(Boolean(payment?.paid_on));

  return (
    <form action={action} className="space-y-5">
      <Field label="What's it for?">
        <input
          name="description"
          required
          defaultValue={payment?.description ?? prefill?.description ?? ""}
          placeholder="e.g. Photographer balance, Wedding rings"
          className={INPUT}
        />
      </Field>

      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="Amount">
          <MoneyInput name="amount" required value={payment?.amount ?? prefill?.amount} />
        </Field>
        <Field label="Due" hint="optional">
          <input name="due_date" type="date" defaultValue={payment?.due_date ?? ""} className={INPUT} />
        </Field>
      </div>

      <Field label="Who to" hint="optional">
        <select name="supplier" defaultValue={payment?.contact_id ?? prefill?.supplier ?? ""} className={INPUT}>
          <option value="">Not a supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Area" hint="optional — a supplier's payment goes under theirs">
        <select name="area" defaultValue={payment?.area_key ?? ""} className={INPUT}>
          <option value="">—</option>
          {areas.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="paid"
          checked={paid}
          onChange={(event) => setPaid(event.target.checked)}
          className="h-5 w-5 accent-ink"
        />
        Already paid
      </label>
      {paid && (
        <Field label="Paid on">
          <input name="paid_on" type="date" defaultValue={payment?.paid_on ?? ""} className={INPUT} />
        </Field>
      )}

      <Field label="Notes" hint="optional">
        <textarea
          name="notes"
          rows={3}
          defaultValue={payment?.notes ?? ""}
          placeholder="e.g. Invoice #1042, pay by bank transfer"
          className={INPUT}
        />
      </Field>

      <SubmitButton label={payment ? "Save" : "Add payment"} />
    </form>
  );
}
