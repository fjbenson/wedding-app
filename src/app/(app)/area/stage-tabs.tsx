"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/**
 * The five stages as a row of circles joined by a gold line, the open one's
 * contents underneath (owner, 21 Oct 2026, canvas 4 "Area page · Round 1",
 * C2: it replaced the stages stacked down the page, and matches the supplier
 * card's Progress). A ticked circle is a stage that's done, the ringed number
 * is the one you're at, and the bold name is the one open. The count heads
 * the open stage, not the row, so five names fit on a 320px phone.
 */
export default function StageTabs({
  stages,
  done,
  current,
  initial,
}: {
  stages: { name: string; id: string; line: string; content: React.ReactNode }[];
  done: boolean[];
  /** The first stage not yet done (the ringed one). */
  current: number;
  /** The stage open on arrival. */
  initial: number;
}) {
  const [open, setOpen] = useState(initial);

  // A link to `#ideas`, `#quotes`… (a note's Edit and Cancel links) opens that stage.
  useEffect(() => {
    const fromHash = () => {
      const i = stages.findIndex((st) => st.id === window.location.hash.slice(1));
      if (i >= 0) setOpen(i);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [stages]);

  const st = stages[open];
  return (
    <div className="mt-4">
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
              aria-controls="stage-panel"
              onClick={() => {
                setOpen(i);
                // In the address, so Back from a form opens this stage again (owner, 21 Oct 2026).
                window.history.replaceState(window.history.state, "", `#${s.id}`);
              }}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span className="flex w-full items-center">
                <span aria-hidden className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : done[i - 1] ? "bg-champagne-600" : "bg-linen"}`} />
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] ${
                    isDone
                      ? "bg-champagne-600 text-white"
                      : isHere
                        ? "border-2 border-champagne-600 bg-white font-display text-champagne-600"
                        : "border-[1.5px] border-dashed border-champagne-400 bg-ivory"
                  } ${isOpen ? "shadow-[0_0_0_4px_rgb(184_145_79/0.25)]" : ""}`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> : isHere ? i + 1 : null}
                </span>
                <span aria-hidden className={`h-0.5 flex-1 ${i === stages.length - 1 ? "bg-transparent" : isDone ? "bg-champagne-600" : "bg-linen"}`} />
              </span>
              <span className={`label whitespace-nowrap !tracking-[0.05em] ${isOpen ? "!font-semibold !text-ink" : isDone ? "!text-champagne-600" : "!text-stone"}`}>
                {s.name}
                {isDone && <span className="sr-only"> (done)</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="stage-panel" aria-labelledby={`stage-tab-${st.id}`} className="mt-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl text-ink">{st.name}</h3>
          <span className="text-sm text-stone">{st.line}</span>
        </div>
        <div id={st.id} className="scroll-mt-6">
          {st.content}
        </div>
      </div>
    </div>
  );
}
