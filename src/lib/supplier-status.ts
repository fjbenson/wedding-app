import type { SupplierStatus } from "@/types/db";

/** Where a supplier is up to, in the order it usually goes. */
export const SUPPLIER_STATUSES: { status: SupplierStatus; label: string }[] = [
  { status: "researching", label: "Looking" },
  { status: "enquired", label: "Enquired" },
  { status: "booked", label: "Booked" },
  { status: "cancelled", label: "Cancelled" },
];

export function supplierStatusLabel(status: SupplierStatus): string {
  return SUPPLIER_STATUSES.find((s) => s.status === status)?.label ?? status;
}
