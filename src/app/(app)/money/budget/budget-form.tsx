"use client";

import { useState } from "react";
import { SubmitBar } from "@/components/form-bits";
import { INPUT } from "@/components/form-styles";
import { formatMoney, parseMoney, withCommas } from "@/lib/money";
import { saveBudgetsAction } from "../actions";

/*
 * The whole budget first, then each area's share of it (owner, 12 Oct 2026:
 * "the budget for the areas gets pulled from that big number"). A running
 * line says how much is still to share out, and "Share it out for us" fills
 * the empty areas from what's left, by a typical UK split — a starting point
 * to change, never saved until Save. Agreed and Paid aren't typed here: they
 * add themselves up from suppliers and payments.
 */

/** Rough shares of a UK wedding budget, by starter area. Own areas get a small even share. */
const TYPICAL_SHARE: Record<string, number> = {
  venue: 30,
  food: 25,
  photography: 10,
  attire: 8,
  flowers: 6,
  music: 6,
  "hair-makeup": 3,
  stationery: 3,
  cake: 3,
  transport: 3,
};
const OWN_AREA_SHARE = 3;

type Area = { id: string; key: string; label: string; budget: number | null };

const MONEY = `${INPUT.replace("mt-2 ", "")} pl-8`;
const toText = (n: number | null) => (n != null ? withCommas(String(n)) : "");
const amount = (text: string) => parseMoney(text) ?? 0;

function Pounds({ name, label, value, onChange, big = false }: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  big?: boolean;
}) {
  return (
    <span className="relative block">
      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone ${big ? "text-2xl" : ""}`}>£</span>
      <input
        name={name}
        aria-label={label}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(withCommas(e.target.value))}
        className={big ? `${MONEY} !pl-10 font-display !text-[32px] font-light` : MONEY}
      />
    </span>
  );
}

export default function BudgetForm({ total, areas }: { total: number | null; areas: Area[] }) {
  const [whole, setWhole] = useState(toText(total));
  const [shares, setShares] = useState<Record<string, string>>(() =>
    Object.fromEntries(areas.map((a) => [a.id, toText(a.budget)])),
  );

  const wholeAmount = amount(whole);
  const given = areas.reduce((sum, a) => sum + amount(shares[a.id] ?? ""), 0);
  const left = wholeAmount - given;
  const empty = areas.filter((a) => !amount(shares[a.id] ?? ""));
  const anyFilled = empty.length < areas.length;

  function shareOut() {
    if (left <= 0 || empty.length === 0) return;
    const weights = empty.map((a) => TYPICAL_SHARE[a.key] ?? OWN_AREA_SHARE);
    const sum = weights.reduce((s, w) => s + w, 0);
    // Round each to £50; whatever rounding leaves over goes to the biggest share.
    const parts = weights.map((w) => Math.floor((left * w) / sum / 50) * 50);
    const biggest = weights.indexOf(Math.max(...weights));
    parts[biggest] += Math.round((left - parts.reduce((s, p) => s + p, 0)) * 100) / 100;
    setShares((now) => ({ ...now, ...Object.fromEntries(empty.map((a, i) => [a.id, toText(parts[i])])) }));
  }

  return (
    <form action={saveBudgetsAction} className="space-y-8">
      <section>
        <p className="type-meta">The whole wedding</p>
        <div className="mt-2 lg:max-w-[460px]">
          <Pounds name="total" label="The whole wedding" value={whole} onChange={setWhole} big />
        </div>
      </section>

      {areas.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-2">
            <h2 className="section-label">Shared out by area</h2>
            {wholeAmount > 0 && (
              <span className={`text-xs tabular-nums ${left < 0 ? "font-semibold text-[#9A3F2B]" : "text-stone"}`}>
                {left < 0 ? `▲ ${formatMoney(-left)} more than the total` : left > 0 ? `${formatMoney(left)} left to share` : "✓ All shared out"}
              </span>
            )}
          </div>

          {wholeAmount > 0 && left > 0 && empty.length > 0 && (
            <button
              type="button"
              onClick={shareOut}
              className="mt-4 w-full rounded-xl border border-champagne-400 bg-champagne-100/60 px-4 py-3 text-sm text-ink transition hover:bg-cream"
            >
              {anyFilled ? `Share out the ${formatMoney(left)} left` : "Share it out for us"}
              <span className="mt-0.5 block text-xs text-stone">A typical split to start from — change any of it</span>
            </button>
          )}

          <div className="mt-2 lg:grid lg:grid-cols-2 lg:gap-x-14">
            {areas.map((a) => {
              const share = amount(shares[a.id] ?? "");
              return (
                <label key={a.id} className="flex items-center gap-4 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] text-ink">{a.label}</span>
                    {wholeAmount > 0 && share > 0 && (
                      <span className="block text-xs tabular-nums text-stone">{Math.round((share / wholeAmount) * 100)}% of the total</span>
                    )}
                  </span>
                  <span className="w-36 shrink-0">
                    <Pounds
                      name={`area-${a.id}`}
                      label={`${a.label} budget`}
                      value={shares[a.id] ?? ""}
                      onChange={(v) => setShares((now) => ({ ...now, [a.id]: v }))}
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      <SubmitBar label="Save the budget" whenChanged />
    </form>
  );
}
