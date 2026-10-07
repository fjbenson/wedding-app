import type { SupplierStatus } from "@/types/db";

/**
 * Where a supplier is up to, in the order it usually goes (area page design,
 * round 4). "Looking" was folded into "Asked" by 0012_area_stages.sql, so it
 * isn't offered; an old row that still says it reads as "Asked".
 */
export const SUPPLIER_STATUSES: { status: SupplierStatus; label: string }[] = [
  { status: "enquired", label: "Asked" },
  { status: "quoted", label: "Quote in" },
  { status: "booked", label: "Booked" },
  { status: "cancelled", label: "Not taken" },
];

export function supplierStatusLabel(status: SupplierStatus): string {
  if (status === "researching") return "Asked";
  return SUPPLIER_STATUSES.find((s) => s.status === status)?.label ?? status;
}
