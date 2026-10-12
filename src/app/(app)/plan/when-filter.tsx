"use client";

import { useRouter } from "next/navigation";
import { WHEN_CHOICES, type When } from "./when";

/**
 * Plan's List narrowed by when (owner, 12 Oct 2026: the List is one long
 * checklist, with the months as a filter rather than headings). Looks like
 * the area filter beside it; picking one reloads with `when=` added to
 * `base`, so it can be linked to.
 */
export default function WhenFilter({ current, base }: { current: When | null; base: string }) {
  const router = useRouter();
  const join = base.includes("?") ? "&" : "?";
  return (
    <label className="relative inline-flex">
      <span className="sr-only">Show the to-dos due</span>
      <select
        value={current ?? ""}
        onChange={(event) => router.push(event.target.value ? `${base}${join}when=${event.target.value}` : base)}
        className={`h-9 appearance-none rounded-full border py-0 pl-3.5 pr-8 text-[13px] focus:outline-none focus:ring-2 focus:ring-champagne-400/40 ${
          current ? "border-ink bg-ink text-ivory" : "border-champagne-400/70 bg-white text-ink"
        }`}
      >
        <option value="">Any time</option>
        {WHEN_CHOICES.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <span aria-hidden className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${current ? "text-ivory" : "text-stone"}`}>
        ▼
      </span>
    </label>
  );
}
