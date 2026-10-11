"use client";

import { useRouter } from "next/navigation";
import type { AreaOption } from "@/lib/areas";

/**
 * The List's area filter (owner's call, 11 Oct 2026: "By area" as a filter
 * rather than a view of its own). Picking one reloads the list with `&area=`,
 * so it can be linked to — the to-do form's back link uses it.
 */
export default function AreaFilter({ areas, current }: { areas: AreaOption[]; current: string | null }) {
  const router = useRouter();
  return (
    <label className="relative inline-flex">
      <span className="sr-only">Show to-dos for</span>
      <select
        value={current ?? ""}
        onChange={(event) =>
          router.push(event.target.value ? `/plan?view=list&area=${encodeURIComponent(event.target.value)}` : "/plan?view=list")
        }
        className={`h-9 appearance-none rounded-full border py-0 pl-3.5 pr-8 text-[13px] focus:outline-none focus:ring-2 focus:ring-champagne-400/40 ${
          current ? "border-ink bg-ink text-ivory" : "border-champagne-400/70 bg-white text-ink"
        }`}
      >
        <option value="">All areas</option>
        {areas.map((a) => (
          <option key={a.key} value={a.key}>
            {a.label}
          </option>
        ))}
        <option value="none">No particular area</option>
      </select>
      <span aria-hidden className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${current ? "text-ivory" : "text-stone"}`}>
        ▼
      </span>
    </label>
  );
}
