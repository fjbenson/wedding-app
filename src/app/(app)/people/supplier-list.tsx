import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { areaName, type AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { formatMoney } from "@/lib/money";
import { supplierStatusLabel } from "@/lib/supplier-status";

function name(s: Supplier) {
  return s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");
}

/**
 * The Suppliers tab of People (screen 12): grouped by what they do, each with
 * where you're up to and what they've quoted. Cancelled ones sink to the end
 * and don't count towards the totals.
 */
export default function SupplierList({ suppliers, areas }: { suppliers: Supplier[]; areas: AreaOption[] }) {
  const live = suppliers.filter((s) => s.supplier_details?.status !== "cancelled");
  const booked = live.filter((s) => s.supplier_details?.status === "booked").length;
  const quoted = live.reduce((sum, s) => sum + (s.supplier_details?.quoted_cost ?? 0), 0);
  const paid = live.reduce((sum, s) => sum + (s.supplier_details?.deposit_paid ?? 0), 0);

  // In the categories' own order, with anything unrecognised after.
  const order = (s: Supplier) => {
    if (s.supplier_details?.status === "cancelled") return 1000;
    const i = areas.findIndex((a) => a.key === s.supplier_details?.category);
    return i === -1 ? 999 : i;
  };
  const sorted = [...suppliers].sort((a, b) => order(a) - order(b));

  return (
    <>
      <h1 className="mt-8 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {suppliers.length === 0 ? "No suppliers yet." : "Suppliers"}
      </h1>
      <p className="mt-2 text-sm text-stone">
        {suppliers.length === 0
          ? "The venue, the photographer, the florist — everyone you're booking, and what they cost."
          : [`${booked} of ${live.length} booked`, quoted > 0 && `${formatMoney(quoted)} quoted`, paid > 0 && `${formatMoney(paid)} paid`]
              .filter(Boolean)
              .join(" · ")}
      </p>

      <Link
        href="/people/suppliers/new"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90 lg:w-fit lg:px-6"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Add a supplier
      </Link>

      {sorted.length > 0 && (
        <ul className="mt-10 border-t border-champagne-400">
          {sorted.map((s) => {
            const d = s.supplier_details;
            const cancelled = d?.status === "cancelled";
            return (
              <li key={s.id} className="border-b border-linen">
                <Link href={`/people/${s.id}`} className="flex items-center gap-3 py-3 hover:bg-cream/60">
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[15px] ${cancelled ? "text-stone line-through" : "text-ink"}`}>
                      {name(s)}
                    </span>
                    <span className="mt-0.5 block text-xs text-stone">
                      {[areaName(d?.category ?? null, areas), d && supplierStatusLabel(d.status)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {d?.quoted_cost != null && (
                    <span className="shrink-0 text-right">
                      <span className="block font-display text-lg text-ink">{formatMoney(d.quoted_cost)}</span>
                      {d.deposit_paid ? (
                        <span className="block text-xs text-stone">{formatMoney(d.deposit_paid)} paid</span>
                      ) : null}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
