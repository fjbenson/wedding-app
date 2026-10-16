"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { CARD, Part, Tiles, areaTiles } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import { formatMoney, withCommas } from "@/lib/money";
import { setBudgetAction } from "./actions";
import PaymentForm from "./payment-form";

type Kind = "payment" | "budget";
type Action = (formData: FormData) => void | Promise<void>;

/**
 * Money's one + (owner, 13 Oct 2026, like Plan's To-do | Appointment): a
 * Payment | Budget switch at the top. By month's + starts on Payment, By
 * area's on Budget. Both forms stay drawn (one hidden), so what's typed in
 * either survives switching. The whole budget, shared out area by area,
 * is still its own page (`/money/budget`, tapping Money's top card).
 */
export default function MoneyAddForm({
  kind: startKind,
  savePayment,
  suppliers,
  areas,
  budgets,
  weddingBudget,
  prefill,
  weddingDate,
}: {
  kind: Kind;
  savePayment: Action;
  suppliers: { id: string; name: string; area?: string | null }[];
  areas: AreaOption[];
  /** Each area's budget now, by key. */
  budgets: Record<string, number | null>;
  weddingBudget: number | null;
  prefill?: { supplier?: string; amount?: number; description?: string; area?: string };
  weddingDate?: string | null;
}) {
  // Picked before the form opens (the + asks first, owner 16 Oct 2026).
  const kind = startKind;

  return (
    <>
      <div hidden={kind !== "payment"}>
        <PaymentForm
          action={savePayment}
          suppliers={suppliers}
          areas={areas}
          prefill={prefill}
          weddingDate={weddingDate}
          focus={startKind === "payment"}
        />
      </div>
      <div hidden={kind !== "budget"}>
        <BudgetAddForm areas={areas} budgets={budgets} weddingBudget={weddingBudget} defaultArea={prefill?.area} />
      </div>
    </>
  );
}

/**
 * One budget: what it's for as tiles (the whole wedding, then each area —
 * no Other, budgets live on the areas), then the amount large. If it has a
 * budget already, that's shown, and saving replaces it.
 */
function BudgetAddForm({
  areas,
  budgets,
  weddingBudget,
  defaultArea,
}: {
  areas: AreaOption[];
  budgets: Record<string, number | null>;
  weddingBudget: number | null;
  defaultArea?: string;
}) {
  const [target, setTarget] = useState(defaultArea && defaultArea in budgets ? defaultArea : "");
  const [amount, setAmount] = useState("");
  const options = [
    { value: "wedding", label: "The whole wedding", icon: Heart },
    ...areaTiles(areas, "other").filter((o) => o.value !== "other"),
  ];
  const now = target === "wedding" ? weddingBudget : target ? budgets[target] ?? null : null;

  return (
    <form action={setBudgetAction}>
      <Part label="What's it for" className="mt-0">
        <Tiles name="for" options={options} value={target} onChange={setTarget} />
      </Part>

      <Part label="How much">
        <label className={`${CARD} flex items-baseline gap-1.5 px-5 py-3`}>
          <span className="font-display text-[32px] font-light text-stone">£</span>
          <input
            name="amount"
            required
            inputMode="decimal"
            autoComplete="off"
            aria-label="Budget"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(withCommas(e.target.value))}
            className="w-full min-w-0 bg-transparent font-display !text-[44px] font-light leading-tight tracking-[-0.02em] text-ink placeholder:text-stone/40 focus:outline-none"
          />
        </label>
        {now != null && (
          <p className="mt-2 text-xs text-stone">
            It&apos;s {formatMoney(now)} now — this replaces it.
          </p>
        )}
      </Part>

      <p className="mt-6">
        <Link href="/money/budget" className="type-meta !text-champagne-600 hover:!text-ink">
          Share out the whole budget ›
        </Link>
      </p>

      <SubmitBar label="Set the budget" />
    </form>
  );
}
