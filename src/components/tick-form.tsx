"use client";

import type { ReactNode } from "react";
import { announceUndo } from "./undo-toast";

/**
 * A tick button as a form, so it works the moment the page appears. When it
 * ticks something off (rather than un-ticking), it raises the Undo note,
 * whose Undo runs `undo` — the same change the other way round.
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
    <form action={action} onSubmit={() => ticking && announceUndo({ label, undo })}>
      <button type="submit" aria-label={ariaLabel} className={className}>
        {children}
      </button>
    </form>
  );
}
