"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePullToClose } from "./use-pull-to-close";
import type { Cycle } from "@/lib/card-cycle";

/**
 * A card over the list: a sheet that slides up on a phone (pull it down to
 * close), a panel on the right on a laptop. The guest card and the household
 * card both use it (owner, 16 Oct 2026: a household opens like a guest).
 *
 * `beside`: on a laptop the card sits beside the list rather than over it
 * (canvas 4 "Laptop · Round 9", 1, owner's pick 21 Oct 2026) — no dimming,
 * the page makes room (`useBeside`), and tapping another row swaps the card.
 */
export default function CardSheet({
  label,
  top,
  onClose,
  beside = false,
  cycle,
  children,
}: {
  label: string;
  beside?: boolean;
  /** The list this card came from: `‹ 2 of 9 ›` in the top row, swipe sideways, ← → on a laptop (owner, 23 Oct 2026). Left out, none of it. */
  cycle?: Cycle | null;
  /** What sits left of the ✕ at the top. */
  top?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Escape closes it, and the list behind doesn't scroll while it's open.
  const wide = useBeside(beside);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    if (wide) return () => document.removeEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, wide]);
  const drag = usePullToClose(onClose);
  const swipe = useSwipeToCycle(cycle);

  return (
    <div className={`fixed inset-0 z-50 ${wide ? "left-auto w-[440px]" : ""}`} role="dialog" aria-modal={!wide} aria-label={label}>
      {!wide && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
          className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
        />
      )}

      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        className={`absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none ${
          wide ? "border-l border-champagne-400/45 lg:shadow-[-24px_0_50px_-36px_rgb(60_50_40/0.4)]" : "lg:rounded-l-[28px]"
        } ${drag.dragging ? "" : "transition-transform duration-200 ease-out"}`}
      >
        {/* The grab bar: pull it (or the top row) down to close, as the bar promises. */}
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>

        <div
          {...swipe.bind}
          style={{ transform: swipe.offset ? `translateX(${swipe.offset}px)` : undefined, transition: swipe.dragging ? "none" : "transform 160ms ease-out", touchAction: cycle ? "pan-y" : undefined }}
          data-accordion
          className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] pt-0 lg:pt-8"
        >
          <div onPointerDown={drag.start} className="flex touch-none items-center gap-3 lg:touch-auto">
            <div className="min-w-0 flex-1">{top}</div>
            {cycle && (
              <span className="flex shrink-0 items-center text-stone">
                <button type="button" onClick={cycle.prev} aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-full hover:text-ink">
                  <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />
                </button>
                <span className="text-[12px] uppercase tracking-[0.14em] tabular-nums">
                  {cycle.index + 1} of {cycle.total}
                </span>
                <button type="button" onClick={cycle.next} aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-full hover:text-ink">
                  <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />
                </button>
              </span>
            )}
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

/**
 * True on a laptop while a card that sits beside the list is open: marks the
 * page (`html[data-card-beside]`) so the frame makes room for the 440px card
 * (globals.css), and so the list stays usable around it.
 */
export function useBeside(beside: boolean): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (!beside) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [beside]);
  useEffect(() => {
    if (!wide) return;
    const html = document.documentElement;
    html.dataset.cardBeside = "";
    return () => {
      delete html.dataset.cardBeside;
    };
  }, [wide]);
  return wide;
}

/**
 * Sideways swipe through the list (the card follows the finger, then the next
 * one opens), the arrow keys on a laptop, and a one-time nudge the first time
 * so people find it (owner, 23 Oct 2026: a sheet says "pull down", not "swipe").
 * Starts on an input, a drop-down or a slider are left alone.
 */
function useSwipeToCycle(cycle?: Cycle | null) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const track = useRef<{ x: number; y: number; dir: "h" | "v" | null } | null>(null);
  const swallow = useRef(false);
  const latest = useRef(cycle);
  latest.current = cycle;

  // ← and → (not while typing, nor with a modifier).
  useEffect(() => {
    if (!cycle) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const t = event.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable='true']") || t.isContentEditable)) return;
      if (event.key === "ArrowLeft") latest.current?.prev?.();
      else if (event.key === "ArrowRight") latest.current?.next?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [!!cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  // The nudge: a few pixels sideways and back, once ever.
  useEffect(() => {
    if (!cycle) return;
    let seen = true;
    try {
      seen = window.localStorage.getItem("card-swipe-nudged") === "1";
      if (!seen) window.localStorage.setItem("card-swipe-nudged", "1");
    } catch {
      // No storage: no nudge rather than one every time.
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = window.setTimeout(() => setOffset(-18), 700);
    const b = window.setTimeout(() => setOffset(0), 1000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [!!cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  const bind = {
    onPointerDown: (e: React.PointerEvent) => {
      if (!latest.current || e.pointerType === "mouse") return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [role='slider'], [data-no-swipe]")) return;
      track.current = { x: e.clientX, y: e.clientY, dir: null };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const t = track.current;
      if (!t) return;
      const dx = e.clientX - t.x;
      const dy = e.clientY - t.y;
      if (!t.dir && Math.hypot(dx, dy) > 10) {
        t.dir = Math.abs(dx) > Math.abs(dy) * 1.4 ? "h" : "v";
        if (t.dir === "h") setDragging(true);
      }
      if (t.dir === "h") setOffset(Math.max(-160, Math.min(160, dx)));
      else if (t.dir === "v") track.current = null;
    },
    onPointerUp: () => {
      const t = track.current;
      track.current = null;
      if (!t || t.dir !== "h") return;
      setDragging(false);
      // What follows a swipe isn't a tap on whatever it started on.
      swallow.current = true;
      window.setTimeout(() => (swallow.current = false), 80);
      const go = offset <= -70 ? latest.current?.next : offset >= 70 ? latest.current?.prev : undefined;
      if (!go) return setOffset(0);
      setOffset(offset < 0 ? -220 : 220);
      window.setTimeout(() => {
        go();
        setOffset(0);
      }, 140);
    },
    onPointerCancel: () => {
      track.current = null;
      setDragging(false);
      setOffset(0);
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (swallow.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
  return { bind, offset, dragging };
}
