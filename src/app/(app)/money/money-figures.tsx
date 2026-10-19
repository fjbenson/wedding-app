import BudgetBar from "@/components/budget-bar";
import type { Money } from "@/lib/budget";
import { formatMoney } from "@/lib/money";

/**
 * The top of Money's By area, and the top of an area's money card. It leads
 * with whichever number fits where the couple are (feedback item 9, 19 Oct
 * 2026, from talking to couples): before anything's agreed, the **budget**;
 * once suppliers are booked, **agreed**, then Paid · To go (which add up to
 * agreed) and what's still free of the budget.
 */
export default function MoneyFigures({ money, size = 44 }: { money: Money; size?: number }) {
  const toGo = Math.max(money.committed - money.paid, 0);
  const free = money.budget !== null ? money.budget - money.committed : null;

  // Nothing agreed or paid yet: the budget is the number that matters.
  if (money.committed <= 0 && money.paid <= 0) {
    return (
      <>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          {money.budget !== null ? (
            <>
              <span className="type-figure leading-none !font-light" style={{ fontSize: size }}>
                {formatMoney(money.budget)}
              </span>
              <span className="text-sm text-stone">budget</span>
            </>
          ) : (
            <span className="type-figure leading-none !font-light !text-stone" style={{ fontSize: size * 0.7 }}>
              No budget yet
            </span>
          )}
        </p>
        <p className="mt-3 text-sm text-stone">Nothing agreed yet</p>
      </>
    );
  }

  return (
    <>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
        <span className="type-figure leading-none !font-light" style={{ fontSize: size }}>
          {formatMoney(money.committed)}
        </span>
        <span className="text-sm text-stone">
          {money.budget !== null ? `agreed of ${formatMoney(money.budget)}` : "agreed"}
        </span>
      </p>
      <div className="mt-4">
        <BudgetBar money={money} thick />
      </div>
      <dl className="mt-3.5 grid grid-cols-3 gap-2">
        <div>
          <dt className="text-xs text-champagne-600">Paid</dt>
          <dd className="type-figure text-xl !font-light !text-champagne-600">{formatMoney(money.paid)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone">To go</dt>
          <dd className="type-figure text-xl !font-light">{formatMoney(toGo)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone">{free !== null && free < 0 ? "Over budget" : "Still free"}</dt>
          <dd className={`type-figure text-xl !font-light ${free !== null && free < 0 ? "!text-[#9A3F2B]" : ""}`}>
            {free === null ? "—" : free < 0 ? `▲ ${formatMoney(-free)}` : formatMoney(free)}
          </dd>
        </div>
      </dl>
    </>
  );
}
