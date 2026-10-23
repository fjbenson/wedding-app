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
      if (i >= 0) {
        setOpen(i);
        // Bring the stages into view: the stage's own id only exists once it's open.
        requestAnimationFrame(() => document.getElementById("stages")?.scrollIntoView({ block: "start" }));
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [stages]);

  const st = stages[open];
  return (
    // On a laptop the circles and the open stage's contents sit together in one
    // big card, as in canvas 4 "Laptop · Round 9", 2 (owner, 21 Oct 2026: it
    // looked like the phone's layout stretched); the cards inside go flat (globals.css).
    <div id="stages" className="stage-card mt-4 scroll-mt-6 lg:mt-0 lg:rounded-[22px] lg:bg-white/60 lg:px-7 lg:pb-7 lg:pt-6 lg:shadow-[0_0_0_0.5px_rgb(60_50_40/0.06),0_18px_40px_-24px_rgb(60_50_40/0.32)]">
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

      <div role="tabpanel" id="stage-panel" aria-labelledby={`stage-tab-${st.id}`} className="mt-5 lg:mt-6 lg:border-t lg:border-linen lg:pt-6">
        {/* Ready is only its button, so no heading row above it (owner, 23 Oct 2026): the circles already say where you are. */}
        {st.id === "ready" ? (
          <h3 className="sr-only">{st.name}</h3>
        ) : (
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="font-display text-xl text-ink">{st.name}</h3>
            <span className="text-sm text-stone">{st.line}</span>
          </div>
        )}
        <div id={st.id} className="scroll-mt-6">
          {st.content}
        </div>
      </div>
    </div>
  );
}
