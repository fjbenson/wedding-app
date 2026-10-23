"use client";

import { useEffect, useState } from "react";
import StageCircles from "@/components/stage-circles";

/**
 * The five stages as a row of circles joined by a gold line, the open one's
 * contents underneath (owner, 21 Oct 2026, canvas 4 "Area page · Round 1",
 * C2: it replaced the stages stacked down the page, and matches the supplier
 * card's Progress). A ticked circle is a stage that's done, the ringed number
 * is the one you're at, and the bold name is the one open. The names are
 * small so five fit on a 320px phone.
 */
export default function StageTabs({
  stages,
  done,
  current,
  initial,
}: {
  stages: { name: string; id: string; content: React.ReactNode }[];
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
      <StageCircles
        stages={stages}
        done={done}
        current={current}
        open={open}
        panelId="stage-panel"
        onOpen={(i) => {
          setOpen(i);
          // In the address, so Back from a form opens this stage again (owner, 21 Oct 2026).
          window.history.replaceState(window.history.state, "", `#${stages[i].id}`);
        }}
      />

      <div role="tabpanel" id="stage-panel" aria-labelledby={`stage-tab-${st.id}`} className="mt-5 lg:mt-6 lg:border-t lg:border-linen lg:pt-6">
        {/* No heading row with a count above the contents (owner, 23 Oct 2026, first Ready then every stage): the open circle's name is already bold, and the rows are the count. */}
        <h3 className="sr-only">{st.name}</h3>
        <div id={st.id} className="scroll-mt-6">
          {st.content}
        </div>
      </div>
    </div>
  );
}
