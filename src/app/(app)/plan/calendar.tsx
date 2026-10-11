"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { replaceQuery } from "@/lib/url-state";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Dot = "todo" | "appointment" | "payment" | "done";

/** "2026-10" → "2026-11" (or back, with -1). */
function shiftMonth(key: string, by: 1 | -1): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

const pad = (n: number) => String(n).padStart(2, "0");


const DOT: Record<Dot, string> = {
  todo: "border-[1.5px] border-stone/60",
  appointment: "bg-champagne-400",
  payment: "border-[1.5px] border-champagne-400 bg-champagne-100",
  done: "bg-linen",
};

/**
 * The plan as a month calendar (canvas "Plan · Calendar · Round 1", option
 * A, 10 Oct 2026) — what Plan opens on. ‹ › move between months; each
 * day shows a dot per thing on it, in the list's marks; tap a day and its
 * rows appear under the grid. Today has a soft circle, the wedding a gold
 * ring. The rows, and each month's "start this month" nudges, are drawn on
 * the server and handed in by date, so ticking off works as in the list.
 */
export default function PlanCalendar({
  today,
  weddingDate,
  firstMonth,
  lastMonth,
  dots,
  dayPanels,
  monthTops,
  toggle,
  weddingPanel,
}: {
  today: string;
  weddingDate: string | null;
  firstMonth: string;
  lastMonth: string;
  dots: Record<string, Dot[]>;
  dayPanels: Record<string, ReactNode>;
  monthTops: Record<string, ReactNode>;
  toggle: ReactNode;
  weddingPanel: ReactNode;
}) {
  // The month in view and the day tapped live in the address (?month=,
  // ?day=; src/lib/url-state.ts), so opening a to-do and going back lands on
  // the same month, and tapping Plan in the menu starts on today.
  const params = useSearchParams();
  const asked = params.get("month");
  const [month, setMonth] = useState(
    asked && /^\d{4}-\d{2}$/.test(asked) && asked >= firstMonth && asked <= lastMonth ? asked : today.slice(0, 7),
  );
  const askedDay = params.get("day");
  const [selected, setSelected] = useState<string | null>(
    askedDay && /^\d{4}-\d{2}-\d{2}$/.test(askedDay) && askedDay.startsWith(month)
      ? askedDay
      : today.startsWith(month)
        ? today
        : null,
  );
  useEffect(() => {
    replaceQuery({ month: month === today.slice(0, 7) ? null : month, day: selected === today ? null : selected });
  }, [month, selected, today]);


  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const blanks = (first.getUTCDay() + 6) % 7; // weeks start on Monday
  const length = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const name = first.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });

  const go = (by: 1 | -1) => {
    const next = shiftMonth(month, by);
    setMonth(next);
    // Keep today picked if it's in view, else the first day with something on.
    const days = Object.keys(dots).filter((d) => d.startsWith(next)).sort();
    setSelected(today.startsWith(next) ? today : (days[0] ?? null));
  };

  const longDate = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={month <= firstMonth}
            aria-label="Previous month"
            className="flex h-11 w-9 items-center justify-center rounded-full text-ink hover:bg-cream disabled:opacity-25"
          >
            <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          <h2 className="min-w-[150px] text-center font-display text-[22px] text-ink" aria-live="polite">
            {name} <span className="font-light italic text-champagne-600">{year}</span>
          </h2>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={month >= lastMonth}
            aria-label="Next month"
            className="flex h-11 w-9 items-center justify-center rounded-full text-ink hover:bg-cream disabled:opacity-25"
          >
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
        </div>
        {toggle}
      </div>

      {monthTops[month]}

      <div className="mt-4 grid grid-cols-7 gap-y-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} aria-hidden className="pb-1 text-center text-xs font-medium tracking-[0.1em] text-stone/80">
            {d}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length }, (_, i) => {
          const date = `${month}-${pad(i + 1)}`;
          const marks = dots[date] ?? [];
          const isSelected = date === selected;
          const isWedding = date === weddingDate;
          const circle = isSelected
            ? "bg-ink text-ivory"
            : isWedding
              ? "text-ink font-semibold shadow-[inset_0_0_0_3px_#B8914F]"
              : date === today
                ? "bg-champagne-100 text-ink"
                : date < today
                  ? "text-stone/60"
                  : "text-ink";
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              aria-pressed={isSelected}
              aria-label={`${longDate(date)}${isWedding ? ", the wedding" : ""}${
                marks.length ? `, ${marks.length} ${marks.length === 1 ? "item" : "items"}` : ""
              }`}
              className="flex h-[52px] flex-col items-center gap-[3px] pt-0.5"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-base ${circle}`}>
                {i + 1}
              </span>
              <span className="flex h-1.5 gap-[3px]" aria-hidden>
                {marks.slice(0, 3).map((m, j) => (
                  <span key={j} className={`h-1.5 w-1.5 rounded-full ${DOT[m]}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-linen pt-4">
        {selected && selected.startsWith(month) ? (
          <>
            <p className="label">
              {selected === today && "Today · "}
              {longDate(selected)}
            </p>
            {selected === weddingDate && weddingPanel}
            {dayPanels[selected] ??
              (selected !== weddingDate && (
                <p className="mt-2.5 text-[15px] text-stone">
                  Nothing on this day.{" "}
                  <Link href="/plan/new" className="text-champagne-600 underline underline-offset-4 hover:text-ink">
                    Add a to-do
                  </Link>
                </p>
              ))}
          </>
        ) : (
          <p className="text-[15px] text-stone">Tap a day to see what&apos;s on.</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-stone" aria-hidden>
        {(
          [
            ["todo", "To-do"],
            ["appointment", "Appointment"],
            ["payment", "Payment"],
            ["done", "Done"],
          ] as const
        ).map(([dot, label]) => (
          <span key={dot} className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${DOT[dot]}`} />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
