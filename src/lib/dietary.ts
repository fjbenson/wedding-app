/**
 * Dietary needs: a standard list to pick from, found by typing ("veggie"
 * finds Vegetarian), plus a couple's own for anything else (owner, 14 Oct
 * 2026). Like roles, they live in the one `rsvps.dietary_notes` column joined
 * with " · ", so no new column was needed and the caterer's list still reads
 * naturally. Anything typed before the list existed stays as one of their own.
 *
 * This is health data (special category): it's for catering only.
 */
export const DIETARY_NEEDS: { name: string; words: string[] }[] = [
  { name: "Vegetarian", words: ["veggie", "veg", "no meat", "meat free"] },
  { name: "Vegan", words: ["plant based", "plant-based", "no animal"] },
  { name: "Pescatarian", words: ["pescetarian", "fish only", "no meat but fish"] },
  { name: "Gluten-free", words: ["gluten", "coeliac", "celiac", "wheat", "gf"] },
  { name: "Dairy-free", words: ["dairy", "lactose", "milk", "no cheese", "df"] },
  { name: "Nut allergy", words: ["nuts", "nut", "peanut", "tree nut", "almond"] },
  { name: "Shellfish allergy", words: ["shellfish", "prawn", "crab", "lobster", "seafood"] },
  { name: "Egg allergy", words: ["egg", "eggs"] },
  { name: "Halal", words: ["muslim"] },
  { name: "Kosher", words: ["jewish"] },
];

const SEPARATOR = " · ";

/** One guest's needs, from the column. */
export function needsOf(notes: string | null | undefined): string[] {
  return (notes ?? "")
    .split("·")
    .map((need) => need.trim())
    .filter(Boolean);
}

/** The column's value for a list of needs: tidied, no repeats, null for none. */
export function joinNeeds(needs: string[]): string | null {
  const tidy = needs.map((n) => n.replace(/·/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  const unique = tidy.filter((n, i) => tidy.findIndex((m) => m.toLowerCase() === n.toLowerCase()) === i);
  return unique.length > 0 ? unique.join(SEPARATOR) : null;
}

/** Every need the wedding's guests already have that isn't on the standard list — offered to others too. */
export function ownNeeds(allNotes: (string | null | undefined)[]): string[] {
  const standard = new Set(DIETARY_NEEDS.map((n) => n.name.toLowerCase()));
  const seen = new Map<string, string>();
  for (const notes of allNotes) {
    for (const need of needsOf(notes)) {
      const key = need.toLowerCase();
      if (!standard.has(key) && !seen.has(key)) seen.set(key, need);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/**
 * What to offer for what's typed: standard ones whose name or search words
 * start with it, then the wedding's own. Nothing typed offers everything.
 */
export function suggestNeeds(typed: string, own: string[], taken: string[]): string[] {
  const q = fold(typed);
  const isTaken = (n: string) => taken.some((t) => t.toLowerCase() === n.toLowerCase());
  const hits = (text: string) => fold(text).split(" ").some((_, i, words) => words.slice(i).join(" ").startsWith(q));
  const standard = DIETARY_NEEDS.filter((n) => !q || hits(n.name) || n.words.some(hits)).map((n) => n.name);
  const theirs = own.filter((n) => !q || hits(n));
  return [...standard, ...theirs].filter((n) => !isTaken(n));
}

/** Where a need sits in the usual order (vegetarian first), then a couple's own. */
export function needRank(need: string): number {
  const i = DIETARY_NEEDS.findIndex((n) => n.name.toLowerCase() === need.toLowerCase());
  return i === -1 ? DIETARY_NEEDS.length : i;
}
