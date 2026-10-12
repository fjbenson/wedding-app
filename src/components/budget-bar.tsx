import type { Money } from "@/lib/budget";

/** Money's bar colours (canvas 2 "Money · Round 4"): agreed light gold, paid dark gold. */
export const AGREED_BAR = "bg-champagne-400/50";
export const PAID_BAR = "bg-champagne-600";
const OVER_STRIPES = { background: "repeating-linear-gradient(135deg,#B5523B 0 3px,#E8B4A6 3px 6px)" };

const pct = (x: number, of: number) => `${Math.min((x / of) * 100, 100)}%`;

/**
 * One bar on the budget's scale: agreed inside, paid inside that, stripes
 * past a tick when over — never colour alone. Money's By area and the area
 * page's Money section both draw it.
 */
export default function BudgetBar({ money, thick = false }: { money: Money; thick?: boolean }) {
  const budget = money.budget ?? 0;
  const scale = Math.max(budget, money.committed, money.paid, 1);
  const over = money.budget !== null && money.committed > budget;
  return (
    <span
      aria-hidden
      className={`relative block rounded-full bg-linen ${thick ? "h-3.5 overflow-hidden" : "h-2"}`}
    >
      <span
        className={`absolute inset-y-0 left-0 ${over ? "rounded-l-full" : "rounded-full"} ${AGREED_BAR}`}
        style={{ width: pct(over ? budget : money.committed, scale) }}
      />
      <span className={`absolute inset-y-0 left-0 rounded-full ${PAID_BAR}`} style={{ width: pct(money.paid, scale) }} />
      {over && (
        <>
          <span
            className="absolute -inset-y-0.5 rounded-r-full"
            style={{ left: pct(budget, scale), width: pct(money.committed - budget, scale), ...OVER_STRIPES }}
          />
          <span className="absolute -inset-y-1 w-[1.5px] bg-ink" style={{ left: pct(budget, scale) }} />
        </>
      )}
    </span>
  );
}
