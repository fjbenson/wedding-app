"use client";

import { Link2 } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { BARE, CARD, Line, Part } from "@/components/visual-form";
import NoteEditor from "@/components/note-editor";

/**
 * An area's note, laid out like the Hub's jot-a-note (owner, 23 Oct 2026):
 * the taped paper slip, a link box under it, the area already chosen.
 */
export default function AreaNoteForm({
  action,
  initial,
  link,
  isNew,
  showLink,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial: string;
  link: string;
  isNew: boolean;
  showLink: boolean;
}) {
  return (
    <form action={action}>
      <div className="relative mt-2 flex min-h-[48dvh] flex-col rounded-[4px] bg-[#FFFDF8] px-5 pb-4 pt-7 shadow-[0_1px_2px_rgb(60_45_20/0.08),0_14px_30px_-16px_rgb(60_45_20/0.35)]">
        <span
          aria-hidden
          className="absolute -top-2 left-1/2 h-4 w-[64px] -translate-x-1/2 border-x border-dashed border-white/60 bg-[rgb(225_205_165/0.55)]"
        />
        <NoteEditor fill initial={initial} autoFocus={isNew} placeholder="A thought, a list, what you've ruled out" />
      </div>
      {showLink && (
        <Part label="A link">
          <div className={CARD}>
            <Line icon={Link2} label="A link">
              <input name="url" defaultValue={link} inputMode="url" autoComplete="off" placeholder="Paste a link — Pinterest, a supplier, a recipe" className={BARE} />
            </Line>
          </div>
        </Part>
      )}
      <SubmitBar label="Save note" whenChanged={!isNew} />
    </form>
  );
}
