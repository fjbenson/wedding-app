"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { replaceQuery } from "@/lib/url-state";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { usePullToClose } from "@/components/use-pull-to-close";
import { Fold } from "./fold";

export type Dot = "todo" | "appointment";

/** "2026-10" → "2026-11" (or back, with -1). */
function shiftMonth(key: string, by: 1 | -1): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

const pad = (n: number) => String(n).padStart(2, "0");


/**
 * A day's marks (owner's pick, 12 Oct 2026, canvas 2 "Plan · Calendar · The
 * to-do mark"): a to-do is a solid white circle — the list's tick circle,
 * filled — an appointment the little gold calendar. Done things get no
 * mark (owner, 12 Oct 2026).
 */
function Mark({ kind }: { kind: Dot }) {
  if (kind === "appointment") {
    return <Calendar className="h-3.5 w-3.5 text-champagne-600" strokeWidth={2.2} />;
  }
  return (
<span className="h-3 w-3 rounded-full border-[1.5px] border-ink/35 bg-white shadow-[0_1px_2px_rgb(30_27_24/0.12)]" />
  );
}

/**
 * The plan as a month calendar — what Plan opens on. ‹ › move between
 * months; each day shows a mark per thing on it (up to two, then "+1"). Under
 * the grid, everything in the month in view, one list in date order with the
 * date on each row (canvas 2 "Plan · Calendar · Round 2", option B, owner's
 * pick 11 Oct 2026, without the day headings). Tap a day and a card comes up
 * with that day's things and "Add on this day". Today has a soft circle, the
 * wedding a gold ring. The rows are drawn on the server and handed in, so
 * ticking off works as in the list.
 */
export default function PlanCalendar({
  today,
  weddingDate,
  firstMonth,
  lastMonth,
  dots,
  dayPanels,
  monthLists,
  monthTops,
  undatedCount,
  undatedPanel,
  toggle,
  weddingPanel,
}: {
  today: string;
  weddingDate: string | null;
  firstMonth: string;
  lastMonth: string;
  dots: Record<string, Dot[]>;
  dayPanels: Record<string, ReactNode>;
  /** Everything in each month, for the list under the grid. */
  monthLists: Record<string, ReactNode>;
  monthTops: Record<string, ReactNode>;
  /** To-dos with no date: a fold under the month's list, like Done (old `?day=undated` links still open their card). */
  undatedCount: number;
  undatedPanel: ReactNode;
  toggle: ReactNode;
  weddingPanel: ReactNode;
}) {
  // The month in view and the day tapped live in the address (?month=,
  // ?day=; src/lib/url-state.ts), so opening a to-do from the day's card and
  // going back lands on the same month with the card open again, and tapping
  // Plan in the menu starts on today with no card.
  const params = useSearchParams();
  const asked = params.get("month");
  const [month, setMonth] = useState(
    asked && /^\d{4}-\d{2}$/.test(asked) && asked >= firstMonth && asked <= lastMonth ? asked : today.slice(0, 7),
  );
  const askedDay = params.get("day");
  const [selected, setSelected] = useState<string | null>(
    askedDay === "undated" || (askedDay && /^\d{4}-\d{2}-\d{2}$/.test(askedDay) && askedDay.startsWith(month)) ? askedDay : null,
  );
  useEffect(() => {
    replaceQuery({ month: month === today.slice(0, 7) ? null : month, day: selected });
  }, [month, selected, today]);
  const close = useCallback(() => setSelected(null), []);


  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const blanks = (first.getUTCDay() + 6) % 7; // weeks start on Monday
  const length = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const name = first.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });


  const go = (by: 1 | -1) => {
    const next = shiftMonth(month, by);
    setMonth(next);
    setSelected(null);
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
      {/* The month on a glass card (owner, 16 Oct 2026: the page was "quite
          flat" — everything printed straight on the background). ‹ the
          month › centred; the round + moved out to the key's row (owner,
          16 Oct 2026: inside the card it crowded the month). */}
      <div className="glass-card rounded-[26px] px-2.5 pb-3 pt-2.5">
      <div className="flex items-center justify-center">
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={month <= firstMonth}
            aria-label="Previous month"
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-cream disabled:opacity-25"
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
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-cream disabled:opacity-25"
          >
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1">
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
                ? "bg-champagne-600 text-white font-medium shadow-[0_6px_14px_-6px_rgb(140_100_40/0.7)]"
                : date < today
                  ? "text-stone/50"
                  : marks.length > 0
                    ? "text-ink font-medium"
                    : "text-ink/60";
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              aria-pressed={isSelected}
              aria-label={`${longDate(date)}${isWedding ? ", the wedding" : ""}${
                marks.length ? `, ${marks.length} ${marks.length === 1 ? "item" : "items"}` : ""
              }`}
              className="flex h-[48px] flex-col items-center gap-[3px] pt-0.5"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-base ${circle}`}>
                {i + 1}
              </span>
              <span className="flex h-3 items-center gap-[3px]" aria-hidden>
                {marks.slice(0, 2).map((m, j) => (
                  <Mark key={j} kind={m} />
                ))}
                {marks.length > 2 && (
                  <span className="text-[10px] leading-none tabular-nums text-stone">+{marks.length - 2}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      </div>

      {/* The key on the left, the round black + on the right — the row of
          controls under the card, as on Guests and Plan's List (owner, 16 Oct
          2026). Undated moved to the foot of the list. */}
      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <span className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone" aria-hidden>
          {(
            [
              ["todo", "To-do"],
              ["appointment", "Appointment"],
            ] as const
          ).map(([dot, label]) => (
            <span key={dot} className="flex items-center gap-1.5">
              <Mark kind={dot} />
              {label}
            </span>
          ))}
        </span>
        {toggle}
      </div>

      {/* The month's things, straight under the key: the month is already
          the title above the grid, and every row has its date (owner, 12 Oct
          2026 — no "All of October · 2 things"). */}
      {monthTops[month]}
      {/* Straight on the page, not a second card (owner, 16 Oct 2026: two
          cards the same weight competed): the calendar card is the hero. */}
      {/* Dividers within the page's margins (full width was tried and taken
          back, owner, 16 Oct 2026), one above the first row too. */}
      <div className="mt-5 [&_ul>li:first-child]:border-t [&_ul>li:first-child]:border-ink/[0.12]">
        {monthLists[month] ?? (
          <p className="py-3.5 text-[15px] text-stone">
            Nothing planned yet.{" "}
            <Link href="/plan/new" className="text-champagne-600 underline underline-offset-4 hover:text-ink">
              Add a to-do
            </Link>
          </p>
        )}
      </div>

      {/* To-dos with no date, after the month: a fold like Done's, opening in
          place (owner, 16 Oct 2026: Done expanded but Undated opened a
          pop-up — two behaviours for the same kind of heading). */}
      {undatedCount > 0 && (
        <Fold
          id="calendar-undated"
          className="mt-3 border-t border-ink/[0.12] pt-3"
          header={
            <span className="flex items-baseline justify-between gap-3">
              <span className="section-label">Undated</span>
              <span className="type-meta">{undatedCount === 1 ? "1 item" : `${undatedCount} items`}</span>
            </span>
          }
        >
          {undatedPanel}
        </Fold>
      )}


      {selected === "undated" && (
        <DayCard date={null} title="No date yet" isToday={false} onClose={close}>
          {undatedPanel || <p className="py-4 text-[15px] text-stone">Every to-do has a date.</p>}
        </DayCard>
      )}

      {selected && selected !== "undated" && (
        <DayCard
          date={selected}
          title={longDate(selected)}
          isToday={selected === today}
          onClose={close}
        >
          {selected === weddingDate && weddingPanel}
          {dayPanels[selected] ??
            (selected !== weddingDate && <p className="py-4 text-[15px] text-stone">Nothing on this day yet.</p>)}
        </DayCard>
      )}
    </section>
  );
}

/**
 * One day, over the calendar: a card that slides up on a phone (pull it
 * down, tap outside or ✕ to close), a panel on the right on a laptop — like
 * the guest card. Its things, then "Add on this day": a to-do or an
 * appointment with the date already filled in. With no `date` it's the card
 * for the to-dos that have no day yet ("No date yet", one Add a to-do).
 */
function DayCard({
  date,
  title,
  isToday,
  onClose,
  children,
}: {
  date: string | null;
  title: string;
  isToday: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  // Escape closes it, and the page behind doesn't scroll while it's open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  const drag = usePullToClose(onClose);

  // "Saturday 17 October" → "Saturday" over "17 October".
  const [weekday, ...rest] = title.split(" ");
  const [day, ...month] = rest;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
      />
      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        className={`absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] ${
          drag.dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
      >
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>
        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] lg:pt-8">
          <div onPointerDown={drag.start} className="flex touch-none items-start gap-3 lg:touch-auto">
            <div className="min-w-0 flex-1">
              <p className="label">
                {date ? (
                  <>
                    {isToday && "Today · "}
                    {weekday}
                  </>
                ) : (
                  "To-dos"
                )}
              </p>
              <h2 className="mt-1 font-display text-[32px] font-light leading-[1.05] tracking-[-0.02em] text-ink">
                {date ? (
                  <>
                    {day} <span className="italic">{month.join(" ")}</span>
                  </>
                ) : (
                  <span className="italic">Undated</span>
                )}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          </div>

          <div className="mt-3 border-t border-linen [--row-bleed:22px]">{children}</div>

          <p className="section-label mt-6">{date ? "Add on this day" : "Add"}</p>
          <div className="mt-2.5 flex gap-2.5">
            {(date
              ? [
                  ["A to-do", `/plan/new?date=${date}`],
                  ["An appointment", `/plan/appointments/new?date=${date}`],
                ]
              : [["A to-do", "/plan/new"]]
            ).map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-champagne-400 bg-white text-[15px] text-ink hover:bg-cream"
              >
                <Plus className="h-4 w-4 text-champagne-600" strokeWidth={1.8} aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
