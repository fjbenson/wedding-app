"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Opening and closing parts of the plan (canvas "Plan · Round 2", 10 Oct
 * 2026): the This-month card and each month on the road to the day. What's
 * open is remembered in this browser, so the plan comes back as it was left.
 * The rows inside are drawn on the server and passed in as children.
 */

const STORAGE_KEY = "plan-open";

type Folds = {
  isOpen: (key: string) => boolean;
  toggle: (key: string) => void;
  setAll: (keys: string[], open: boolean) => void;
};

const FoldContext = createContext<Folds | null>(null);

export function FoldGroup({ initiallyOpen, children }: { initiallyOpen: string[]; children: ReactNode }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initiallyOpen.map((key) => [key, true])),
  );

  // Read what was left open after the first draw, so server and browser agree.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setOpen((now) => ({ ...now, ...JSON.parse(saved) }));
    } catch {
      // Private browsing or blocked storage: start from the defaults.
    }
  }, []);

  const save = (next: Record<string, boolean>) => {
    setOpen(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Not remembered, but still works.
    }
  };

  const folds: Folds = {
    isOpen: (key) => !!open[key],
    toggle: (key) => save({ ...open, [key]: !open[key] }),
    setAll: (keys, value) => save({ ...open, ...Object.fromEntries(keys.map((key) => [key, value])) }),
  };

  return <FoldContext.Provider value={folds}>{children}</FoldContext.Provider>;
}

function useFolds(): Folds {
  const folds = useContext(FoldContext);
  if (!folds) throw new Error("Fold used outside FoldGroup");
  return folds;
}

/**
 * A header that opens and closes what's under it. `closed` shows only while
 * shut (a month's one-line summary); `children` only while open.
 */
export function Fold({
  id,
  header,
  closed,
  children,
  chevronClassName = "text-stone/70",
  className,
}: {
  id: string;
  header: ReactNode;
  closed?: ReactNode;
  children: ReactNode;
  chevronClassName?: string;
  className?: string;
}) {
  const { isOpen, toggle } = useFolds();
  const open = isOpen(id);
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          {header}
          {!open && closed}
        </span>
        <ChevronDown
          className={`mt-1 h-[18px] w-[18px] shrink-0 transition-transform ${open ? "rotate-180" : ""} ${chevronClassName}`}
          strokeWidth={1.8}
          aria-hidden
        />
      </button>
      {open && children}
    </div>
  );
}

/** "Open all" / "Close all" for a set of folds. */
export function FoldAll({ ids }: { ids: string[] }) {
  const { isOpen, setAll } = useFolds();
  const anyClosed = ids.some((id) => !isOpen(id));
  if (ids.length < 2) return null;
  return (
    <button
      type="button"
      onClick={() => setAll(ids, anyClosed)}
      className="py-2 text-sm text-champagne-600 hover:text-ink"
    >
      {anyClosed ? "Open all" : "Close all"}
    </button>
  );
}
