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
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${day} ${MONTHS[month - 1]} ${year}`;
}

/** "12.06.2027" — the date under the couple's names on the home screen. */
export function formatFullDotDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

/*
 * Day and month names are spelled out here rather than left to the browser:
 * a phone and the server word them differently ("Wed, 14 Oct" or "Wed 14
 * Oct", "Sep" or "Sept"), and a card drawn by both then didn't match.
 */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const parts = (date: string) => date.split("-").map(Number);

/** "1 Nov" — dates beside list items. */
export function formatDayMonth(date: string): string {
  const [, month, day] = parts(date);
  return `${day} ${MONTHS[month - 1].slice(0, 3)}`;
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
  const [year, month] = parts(date);
  return `${MONTHS[month - 1]} ${year}`;
}

/** "14:30:00" → "2:30pm", "09:00" → "9am". */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

/** "14:30:00" → "14:30", "09:00" → "9:00" — the run sheet's clock. */
export function formatClock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h}:${String(m || 0).padStart(2, "0")}`;
}

/** Today's date and the time ("2027-06-12", "14:52") in the UK, wherever the server is. */
export function nowInLondon(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** "Sat 3 Oct" */
export function formatWeekdayDayMonth(date: string): string {
  const [year, month, day] = parts(date);
  return `${DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]} ${day} ${MONTHS[month - 1].slice(0, 3)}`;
}

/** "Today", "Yesterday", "3 days ago", then "12 Oct" — when a note was jotted. */
export function formatAgo(timestamp: string, today: string): string {
  const day = timestamp.slice(0, 10);
  const days = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDayMonth(day);
}
