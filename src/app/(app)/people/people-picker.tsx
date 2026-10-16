"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import { CARD } from "@/components/visual-form";

/**
 * Who's in it, for a new household or group: search the guest list and tick
 * people. Each ticked person is sent as a `member`. `note` says something
 * under a name ("Now in The Reids — moves here").
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
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = people.filter((p) => picked.includes(p.id) || words.every((w) => p.name.toLowerCase().includes(w)));
  const toggle = (id: string) => setPicked((now) => (now.includes(id) ? now.filter((x) => x !== id) : [...now, id]));

  return (
    <div>
      {picked.map((id) => (
        <input key={id} type="hidden" name="member" value={id} />
      ))}
      <label className="flex h-10 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
        <Search className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a guest"
          aria-label="Find a guest"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
        />
      </label>
      {picked.length > 0 && <p className="type-meta mt-3 px-1">{picked.length === 1 ? "1 picked" : `${picked.length} picked`}</p>}
      {note && <p className="mt-2 px-1 text-[13px] text-stone">{note}</p>}
      <ul className={`${CARD} max-h-[50dvh] overflow-y-auto px-4`}>
        {shown.map((p) => {
          const on = picked.includes(p.id);
          return (
            <li key={p.id} className="border-b border-linen last:border-b-0">
              <button type="button" onClick={() => toggle(p.id)} aria-pressed={on} className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left">
                <span
                  aria-hidden
                  className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full ${on ? "bg-champagne-600 text-white" : "border-[1.5px] border-stone/40 bg-white"}`}
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-ink">{p.name}</span>
                  {p.note && <span className="block truncate text-xs text-stone">{p.note}</span>}
                </span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 && <li className="py-4 text-sm text-stone">No one matches that.</li>}
      </ul>
    </div>
  );
}
