"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

/**
 * Kinds of guest to add up (diets, roles, meals…), used for "Copy the list for
 * the caterer". The card at the top of the guest list used to show a tally
 * of these once a filter was on; since 17 Oct 2026 (owner) it's always the
 * same numbers card, and the breakdown is the list's View instead.
 */

export type SplitKind = "diet" | "role" | "meal" | "age" | "when";

export interface TallyLine {
  /** `${kind}:${label}` — what the list narrows to when tapped. */
  id: string;
  label: string;
  count: number;
  /** An allergy: what the kitchen must avoid. */
  rose?: boolean;
  /** "Not picked yet": something still to do, not a kind. */
  faded?: boolean;
}

export interface Split {
  kind: SplitKind;
  /** The word on the switch. */
  word: string;
  sections: { title?: string; rose?: boolean; lines: TallyLine[] }[];
  /** Text for "Copy the list for the caterer". */
  copy?: string;
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("manual");
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="mt-4 flex h-[42px] w-full items-center justify-center gap-2 rounded-full border border-linen bg-white text-sm text-ink hover:border-champagne-400"
      >
        <Copy className="h-4 w-4" strokeWidth={1.7} aria-hidden />
        {state === "copied" ? "Copied ✓" : label}
      </button>
      {state === "manual" && (
        <textarea
          readOnly
          value={text}
          rows={6}
          aria-label={label}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 w-full rounded-xl border border-linen bg-ivory px-3 py-2 text-[13px] leading-relaxed text-ink"
        />
      )}
    </>
  );
}
