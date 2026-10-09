"use client";

import { useEffect } from "react";

/**
 * The safety net for every signed-in screen. If something breaks while a
 * screen is open, this shows in its place — rather than the browser's bare
 * "Application error" — with a way back. The usual cause is the app being
 * updated while the page was open, which a reload fixes.
 */
export default function ScreenError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page flex flex-col items-start pb-28">
      <p className="label mt-6">Sorry</p>
      <h1 className="type-display mt-3 text-[40px] leading-[1.05] tracking-[-0.02em]">Something went wrong.</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-stone">
        Nothing you&apos;ve saved is lost. If the app was just updated, reloading usually sorts it.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-full bg-ink px-5 text-sm text-ivory hover:bg-ink/90">
          Reload
        </button>
        <button type="button" onClick={reset} className="h-11 rounded-full border border-linen bg-white px-5 text-sm text-ink hover:border-champagne-400">
          Try again
        </button>
      </div>
      {error.digest && <p className="mt-8 text-xs text-stone/70">Reference: {error.digest}</p>}
    </main>
  );
}
