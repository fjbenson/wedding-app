import CardLink from "@/components/card-link";
import RowLine from "@/components/row-line";
import RowPeople from "@/components/row-people";
import { Calendar, Check } from "lucide-react";
import { formatTime, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import DateStamp, { TimeStamp } from "@/components/date-stamp";
import type { Appointment } from "@/types/db";

/**
 * One appointment, laid out like the Hub's This week and every Plan row
 * (owner, 16 Oct 2026): the date large on the left, the title, then the day
 * and time and where under it, and the little calendar on the right (a tick
 * once its day has gone by — "been"). `supplier` is named after the place
 * unless the place already says it; `area` is left off where the list is
 * already one area. `inDay`: in a day's card, where the date is already the
 * card's title, the time takes the date's place and the line just says where
 * (owner, 23 Oct 2026).
 */
export function AppointmentRow({
  appointment: a,
  been,
  supplier,
  area,
  inDay = false,
}: {
  appointment: Appointment;
  been: boolean;
  supplier?: string;
  area?: string | null;
  /** In a day's card: "times" puts the time where the date was; "plain" (no times that day) leaves the column out. */
  inDay?: "times" | "plain" | false;
}) {
  const weekday = formatWeekdayDayMonth(a.on_date).split(" ")[0];
  // Day and time, then who it's with — else where, else the area (RowLine).
  const details = inDay
    ? [supplier ?? a.location ?? area]
    : [`${weekday}${a.at_time ? ` ${formatTime(a.at_time)}` : ""}`, supplier ?? a.location ?? area];
  return (
    <li className={`row-press flex items-center gap-3.5 border-b border-ink/[0.12] last:border-b-0 ${been ? "opacity-60" : ""}`}>
      <CardLink href={`/plan/appointments/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 py-3">
        {inDay === "times" ? <TimeStamp time={a.at_time} done={been} /> : !inDay && <DateStamp date={a.on_date} today={todayISO()} done={been} />}
        <span className="min-w-0 flex-1">
          <span className={`type-item block ${been ? "!text-stone" : ""}`}>{a.title}</span>
          <RowLine status={been ? "Been" : null} details={details} />
        </span>
        <RowPeople kind="appointment" id={a.id} />
      </CardLink>
      {/* Champagne fill with a soft edge (owner, 16 Oct 2026): tells it apart from the white to-do circle. */}
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-champagne-400/45 bg-champagne-100 text-champagne-600" aria-hidden>
        {been ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> : <Calendar className="h-3.5 w-3.5" strokeWidth={2} />}
      </span>
    </li>
  );
}
