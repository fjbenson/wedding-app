"use client";

import type { PaymentStepsBlock, Proposal } from "@/lib/assistant/blocks";
import { formatLongDate } from "@/lib/dates";
import { formatMoney, parseMoney, withCommas } from "@/lib/money";
import { FIELD, PILL, PILL_OFF, PILL_ON, type Flow, type StepBodyProps, type StepsState } from "./steps-flow";
import { AreaPills, DateStep, SupplierSelect } from "./steps-bits";

/**
 * Recording a payment, a step at a time (see steps-flow.tsx). Steps: the
 * amount, still to pay or already paid (and when), and who it's to. When the
 * amount and whether it's paid are known it goes straight to the check card;
 * who it's to is optional (no supplier, no area means Other). Picking a
 * supplier picks their area, as on the payment form.
 */

interface Values {
  /** Typed with commas: "1,250" */
  amount: string;
  status: "" | "due" | "paid";
  /** The due date, or the day it was paid; "" for none (paid means today) */
  date: string;
  /** "" nothing chosen · "none" not for a supplier · otherwise a supplier's id */
  supplier: string;
  area: string;
}

type Key = "amount" | "when" | "who";
const KEYS: Key[] = ["amount", "when", "who"];

function initial(block: PaymentStepsBlock): StepsState<Values> {
  const p = block.prefill;
  const values: Values = {
    amount: p.amount != null ? withCommas(String(p.amount)) : "",
    status: p.paid ? "paid" : p.whenKnown ? "due" : "",
    date: (p.paid ? p.paidOn : p.dueDate) ?? "",
    supplier: p.supplierId ?? (p.whoKnown && !p.area ? "none" : ""),
    area: p.area ?? "",
  };
  const marks: StepsState["marks"] = {};
  if (p.amount != null) marks.amount = "answered";
  if (p.whenKnown) marks.when = "answered";
  if (p.whoKnown) marks.who = "answered";
  if (marks.amount && marks.when) {
    marks.who ??= "skipped";
    return { phase: "review", index: KEYS.length - 1, marks, editing: false, values };
  }
  return { phase: "asking", index: KEYS.findIndex((k) => !marks[k]), marks, editing: false, values };
}

function answer(block: PaymentStepsBlock, v: Values, key: string): string | null {
  switch (key as Key) {
    case "amount": {
      const n = parseMoney(v.amount);
      return n === null ? null : formatMoney(n);
    }
    case "when":
      if (v.status === "due") return v.date ? `Still to pay · ${formatLongDate(v.date)}` : "Still to pay · no date yet";
      if (v.status === "paid") return v.date ? `Paid ${formatLongDate(v.date)}` : "Paid today";
      return null;
    case "who": {
      const supplier = block.options.suppliers.find((s) => s.id === v.supplier);
      if (supplier) return supplier.name;
      if (v.supplier === "none" || v.area) {
        const area = v.area === "other" ? "Other" : block.options.areas.find((a) => a.key === v.area)?.label;
        return area ? `Not for a supplier · ${area}` : "Not for a supplier";
      }
      return null;
    }
  }
  return null;
}

function clear(v: Values, key: string): Values {
  switch (key as Key) {
    case "amount":
      return { ...v, amount: "" };
    case "when":
      return { ...v, status: "", date: "" };
    case "who":
      return { ...v, supplier: "", area: "" };
  }
  return v;
}

function proposal(block: PaymentStepsBlock, v: Values): Proposal {
  const supplier = block.options.suppliers.some((s) => s.id === v.supplier) ? v.supplier : null;
  const paid = v.status === "paid";
  return {
    kind: "add_payment",
    input: {
      description: block.prefill.description,
      amount: parseMoney(v.amount) ?? 0,
      supplierId: supplier,
      // With a supplier the area follows them, as on the payment form.
      area: supplier ? null : v.area || null,
      dueDate: paid ? null : v.date || null,
      paid,
      paidOn: paid ? v.date || null : null,
      notes: block.prefill.notes,
    },
  };
}

export const paymentFlow: Flow<PaymentStepsBlock, Values> = {
  keys: () => KEYS,
  initial,
  answer,
  clear,
  proposal,
  subject: (b) => b.prefill.description,
  intro: () => "A few quick questions. Skip any you like.",
  question: (_b, key) => ({ amount: "How much is it?", when: "Still to pay, or already paid?", who: "Who’s it to?" })[key as Key] ?? "",
  heading: (_b, key) => ({ amount: "How much?", when: "Paid yet?", who: "Who’s it to?" })[key as Key] ?? "",
  label: (key) => ({ amount: "Amount", when: "Paid yet", who: "To" })[key as Key] ?? key,
  action: "Record a payment",
  closing: () => "That’s everything. Shall I record it?",
  yes: () => "Record it",
  seeIt: "See it ›",
  cancelled: "Cancelled. Nothing was recorded.",
  fixed: (b) => (b.prefill.notes ? [["Notes", b.prefill.notes]] : []),
  missing: (_b, v) => (parseMoney(v.amount) === null ? "Add the amount first: tap the Amount line." : null),
  Body,
};

function Body({ block, state, setValues, stepKey }: StepBodyProps<PaymentStepsBlock, Values>) {
  const v = state.values;
  if (stepKey === "amount") {
    return (
      <label className="relative block">
        <span className="sr-only">Amount in pounds</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-[26px] font-light text-stone">£</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          value={v.amount}
          onChange={(e) => setValues({ amount: withCommas(e.target.value) })}
          placeholder="0"
          className={`${FIELD} h-16 pl-10 font-display !text-[30px] font-light`}
        />
      </label>
    );
  }
  if (stepKey === "when") {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {(
            [
              ["due", "Still to pay"],
              ["paid", "Already paid"],
            ] as const
          ).map(([status, label]) => (
            <button
              key={status}
              type="button"
              aria-pressed={v.status === status}
              onClick={() => setValues({ status: v.status === status ? "" : status, date: v.status === status ? v.date : "" })}
              className={`h-14 flex-1 rounded-2xl border text-[16px] transition ${v.status === status ? "border-champagne-400 bg-champagne-100" : "border-linen bg-white hover:border-champagne-400"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {v.status === "due" && <DateStep value={v.date} onChange={(date) => setValues({ date })} today={block.options.today} weddingDate={block.options.weddingDate} />}
        {v.status === "paid" && (
          <div className="space-y-2">
            <p className="text-sm text-stone">The day it was paid. Leave it for today.</p>
            <label className="block">
              <span className="sr-only">Day paid</span>
              <input type="date" value={v.date} onChange={(e) => setValues({ date: e.target.value })} className={FIELD} />
            </label>
          </div>
        )}
      </div>
    );
  }
  const supplier = block.options.suppliers.find((s) => s.id === v.supplier);
  return (
    <div className="space-y-3">
      <SupplierSelect
        suppliers={block.options.suppliers}
        value={v.supplier}
        onChange={(supplier) => setValues({ supplier, area: "" })}
        none="Not for a supplier"
        placeholder="Choose a supplier"
      />
      {!supplier && v.supplier === "none" && (
        <div>
          <p className="section-label mb-2">Area</p>
          <AreaPills areas={block.options.areas} value={v.area} onChange={(area) => setValues({ area })} />
        </div>
      )}
    </div>
  );
}
