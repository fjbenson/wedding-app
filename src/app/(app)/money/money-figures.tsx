import BudgetBar from "@/components/budget-bar";
import type { Money } from "@/lib/budget";
import { formatMoney } from "@/lib/money";

/**
 * Agreed of budget large, one thick bar, then Paid · To pay · Still free —
 * the top of Money's By area, and the top of an area's money card.
 */
export default function MoneyFigures({ money, size = 44 }: { money: Money; size?: number }) {
  const toPay = Math.max(money.committed - money.paid, 0);
  const free = money.budget !== null ? money.budget - money.committed : null;
  return (
    <>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
        <span className="type-figure leading-none !font-light" style={{ fontSize: size }}>
          {formatMoney(money.committed)}
        </span>
        <span className="text-sm text-stone">
          {money.budget !== null ? `of ${formatMoney(money.budget)} agreed` : "agreed"}
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
          <dt className="text-xs text-stone">To pay</dt>
          <dd className="type-figure text-xl !font-light">{formatMoney(toPay)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone">{free !== null && free < 0 ? "Over" : "Still free"}</dt>
          <dd className={`type-figure text-xl !font-light ${free !== null && free < 0 ? "!text-[#9A3F2B]" : ""}`}>
            {free === null ? "—" : free < 0 ? `▲ ${formatMoney(-free)}` : formatMoney(free)}
          </dd>
        </div>
      </dl>
    </>
  );
}
