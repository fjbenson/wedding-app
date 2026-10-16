"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { CARD } from "@/components/visual-form";
import { initialsOf } from "@/lib/names";
import { safely } from "../people/guest-card";
import { setInvolvedAction, type Involved } from "./card-actions";

/**
 * Who's involved, on a to-do's or an appointment's card (0021_involved.sql;
 * owner's OK 16 Oct 2026): the guests tagged on it as pills — tap a name to
 * open their card, ✕ to take them off — and "+ Add someone", a search over
 * the guest list where a tap tags them at once (taps save, like the rest of
 * the card). Nobody is told; it's a note for the couple.
 */
export function InvolvedPart({ kind, id, involved }: { kind: "todo" | "appointment"; id: string; involved: Involved }) {
  const router = useRouter();
  const [ids, setIds] = useState(involved.ids);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();
  const names = new Map(involved.guests.map((g) => [g.id, g.name]));

  const set = async (contactId: string, on: boolean) => {
    const before = ids;
    setIds(on ? [...ids, contactId] : ids.filter((x) => x !== contactId));
    const result = await safely(() => setInvolvedAction(kind, id, contactId, on));
    if (result.error) {
      setIds(before);
      setError(result.error);
    } else {
      setError(undefined);
      router.refresh();
    }
  };

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = involved.guests.filter((g) => !ids.includes(g.id) && words.every((w) => g.name.toLowerCase().includes(w))).slice(0, 8);

  return (
    <fieldset className="mt-7 min-w-0">
      <legend className="section-label">Who&apos;s involved</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {ids.map((guestId) => {
          const name = names.get(guestId) ?? "Someone";
          return (
            <span key={guestId} className="flex h-9 items-center gap-1.5 rounded-full border border-linen bg-white pl-1 pr-1.5 text-[15px] text-ink">
              <Link href={`/people?guest=${guestId}`} className="flex items-center gap-2 pr-0.5">
                <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-champagne-100 text-[11px] font-medium text-champagne-600">
                  {initialsOf(name)}
                </span>
                {name}
              </Link>
              <button
                type="button"
                onClick={() => set(guestId, false)}
                aria-label={`Take ${name} off this`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-stone hover:bg-linen hover:text-ink"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
            </span>
          );
        })}
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-champagne-400 px-3.5 text-[15px] text-champagne-600 hover:bg-champagne-100"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            {ids.length ? "Add someone" : "Add a guest"}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
              <Search className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a guest"
                aria-label="Find a guest"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
              />
            </label>
            <button type="button" onClick={() => (setOpen(false), setQuery(""))} className="px-2 text-sm text-stone hover:text-ink">
              Done
            </button>
          </div>
          <ul className={`${CARD} px-4`}>
            {matches.map((g) => (
              <li key={g.id} className="border-b border-linen last:border-b-0">
                <button type="button" onClick={() => set(g.id, true)} className="flex min-h-[48px] w-full items-center gap-3 py-2 text-left">
                  <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-medium text-stone">
                    {initialsOf(g.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{g.name}</span>
                  <Plus className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="py-4 text-sm text-stone">{involved.guests.length ? "No one matches that." : "No one on the guest list yet."}</li>
            )}
          </ul>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}
    </fieldset>
  );
}
