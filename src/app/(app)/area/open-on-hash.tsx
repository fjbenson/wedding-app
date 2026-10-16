"use client";

import { useEffect } from "react";

/**
 * Opens the folded part of the area page a link points at (`#payments`,
 * `#notes`…), since a closed <details> would otherwise hide what the link
 * meant to show. Renders nothing.
 */
export default function OpenOnHash() {
  useEffect(() => {
    const open = () => {
      const id = window.location.hash.slice(1);
      const el = id ? document.getElementById(id) : null;
      const details = el?.closest("details") ?? (el instanceof HTMLDetailsElement ? el : null);
      if (details && !details.open) {
        details.open = true;
        el?.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
