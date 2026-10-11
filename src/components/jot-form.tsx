"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Camera, Link2 } from "lucide-react";
import { captureAction } from "@/app/(app)/capture/actions";

const BUTTON = "inline-flex h-11 items-center gap-1.5 rounded-xl border text-sm transition";
const CHIP = `${BUTTON} px-3.5 border-linen bg-white/70 text-ink hover:border-champagne-400`;
const FIELD =
  "block w-full rounded-xl border border-linen bg-white/60 px-4 text-ink placeholder:text-stone focus:border-champagne-400 focus:outline-none";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${BUTTON} ml-auto border-ink bg-ink px-5 text-ivory hover:bg-ink/90 disabled:opacity-60`}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

/**
 * Quick capture on the home screen itself: jot a thought (and a link, if
 * there is one) without leaving the page. Unfiled, it waits in the inbox.
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
          rows={3}
          placeholder="Jot something down…"
          className={`${FIELD} resize-none py-3 font-display text-[19px] leading-snug placeholder:italic`}
        />
      </label>
      {withLink && (
        <label className="mt-2 block">
          <span className="sr-only">A link</span>
          <input name="url" inputMode="url" autoFocus placeholder="Paste a link — Pinterest, a supplier…" className={`${FIELD} h-12 text-[16px]`} />
        </label>
      )}
      <div className="mt-2.5 flex gap-2">
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
        <Save />
      </div>
    </form>
  );
}
