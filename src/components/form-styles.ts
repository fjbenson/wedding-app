/**
 * The text-box style shared by every form. Kept out of form-bits.tsx (a
 * "use client" file) so server-rendered pages can use it too — a constant
 * exported from a client file reaches the server as a stand-in, not a string.
 */
export const INPUT =
  "mt-2 w-full rounded-xl border border-linen bg-white px-4 py-3 text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30";
