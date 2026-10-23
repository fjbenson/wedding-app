import Link from "next/link";
import type { HubPush } from "@/lib/hub-stages";

/**
 * Beside the laptop Hub's ring: the areas furthest behind, each with its
 * next step as a quiet button (canvas 4 "Laptop · Round 8", C, owner's pick
 * 21 Oct 2026). Gone once every area is ready — say less.
 */
export default function NeedsAPush({ items }: { items: HubPush[] }) {
  if (items.length === 0) return null;
  return (
    <section className="glass-card hidden rounded-[22px] px-5 pb-2 pt-4 lg:block">
      <div className="flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-2.5">
        <h2 className="section-label whitespace-nowrap">Needs a push</h2>
        <Link href="/standing" className="type-meta whitespace-nowrap !text-champagne-600 hover:!text-ink">
          Where things stand ›
        </Link>
      </div>
      <ul>
        {items.map((p) => (
          <li key={p.key} className="flex items-center gap-3 border-t border-linen py-3 first:border-t-0">
            <Link href={`/area/${encodeURIComponent(p.key)}`} className="min-w-0 flex-1">
              <span className="type-item block">{p.label}</span>
              <span className="block text-[13px] text-stone">{p.line}</span>
            </Link>
            <Link
              href={p.href}
              className="flex h-9 shrink-0 items-center rounded-full border border-champagne-400 bg-white px-3.5 text-[13px] text-champagne-600 transition hover:border-ink hover:text-ink"
            >
              {p.action}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
