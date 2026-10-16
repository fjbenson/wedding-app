/**
 * One "Full name" box, split for sorting and initials (owner's call, 9 Oct
 * 2026): the last word is the surname, everything before it the first name.
 * "Mary Ann Smith" → Mary Ann · Smith; "Nan" → Nan, no surname.
 */
export function splitName(full: string): { first: string; last: string | null } {
  const words = full.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { first: words[0] ?? "", last: null };
  return { first: words.slice(0, -1).join(" "), last: words[words.length - 1] };
}

/** "AL" for "Amy Latham" — for the little circles of people on a row. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.charAt(0) ?? "") + (words.length > 1 ? words[words.length - 1].charAt(0) : "")).toUpperCase();
}
