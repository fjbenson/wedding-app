"use client";

import { useEffect } from "react";

/**
 * One fold open at a time (owner, 23 Oct 2026): open Details and History
 * closes, so a card never grows into a long scroll. Applies inside anything
 * marked `data-accordion` (every card, the area page's "Everything for…");
 * folds in other places keep opening independently. Mounted once in the app
 * layout, listening for any fold opening — by a tap or by `jumpTo`.
 */
export default function FoldAccordion() {
  useEffect(() => {
    // `toggle` doesn't bubble, so listen in the capture phase.
    const onToggle = (event: Event) => {
      const opened = event.target;
      if (!(opened instanceof HTMLDetailsElement) || !opened.open) return;
      const group = opened.parentElement?.closest("[data-accordion]");
      if (!group) return;
      group.querySelectorAll("details[open]").forEach((other) => {
        if (other === opened || other.contains(opened) || opened.contains(other)) return;
        if (other.parentElement?.closest("[data-accordion]") === group) (other as HTMLDetailsElement).open = false;
      });
    };
    document.addEventListener("toggle", onToggle, true);
    return () => document.removeEventListener("toggle", onToggle, true);
  }, []);
  return null;
}
