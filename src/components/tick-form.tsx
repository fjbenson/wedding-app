"use client";

import type { ReactNode } from "react";
import { announceUndo } from "./undo-toast";

/**
 * A tick button as a form, so it works the moment the page appears. When it
 * ticks something off (rather than un-ticking), it raises the Undo note,
 * whose Undo runs `undo` — the same change the other way round — and its
 * row slides away.
 */
export default function TickForm({
  action,
  undo,
  ticking,
  label,
  className,
  ariaLabel,
  children,
}: {
  action: () => Promise<void>;
  undo: () => Promise<unknown>;
  /** True when this tap marks it done or paid; false when it reopens it. */
  ticking: boolean;
  /** What the Undo note says, e.g. "Ticked off" or "Marked paid". */
  label: string;
  className: string;
  ariaLabel: string;
  children?: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!ticking) return;
        announceUndo({ label, undo });
        // The row slides away as it's ticked (owner, 12 Oct 2026), then turns
        // up again under Done once the page catches up. The class comes off
        // after a moment, so a row that stays in the same list reappears.
        const row = event.currentTarget.closest("li");
        if (row && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          row.classList.add("tick-away");
          window.setTimeout(() => row.classList.remove("tick-away"), 1400);
        }
      }}
    >
      <button type="submit" aria-label={ariaLabel} className={className}>
        {children}
      </button>
    </form>
  );
}
