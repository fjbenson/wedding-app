import type { AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import type { Payment } from "@/types/db";

/**
 * How the Money tab and the area pages count money, in one place so they
 * always agree:
 *
 * - Committed: what you've agreed to spend — booked suppliers' quotes, plus
 *   payments that aren't for a supplier (the rings, the licence). A payment
 *   *for* a supplier is part of their quote, so it isn't counted twice.
 * - Paid: suppliers' deposits (recorded on the supplier), plus payments
 *   marked paid.
 *
 * An area's money is its suppliers' plus payments tagged with it; a
 * supplier's payment belongs to the supplier's area unless it says otherwise.
 */
export interface Money {
  budget: number | null;
  committed: number;
  paid: number;
}

const n = (value: number | string | null | undefined) => Number(value ?? 0) || 0;

function paymentArea(payment: Payment, suppliers: Supplier[]): string | null {
  if (payment.area_key) return payment.area_key;
  const supplier = suppliers.find((s) => s.id === payment.contact_id);
  return supplier?.supplier_details?.category ?? null;
}

/** The money for one area, or for everything when `key` is undefined. */
export function moneyFor(
  key: string | null | undefined,
  suppliers: Supplier[],
  payments: Payment[],
  budget: number | null,
): Money {
  const inScope = (area: string | null) => key === undefined || area === key;
  const live = suppliers.filter(
    (s) => s.supplier_details?.status !== "cancelled" && inScope(s.supplier_details?.category ?? null),
  );
  const theirPayments = payments.filter((p) => inScope(paymentArea(p, suppliers)));

  const committed =
    live.filter((s) => s.supplier_details?.status === "booked").reduce((sum, s) => sum + n(s.supplier_details?.quoted_cost), 0) +
    theirPayments.filter((p) => !p.contact_id).reduce((sum, p) => sum + n(p.amount), 0);
  const paid =
    live.reduce((sum, s) => sum + n(s.supplier_details?.deposit_paid), 0) +
    theirPayments.filter((p) => p.paid_on).reduce((sum, p) => sum + n(p.amount), 0);

  return { budget: budget === null || budget === undefined ? null : n(budget), committed, paid };
}

/** Every area's money, plus a row for anything not in an area, if there is any. */
export function moneyByArea(
  areas: (AreaOption & { budget?: number | null })[],
  suppliers: Supplier[],
  payments: Payment[],
): (AreaOption & Money)[] {
  const rows = areas.map((a) => ({ ...a, ...moneyFor(a.key, suppliers, payments, a.budget ?? null) }));
  const known = new Set(areas.map((a) => a.key));
  const loose = {
    key: "",
    label: "Not in an area",
    ...moneyFor(null, suppliers, payments, null),
  };
  // Money filed under a switched-off area or "Other" also counts here.
  const elsewhere = [...new Set(suppliers.map((s) => s.supplier_details?.category).concat(payments.map((p) => paymentArea(p, suppliers))))]
    .filter((k): k is string => !!k && !known.has(k))
    .map((k) => moneyFor(k, suppliers, payments, null));
  for (const m of elsewhere) {
    loose.committed += m.committed;
    loose.paid += m.paid;
  }
  return loose.committed > 0 || loose.paid > 0 ? [...rows, loose] : rows;
}

/**
 * Balances nobody has scheduled yet: a booked supplier whose quote is more
 * than their deposit plus the payments already recorded for them.
 */
export function unscheduledBalances(suppliers: Supplier[], payments: Payment[]) {
  return suppliers
    .filter((s) => s.supplier_details?.status === "booked" && n(s.supplier_details?.quoted_cost) > 0)
    .map((s) => {
      const recorded = payments.filter((p) => p.contact_id === s.id).reduce((sum, p) => sum + n(p.amount), 0);
      return { supplier: s, balance: n(s.supplier_details?.quoted_cost) - n(s.supplier_details?.deposit_paid) - recorded };
    })
    .filter((b) => b.balance > 0.005);
}
