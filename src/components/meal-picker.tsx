"use client";

import { Baby, Ban, CupSoda, Utensils, Wine } from "lucide-react";
import { MEAL_KINDS, type MealKind } from "@/lib/meals";

/**
 * A guest's meal (Adult · Child · No meal) and drinks (Alcohol · Soft
 * drinks only) as picture tiles — canvas 3 "Children · Round 1", C, owner's
 * pick 19 Oct 2026. Both decide what the caterer charges. Controlled: the
 * guest card saves on each tap, the add form keeps them in hidden fields.
 */
const MEAL_ICON = { adult: Utensils, child: Baby, none: Ban } as const;

export default function MealPicker({
  kind,
  noAlcohol,
  onKind,
  onNoAlcohol,
}: {
  kind: MealKind;
  noAlcohol: boolean;
  onKind: (kind: MealKind) => void;
  onNoAlcohol: (no: boolean) => void;
}) {
  const tile = (on: boolean) =>
    `flex min-h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-2 text-center text-[13px] leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-400 ${
      on ? "border-champagne-600 bg-champagne-100 text-champagne-600" : "border-linen bg-white/70 text-ink"
    }`;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="section-label">Meal</h3>
        <div role="radiogroup" aria-label="Meal" className="mt-2 flex gap-2">
          {MEAL_KINDS.map((m) => {
            const Icon = MEAL_ICON[m.value];
            return (
              <button key={m.value} type="button" role="radio" aria-checked={kind === m.value} onClick={() => onKind(m.value)} className={tile(kind === m.value)}>
                <Icon aria-hidden className="h-5 w-5" strokeWidth={1.6} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="section-label">Drinks</h3>
        <div role="radiogroup" aria-label="Drinks" className="mt-2 flex gap-2">
          <button type="button" role="radio" aria-checked={!noAlcohol} onClick={() => onNoAlcohol(false)} className={tile(!noAlcohol)}>
            <Wine aria-hidden className="h-5 w-5" strokeWidth={1.6} />
            Alcohol
          </button>
          <button type="button" role="radio" aria-checked={noAlcohol} onClick={() => onNoAlcohol(true)} className={tile(noAlcohol)}>
            <CupSoda aria-hidden className="h-5 w-5" strokeWidth={1.6} />
            Soft drinks only
          </button>
        </div>
      </div>
    </div>
  );
}
