"use client";

import { Check } from "lucide-react";

/**
 * A row of stage circles joined by a gold line (owner, 21 Oct 2026, canvas 4
 * "Area page · Round 1" C2; the supplier card uses it too, 23 Oct 2026,
 * canvas 5 "Supplier card · Round 20"). A ticked circle is a stage that's
 * done, the ringed number is the one you're at, and the bold name is the one
 * open. Tapping one only opens it to look; it never moves anything. The names
 * are small so five fit on a 320px phone.
 */
export default function StageCircles({
  stages,
  done,
  current,
  open,
  onOpen,
  panelId,
}: {
  stages: { name: string; id: string }[];
  done: boolean[];
  /** The first stage not yet done (the ringed one); -1 for none. */
  current: number;
  open: number;
  onOpen: (index: number) => void;
  /** The id of the panel these tabs control. */
  panelId: string;
}) {
  return (
    <div role="tablist" aria-label="Stages" className="flex">
      {stages.map((s, i) => {
        const isDone = done[i];
        const isHere = i === current;
        const isOpen = i === open;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`stage-tab-${s.id}`}
            aria-selected={isOpen}
            aria-controls={panelId}
            onClick={() => onOpen(i)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span className="flex w-full items-center">
              <span aria-hidden className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : done[i - 1] ? "bg-champagne-600" : "bg-linen"}`} />
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  isDone
                    ? "bg-champagne-600 text-white"
                    : isHere
                      ? "border-2 border-champagne-600 bg-white font-display text-champagne-600"
                      : "border-[1.5px] border-dashed border-champagne-400 bg-ivory"
                } ${isOpen ? "shadow-[0_0_0_3px_rgb(184_145_79/0.22)]" : ""}`}
              >
                {isDone ? <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden /> : isHere ? i + 1 : null}
              </span>
              <span aria-hidden className={`h-0.5 flex-1 ${i === stages.length - 1 ? "bg-transparent" : isDone ? "bg-champagne-600" : "bg-linen"}`} />
            </span>
            {/* Smaller and lighter (owner, 21 Oct 2026); 12px is the floor, so the names lose weight and tracking instead. */}
            <span className={`label whitespace-nowrap !tracking-[0.03em] ${isOpen ? "!font-medium !text-ink/80" : isDone ? "!font-normal !text-champagne-600" : "!font-normal !text-stone"}`}>
              {s.name}
              {isDone && <span className="sr-only"> (done)</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
