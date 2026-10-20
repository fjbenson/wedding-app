"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, LayoutList, Plus, Users } from "lucide-react";
import { usePullToClose } from "@/components/use-pull-to-close";
import type { RunSheet } from "@/types/db";

/**
 * Which run sheet you're looking at (canvas 3 "Run sheets · Round 1", owner's
 * idea 20 Oct 2026): "The day" is the main one everyone shares; the others —
 * the bridesmaids', the groomsmen's, the photographer's list — each have their
 * own moments. A button where the page says what it's showing, and a sheet
 * from the bottom listing them, with "+ New run sheet". `counts` is moments
 * per sheet, keyed by id ("" is the main one).
 */
export default function SheetPicker({
  sheets,
  current,
  counts,
  groupNames,
}: {
  sheets: RunSheet[];
  current: string | null;
  counts: Record<string, number>;
  groupNames: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const drag = usePullToClose(close);
  const name = (current && sheets.find((s) => s.id === current)?.name) || "The day";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const row = (key: string, href: string, title: string, line: string, ticked: boolean, group?: boolean) => (
    <li key={key} className="border-b border-linen last:border-b-0">
      <Link href={href} onClick={close} className="flex min-h-[64px] items-center gap-3 py-2.5 text-[16px] text-ink">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
          {group ? <Users className="h-[18px] w-[18px]" strokeWidth={1.7} /> : <LayoutList className="h-[18px] w-[18px]" strokeWidth={1.7} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{title}</span>
          <span className="block truncate text-[13px] text-stone">{line}</span>
        </span>
        {ticked && (
          <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ivory">
            <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
        )}
      </Link>
    </li>
  );
  const moments = (n: number) => `${n} ${n === 1 ? "moment" : "moments"}`;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Run sheet: ${name}`}
        onClick={() => setOpen(true)}
        className="type-meta flex h-9 min-w-0 items-center gap-1.5 hover:text-ink"
      >
        <LayoutList className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
        <span className="truncate">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Run sheets">
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
          />
          <div
            style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
            className={`absolute inset-x-0 bottom-0 flex max-h-[80dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] ${
              drag.dragging ? "" : "transition-transform duration-200 ease-out"
            }`}
          >
            <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
              <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
            </div>
            <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:pt-8">
              <h2 className="label mt-2">Run sheets</h2>
              <ul className="mt-2">
                {row("main", "/day", "The day", `${moments(counts[""] ?? 0)} · everyone's`, current === null)}
                {sheets.map((s) =>
                  row(
                    s.id,
                    `/day?sheet=${s.id}`,
                    s.name,
                    `${moments(counts[s.id] ?? 0)} · ${s.group_id && groupNames[s.group_id] ? `for the ${groupNames[s.group_id]} group` : "not for a group"}`,
                    current === s.id,
                    !!s.group_id,
                  ),
                )}
              </ul>
              <Link href="/day/sheets/new" onClick={close} className="mt-1 flex items-center gap-3 py-3.5 text-[15px] text-champagne-600">
                <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400">
                  <Plus className="h-5 w-5" strokeWidth={1.7} />
                </span>
                New run sheet
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
