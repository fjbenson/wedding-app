"use client";

import { useState } from "react";
import { CircleCheck, Hourglass, NotebookPen, Plus, Store } from "lucide-react";
import PeoplePicker from "../people/people-picker";
import { SubmitBar } from "@/components/form-bits";
import { BARE, CARD, DateCard, Folded, Line, Part, TITLE_INPUT, Tiles, AreaTiles } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import { withCommas } from "@/lib/money";
import { todayISO } from "@/lib/dates";
import type { Payment } from "@/types/db";

/** One-tap names. The first three take the supplier's name in front when one's picked. */
const KINDS = ["Deposit", "Instalment", "Balance"];
const OTHERS = ["Wedding rings", "Giving notice", "Ceremony fee", "Marriage certificate"];

const STATUS_TILES = [
  { value: "due", label: "Still to pay", icon: Hourglass },
  { value: "paid", label: "Already paid", icon: CircleCheck },
];

/**
 * Add or edit one payment (screen 24; `payment` is missing when adding).
 * Made visual like the add-a-supplier and Plan forms (owner, 12 Oct 2026):
 * what it's for, large, with one-tap names; the amount as one big figure;
 * Still to pay · Already paid as tiles, then the date as a card (due date
 * with quick picks, or the day it was paid); who it's to (picking a supplier
 * picks their area); the area as picture tiles; notes folded away.
 */
export default function PaymentForm({
  action,
  payment,
  suppliers,
  areas,
  prefill,
  weddingDate,
  focus = true,
  guests = [],
}: {
  /** For "Who's paying" on a new payment (0023): family paying a bill themselves. */
  guests?: { id: string; name: string }[];
  action: (formData: FormData) => void | Promise<void>;
  payment?: Payment;
  suppliers: { id: string; name: string; area?: string | null }[];
  areas: AreaOption[];
  /** From "Add as a payment" on an unscheduled balance. */
  prefill?: { supplier?: string; amount?: number; description?: string; area?: string };
  weddingDate?: string | null;
  /** False when it opens hidden behind Money's Budget switch. */
  focus?: boolean;
}) {
  const [description, setDescription] = useState(payment?.description ?? prefill?.description ?? "");
  const [amount, setAmount] = useState(() => {
    const start = payment?.amount ?? prefill?.amount;
    return start != null ? withCommas(String(start)) : "";
  });
  const [status, setStatus] = useState(payment?.paid_on ? "paid" : "due");
  const [due, setDue] = useState(payment?.due_date ?? "");
  const [paidOn, setPaidOn] = useState(payment?.paid_on ?? todayISO());
  const [supplier, setSupplier] = useState(payment?.contact_id ?? prefill?.supplier ?? "");
  const known = new Set(areas.map((a) => a.key));
  // No area of its own: show its supplier's, the one Money counts it under.
  const fromSupplier = suppliers.find((s) => s.id === payment?.contact_id)?.area;
  const [area, setArea] = useState(
    payment?.area_key ?? (fromSupplier ? (known.has(fromSupplier) ? fromSupplier : "other") : (prefill?.area ?? "")),
  );
  const original = payment?.area_key;
  const options =
    original && original !== "other" && !known.has(original) ? [...areas, { key: original, label: original }] : areas;
  const supplierName = suppliers.find((s) => s.id === supplier)?.name;
  const [someoneElse, setSomeoneElse] = useState(false);

  const chip = (label: string, value: string) => (
    <button
      key={label}
      type="button"
      onClick={() => setDescription(value)}
      className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] transition ${
        description === value ? "border-ink bg-ink text-ivory" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form action={action}>
      <input
        name="description"
        required
        autoFocus={focus && !payment && !prefill}
        autoComplete="off"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        aria-label="What's it for?"
        placeholder="What's it for?"
        // A supplier's name plus "deposit" runs long: step the size down so it fits.
        className={description.length > 24 ? TITLE_INPUT.replace("!text-[24px]", "!text-[20px]") : TITLE_INPUT}
      />
      {!payment && (
        <div className="-mx-[var(--gutter)] mt-3 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 [scrollbar-width:none]">
          {KINDS.map((k) => chip(k, supplierName ? `${supplierName} ${k.toLowerCase()}` : k))}
          {OTHERS.map((k) => chip(k, k))}
        </div>
      )}

      <Part label="How much">
        <label className={`${CARD} flex items-baseline gap-1.5 px-5 py-3`}>
          <span className="font-display text-[32px] font-light text-stone">£</span>
          <input
            name="amount"
            required
            inputMode="decimal"
            autoComplete="off"
            aria-label="Amount"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(withCommas(e.target.value))}
            className="w-full min-w-0 bg-transparent font-display !text-[44px] font-light leading-tight tracking-[-0.02em] text-ink placeholder:text-stone/40 focus:outline-none"
          />
        </label>
      </Part>

      <Part label="Paid yet?">
        <Tiles name="status" options={STATUS_TILES} value={status} onChange={setStatus} columns="grid-cols-2" />
        {status === "paid" ? (
          <div className="mt-4">
            <input type="hidden" name="paid" value="on" />
            {/* Keep any due date it had, so marking it paid loses nothing. */}
            <input type="hidden" name="due_date" value={due} />
            <p className="type-meta">The day you paid</p>
            <DateCard name="paid_on" value={paidOn} onChange={setPaidOn} quick={false} />
          </div>
        ) : (
          <div className="mt-4">
            <p className="type-meta">When it&apos;s due</p>
            <DateCard name="due_date" value={due} onChange={setDue} weddingDate={weddingDate} />
          </div>
        )}
      </Part>

      <Part label="Who it's to">
        <div className={CARD}>
          <Line icon={Store} label="Supplier">
            <select
              name="supplier"
              value={supplier}
              onChange={(e) => {
                setSupplier(e.target.value);
                // Picking a supplier picks their area too, unless one's already chosen.
                const s = suppliers.find((x) => x.id === e.target.value);
                if (s?.area && !area) setArea(known.has(s.area) ? s.area : "other");
              }}
              className={`${BARE} appearance-none ${supplier ? "" : "text-stone/60"}`}
            >
              <option value="">Not a supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Line>
        </div>
      </Part>

      <Part label="Area">
        {/* None picked means it follows the supplier's area, as before. */}
        <AreaTiles name="area" areas={options} otherValue="other" value={area} onChange={setArea} folded={!!payment && !!area} />
      </Part>

      {/* Nobody picked means the couple pay it; changed later on the payment's card. */}
      {!payment && guests.length > 0 && (
        <Part label="Who's paying">
          {someoneElse ? (
            <div className="mt-1">
              <PeoplePicker people={guests} />
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="flex h-9 items-center rounded-full border border-linen bg-white px-3.5 text-[15px] text-ink">Us</span>
              <button
                type="button"
                onClick={() => setSomeoneElse(true)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-champagne-400 px-3.5 text-[15px] text-champagne-600 hover:bg-champagne-100"
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                Someone else
              </button>
            </div>
          )}
        </Part>
      )}

      <Folded label="Add notes" open={!!payment?.notes}>
        <section className="mt-7">
          <h2 className="section-label font-body">Notes</h2>
          <div className={CARD}>
            <Line icon={NotebookPen} label="Notes" top>
              <textarea
                name="notes"
                rows={3}
                defaultValue={payment?.notes ?? ""}
                placeholder="e.g. Invoice #1042, pay by bank transfer"
                className={`${BARE} w-full resize-none`}
              />
            </Line>
          </div>
        </section>
      </Folded>

      <SubmitBar label={payment ? "Save changes" : "Add payment"} whenChanged={!!payment} />
    </form>
  );
}
