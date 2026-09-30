"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Field, INPUT } from "@/components/form-bits";
import type { AreaOption } from "@/lib/areas";
import { uploadInspoPicture } from "@/lib/db/inspo-upload";

/**
 * Saving something (screen 31): a photo from the phone, a pasted link, or
 * both. The photo uploads straight from the phone first; then the form
 * saves, carrying the stored path along.
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
    <form ref={form} action={action} onSubmit={onSubmit} className="space-y-5">
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="The picture you picked" className="max-h-80 w-full rounded-2xl object-cover" />
        ) : (
          <span className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-champagne-400 bg-white text-sm text-stone peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400/40">
            <ImagePlus className="h-6 w-6 text-champagne-600" strokeWidth={1.5} aria-hidden />
            Add a picture from your phone
          </span>
        )}
        {preview && <span className="mt-2 block text-center text-sm text-stone underline underline-offset-4">Choose a different picture</span>}
      </label>

      <Field label="Or a link" hint="Pinterest, a supplier, anything">
        <input name="url" inputMode="url" placeholder="Paste a link" className={INPUT} />
      </Field>

      <Field label="Folder" hint="or leave it unsorted">
        <select name="folder" defaultValue={defaultFolder ?? ""} className={INPUT}>
          <option value="">Unsorted</option>
          {areas.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="A note" hint="optional">
        <input name="note" placeholder="e.g. Love the sleeves, not the colour" className={INPUT} />
      </Field>

      {problem && (
        <p role="alert" className="rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {problem}
        </p>
      )}

      <button
        type="submit"
        disabled={!!busy}
        className="w-full rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90 disabled:opacity-60"
      >
        {busy || "Save"}
      </button>
    </form>
  );
}
