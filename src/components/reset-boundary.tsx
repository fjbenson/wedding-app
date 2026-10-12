"use client";

import { createContext, Fragment, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { replaceQuery } from "@/lib/url-state";

const Reset = createContext<(() => void) | null>(null);

/** Puts the form back how it opened (SubmitBar's Cancel), if it's inside a ResetBoundary. */
export function useFormReset() {
  return useContext(Reset);
}

/**
 * Around a form page's form (FormPage): Cancel puts the form back how it
 * opened by drawing it afresh, and after a Save (`?saved=`, stayAfterSave in
 * src/lib/return-to.ts) it starts afresh from what's now saved, with a short
 * "Saved" note — so neither leaves the form (owner, 12 Oct 2026).
 */
export default function ResetBoundary({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const saved = params.get("saved");
  const [round, setRound] = useState(0);
  const [note, setNote] = useState(false);
  // A fresh save draws the form afresh too (its "as it opened" is now what's saved).
  const [lastSaved, setLastSaved] = useState(saved);
  if (saved && saved !== lastSaved) {
    setLastSaved(saved);
    setRound((r) => r + 1);
  }

  useEffect(() => {
    if (!saved) return;
    setNote(true);
    // Tidy the address so Back and a reload don't say "Saved" again.
    replaceQuery({ saved: null });
  }, [saved]);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(false), 2200);
    return () => clearTimeout(t);
  }, [note]);

  return (
    <Reset.Provider value={() => setRound((r) => r + 1)}>
      <Fragment key={round}>{children}</Fragment>
      {note && (
        <p
          role="status"
          className="rise-in fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 mx-auto flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-ivory shadow-[0_10px_24px_-10px_rgb(30_27_24/0.6)]"
        >
          <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
          Saved
        </p>
      )}
    </Reset.Provider>
  );
}
