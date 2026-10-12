"use client";

import { useRouter } from "next/navigation";
import type { AreaOption } from "@/lib/areas";

/**
 * An area filter (owner's call, 11 Oct 2026: "By area" as a filter rather
 * than a view of its own) — on Plan's List and on Money, so every tab can be
 * narrowed to one area and an area page's "In Plan ›" / "In Money ›" land
 * there. Picking one reloads the screen with `area=` added to `base`, so it
 * can be linked to.
 */
export default function AreaFilter({
  areas,
  current,
  base = "/plan?view=list",
  label = "Show the plan for",
}: {
  areas: AreaOption[];
  current: string | null;
  base?: string;
  label?: string;
}) {
  const router = useRouter();
  const join = base.includes("?") ? "&" : "?";
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={current ?? ""}
        onChange={(event) =>
          router.push(event.target.value ? `${base}${join}area=${encodeURIComponent(event.target.value)}` : base)
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
        <option value="none">Other</option>
      </select>
      <span aria-hidden className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${current ? "text-ivory" : "text-stone"}`}>
        ▼
      </span>
    </label>
  );
}
