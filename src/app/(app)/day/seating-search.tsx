"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import AddButton from "@/components/add-button";

/**
 * Seating's search with the round black + at its end, like every other tab
 * (canvas 3 "The Day · Round 1", A, owner's pick 17 Oct 2026). Typing a name
 * answers "where's Amy sitting?" right under the box — the guest and their
 * table, or "Not seated yet" — and finds tables by name too.
 */
export default function SeatingSearch({
  guests,
  tables,
}: {
  guests: { id: string; name: string; table: string | null }[];
  tables: { id: string; name: string; count: number; capacity: number }[];
}) {
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (name: string) => words.every((w) => name.toLowerCase().includes(w));
  const people = words.length ? guests.filter((g) => matches(g.name)).slice(0, 8) : [];
  const found = words.length ? tables.filter((t) => matches(t.name)).slice(0, 4) : [];

  return (
    <>
      <div className="mt-5 flex items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
          <Search className="h-[17px] w-[17px] shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
          <span className="sr-only">Find a guest or table</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a guest or table"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
          />
        </label>
        <AddButton href="/day/tables/new" label="Add a table" />
      </div>
      {words.length > 0 && (
        <ul className="glass-card mt-2.5 overflow-hidden rounded-[22px] px-4">
          {found.map((t) => (
            <li key={t.id} className="flex min-h-12 items-center justify-between gap-3 border-b border-linen py-2 last:border-b-0">
              <span className="truncate font-display text-[17px] text-ink">{t.name}</span>
              <span className="shrink-0 text-[13px] text-stone">
                {t.count} of {t.capacity} seats
              </span>
            </li>
          ))}
          {people.map((g) => (
            <li key={g.id} className="flex min-h-12 items-center justify-between gap-3 border-b border-linen py-2 last:border-b-0">
              <span className="truncate text-[15px] text-ink">{g.name}</span>
              <span className={`shrink-0 text-[13px] ${g.table ? "text-champagne-600" : "text-stone"}`}>{g.table ?? "Not seated yet"}</span>
            </li>
          ))}
          {people.length + found.length === 0 && <li className="py-4 text-sm text-stone">No one matches that.</li>}
        </ul>
      )}
    </>
  );
}
