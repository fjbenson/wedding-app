"use client";

import { X } from "lucide-react";

/**
 * The small x at the end of a search box, once something is typed (owner,
 * 23 Oct 2026). Sits inside the box's `<label>`, after the input. It keeps the
 * keyboard up (mousedown is swallowed) so you can type a new search straight
 * away. The browser's own clear button is hidden in globals.css so there's
 * only ever one.
 */
export default function SearchClear({ query, onClear, label = "Clear the search" }: { query: string; onClear: () => void; label?: string }) {
  if (!query) return null;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      aria-label={label}
      className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center text-stone hover:text-ink"
    >
      <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
    </button>
  );
}
