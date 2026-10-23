"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decorFromAction } from "@/app/(app)/decor/actions";
import { formatDayMonth } from "@/lib/dates";
import { statusLabel, withQuantity } from "@/lib/decor";
import { Sparkles } from "lucide-react";
import type { DecorItem } from "@/types/db";

/**
 * On a supplier's card: what they're lending or hiring out for the day —
 * the venue's easel, the cake maker's stand — and when it goes back (owner,
 * 19 Oct 2026: Decor stays the one place for these; the card just shows
 * them). Nothing shows when they aren't lending anything. Rows for the
 * Booked stage's card (23 Oct 2026).
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
    <ul>
      {items.map((item) => (
        <li key={item.id} className="border-b border-linen">
          <Link href={`/day/decor?thing=${item.id}`} className="flex min-h-[52px] items-center gap-3 py-2.5">
            <span aria-hidden className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
              <Sparkles className="h-[17px] w-[17px]" strokeWidth={1.6} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-ink">{withQuantity(item)}</span>
              <span className="block text-[13px] text-stone">
                From them ·{" "}
                {item.status === "returned" ? "given back" : item.return_on ? `back ${formatDayMonth(item.return_on)}` : statusLabel(item.status).toLowerCase()}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
