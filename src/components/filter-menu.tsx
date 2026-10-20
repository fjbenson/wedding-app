"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { usePullToClose } from "@/components/use-pull-to-close";

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
  start,
  end,
  expandable,
}: {
  base: string;
  groups: FilterGroup[];
  /** The View button, on the left with Filter moved to the right (Plan's List, as on the guest list). */
  start?: React.ReactNode;
  /** Buttons for the right of the Filter's row (The Day's Print and +). */
  end?: React.ReactNode;
  /**
   * Like the guest list's Filter (owner, 20 Oct 2026): one row per group, each
   * opening its own values; on a phone a sheet from the bottom with a "Show N
   * …" button. A pick keeps it open so rows can be combined.
   */
  expandable?: { results: number; noun: string };
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

  const [openRow, setOpenRow] = useState<string | null>(null);
  const drag = usePullToClose(() => setOpen(false));
  // On a phone the sheet holds the page still while it's open.
  useEffect(() => {
    if (!expandable || !open || !window.matchMedia("(max-width: 1023px)").matches) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [expandable, open]);

  const on = groups.filter((g) => g.current);
  const go = (param: string | null, value: string | null) => {
    if (!expandable) setOpen(false);
    const parts = groups
      .map((g) => [g.param, param === null ? null : g.param === param ? value : g.current] as const)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`);
    const href = parts.length ? `${base}${base.includes("?") ? "&" : "?"}${parts.join("&")}` : base;
    if (expandable) router.replace(href, { scroll: false });
    else router.push(href);
  };
  /** The rows with their values: one list of things to filter by, each opening in place. */
  const rowsContent = (
    <>
      <div className="flex items-baseline justify-between py-1">
        <span className="section-label">Filter by</span>
        {on.length > 0 && (
          <button type="button" onClick={() => go(null, null)} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
            Clear
          </button>
        )}
      </div>
      {groups.map((g) => {
        const isOpen = openRow === g.param;
        const picked = g.current ? (g.rows.find((r) => r.key === g.current)?.label ?? g.current) : null;
        return (
          <div key={g.param} className="border-t border-linen first:border-t-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenRow(isOpen ? null : g.param)}
              className="flex min-h-12 w-full items-center gap-3 text-left text-[15px] text-ink"
            >
              <span className="flex-1">{g.title ?? g.param}</span>
              {picked && <span className="max-w-[45%] truncate text-[13px] font-medium text-champagne-600">{picked}</span>}
              <ChevronRight className={`h-4 w-4 shrink-0 text-stone transition ${isOpen ? "rotate-90" : ""}`} strokeWidth={1.8} aria-hidden />
            </button>
            {isOpen && (
              <ul className="pb-1 pl-2">
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
            )}
          </div>
        );
      })}
    </>
  );
  const labelOf = (g: FilterGroup) => g.rows.find((r) => r.key === g.current)?.label ?? g.current;

  return (
    <div className="mt-3 px-1 print:hidden">
      <div className="flex items-center justify-between gap-3">
        {start}
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

          {open && expandable && (
            <>
              {/* Laptops: a small menu under the button. */}
              <div className={`absolute ${start ? "right-0" : "left-0"} top-[calc(100%+8px)] z-30 hidden max-h-[70dvh] w-[17rem] overflow-y-auto rounded-[20px] border border-linen bg-white px-4 pb-2 pt-2.5 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)] lg:block`}>
                {rowsContent}
              </div>
              {/* Phones: a sheet from the bottom, as on the guest list. */}
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
                  className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
                />
                <div
                  style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
                  className={`absolute inset-x-0 bottom-0 flex h-[80dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] ${
                    drag.dragging ? "" : "transition-transform duration-200 ease-out"
                  }`}
                >
                  <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center">
                    <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[22px] pb-3">{rowsContent}</div>
                  <div className="shrink-0 border-t border-linen px-[22px] pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                    <button type="button" onClick={() => setOpen(false)} className="h-12 w-full rounded-full bg-ink text-[15px] text-ivory">
                      Show {expandable.results} {expandable.results === 1 ? expandable.noun : `${expandable.noun}s`}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {open && !expandable && (
            <div className={`absolute ${start ? "right-0" : "left-0"} top-[calc(100%+8px)] z-30 max-h-[70dvh] w-[17rem] overflow-y-auto rounded-[20px] border border-linen bg-white px-4 pb-2 pt-2.5 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]`}>
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
