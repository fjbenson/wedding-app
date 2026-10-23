"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { replaceQuery } from "@/lib/url-state";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { usePullToClose } from "@/components/use-pull-to-close";
import { Fold } from "./fold";

export type Dot = "todo" | "appointment";

/** One thing written in its day on the laptop's big month: "2pm Meeting with Sarah". */
export type Chip = { kind: Dot; title: string; time: string | null; overdue: boolean };

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
 * One thing in a day of the big month: a to-do on white with its circle, an
 * appointment on champagne with its time, an overdue to-do in rose with a "!"
 * (never colour alone).
 */
function ChipLine({ chip }: { chip: Chip }) {
  const tone = chip.overdue
    ? "bg-[#FBEDEA] text-[#9A3F2B] shadow-[inset_0_0_0_0.5px_#E8C2B9]"
    : chip.kind === "appointment"
      ? "bg-champagne-100 text-[#5E4518]"
      : "bg-white text-ink shadow-[inset_0_0_0_0.5px_#E6E0D6]";
  return (
    <span className={`flex min-w-0 items-center gap-1.5 rounded-[7px] px-1.5 py-[3px] text-xs leading-[1.35] ${tone}`}>
      {chip.kind === "appointment" ? (
        <Calendar className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
      ) : (
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full border-[1.2px] border-current" />
      )}
      <span className="truncate">
        {chip.overdue && "! "}
        {chip.time && `${chip.time} `}
        {chip.title}
      </span>
    </span>
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
  chips,
  doneLists,
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
  chips: Record<string, Chip[]>;
  /** Each month's done things, for the big month's Done pill. */
  doneLists: Record<string, { count: number; panel: ReactNode }>;
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
    askedDay === "undated" || askedDay === "done" || (askedDay && /^\d{4}-\d{2}-\d{2}$/.test(askedDay) && askedDay.startsWith(month)) ? askedDay : null,
  );
  useEffect(() => {
    replaceQuery({ month: month === today.slice(0, 7) ? null : month, day: selected });
  }, [month, selected, today]);
  const close = useCallback(() => setSelected(null), []);


  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const blanks = (first.getUTCDay() + 6) % 7; // weeks start on Monday
  const length = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const lastMonthLength = new Date(Date.UTC(year, monthNumber - 1, 0)).getUTCDate();
  const weeks = Math.ceil((blanks + length) / 7);
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
      {/* Phones (and a laptop with a card open beside, until there's room). */}
      <div className="room-lg:hidden">
      <div>
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
      </div>

      <div>
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
      </div>
      </div>

      {/* Laptops: the big month (canvas 5 "Laptop · Round 21", A, owner's pick
          23 Oct 2026). The month fills the page and each day says what's on
          it; tap a day for its card. No list under it: No date and Done are
          pills by the month's name. */}
      <div className="glass-card hidden rounded-[26px] px-4 pt-4 room-lg:block">
        <div className="flex items-center gap-2 px-1.5 pb-3">
          <h2 className="font-display text-[26px] font-light text-ink" aria-live="polite">
            {name} <span className="italic text-champagne-600">{year}</span>
          </h2>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={month <= firstMonth}
            aria-label="Previous month"
            className="ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-cream disabled:opacity-25"
          >
            <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={month >= lastMonth}
            aria-label="Next month"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-cream disabled:opacity-25"
          >
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          {month !== today.slice(0, 7) && (
            <button
              type="button"
              onClick={() => {
                setMonth(today.slice(0, 7));
                setSelected(null);
              }}
              className="ml-1 h-9 rounded-full border-[0.5px] border-linen bg-white/70 px-4 text-[13px] text-ink hover:bg-white"
            >
              Today
            </button>
          )}
          <span className="flex-1" />
          {undatedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelected("undated")}
              className="flex h-9 items-center gap-2 rounded-full border-[0.5px] border-linen bg-white/70 px-4 text-[13px] text-ink hover:bg-white"
            >
              No date <span className="font-medium text-champagne-600">{undatedCount}</span>
            </button>
          )}
          {doneLists[month] && (
            <button
              type="button"
              onClick={() => setSelected("done")}
              className="flex h-9 items-center gap-2 rounded-full border-[0.5px] border-linen bg-white/70 px-4 text-[13px] text-ink hover:bg-white"
            >
              Done <span className="font-medium text-champagne-600">{doneLists[month].count}</span>
            </button>
          )}
          <span className="ml-2">{toggle}</span>
        </div>

        <div className="grid grid-cols-7" aria-hidden>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d} className="px-2.5 pb-2 text-xs uppercase tracking-[0.2em] text-stone">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: weeks * 7 }, (_, i) => {
            const n = i - blanks + 1;
            const edge = i % 7 === 0 ? "" : "border-l-[0.5px]";
            // Days from the months either side, faded and not tappable.
            if (n < 1 || n > length) {
              return (
                <span key={`o${i}`} aria-hidden className={`h-[112px] border-t-[0.5px] border-linen px-2 pt-2 ${edge}`}>
                  <span className="flex h-7 items-center font-display text-[15px] text-stone/35">
                    {n < 1 ? lastMonthLength + n : n - length}
                  </span>
                </span>
              );
            }
            const date = `${month}-${pad(n)}`;
            const things = chips[date] ?? [];
            const isWedding = date === weddingDate;
            const isToday = date === today;
            // Three fit; past that, two and "+N more".
            const shown = things.length > 3 ? things.slice(0, 2) : things;
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(date)}
                aria-pressed={date === selected}
                aria-label={`${longDate(date)}${isWedding ? ", the wedding" : ""}${
                  things.length ? `, ${things.length} ${things.length === 1 ? "item" : "items"}` : ""
                }`}
                className={`flex h-[112px] min-w-0 flex-col gap-1 border-t-[0.5px] border-linen px-2 pb-1.5 pt-2 text-left transition hover:bg-white/70 ${edge} ${
                  date === selected ? "bg-white" : isToday ? "bg-champagne-100/40" : ""
                }`}
              >
                <span
                  className={`flex h-7 min-w-[28px] items-center justify-center self-start rounded-full px-1 font-display text-[15px] ${
                    isToday
                      ? "bg-champagne-600 text-white"
                      : isWedding
                        ? "font-semibold text-ink shadow-[inset_0_0_0_2px_#B8914F]"
                        : date < today
                          ? "text-stone/55"
                          : "text-ink"
                  }`}
                >
                  {n}
                </span>
                {isWedding && (
                  <span className="truncate rounded-[7px] px-1.5 py-[3px] text-xs font-medium text-champagne-600 shadow-[inset_0_0_0_1px_#B8914F]">
                    The wedding
                  </span>
                )}
                {shown.map((c, j) => (
                  <ChipLine key={j} chip={c} />
                ))}
                {things.length > 3 && <span className="px-1.5 text-xs text-stone">+{things.length - 2} more</span>}
              </button>
            );
          })}
        </div>
      </div>

      {selected === "undated" && (
        <DayCard date={null} title="No date yet" isToday={false} onClose={close}>
          {undatedPanel || <p className="py-4 text-[15px] text-stone">Every to-do has a date.</p>}
        </DayCard>
      )}

      {selected === "done" && (
        <DayCard date={null} title={`Done in ${name}`} label={`${name} ${year}`} heading="Done" canAdd={false} isToday={false} onClose={close}>
          {doneLists[month]?.panel ?? <p className="py-4 text-[15px] text-stone">Nothing done this month yet.</p>}
        </DayCard>
      )}

      {selected && selected !== "undated" && selected !== "done" && (
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
  label = "To-dos",
  heading = "Undated",
  canAdd = true,
}: {
  date: string | null;
  title: string;
  isToday: boolean;
  onClose: () => void;
  children: ReactNode;
  /** With no date: the small line and the big word at the top ("To-dos" over "Undated"). */
  label?: string;
  heading?: string;
  /** False for a month's Done card: nothing to add there. */
  canAdd?: boolean;
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
                  label
                )}
              </p>
              <h2 className="mt-1 font-display text-[32px] font-light leading-[1.05] tracking-[-0.02em] text-ink">
                {date ? (
                  <>
                    {day} <span className="italic">{month.join(" ")}</span>
                  </>
                ) : (
                  <span className="italic">{heading}</span>
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

          {canAdd && <p className="section-label mt-6">{date ? "Add on this day" : "Add"}</p>}
          {canAdd && <div className="mt-2.5 flex gap-2.5">
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
          </div>}
        </div>
      </div>
    </div>
  );
}
