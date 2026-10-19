"use client";

import { useState, useTransition } from "react";
import MoneyInput from "@/components/money-input";
import { formatMoney } from "@/lib/money";
import { mealCost, type MealCounts, type MealPrices } from "@/lib/meals";
import { setAreaPricesAction } from "./actions";

/**
 * What the food and drink should cost (canvas 3 "Children · Round 1", C):
 * the caterer's price a head, typed once, times who's coming — adult meals,
 * children's meals and the drinks package for those drinking. Moves by
 * itself when a guest's meal or drinks change. Only the counts and prices
 * are used; no guest's name is involved.
 */
export default function FoodCosts({
  areaId,
  areaKey,
  counts,
  prices,
}: {
  areaId: string;
  areaKey: string;
  counts: MealCounts;
  prices: MealPrices;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const cost = mealCost(counts, prices);

  const save = (formData: FormData) =>
    start(async () => {
      setError(undefined);
      try {
        const r = await setAreaPricesAction(areaId, areaKey, {
          adult: String(formData.get("adult") ?? ""),
          child: String(formData.get("child") ?? ""),
          drinks: String(formData.get("drinks") ?? ""),
        });
        if (r.error) setError(r.error);
        else setEditing(false);
      } catch {
        setError("That didn't work — the app may have just been updated. Pull down to refresh, then try again.");
      }
    });

  const box =
    "mt-1.5 h-11 w-full rounded-[12px] border border-linen bg-white px-3 text-base text-ink focus:border-champagne-400 focus:outline-none";

  if (editing)
    return (
      <form action={save} className="border-t border-linen py-3.5">
        <h3 className="section-label">The caterer&apos;s prices a head</h3>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <label className="block text-[12px] text-stone">
            Adult meal
            <MoneyInput name="adult" defaultValue={prices.adult} placeholder="£" className={box} />
          </label>
          <label className="block text-[12px] text-stone">
            Child&apos;s meal
            <MoneyInput name="child" defaultValue={prices.child} placeholder="£" className={box} />
          </label>
          <label className="block text-[12px] text-stone">
            Drinks
            <MoneyInput name="drinks" defaultValue={prices.drinks} placeholder="£" className={box} />
          </label>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className="h-9 rounded-full border border-linen bg-white px-4 text-[13px] text-ink">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="h-9 rounded-full bg-ink px-4 text-[13px] text-ivory disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    );

  return (
    <div className="border-t border-linen py-3.5">
      <div className="flex items-baseline justify-between">
        <h3 className="section-label">What it comes to</h3>
        <button type="button" onClick={() => setEditing(true)} className="text-[13px] text-champagne-600 underline underline-offset-4 hover:text-ink">
          {cost ? "Change the prices" : "Add the caterer's prices"}
        </button>
      </div>
      {cost ? (
        <ul className="mt-2 grid gap-1.5 text-[14px]">
          {cost.lines.map((l) => (
            <li key={l.key} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate">
                {l.label} <span className="text-stone">· {l.n} × {formatMoney(l.each)}</span>
              </span>
              <span className="type-figure text-base">{formatMoney(l.total)}</span>
            </li>
          ))}
          <li className="mt-1 flex items-baseline justify-between gap-3 border-t border-linen pt-2">
            <span className="font-medium">Worked out</span>
            <span className="type-figure text-[22px]">{formatMoney(cost.total)}</span>
          </li>
        </ul>
      ) : (
        <p className="mt-1.5 text-sm text-stone">Type the price a head once, and it&apos;s worked out from who&apos;s coming.</p>
      )}
    </div>
  );
}

