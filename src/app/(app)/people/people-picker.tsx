"use client";

import SearchClear from "@/components/search-clear";
import { useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { CARD } from "@/components/visual-form";
import { initialsOf } from "@/lib/names";

/**
 * Picking guests on a form — who's in a new household or group, who's
 * involved in a new to-do or appointment. Search, tap a name, and they become
 * a pill above the search (✕ takes them off); the search empties, ready for
 * the next person (owner, 17 Oct 2026: ticking left you stuck on the search).
 * The same pattern as "Who's involved" on a to-do's card. Each picked person
 * is sent as a `member`. `note` says something under a name ("Now in The
 * Reids — moves here").
 */
export default function PeoplePicker({
  people,
  note,
}: {
  people: { id: string; name: string; note?: string }[];
  note?: string;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const box = useRef<HTMLInputElement>(null);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = words.length
    ? people.filter((p) => !picked.includes(p.id) && words.every((w) => p.name.toLowerCase().includes(w))).slice(0, 8)
    : [];
  const pick = (id: string) => {
    setPicked((now) => [...now, id]);
    setQuery("");
    box.current?.focus();
  };

  return (
    <div>
      {picked.map((id) => (
        <input key={id} type="hidden" name="member" value={id} />
      ))}
      {picked.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {picked.map((id) => {
            const name = people.find((p) => p.id === id)?.name ?? "Someone";
            return (
              <span key={id} className="flex h-9 items-center gap-1.5 rounded-full border border-linen bg-white pl-1 pr-1.5 text-[15px] text-ink">
                <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-champagne-100 text-[11px] font-medium text-champagne-600">
                  {initialsOf(name)}
                </span>
                {name}
                <button
                  type="button"
                  onClick={() => setPicked((now) => now.filter((x) => x !== id))}
                  aria-label={`Take ${name} off`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone hover:bg-linen hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <label className="flex h-10 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
        <Search className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        <input
          ref={box}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={picked.length ? "Add someone else" : "Find a guest"}
          aria-label="Find a guest"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
        />
        <SearchClear query={query} onClear={() => setQuery("")} />
      </label>
      {note && <p className="mt-2 px-1 text-[13px] text-stone">{note}</p>}
      {words.length > 0 && (
        <ul className={`${CARD} px-4`}>
          {matches.map((p) => (
            <li key={p.id} className="border-b border-linen last:border-b-0">
              <button type="button" onClick={() => pick(p.id)} className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left">
                <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-medium text-stone">
                  {initialsOf(p.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-ink">{p.name}</span>
                  {p.note && <span className="block truncate text-xs text-stone">{p.note}</span>}
                </span>
                <Plus className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={2} aria-hidden />
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="py-4 text-sm text-stone">No one matches that.</li>}
        </ul>
      )}
    </div>
  );
}
