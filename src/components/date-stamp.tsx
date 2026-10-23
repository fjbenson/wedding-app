import { formatDayMonth, formatWeekdayDayMonth } from "@/lib/dates";

/**
 * The date down the left of a row, large — the Hub's This week look (owner,
 * 16 Oct 2026: to-dos, appointments and payments all take it): the day in
 * gold with the month under it; rose when it's overdue, grey once done, ink
 * for today. `under: "weekday"` puts the weekday under instead (This week,
 * where every row is in the same few days). No date: a faint "Set date".
 */
export default function DateStamp({
  date,
  today,
  overdue = false,
  done = false,
  under = "month",
}: {
  date: string | null;
  today: string;
  overdue?: boolean;
  done?: boolean;
  under?: "month" | "weekday";
}) {
  const isToday = date === today && !done;
  const tone = done ? "text-stone" : isToday ? "text-ink" : overdue ? "text-[#9A3F2B]" : "text-champagne-600";
  // No date: a faint "Set date" where the day would be (owner, 23 Oct 2026: the
  // dash and "No date" read like a typo). The row opens its card to set one.
  // Something done or paid with no date (a deposit) needs none: just a quiet dash.
  if (!date && done) {
    return (
      <span aria-hidden className="flex w-12 shrink-0 font-display text-[30px] font-light leading-none text-stone/40">
        –
      </span>
    );
  }
  if (!date) {
    return (
      <span className="flex w-12 shrink-0 flex-col items-start text-[12px] font-semibold uppercase leading-[1.5] tracking-[0.12em] text-stone/55">
        <span>Set</span>
        <span>date</span>
      </span>
    );
  }
  return (
    <span className="flex w-12 shrink-0 flex-col items-start">
      <span className={`font-display text-[30px] font-light leading-none tabular-nums ${tone}`}>
        {/* Always two digits, 08 not 8 (owner, 16 Oct 2026), so the column lines up. */}
        {date.slice(8, 10)}
      </span>
      <span className={`mt-1 text-[12px] font-semibold uppercase tracking-[0.12em] ${isToday ? "text-ink" : "text-stone"}`}>
        {isToday
            ? "Today"
            : under === "weekday" && !overdue
              ? formatWeekdayDayMonth(date).split(" ")[0]
              : formatDayMonth(date).split(" ")[1]}
      </span>
    </span>
  );
}
