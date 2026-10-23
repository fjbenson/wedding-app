"use client";

import SearchClear from "@/components/search-clear";
import { useState } from "react";
import { Search } from "lucide-react";
import { AREA_ICONS, searchIcons } from "@/lib/area-icons";

/**
 * Search the area icons ("lights" finds the bulb) and tap one. Used when
 * adding an area (step 2) and when changing one's icon on its page. The
 * shortlist and its search words live in src/lib/area-icons.ts.
 */
export default function IconPicker({ value, onPick }: { value: string | null; onPick: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const found = searchIcons(query);
  const shown = found.length ? found : AREA_ICONS;
  return (
    <>
      <label className="flex h-11 items-center gap-2.5 rounded-full border border-linen bg-white/80 px-4">
        <Search className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        <span className="sr-only">Search the icons</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          placeholder="Search, e.g. lights"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-stone/60 focus:outline-none"
        />
        <SearchClear query={query} onClear={() => setQuery("")} />
      </label>
      {query.trim() && !found.length && <p className="mt-3 text-sm text-stone">Nothing for “{query.trim()}” — here they all are.</p>}
      <div className="mt-4 grid grid-cols-6 gap-[7px]">
        {shown.map((i) => (
          <button
            key={i.name}
            type="button"
            onClick={() => onPick(i.name)}
            aria-label={i.words.split(" ")[0]}
            aria-pressed={value === i.name}
            className={`flex h-12 items-center justify-center rounded-[14px] border transition ${
              value === i.name ? "border-ink bg-ink text-champagne-100" : "border-linen bg-white/70 text-champagne-600 hover:border-champagne-400"
            }`}
          >
            <i.icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
          </button>
        ))}
      </div>
    </>
  );
}
