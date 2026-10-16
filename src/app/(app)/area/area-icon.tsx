"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import IconPicker from "@/components/icon-picker";
import { usePullToClose } from "@/components/use-pull-to-close";
import { areaIcon } from "@/lib/areas";
import { setAreaIconAction } from "./actions";

/**
 * The area's icon beside its name on its page — its dot on the hub ring. Tap
 * it to change it: a card slides up with the icon search, and a tap saves
 * (canvas 2 "Area · Add in three steps", the fourth screen; 12 Oct 2026).
 */
export default function AreaIcon({ id, areaKey, icon }: { id: string; areaKey: string; icon: string | null }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(icon);
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const Icon = areaIcon(areaKey, current);
  const close = () => setOpen(false);
  const drag = usePullToClose(close);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const pick = (name: string) =>
    start(async () => {
      const before = current;
      setCurrent(name);
      let result: { error?: string };
      try {
        result = await setAreaIconAction(id, areaKey, name);
      } catch {
        result = { error: "That didn't save. Reload the page and try again." };
      }
      if (result.error) {
        setCurrent(before);
        setError(result.error);
      } else {
        setError(undefined);
        setOpen(false);
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change the icon"
        className="glass-card pointer-events-auto relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-champagne-600"
      >
        {/* No pen badge (owner, 16 Oct 2026): it read as "save an idea"; a tap still changes it. */}
        <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Change the icon">
          <button
            type="button"
            aria-label="Close"
            onClick={close}
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
              <div onPointerDown={drag.start} className="flex touch-none items-center gap-3 lg:touch-auto">
                <h2 className="min-w-0 flex-1 font-display text-[26px] font-light leading-tight text-ink">
                  Change the <span className="italic">icon</span>
                </h2>
                <button type="button" onClick={close} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink">
                  <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                </button>
              </div>
              {error && <p role="alert" className="mt-2 text-sm text-champagne-600">{error}</p>}
              <div className={`mt-4 ${pending ? "opacity-60" : ""}`}>
                <IconPicker value={current} onPick={pick} />
              </div>
              <p className="mt-3.5 text-center text-xs text-stone">It saves as soon as you tap one.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
