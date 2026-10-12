import type { SupplierStatus } from "@/types/db";

/**
 * Where a supplier is up to. The journey is three steps, in order (owner,
 * 12 Oct 2026): **In touch → Quote in → Booked** — booked last. "Not taken"
 * (we didn't go with them) isn't a step, so it isn't in the row of stages;
 * the supplier card has a quiet "We didn't go with them" instead, and they
 * stay on the list greyed out with their quote. "Looking" was folded into
 * the first step by 0012_area_stages.sql; an old row that says it reads as
 * "In touch".
 */
export const SUPPLIER_STAGES: { status: SupplierStatus; label: string }[] = [
  { status: "enquired", label: "In touch" },
  { status: "quoted", label: "Quote in" },
  { status: "booked", label: "Booked" },
];

/** Every status a supplier can have: the three stages, then not taken. */
export const SUPPLIER_STATUSES: { status: SupplierStatus; label: string }[] = [
  ...SUPPLIER_STAGES,
  { status: "cancelled", label: "Not taken" },
];

export function supplierStatusLabel(status: SupplierStatus): string {
  if (status === "researching") return "In touch";
  return SUPPLIER_STATUSES.find((s) => s.status === status)?.label ?? status;
}
