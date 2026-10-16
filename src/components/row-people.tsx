"use client";

import { createContext, useContext } from "react";
import { initialsOf } from "@/lib/names";

/**
 * The guests tagged on to-dos and appointments (0021_involved.sql), keyed
 * "todo:<id>" / "appointment:<id>" → their names. A page that shows rows wraps
 * them in `<RowPeopleProvider>` once, so the rows needn't be handed it one by one.
 */
const Ctx = createContext<Record<string, string[]>>({});

export function RowPeopleProvider({ people, children }: { people: Record<string, string[]>; children: React.ReactNode }) {
  return <Ctx.Provider value={people}>{children}</Ctx.Provider>;
}

/** Small overlapping initials at a row's end — two, then "+N". Nothing when no one's tagged. */
export default function RowPeople({ kind, id }: { kind: "todo" | "appointment"; id: string }) {
  const names = useContext(Ctx)[`${kind}:${id}`];
  if (!names?.length) return null;
  const shown = names.slice(0, 2);
  const more = names.length - shown.length;
  return (
    <span className="flex shrink-0 items-center" aria-label={`With ${names.join(", ")}`} title={names.join(", ")}>
      {shown.map((name, i) => (
        <span
          key={i}
          aria-hidden
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-champagne-100 text-[10px] font-medium text-champagne-600 ${i ? "-ml-2" : ""}`}
        >
          {initialsOf(name)}
        </span>
      ))}
      {more > 0 && (
        <span aria-hidden className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-linen text-[10px] font-medium text-stone">
          +{more}
        </span>
      )}
    </span>
  );
}
