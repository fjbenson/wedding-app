"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decorFromAction } from "@/app/(app)/decor/actions";
import { formatDayMonth } from "@/lib/dates";
import { statusLabel, withQuantity } from "@/lib/decor";
import type { DecorItem } from "@/types/db";

/**
 * On a supplier's card: what they're lending or hiring out for the day —
 * the venue's easel, the cake maker's stand — and when it goes back (owner,
 * 19 Oct 2026: Decor stays the one place for these; the card just shows
 * them). Nothing shows when they aren't lending anything.
 */
export default function SupplierDecor({ supplierId }: { supplierId: string }) {
  const [items, setItems] = useState<DecorItem[]>([]);
  useEffect(() => {
    let live = true;
    decorFromAction(supplierId)
      .then((r) => live && setItems(r.items))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [supplierId]);
  if (items.length === 0) return null;

  return (
    <section className="mt-7">
      <h2 className="section-label font-body">Decor from them</h2>
      <ul className="mt-1">
        {items.map((item) => (
          <li key={item.id} className="border-b border-linen">
            <Link href={`/day/decor?thing=${item.id}`} className="flex items-baseline justify-between gap-3 py-3">
              <span className="min-w-0 truncate text-[15px] text-ink">{withQuantity(item)}</span>
              <span className="shrink-0 text-[13px] text-stone">
                {item.status === "returned"
                  ? "Given back"
                  : item.return_on
                    ? `Back ${formatDayMonth(item.return_on)}`
                    : statusLabel(item.status)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
