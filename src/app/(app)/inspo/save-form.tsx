"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, NotebookPen } from "lucide-react";
import { AreaTiles, BARE, CARD, Line, Part } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import { uploadInspoPicture } from "@/lib/db/inspo-upload";

/**
 * Saving something (screen 31): a photo from the phone, a pasted link, or
 * both. The photo uploads straight from the phone first; then the form
 * saves, carrying the stored path along. Laid out like the other visual
 * forms (15 Oct 2026): the picture first, then a link, the folder as the
 * area tiles (nothing picked = unsorted), a note.
 */
export default function SaveForm({
  action,
  weddingId,
  areas,
  defaultFolder,
  returnTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  weddingId: string;
  areas: AreaOption[];
  defaultFolder?: string;
  returnTo?: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const pathInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<false | "Uploading…" | "Saving…">(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [folder, setFolder] = useState(defaultFolder ?? "");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!file || pathInput.current!.value) return; // nothing to upload, or done already
    event.preventDefault();
    setBusy("Uploading…");
    setProblem(null);
    try {
      pathInput.current!.value = await uploadInspoPicture(weddingId, file);
      setBusy("Saving…");
      form.current!.requestSubmit();
    } catch (error) {
      console.error("upload failed", error);
      setProblem("The picture didn't upload. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form ref={form} action={action} onSubmit={onSubmit}>
      <input ref={pathInput} type="hidden" name="image_path" />
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}

      <label className="block cursor-pointer">
        <span className="sr-only">A picture</span>
        <input
          type="file"
          accept="image/*"
          className="peer sr-only"
          onChange={(event) => {
            const picked = event.target.files?.[0] ?? null;
            setFile(picked);
            setPreview(picked ? URL.createObjectURL(picked) : null);
            pathInput.current!.value = "";
          }}
        />
        {preview ? (
          <span className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="The picture you picked" className="max-h-80 w-full rounded-[22px] object-cover shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4)]" />
            <span className="mt-2 block text-center text-sm text-stone underline underline-offset-4">Choose a different picture</span>
          </span>
        ) : (
          <span
            className={`${CARD} !mt-0 flex h-48 flex-col items-center justify-center gap-2.5 border-dashed !border-champagne-400/80 text-center peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400/40`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne-100">
              <ImagePlus className="h-6 w-6 text-champagne-600" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="font-display text-[21px] font-light leading-tight text-ink">Add a picture</span>
            <span className="text-[13px] text-stone">Take one, or pick from your photos</span>
          </span>
        )}
      </label>

      <Part label="Or a link">
        <div className={CARD}>
          <Line icon={Link2} label="A link">
            <input name="url" inputMode="url" autoComplete="off" placeholder="Paste a link — Pinterest, a supplier…" className={BARE} />
          </Line>
        </div>
      </Part>

      <Part label="Folder">
        <AreaTiles name="folder" areas={areas} otherValue="other" value={folder} onChange={setFolder} />
        {folder && (
          <button type="button" onClick={() => setFolder("")} className="mt-2 h-10 text-sm text-stone underline underline-offset-4 hover:text-ink">
            Leave it unsorted
          </button>
        )}
      </Part>

      <Part label="A note">
        <div className={CARD}>
          <Line icon={NotebookPen} label="A note">
            <input name="note" autoComplete="off" placeholder="e.g. Love the sleeves, not the colour" className={BARE} />
          </Line>
        </div>
      </Part>

      {problem && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {problem}
        </p>
      )}

      <div className="sticky bottom-0 z-20 -mx-5 mt-8 bg-gradient-to-t from-ivory from-60% to-ivory/0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
        <button
          type="submit"
          disabled={!!busy}
          className="h-[52px] w-full rounded-2xl bg-ink px-4 text-ivory shadow-[0_10px_24px_-12px_rgb(30_27_24/0.5)] transition hover:bg-ink/90 disabled:opacity-60"
        >
          {busy || "Save the idea"}
        </button>
      </div>
    </form>
  );
}
