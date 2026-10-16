import Link from "next/link";
import { Check, ChevronDown, LayoutList } from "lucide-react";

/**
 * "☰ Floor plan ⌄" — the View button on the line under the search, like the
 * guest list's, for a page whose views are separate addresses. A small
 * dropdown of links; no script needed.
 */
export default function ViewMenu({ options }: { options: { label: string; href: string; active: boolean }[] }) {
  const current = options.find((o) => o.active) ?? options[0];
  return (
    <details className="group relative">
      <summary className="type-meta flex h-9 cursor-pointer list-none items-center gap-1.5 hover:text-ink [&::-webkit-details-marker]:hidden">
        <LayoutList className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
        {current.label}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition group-open:rotate-180" strokeWidth={2} aria-hidden />
      </summary>
      <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[14rem] rounded-[20px] border border-linen bg-white px-4 pb-1.5 pt-2.5 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]">
        <span className="section-label block py-1">View</span>
        <ul>
          {options.map((o) => (
            <li key={o.href} className="border-t border-linen first:border-t-0">
              <Link href={o.href} className="flex min-h-11 items-center gap-3 text-sm text-ink">
                <span className="flex-1">{o.label}</span>
                {o.active && <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
