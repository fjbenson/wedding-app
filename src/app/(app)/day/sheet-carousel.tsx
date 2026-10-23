"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselSheet {
  href: string;
  name: string;
  line: string;
}

/**
 * The run sheets on a phone as a carousel (canvas 5 "The Day · Round 23", B,
 * owner 23 Oct 2026): the sheet's name between ‹ › with dots under; they go
 * round. The laptop has its own (names along the top, sheets peeking).
 */
export function SheetCarousel({ sheets, at }: { sheets: CarouselSheet[]; at: number }) {
  const n = sheets.length;
  if (n < 2) return null;
  const prev = sheets[(at - 1 + n) % n];
  const next = sheets[(at + 1) % n];
  const arrow = "flex h-11 w-11 items-center justify-center rounded-full border border-linen bg-white/80 text-stone hover:text-ink";
  return (
    <section aria-label="Run sheets" className="mt-6 print:hidden lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href={prev.href} aria-label={`Previous sheet: ${prev.name}`} className={arrow}>
          <ChevronLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </Link>
        <div className="min-w-0 text-center">
          <p className="type-display truncate text-[22px] leading-tight">{sheets[at].name}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-stone">{sheets[at].line}</p>
        </div>
        <Link href={next.href} aria-label={`Next sheet: ${next.name}`} className={arrow}>
          <ChevronRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </Link>
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
        {sheets.map((s, i) => (
          <span key={s.href} className={`h-[7px] rounded-full ${i === at ? "w-[18px] bg-champagne-600" : "w-[7px] bg-linen"}`} />
        ))}
      </div>
    </section>
  );
}

/** Swipe the sheet left or right to go to the next or the one before. */
export function SheetSwipe({ prev, next, children }: { prev?: string; next?: string; children: React.ReactNode }) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      onTouchStart={(e) => {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
        const to = dx < 0 ? next : prev;
        if (to) router.push(to);
      }}
    >
      {children}
    </div>
  );
}
