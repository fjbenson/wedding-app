import type { Appointment } from "@/types/db";

/** Escapes text for a calendar file (commas, semicolons, backslashes, new lines). */
function esc(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

const compact = (iso: string) => iso.replace(/-/g, "");

/** The day after an ISO date, for an all-day event's end. */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * An appointment as a calendar file (.ics) the phone opens in its own
 * calendar — Apple, Google, Outlook (feedback item 3, 19 Oct 2026). Nothing
 * is sent anywhere: the couple's phone adds it if they say so. Times are UK
 * time (the app's), an hour long; no time means an all-day event.
 */
export function appointmentIcs(a: Appointment, withWhom?: string | null): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  let when: string[];
  if (a.at_time) {
    const [h, m] = a.at_time.split(":").map(Number);
    const start = `${compact(a.on_date)}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
    const endH = h + 1;
    // Past 11pm, the hour runs to midnight rather than into the next day.
    const end = endH >= 24 ? `${compact(a.on_date)}T235900` : `${compact(a.on_date)}T${String(endH).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
    when = [`DTSTART;TZID=Europe/London:${start}`, `DTEND;TZID=Europe/London:${end}`];
  } else {
    when = [`DTSTART;VALUE=DATE:${compact(a.on_date)}`, `DTEND;VALUE=DATE:${compact(nextDay(a.on_date))}`];
  }
  const notes = [withWhom ? `With ${withWhom}` : null, a.notes].filter(Boolean).join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding app//Appointments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/London",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0100",
    "TZNAME:BST",
    "DTSTART:19700329T010000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0000",
    "TZNAME:GMT",
    "DTSTART:19701025T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:appointment-${a.id}@wedding-app`,
    `DTSTAMP:${stamp}`,
    ...when,
    `SUMMARY:${esc(a.title)}`,
    a.location ? `LOCATION:${esc(a.location)}` : null,
    notes ? `DESCRIPTION:${esc(notes)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);
  return lines.join("\r\n") + "\r\n";
}

/** The same event as a link that opens the couple's own calendar on the web, ready to save. */
function eventParts(a: Appointment, withWhom?: string | null) {
  const notes = [withWhom ? `With ${withWhom}` : null, a.notes].filter(Boolean).join("\n\n");
  if (!a.at_time) return { allDay: true, start: a.on_date, end: nextDay(a.on_date), notes };
  const [h, m] = a.at_time.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const endH = Math.min(h + 1, 23);
  const endM = h + 1 > 23 ? 59 : m;
  return { allDay: false, start: `${a.on_date}T${pad(h)}:${pad(m)}:00`, end: `${a.on_date}T${pad(endH)}:${pad(endM)}:00`, notes };
}

/**
 * Google Calendar's "add an event" page (owner, 19 Oct 2026: "an option for
 * which calendar"). The title, place and notes go to Google only when the
 * couple tap it, into their own account; nothing is saved until they do.
 */
export function googleCalendarUrl(a: Appointment, withWhom?: string | null): string {
  const p = eventParts(a, withWhom);
  const dates = p.allDay ? `${compact(p.start)}/${compact(p.end)}` : `${p.start.replace(/[-:]/g, "")}/${p.end.replace(/[-:]/g, "")}`;
  const q = new URLSearchParams({ action: "TEMPLATE", text: a.title, dates, ctz: "Europe/London" });
  if (a.location) q.set("location", a.location);
  if (p.notes) q.set("details", p.notes);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Outlook on the web: a personal account (outlook.com) or a work or school one (Microsoft 365). */
export function outlookCalendarUrl(a: Appointment, withWhom: string | null | undefined, work: boolean): string {
  const p = eventParts(a, withWhom);
  const q = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: a.title, startdt: p.start, enddt: p.end });
  if (p.allDay) q.set("allday", "true");
  if (a.location) q.set("location", a.location);
  if (p.notes) q.set("body", p.notes);
  return `https://${work ? "outlook.office.com" : "outlook.live.com"}/calendar/0/deeplink/compose?${q.toString()}`;
}
