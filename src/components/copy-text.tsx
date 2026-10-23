"use client";

import { useState } from "react";

/**
 * A button that copies some text — the caterer's list, every address for
 * the envelopes. If the phone won't let it copy, the text opens in a box to
 * select by hand instead.
 */
export default function CopyText({ text, label, className = "", buttonClassName = "" }: { text: string; label: string; className?: string; buttonClassName?: string }) {
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
    <div className={className}>
      <button type="button" onClick={copy} className={`label flex min-h-12 items-center hover:text-ink ${buttonClassName}`}>
        {state === "copied" ? "Copied ✓" : label}
      </button>
      {state === "manual" && (
        <textarea
          readOnly
          value={text}
          rows={6}
          aria-label={label}
          onFocus={(e) => e.currentTarget.select()}
          className="mb-3 w-full rounded-xl border border-linen bg-ivory px-3 py-2 text-[13px] leading-relaxed text-ink"
        />
      )}
    </div>
  );
}
