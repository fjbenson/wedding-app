"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, SlidersHorizontal, X } from "lucide-react";

export type FilterGroup = {
  /** The address's own word for it: `area`, `when`. */
  param: string;
  /** A heading in the menu when there's more than one group. */
  title?: string;
  current: string | null;
  rows: { key: string; label: string }[];
};

/**
 * Filter, drawn like the guest list's and Suppliers' (owner, 13 Oct 2026, for
 * harmony): the sliders icon and "FILTER" on the left, a "Show only" menu,
 * and with anything on, the button goes champagne with a count and each
 * choice shows as a pill to take off. One pick per group (an area, a when);
 * picking reloads the screen with the choice in the address, so Money, Plan's
 * List and The Day can still be linked to already narrowed.
 */
export default function FilterMenu({
  base,
  groups,
  end,
}: {
  base: string;
  groups: FilterGroup[];
  /** Buttons for the right of the Filter's row (The Day's Print and +). */
  end?: React.ReactNode;
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

  const on = groups.filter((g) => g.current);
  const go = (param: string | null, value: string | null) => {
    setOpen(false);
    const parts = groups
      .map((g) => [g.param, param === null ? null : g.param === param ? value : g.current] as const)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`);
    router.push(parts.length ? `${base}${base.includes("?") ? "&" : "?"}${parts.join("&")}` : base);
  };
  const labelOf = (g: FilterGroup) => g.rows.find((r) => r.key === g.current)?.label ?? g.current;

  return (
    <div className="mt-3 px-1 print:hidden">
      <div className="flex items-center justify-between gap-3">
        <div ref={box} className="relative inline-block">
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={on.length > 0 ? `Filter, ${on.length} on` : "Filter"}
            onClick={() => setOpen((o) => !o)}
            className={`flex h-9 items-center gap-1.5 rounded-full transition ${
              on.length > 0
                ? "border border-champagne-600 bg-champagne-100 pl-2.5 pr-3 text-[13px] font-medium text-champagne-600"
                : "type-meta hover:text-ink"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            {on.length > 0 ? `Filter · ${on.length}` : "Filter"}
          </button>

          {open && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-30 max-h-[70dvh] w-[17rem] overflow-y-auto rounded-[20px] border border-linen bg-white px-4 pb-2 pt-2.5 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]">
              <div className="flex items-baseline justify-between py-1">
                <span className="section-label">Show only</span>
                {on.length > 0 && (
                  <button type="button" onClick={() => go(null, null)} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                    Clear
                  </button>
                )}
              </div>
              {groups.map((g, gi) => (
                <div key={g.param} className={gi > 0 ? "mt-1 border-t border-champagne-400 pt-1" : ""}>
                  {groups.length > 1 && g.title && <p className="type-meta pb-1 pt-2">{g.title}</p>}
                  <ul>
                    {g.rows.map((r) => {
                      const ticked = r.key === g.current;
                      return (
                        <li key={r.key} className="border-t border-linen first:border-t-0">
                          <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={ticked}
                            onClick={() => go(g.param, ticked ? null : r.key)}
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
              ))}
            </div>
          )}
        </div>
        {end && <div className="flex items-center gap-2">{end}</div>}
      </div>

      {on.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {on.map((g) => (
            <button
              key={g.param}
              type="button"
              onClick={() => go(g.param, null)}
              aria-label={`Take off ${labelOf(g)}`}
              className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 text-[13px] font-medium text-champagne-600"
            >
              {labelOf(g)}
              <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
