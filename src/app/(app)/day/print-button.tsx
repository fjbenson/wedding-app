"use client";

import { Printer } from "lucide-react";

/** The run sheet gets printed and handed round, so it can be. */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-10 items-center justify-center gap-2 rounded-full border border-champagne-400 px-4 text-sm text-ink transition hover:bg-champagne-100 print:hidden"
    >
      <Printer className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      Print
    </button>
  );
}
