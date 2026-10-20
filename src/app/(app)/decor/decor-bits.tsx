"use client";

import { Handshake, Hammer, Home, ShoppingBag, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PLACES } from "@/lib/decor";
import type { DecorSource } from "@/types/db";
import type { DecorPerson } from "./decor-people";

/** Each "where it's from" with its picture. */
export const SOURCE_ICONS: Record<DecorSource, LucideIcon> = {
  own: Home,
  borrowed: Handshake,
  hired: Truck,
  bought: ShoppingBag,
  made: Hammer,
};

/** Where it goes: the usual places as pills, or type your own. */
export function PlacePicker({ value, onChange }: { value: string; onChange: (place: string) => void }) {
  const own = value && !PLACES.includes(value);
  return (
    <div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PLACES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(value === p ? "" : p)}
            className={`h-9 rounded-full border px-3.5 text-[13px] transition ${
              value === p ? "border-champagne-600 bg-champagne-100 text-champagne-600" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={own ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Somewhere else, e.g. The photo booth"
        aria-label="Somewhere else"
        className="mt-3 w-full rounded-full border border-linen bg-white px-4 py-2 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none"
      />
    </div>
  );
}

/**
 * Who it's from. Suppliers first (hire companies and the venue lend most
 * things), then someone typed, then guests for family (owner, 19 Oct 2026:
 * guests don't tend to lend stuff). "" = nobody, "typed" = a name.
 */
export function FromSelect({
  people,
  value,
  onChange,
  className,
  label = "Who it's from",
}: {
  people: DecorPerson[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={className}>
      <option value="">No one in particular</option>
      <optgroup label="Suppliers">
        {people.filter((p) => p.kind === "supplier").map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </optgroup>
      <option value="typed">Someone else (type a name)</option>
      <optgroup label="Family and friends on the guest list">
        {people.filter((p) => p.kind === "guest").map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </optgroup>
    </select>
  );
}
