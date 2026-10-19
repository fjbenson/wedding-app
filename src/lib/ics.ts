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
