import Link from "next/link";
import { Plus } from "lucide-react";
import { areaName, type AreaOption } from "@/lib/areas";
import { formatDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Contribution } from "@/types/db";

/**
 * Who's paying for what (owner, 17 Oct 2026; 0022_contributions.sql): the
 * money coming in towards the wedding, under the budget it helps pay for.
 * Each one opens to change; "+ Add" opens the full-screen form.
 */
export default function Paying({ contributions, areas }: { contributions: Contribution[]; areas: AreaOption[] }) {
  const total = contributions.reduce((t, c) => t + c.amount, 0);
  const arrived = contributions.filter((c) => c.received_on).reduce((t, c) => t + c.amount, 0);

  return (
    <section id="paying" className="mt-12 scroll-mt-6 border-t border-linen pt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-meta">Who&apos;s paying</h2>
        {total > 0 && (
          <span className="text-xs text-stone">
            {formatMoney(total)} · {formatMoney(arrived)} arrived
          </span>
        )}
      </div>
      {contributions.length > 0 && (
        <ul className="mt-2">
          {contributions.map((c) => (
            <li key={c.id} className="row-press border-b border-linen last:border-b-0">
              <Link href={`/money/contributions/${c.id}`} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-ink">{c.name}</span>
                  <span className="block text-xs text-stone">
                    {c.received_on ? `Arrived ${formatDayMonth(c.received_on)}` : "Promised"}
                    {c.area_key ? ` · ${areaName(c.area_key, areas) ?? c.area_key}` : ""}
                  </span>
                </span>
                <span className={`type-figure shrink-0 text-lg !font-light ${c.received_on ? "" : "!text-stone"}`}>{formatMoney(c.amount)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/money/contributions/new" className="mt-2 inline-flex items-center gap-1.5 py-2 text-sm text-champagne-600 hover:text-ink">
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Add money towards it
      </Link>
    </section>
  );
}
