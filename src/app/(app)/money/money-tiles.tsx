import Link from "next/link";
import { CalendarClock, Check, ChevronRight, PiggyBank, Wallet } from "lucide-react";
import type { Money } from "@/lib/budget";
import { formatMoney } from "@/lib/money";

/**
 * Money's four tiles, on a laptop (canvas 5 "Laptop · Round 27", E, owner's
 * pick 24 Oct 2026): Budget · Booked · Paid · Still to pay, like Plan's tiles
 * so every tab starts the same way. The budget tile opens the budget page.
 */
export default function MoneyTiles({
  total,
  unshared,
  towards,
  next,
}: {
  total: Money;
  /** The budget not shared out among the areas, or null when there's nothing to say. */
  unshared: number | null;
  /** Money towards it from family. */
  towards: number;
  /** The next month with something due, e.g. { amount: 2150, month: "November" }. */
  next: { amount: number; month: string } | null;
}) {
  const toGo = Math.max(total.committed - total.paid, 0);
  const pct = (x: number, of: number) => `${Math.round((x / of) * 100)}%`;
  const label = "type-meta flex items-center gap-2";
  const badge = "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600";
  const figure = "type-figure mt-3 block text-[34px] leading-none !font-light";
  const line = "mt-2 block truncate text-[13px] text-stone";
  const plain = "rounded-[18px] border-[0.5px] border-linen bg-white/70 px-[18px] py-3.5 shadow-[0_10px_24px_-18px_rgb(60_50_40/0.4)]";
  return (
    <section aria-label="Where the money stands" className="mt-6 hidden grid-cols-4 gap-3 room-md:grid">
      <Link href="/money/budget" className="row-press rounded-[18px] border-[0.5px] border-[#E3D3B3] bg-[#F1E7D4] px-[18px] py-3.5 hover:bg-[#EDE0C8]">
        <span className={label}>
          <span className={`${badge} bg-white/70`}><PiggyBank className="h-3 w-3" strokeWidth={2.2} aria-hidden /></span>
          Budget
        </span>
        <span className={`${figure} ${total.budget === null ? "!text-stone text-[26px]" : ""}`}>
          {total.budget === null ? "Not set yet" : formatMoney(total.budget)}
        </span>
        <span className={`${line} flex items-center gap-0.5`}>
          {total.budget === null ? "Set a budget" : unshared ? `${formatMoney(unshared)} not shared out · Change` : "Change"}
          <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
        </span>
      </Link>
      <div className={plain}>
        <span className={label}>
          <span className={badge}><Check className="h-3 w-3" strokeWidth={2.4} aria-hidden /></span>
          Booked
        </span>
        <span className={figure}>{formatMoney(total.committed)}</span>
        <span className={`${line} ${total.budget !== null && total.committed > total.budget ? "!text-[#9A3F2B]" : ""}`}>
          {total.budget === null || total.budget <= 0
            ? "Nothing to compare yet"
            : total.committed > total.budget
              ? `▲ Over by ${formatMoney(total.committed - total.budget)}`
              : `${pct(total.committed, total.budget)} of the budget`}
        </span>
      </div>
      <div className={plain}>
        <span className={label}>
          <span className={badge}><Wallet className="h-3 w-3" strokeWidth={2.2} aria-hidden /></span>
          Paid
        </span>
        <span className={`${figure} !text-champagne-600`}>{formatMoney(total.paid)}</span>
        <span className={line}>
          {towards > 0 ? `${formatMoney(towards)} towards it from family` : total.committed > 0 ? `${pct(total.paid, total.committed)} of what's booked` : "Nothing yet"}
        </span>
      </div>
      <div className={plain}>
        <span className={label}>
          <span className={badge}><CalendarClock className="h-3 w-3" strokeWidth={2.2} aria-hidden /></span>
          Still to pay
        </span>
        <span className={figure}>{formatMoney(toGo)}</span>
        <span className={line}>{next ? `${formatMoney(next.amount)} due in ${next.month}` : toGo > 0 ? "No dates yet" : "All paid"}</span>
      </div>
    </section>
  );
}
