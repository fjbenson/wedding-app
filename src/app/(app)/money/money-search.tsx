"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * Money's search box, with the round black + at its end like the guest list
 * and Plan's List (owner, 17 Oct 2026: "florist deposit" one search away).
 * Money is drawn on the server, so the words go in the address (`?q=`) and
 * the page redraws a moment after typing stops; the area filter and the view
 * stay as they are.
 */
export default function MoneySearch({ initial, placeholder, end }: { initial: string; placeholder: string; end?: React.ReactNode }) {
  const router = useRouter();
  const [query, setQuery] = useState(initial);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (query.trim()) url.searchParams.set("q", query.trim());
      else url.searchParams.delete("q");
      // A new search shows every month again.
      url.searchParams.delete("month");
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, router]);

  return (
    <div className="mt-5 flex items-center gap-2">
      <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
        <Search className="h-[17px] w-[17px] shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        <span className="sr-only">{placeholder}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
        />
      </label>
      {end}
    </div>
  );
}
