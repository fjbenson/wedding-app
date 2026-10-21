"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import type { Contact } from "@/types/db";
import { setOwnWayAction, setStayAction } from "../day/travel-actions";

/** What the guest card needs from Travel (`travelForGuests()` in src/lib/db/stays.ts). */
export interface TravelInfo {
  stays: { id: string; name: string }[];
  /** Guest id → their journeys, as "Coach 1 at 12:45", in time order. */
  journeys: Record<string, string[]>;
}

const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

const CHIP =
  "inline-flex h-9 items-center rounded-full px-3.5 text-sm ring-1 disabled:opacity-50";

/**
 * The guest card's Travel part (canvas 3 "Travel · First version", 15 Oct
 * 2026): where they're staying and how they're getting there and back. Not
 * chosen yet shows dashed, like Travel's "still to sort" cards; a tap picks.
 * Journeys themselves are chosen in Travel, where the seats are.
 */
export function GuestTravelSection({ guest, travel, bare = false }: { guest: Contact; travel: TravelInfo; bare?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [picking, setPicking] = useState(false);
  const run = (save: () => Promise<{ error?: string }>, after?: () => void) =>
    startTransition(async () => {
      try {
        const result = await save();
        setError(result.error);
        if (!result.error) after?.();
      } catch {
        setError(UNSAVED);
      }
    });

  const place = travel.stays.find((s) => s.id === guest.stay_id);
  const staying =
    guest.staying === "no" ? "Not staying over" : guest.staying === "yes" ? (place?.name ?? "Staying, not sure where") : null;
  const journeys = travel.journeys[guest.id] ?? [];
  const current = guest.staying === "no" ? "no" : guest.staying === "yes" ? (place?.id ?? "unsure") : "";
  const choices = [
    ...travel.stays.map((s) => ({ value: s.id, label: s.name })),
    { value: "unsure", label: "Staying, not sure where" },
    { value: "no", label: "Not staying over" },
  ];

  return (
    <section className={bare ? "mt-5" : "mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6"}>
      {!bare && <h3 className="section-label">Travel</h3>}

      <button
        type="button"
        onClick={() => setPicking(!picking)}
        aria-expanded={picking}
        className={`mt-2 flex min-h-[58px] w-full items-center gap-3 rounded-[18px] px-4 text-left ${
          staying ? "bg-white ring-1 ring-linen" : "border-[1.5px] border-dashed border-champagne-400 text-champagne-600"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-stone">Accommodation</span>
          <span className={`block truncate text-[15px] ${staying ? "text-ink" : "italic"}`}>{staying ?? "Not sure yet · tap to pick"}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-stone transition ${picking ? "rotate-180" : ""}`} strokeWidth={1.8} aria-hidden />
      </button>
      {picking && (
        <div className="mt-2 flex flex-wrap gap-2">
          {choices.map((c) => (
            <button
              key={c.value}
              type="button"
              disabled={pending}
              aria-pressed={current === c.value}
              onClick={() => run(() => setStayAction(guest.id, c.value), () => setPicking(false))}
              className={`${CHIP} ${current === c.value ? "bg-champagne-100 text-ink ring-champagne-400" : "bg-ivory text-ink ring-linen hover:ring-champagne-400"}`}
            >
              {c.label}
            </button>
          ))}
          {travel.stays.length === 0 && (
            <Link href="/day?tab=travel&open=stay:new" className={`${CHIP} bg-ivory text-champagne-600 ring-linen`}>
              + Add a place to stay
            </Link>
          )}
        </div>
      )}

      <div
        className={`mt-2 flex min-h-[58px] items-center gap-3 rounded-[18px] px-4 py-2 ${
          journeys.length || guest.own_way ? "bg-white ring-1 ring-linen" : "border-[1.5px] border-dashed border-champagne-400"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-stone">Transport</span>
          {journeys.length > 0 ? (
            <Link href="/day?tab=travel" className="block text-[15px] text-ink hover:underline">
              {journeys.join(" · ")}
            </Link>
          ) : guest.own_way ? (
            <span className="block text-[15px] text-ink">Making their own way</span>
          ) : (
            <Link href="/day?tab=travel&open=nolift" className="block text-[15px] italic text-champagne-600 hover:underline">
              No lift yet · put them on a journey ›
            </Link>
          )}
        </span>
        {journeys.length === 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setOwnWayAction(guest.id, !guest.own_way))}
            className="shrink-0 text-sm text-stone underline underline-offset-4 hover:text-ink disabled:opacity-50"
          >
            {guest.own_way ? "Undo" : "Own way"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      )}
    </section>
  );
}
