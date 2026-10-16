import type { ReactNode } from "react";
import { formatMoney } from "@/lib/money";

const OVER_STRIPES = { background: "repeating-linear-gradient(135deg,#B5523B 0 3px,#E8B4A6 3px 6px)" };

/**
 * Quotes side by side against what's left of the budget (canvas 3 "Money ·
 * Comparing quotes", B, with A's tap-for-the-card; owner, 17 Oct 2026). One
 * bar per quote, cheapest first; a black line marks the room left in the
 * budget (a tick through each bar), and a quote past it runs on in rose stripes with "▲ Over by £…"
 * in words (never colour alone). Each row is wrapped by `row` so the page
 * decides what a tap opens (the supplier's card).
 */
export default function QuoteCompare({
  quotes,
  room,
  row,
}: {
  quotes: { id: string; name: string; quote: number }[];
  /** What's left of the area's budget for this: budget minus agreed. Null without a budget. */
  room: number | null;
  row: (id: string, className: string, children: ReactNode) => ReactNode;
}) {
  const sorted = [...quotes].sort((a, b) => a.quote - b.quote);
  const top = Math.max(...sorted.map((q) => q.quote), room ?? 0);
  // The budget line sits a little in from the end, so an over-budget bar has room to show.
  const scale = top / (room !== null && sorted.some((q) => q.quote > room) ? 1 : 0.88);
  const pct = (n: number) => `${Math.max(0, Math.min((n / scale) * 100, 100))}%`;
  const line = room !== null && room > 0 ? pct(room) : null;

  return (
    <div className="glass-card mt-3 rounded-[22px] px-4 pb-1.5 pt-3.5">
      <p className="flex items-baseline justify-between gap-3">
        <span className="type-meta !text-champagne-600">Quotes against the budget</span>
        <span className="text-xs text-stone">{sorted.length}</span>
      </p>
      {line && (
        <p className="relative mt-3 h-4" aria-hidden>
          <span className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-ink" style={{ left: line }}>
            {room !== null && `Left ${formatMoney(room)}`}
          </span>
        </p>
      )}
      <ul className="relative">
        {sorted.map((q, i) => {
          const over = room !== null && q.quote > room;
          const cheapest = i === 0 && sorted.length > 1;
          const note =
            room === null ? (cheapest ? "Cheapest" : null)
            : over ? `▲ Over by ${formatMoney(q.quote - room)}`
            : `${formatMoney(room - q.quote)} under${cheapest ? " · cheapest" : ""}`;
          return (
            <li key={q.id} className="border-b border-linen last:border-b-0">
              {row(
                q.id,
                "block w-full py-3 text-left",
                <>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[15px] text-ink">{q.name}</span>
                    <span className="type-figure shrink-0 text-xl !font-light">{formatMoney(q.quote)}</span>
                  </span>
                  <span className="relative mt-2 block h-2.5 rounded-full bg-stone/[0.12]">
                    <span
                      className={`absolute inset-y-0 left-0 bg-champagne-400/60 ${over ? "rounded-l-full" : "rounded-full"}`}
                      style={{ width: over ? (line ?? "0%") : pct(q.quote) }}
                    />
                    {/* The budget line, through each bar only — not over the names and prices. */}
                    {line && <span aria-hidden className="absolute -inset-y-1.5 z-10 w-[1.5px] bg-ink" style={{ left: line }} />}
                    {over && (
                      <span
                        className={`absolute -inset-y-0.5 ${line ? "rounded-r-full" : "rounded-full"}`}
                        style={{ left: line ?? "0%", width: `calc(${pct(q.quote)} - ${line ?? "0%"})`, ...OVER_STRIPES }}
                      />
                    )}
                  </span>
                  {note && (
                    <span className={`mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] ${over ? "text-[#9A3F2B]" : "text-champagne-600"}`}>
                      {note}
                    </span>
                  )}
                </>,
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
