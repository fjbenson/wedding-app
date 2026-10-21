import type { Contact } from "@/types/db";

/*
 * Children, properly (canvas 3 "Children · Round 1", C — owner's pick
 * 19 Oct 2026; 0033_children_meals.sql). Every guest has a meal — adult,
 * child's, or none (a baby) — and either drinks alcohol or doesn't, because
 * both decide what the caterer charges. The old Child tick follows the meal
 * (`is_child` is true for anything but an adult meal). Plain values, so server
 * and client screens can both use them.
 */
export type MealKind = "adult" | "child" | "none";

export const MEAL_KINDS: { value: MealKind; label: string; line: string }[] = [
  { value: "adult", label: "Adult", line: "The adult menu" },
  { value: "child", label: "Child's", line: "The children's menu" },
  { value: "none", label: "No meal", line: "A baby, say" },
];

/** How a guest's meal reads in a list or on their card: "Adult meal", "Child's meal", "No meal". */
export const mealWord = (g: Pick<Contact, "is_child" | "meal_kind">): string =>
  ({ adult: "Adult meal", child: "Child's meal", none: "No meal" })[mealKindOf(g)];

export const isMealKind = (v: unknown): v is MealKind => v === "adult" || v === "child" || v === "none";

/** Guests from before 0033 have no meal kind: the old Child tick stands in. */
export const mealKindOf = (g: Pick<Contact, "is_child" | "meal_kind">): MealKind => g.meal_kind ?? (g.is_child ? "child" : "adult");
export const noAlcoholOf = (g: Pick<Contact, "is_child" | "no_alcohol">): boolean => g.no_alcohol ?? g.is_child;

/** What a change of meal does to the other fields: a child or baby is soft drinks only to start with. */
export function mealFields(kind: MealKind): { meal_kind: MealKind; is_child: boolean; no_alcohol: boolean } {
  return { meal_kind: kind, is_child: kind !== "adult", no_alcohol: kind !== "adult" };
}

/** The caterer's prices a head, typed once on the Food & drink area. */
export interface MealPrices {
  adult: number | null;
  child: number | null;
  drinks: number | null;
}

export interface MealCounts {
  adult: number;
  child: number;
  none: number;
  drinking: number;
  soft: number;
}

/** Counts for whoever's coming (or any list of guests). */
export function mealCounts(guests: Pick<Contact, "is_child" | "meal_kind" | "no_alcohol">[]): MealCounts {
  const counts: MealCounts = { adult: 0, child: 0, none: 0, drinking: 0, soft: 0 };
  for (const g of guests) {
    counts[mealKindOf(g)]++;
    // A baby with no meal isn't on a drinks package either way.
    if (mealKindOf(g) === "none") continue;
    if (noAlcoholOf(g)) counts.soft++;
    else counts.drinking++;
  }
  return counts;
}

/** What the food and drink should cost: only the parts with a price. Null if none is set. */
export function mealCost(counts: MealCounts, prices: MealPrices) {
  const lines = [
    prices.adult !== null ? { key: "adult", label: "Adult meals", n: counts.adult, each: prices.adult } : null,
    prices.child !== null ? { key: "child", label: "Children's meals", n: counts.child, each: prices.child } : null,
    prices.drinks !== null ? { key: "drinks", label: "Drinks package", n: counts.drinking, each: prices.drinks } : null,
  ]
    .filter((l): l is { key: string; label: string; n: number; each: number } => l !== null)
    .map((l) => ({ ...l, total: l.n * l.each }));
  return lines.length ? { lines, total: lines.reduce((sum, l) => sum + l.total, 0) } : null;
}

/** An area's price columns as prices (null until set). */
export const pricesOf = (area: { price_adult?: number | null; price_child?: number | null; price_drinks?: number | null }): MealPrices => ({
  adult: area.price_adult ?? null,
  child: area.price_child ?? null,
  drinks: area.price_drinks ?? null,
});
