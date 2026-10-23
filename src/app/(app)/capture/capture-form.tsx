"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { AreaTiles, BARE, CARD, Line, Part } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import NoteEditor from "@/components/note-editor";

/**
 * Jot a note (screen 35), laid out like the other visual forms (15 Oct
 * 2026): you write on a slip of paper like the ones on the notes wall, a
 * link on a glass card, and filing it folded away — the point is getting it
 * down fast; nothing picked leaves it to sort later.
 */
export default function CaptureForm({
  action,
  areas,
  defaultArea,
  returnTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  areas: AreaOption[];
  defaultArea?: string;
  returnTo: string;
}) {
  const [area, setArea] = useState(defaultArea ?? "");
  return (
    <form action={action}>
      <input type="hidden" name="return_to" value={returnTo} />
      {/* Words, bullets and tick-boxes in one note (canvas 3 "Notes · Round 1", A, owner 19 Oct 2026). */}
      <div className="relative mt-2 flex min-h-[48dvh] flex-col rounded-[4px] bg-[#FFFDF8] px-5 pb-4 pt-7 shadow-[0_1px_2px_rgb(60_45_20/0.08),0_14px_30px_-16px_rgb(60_45_20/0.35)]">
        <span
          aria-hidden
          className="absolute -top-2 left-1/2 h-4 w-[64px] -translate-x-1/2 border-x border-dashed border-white/60 bg-[rgb(225_205_165/0.55)]"
        />
        <NoteEditor fill autoFocus placeholder="What's on your mind? An idea, a name, something someone said…" />
      </div>

      <Part label="A link">
        <div className={CARD}>
          <Line icon={Link2} label="A link">
            <input name="url" inputMode="url" autoComplete="off" placeholder="Paste a link — Pinterest, a supplier, a recipe" className={BARE} />
          </Line>
        </div>
      </Part>

      {/* Open like every other area pick (owner, 23 Oct 2026). */}
      <Part label="File it under">
        <AreaTiles name="area" areas={areas} otherValue="other" value={area} onChange={setArea} />
        {area && (
          <button type="button" onClick={() => setArea("")} className="mt-2 h-10 text-sm text-stone underline underline-offset-4 hover:text-ink">
            Leave it to sort later
          </button>
        )}
      </Part>

      <SubmitBar label="Save the note" />
    </form>
  );
}
