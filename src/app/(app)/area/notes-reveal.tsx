"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Decor and Stationery keep their notes list out of sight until the Notes
 * tile is tapped, so the tile and a fold don't both show (owner, 23 Oct
 * 2026). It listens for the same `#ideas` change the tile's JumpLink fires.
 */
export default function NotesReveal({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const check = () => {
      if (window.location.hash === "#ideas") setShown(true);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);
  useEffect(() => {
    if (shown) box.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [shown]);
  return (
    <div ref={box} hidden={!shown}>
      {children}
    </div>
  );
}
