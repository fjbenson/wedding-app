"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** The tabs whose cards open beside the list on a laptop, rather than over it. */
const TWO_PANE = ["/people", "/plan", "/money", "/day"];

/**
 * Laptops (owner, 18 Oct 2026: "list on the left, the open card on the
 * right"): on People, Plan, Money and The Day a card opens beside the list
 * instead of over it — no dimming, the list still scrolls and a tap on
 * another row swaps the card. It only marks the page; the layout itself is
 * `body[data-panes="two"]` in globals.css, and the cards carry
 * `data-sheet` / `data-sheet-backdrop` / `data-sheet-panel`. Phones are
 * unchanged.
 */
export default function PaneMode() {
  const pathname = usePathname();
  const two = TWO_PANE.includes(pathname);

  useEffect(() => {
    if (!two) return;
    document.body.dataset.panes = "two";
    return () => {
      delete document.body.dataset.panes;
    };
  }, [two]);

  return null;
}
