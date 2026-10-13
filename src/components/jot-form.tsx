"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Camera, Link2 } from "lucide-react";
import { captureAction } from "@/app/(app)/capture/actions";

const CHIP =
  "inline-flex h-11 items-center gap-1.5 rounded-full border border-linen bg-white/80 px-3.5 text-sm text-ink transition hover:border-champagne-400";
const FIELD =
  "block w-full rounded-2xl border border-transparent bg-cream px-4 text-ink placeholder:text-stone focus:border-champagne-400 focus:outline-none";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 h-[52px] w-full rounded-full bg-ink text-[15px] text-ivory transition hover:bg-ink/90 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save to your notes"}
    </button>
  );
}

/**
 * Quick capture from the Hub, inside its jot sheet (`jot-sheet.tsx`): a
 * thought (and a link, if there is one) without leaving the page. Unfiled,
 * it waits in Your notes.
 */
export default function JotForm() {
  const [withLink, setWithLink] = useState(false);

  return (
    <form action={captureAction}>
      <input type="hidden" name="return_to" value="/" />
      <label className="block">
        <span className="sr-only">Jot something down</span>
        <textarea
          name="body"
          rows={5}
          autoFocus
          placeholder="Jot something down…"
          className={`${FIELD} resize-none py-4 font-display text-[21px] leading-snug placeholder:italic`}
        />
      </label>
      {withLink && (
        <label className="mt-2 block">
          <span className="sr-only">A link</span>
          <input name="url" inputMode="url" autoFocus placeholder="Paste a link — Pinterest, a supplier…" className={`${FIELD} h-12 text-[16px]`} />
        </label>
      )}
      <div className="mt-3 flex gap-2">
        {!withLink && (
          <button type="button" onClick={() => setWithLink(true)} className={CHIP}>
            <Link2 className="h-4 w-4 text-champagne-600" strokeWidth={1.8} aria-hidden />
            Link
          </button>
        )}
        <Link href="/inspo/new?from=/" className={CHIP}>
          <Camera className="h-4 w-4 text-champagne-600" strokeWidth={1.8} aria-hidden />
          Photo
        </Link>
      </div>
      <Save />
    </form>
  );
}
