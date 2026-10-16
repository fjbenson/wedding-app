import CardLink from "@/components/card-link";
import { Calendar, Check } from "lucide-react";
import { formatTime, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import DateStamp from "@/components/date-stamp";
import type { Appointment } from "@/types/db";

/**
 * One appointment, laid out like the Hub's This week and every Plan row
 * (owner, 16 Oct 2026): the date large on the left, the title, then the day
 * and time and where under it, and the little calendar on the right (a tick
 * once its day has gone by — "been"). `supplier` is named after the place
 * unless the place already says it; `area` is left off where the list is
 * already one area.
 */
export function AppointmentRow({
  appointment: a,
  been,
  supplier,
  area,
}: {
  appointment: Appointment;
  been: boolean;
  supplier?: string;
  area?: string | null;
}) {
  const weekday = formatWeekdayDayMonth(a.on_date).split(" ")[0];
  const details = [
    `${weekday}${a.at_time ? ` ${formatTime(a.at_time)}` : ""}`,
    a.location,
    // "at Hazel Gap Barn · with Hazel Gap Barn" says it twice.
    supplier && !a.location?.includes(supplier) && `with ${supplier}`,
    area,
  ].filter(Boolean);
  return (
    <li className={`row-press flex items-center gap-3.5 border-b border-ink/[0.12] last:border-b-0 ${been ? "opacity-60" : ""}`}>
      <CardLink href={`/plan/appointments/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 py-3">
        <DateStamp date={a.on_date} today={todayISO()} done={been} />
        <span className="min-w-0 flex-1">
          <span className={`type-item block ${been ? "!text-stone" : ""}`}>{a.title}</span>
          <span className="type-meta mt-1 block">{details.join(" · ")}</span>
        </span>
      </CardLink>
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600" aria-hidden>
        {been ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> : <Calendar className="h-3.5 w-3.5" strokeWidth={2} />}
      </span>
    </li>
  );
}
