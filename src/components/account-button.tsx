"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { coupleName } from "@/lib/couple-name";

/** "Olivia & Theo" → "O&T"; a single name → its first letter. */
function monogram(name: string): string {
  const parts = coupleName(name).split("&").map((p) => p.trim()).filter(Boolean);
  return parts.map((p) => p[0]!.toUpperCase()).join("&") || "·";
}

/**
 * The foot of the laptop menu (canvas 5 "Laptop · Round 16", A, owner's pick
 * 23 Oct 2026, with the couple's monogram in the circle and "Settings" beside
 * it, so the names don't show a third time). A tap opens a small menu
 * upwards: Settings and Sign out.
 */
export default function AccountButton({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Closes on a click elsewhere, Escape, or moving to another screen.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const row = "flex w-full items-center rounded-[10px] px-3 py-2.5 text-left text-sm transition hover:bg-champagne-100";

  return (
    <div ref={box} className="relative mt-auto">
      {open && (
        <div role="menu" className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-[#FFFDF8]/95 p-1.5 shadow-[0_0_0_0.5px_rgb(60_50_40/0.12),0_24px_50px_-20px_rgb(60_50_40/0.4)] backdrop-blur-xl">
          <Link href="/settings" role="menuitem" className={`${row} text-ink`}>
            Settings
          </Link>
          <div aria-hidden className="mx-3 my-1 h-px bg-linen" />
          <form action="/auth/sign-out" method="post">
            <button type="submit" role="menuitem" className={`${row} text-stone hover:text-ink`}>
              Sign out
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`-mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-[14px] p-2 text-left text-sm transition hover:bg-champagne-100/60 hover:text-ink ${
          open || pathname === "/settings" ? "bg-champagne-100/60 text-ink" : "text-stone"
        }`}
      >
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-100 font-display text-[15px] font-light italic tracking-[0.02em] text-champagne-600 shadow-[inset_0_0_0_1px_rgb(184_145_79/0.35)]">
          {monogram(name)}
        </span>
        <span className="flex-1">Settings</span>
      </button>
    </div>
  );
}
