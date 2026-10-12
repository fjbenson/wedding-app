// Plan's List "when" filter choices. Kept out of when-filter.tsx: that's a
// client file, and the server can't use plain values exported from one.
export const WHEN_CHOICES = [
  ["overdue", "Overdue"],
  ["month", "This month"],
  ["soon", "Next 3 months"],
  ["none", "No date"],
] as const;
export type When = (typeof WHEN_CHOICES)[number][0];

export const asWhen = (value: string | undefined): When | null =>
  WHEN_CHOICES.some(([key]) => key === value) ? (value as When) : null;
