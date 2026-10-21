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
 * 2026): where they're staying and how they're getting there and back. Both
 * are optional (a guest may live nearby and drive), so unset shows as a quiet
 * dashed box saying so, not a job to do (owner, 21 Oct 2026); a tap picks.
 * Journeys themselves are chosen in Travel, where the seats are.
 */
export function GuestTravelSection({ guest, travel, bare = false }: { guest: Contact; travel: TravelInfo; bare?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [picking, setPicking] = useState(false);
  const [getting, setGetting] = useState(false);
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

      {/* Both rows work the same way (owner, 21 Oct 2026): a label, what's set or "Optional · tap to add", a chevron; a tap opens the choices below. */}
      <PickRow label="Accommodation" value={staying} open={picking} onToggle={() => setPicking(!picking)} />
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

      <PickRow
        label="Transport"
        value={journeys.length > 0 ? journeys.join(" · ") : guest.own_way ? "Making their own way" : null}
        open={getting}
        onToggle={() => setGetting(!getting)}
      />
      {getting && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            aria-pressed={Boolean(guest.own_way)}
            onClick={() => run(() => setOwnWayAction(guest.id, !guest.own_way), () => setGetting(false))}
            className={`${CHIP} ${guest.own_way ? "bg-champagne-100 text-ink ring-champagne-400" : "bg-ivory text-ink ring-linen hover:ring-champagne-400"}`}
          >
            Own way
          </button>
          <Link href={journeys.length > 0 ? "/day?tab=travel" : "/day?tab=travel&open=nolift"} className={`${CHIP} bg-ivory text-champagne-600 ring-linen`}>
            {journeys.length > 0 ? "See their journeys ›" : "Put them on a journey ›"}
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      )}
    </section>
  );
}

/** One of the Travel part's rows: its label, what's set (or a quiet "Optional · tap to add"), and a chevron that opens the choices. */
function PickRow({ label, value, open, onToggle }: { label: string; value: string | null; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`mt-2 flex min-h-[58px] w-full items-center gap-3 rounded-[18px] px-4 text-left ${
        value ? "bg-white ring-1 ring-linen" : "border-[1.5px] border-dashed border-linen text-stone"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-stone">{label}</span>
        <span className={`block truncate text-[15px] ${value ? "text-ink" : "italic"}`}>{value ?? "Optional · tap to add"}</span>
      </span>
      <ChevronDown className={`h-4 w-4 shrink-0 text-stone transition ${open ? "rotate-180" : ""}`} strokeWidth={1.8} aria-hidden />
    </button>
  );
}
