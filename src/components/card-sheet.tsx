"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { usePullToClose } from "./use-pull-to-close";

/**
 * A card over the list: a sheet that slides up on a phone (pull it down to
 * close), a panel on the right on a laptop. The guest card and the household
 * card both use it (owner, 16 Oct 2026: a household opens like a guest).
 */
export default function CardSheet({
  label,
  top,
  onClose,
  children,
}: {
  label: string;
  /** What sits left of the ✕ at the top. */
  top?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Escape closes it, and the list behind doesn't scroll while it's open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  const drag = usePullToClose(onClose);

  return (
    <div data-sheet className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
        data-sheet-backdrop className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
      />

      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        data-sheet-panel className={`absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] ${
          drag.dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
      >
        {/* The grab bar: pull it (or the top row) down to close, as the bar promises. */}
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>

        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] pt-0 lg:pt-8">
          <div onPointerDown={drag.start} className="flex touch-none items-center gap-3 lg:touch-auto">
            <div className="min-w-0 flex-1">{top}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
