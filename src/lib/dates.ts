/**
 * Whole days from today until a wedding date.
 *
 * Both dates are pinned to UTC midnight so the answer doesn't wobble with
 * the clock — a wedding date is a day, not a moment.
 */
export function daysUntil(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);

  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return Math.round((target - today) / 86_400_000);
}

/** "Saturday, 12 June 2027" */
export function formatLongDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
