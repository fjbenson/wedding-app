"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PenLine, X } from "lucide-react";
import JotForm from "@/components/jot-form";
import { usePullToClose } from "@/components/use-pull-to-close";

/**
 * The Hub's "Jot something down" (canvas 2, "Home · Round 2 · Calm under the
 * ring", option B, owner's pick 13 Oct 2026): a small glass pill under the
 * ring that brings up a sheet with the jot box — a sheet on phones (pull down
 * to close), a right-hand panel on laptops, like the day card. Saving lands
 * back on the Hub with `?captured=1`, which closes it and shows "Saved".
 */
export default function JotSheet() {
  const [open, setOpen] = useState(false);
  const captured = useSearchParams().get("captured");
  useEffect(() => {
    if (captured) setOpen(false);
  }, [captured]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-card mx-auto flex h-11 items-center gap-2.5 rounded-full px-5 text-sm text-ink transition hover:border-champagne-400"
      >
        <PenLine className="h-[18px] w-[18px] text-champagne-600" strokeWidth={1.7} aria-hidden />
        Jot something down
      </button>
      {open && <Sheet onClose={() => setOpen(false)} />}
    </>
  );
}

function Sheet({ onClose }: { onClose: () => void }) {
  // Escape closes it, and the page behind doesn't scroll while it's open.
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="A note for later">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
      />
      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        className={`absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] ${
          drag.dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
      >
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>
        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] lg:pt-8">
          <div onPointerDown={drag.start} className="flex touch-none items-center justify-between gap-3 lg:touch-auto">
            <p className="section-label">A note for later</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-stone hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </button>
          </div>
          <div className="mt-3">
            <JotForm />
          </div>
        </div>
      </div>
    </div>
  );
}
