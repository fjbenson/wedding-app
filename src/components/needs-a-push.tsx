import Link from "next/link";
import type { HubPush } from "@/lib/hub-stages";

/**
 * Beside the laptop Hub's ring: the areas furthest behind, each a pill with
 * its next step (canvas 4 "Laptop · Round 13", C, owner's pick 23 Oct 2026;
 * rows with a button before). Gone once every area is ready — say less.
 */
export default function NeedsAPush({ items, className = "" }: { items: HubPush[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <section className={`glass-card hidden rounded-[22px] px-5 pb-4 pt-4 lg:block ${className}`}>
      <div className="flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-2.5">
        <h2 className="section-label whitespace-nowrap">Needs a push</h2>
        <Link href="/standing" className="type-meta whitespace-nowrap !text-champagne-600 hover:!text-ink">
          Where things stand ›
        </Link>
      </div>
      <ul className="mt-3.5 flex flex-wrap gap-2">
        {items.map((p) => (
          <li key={p.key}>
            {/* Where it stands ("2 quotes in") shows on hover and is read out. */}
            <Link
              href={p.href}
              title={p.line}
              aria-label={`${p.label}: ${p.line}. ${p.action}`}
              className="flex h-9 items-center gap-2 rounded-full border border-champagne-400 bg-white/70 px-3.5 text-sm text-ink transition hover:border-ink"
            >
              {p.label}
              <span className="text-[13px] text-champagne-600">{p.action} ›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
