"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, SlidersHorizontal, X } from "lucide-react";
import type { AreaOption } from "@/lib/areas";

/**
 * Money's area filter, drawn like the guest list's and Suppliers' Filter
 * (owner, 13 Oct 2026, for harmony): "FILTER" with its icon on the left, a
 * "Show only" menu, and once one's picked the button goes champagne with a
 * pill to take it off. One area at a time; picking reloads with `area=`
 * added to `base` (or `none` for Other), as the old drop-down did.
 */
export default function MoneyAreaFilter({
  areas,
  current,
  base,
}: {
  areas: AreaOption[];
  current: string | null;
  base: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rows = [...areas.filter((a) => a.key !== "other").map((a) => ({ key: a.key, label: a.label })), { key: "none", label: "Other" }];
  const label = rows.find((r) => r.key === current)?.label ?? current;
  const join = base.includes("?") ? "&" : "?";
  const go = (key: string | null) => {
    setOpen(false);
    router.push(key ? `${base}${join}area=${encodeURIComponent(key)}` : base);
  };

  return (
    <div className="mt-3 px-1">
      <div ref={box} className="relative inline-block">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={current ? "Filter, 1 on" : "Filter"}
          onClick={() => setOpen((o) => !o)}
          className={`flex h-9 items-center gap-1.5 rounded-full transition ${
            current
              ? "border border-champagne-600 bg-champagne-100 pl-2.5 pr-3 text-[13px] font-medium text-champagne-600"
              : "type-meta hover:text-ink"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
          {current ? "Filter · 1" : "Filter"}
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-30 max-h-[70dvh] w-[17rem] overflow-y-auto rounded-[20px] border border-linen bg-white px-4 pb-2 pt-2.5 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]">
            <div className="flex items-baseline justify-between py-1">
              <span className="section-label">Show only</span>
              {current && (
                <button type="button" onClick={() => go(null)} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                  Clear
                </button>
              )}
            </div>
            <ul>
              {rows.map((r) => {
                const ticked = r.key === current;
                return (
                  <li key={r.key} className="border-t border-linen first:border-t-0">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={ticked}
                      onClick={() => go(ticked ? null : r.key)}
                      className="flex min-h-11 w-full items-center gap-3 text-left text-sm text-ink"
                    >
                      <span
                        aria-hidden
                        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
                          ticked ? "bg-ink text-ivory" : "border-[1.5px] border-[#D8D0C4]"
                        }`}
                      >
                        {ticked && <Check className="h-3 w-3" strokeWidth={2.6} />}
                      </span>
                      <span className="flex-1">{r.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {current && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => go(null)}
            aria-label={`Take off ${label}`}
            className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 text-[13px] font-medium text-champagne-600"
          >
            {label}
            <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
