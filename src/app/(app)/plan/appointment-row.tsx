import Link from "next/link";
import { Calendar, Check, ChevronRight } from "lucide-react";
import { formatTime, formatWeekdayDayMonth } from "@/lib/dates";
import type { Appointment } from "@/types/db";

/**
 * One appointment, in the same marks wherever Plan's things are listed: the
 * calendar, the List and an area page's Plan section. A tiny calendar on
 * champagne, or a tick once its day has gone by ("been"). `supplier` is
 * named after the place unless the place already says it; `area` is left
 * off where the list is already one area.
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
  const details = [
    `${formatWeekdayDayMonth(a.on_date)}${a.at_time ? ` · ${formatTime(a.at_time)}` : ""}`,
    a.location,
    // "at Hazel Gap Barn · with Hazel Gap Barn" says it twice.
    supplier && !a.location?.includes(supplier) && `with ${supplier}`,
    area,
  ].filter(Boolean);
  return (
    <li className={`row-press flex items-center gap-3.5 border-b border-ink/[0.12] last:border-b-0 ${been ? "opacity-60" : ""}`}>
      {/* Outlined like a to-do's circle so the two read the same size (owner,
          12 Oct 2026); the plain calendar, as on the Plan calendar. */}
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-champagne-400/70 bg-champagne-100 text-champagne-600" aria-hidden>
        {been ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> : <Calendar className="h-3.5 w-3.5" strokeWidth={2} />}
      </span>
      <Link href={`/plan/appointments/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3">
        <span className="min-w-0 flex-1">
          <span className={`type-item block ${been ? "!text-stone" : ""}`}>{a.title}</span>
          <span className="type-meta mt-1 block">{details.join(" · ")}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
      </Link>
    </li>
  );
}
