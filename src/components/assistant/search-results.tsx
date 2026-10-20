"use client";

import { useEffect, useState } from "react";
import {
  Armchair,
  BedDouble,
  CalendarDays,
  CircleCheck,
  Clock,
  Home,
  Image as ImageIcon,
  ListChecks,
  Palette,
  PoundSterling,
  Sparkles,
  StickyNote,
  Store,
  UserRound,
  Users,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import CardLink from "@/components/card-link";
import { searchAction } from "@/app/(app)/search/actions";
import type { SearchKind, SearchResult } from "@/lib/db/search";

/** Each kind's picture and the heading it's grouped under. */
const KINDS: Record<SearchKind, { icon: LucideIcon; group: string }> = {
  guest: { icon: UserRound, group: "Guests" },
  household: { icon: Home, group: "Guests" },
  group: { icon: Users, group: "Guests" },
  supplier: { icon: Store, group: "Suppliers" },
  todo: { icon: CircleCheck, group: "Plan" },
  appointment: { icon: CalendarDays, group: "Plan" },
  payment: { icon: PoundSterling, group: "Money" },
  moment: { icon: Clock, group: "The Day" },
  table: { icon: Armchair, group: "The Day" },
  stay: { icon: BedDouble, group: "The Day" },
  decor: { icon: Palette, group: "Decor" },
  list: { icon: ListChecks, group: "Lists and notes" },
  note: { icon: StickyNote, group: "Lists and notes" },
  area: { icon: Sparkles, group: "Areas" },
  idea: { icon: ImageIcon, group: "Inspo" },
  menu: { icon: UtensilsCrossed, group: "Food & drink" },
  drink: { icon: Wine, group: "Food & drink" },
};

/**
 * Search across the whole wedding, as you type in Your assistant's box (owner,
 * 19 Oct 2026: "search the word easels and it finds it all across the app").
 * No AI: the app looks it up itself, and nothing leaves it. A tap opens the
 * thing in its card or on its page; Send still asks the assistant.
 */
export default function SearchResults({ query, onGo }: { query: string; onGo: () => void }) {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searched, setSearched] = useState("");
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) return;
    let live = true;
    const timer = setTimeout(() => {
      searchAction(q)
        .then((r) => {
          if (!live) return;
          setResults(r.results);
          setSearched(q);
        })
        .catch(() => live && setResults([]));
    }, 220);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [q]);

  if (q.length < 2) return null;
  const groups = new Map<string, SearchResult[]>();
  for (const r of results ?? []) {
    const g = KINDS[r.kind].group;
    groups.set(g, [...(groups.get(g) ?? []), r]);
  }

  return (
    <section aria-label="Found in your wedding" aria-live="polite" className="mt-5 text-left">
      {results === null ? (
        <p className="px-1 text-sm text-stone">Looking…</p>
      ) : results.length === 0 ? (
        <p className="px-1 text-sm text-stone">Nothing in your wedding matches &ldquo;{searched || q}&rdquo;. Press send to ask Juno.</p>
      ) : (
        <>
          {[...groups.entries()].map(([group, rows]) => (
            <div key={group} className="mt-4 first:mt-0">
              <h3 className="section-label px-1">{group}</h3>
              <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
                {rows.map((r) => {
                  const Icon = KINDS[r.kind].icon;
                  return (
                    <li key={`${r.kind}:${r.id}:${r.title}`} className="border-b border-ink/[0.12] last:border-b-0">
                      <CardLink href={r.href} onOpen={onGo} className="row-press flex items-center gap-3 py-3">
                        <span aria-hidden className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="type-item block truncate">{r.title}</span>
                          {r.line && <span className="block truncate text-[13px] text-stone">{r.line}</span>}
                        </span>
                      </CardLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <p className="mt-4 px-1 text-center text-[13px] text-stone">Not it? Press send to ask Juno.</p>
        </>
      )}
    </section>
  );
}
