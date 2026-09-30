"use client";

import { Printer } from "lucide-react";

/** The run sheet gets printed and handed round, so it can be. */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center justify-center gap-2 rounded-xl border border-champagne-400 px-4 py-3 text-ink transition hover:bg-champagne-100 sm:px-6 print:hidden"
    >
      <Printer className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      Print
    </button>
  );
}
