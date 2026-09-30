/**
 * "£1,250" — whole pounds when there are no pence, "£1,250.50" when there are.
 * Pounds for now; a wedding-level currency comes with the Money tab.
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Reads "1,250" or "£1250.50" from a form field; blank means no amount. */
export function parseMoney(value: FormDataEntryValue | null): number | null {
  const cleaned = String(value ?? "").replace(/[£,\s]/g, "");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}
