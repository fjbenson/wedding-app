"use client";

import { useState } from "react";

/**
 * Pull the sheet down to close it (phones). The card follows the finger;
 * let go past 110px and it closes, otherwise it springs back. A pull that
 * moved doesn't also count as a tap on whatever it started on.
 */
export function usePullToClose(onClose: () => void) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const start = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") return;
    const from = event.clientY;
    let current = 0;
    setDragging(true);

    const move = (e: PointerEvent) => {
      current = Math.max(0, e.clientY - from);
      setOffset(current);
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      setDragging(false);
      if (current > 6) {
        // Swallow the click that follows a pull, so it doesn't press a button.
        const swallow = (e: MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
        };
        window.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 300);
      }
      if (current > 110) onClose();
      else setOffset(0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return { offset, dragging, start };
}
