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

/** "12.06.27" — the countdown's cover line. */
export function formatDotDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year.slice(2)}`;
}

/** "1 Nov" — dates beside list items. */
export function formatDayMonth(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** True if the date falls in the current calendar month. */
export function isThisMonth(date: string): boolean {
  const [year, month] = date.split("-").map(Number);
  const now = new Date();
  return year === now.getUTCFullYear() && month === now.getUTCMonth() + 1;
}

/** Today as "2026-09-29", in UTC to match how dates are stored. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "November 2026" */
export function formatMonthYear(date: string): string {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
