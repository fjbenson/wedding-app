"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { daysUntil } from "@/lib/dates";

/** The left-hand column on desktop: whose wedding, and the way around. */
export default function Sidebar({
  name,
  weddingDate,
}: {
  name: string;
  weddingDate: string | null;
}) {
  const pathname = usePathname();
  const days = weddingDate ? daysUntil(weddingDate) : null;

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-linen bg-cream/60 px-4 py-8 lg:flex">
      <div className="px-3">
        <p className="font-display text-2xl leading-tight text-ink">{name}</p>
        <p className="mt-1 text-sm text-stone">
          {days === null ? "No date yet" : days > 0 ? `${days} days to go` : days === 0 ? "Today" : "Married"}
        </p>
      </div>

      <nav aria-label="Main" className="mt-8 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          // Guests stays lit on a guest's own page, too.
          const active =
            item.href === "/" ? pathname === "/" : !!item.href && pathname.startsWith(item.href);
          const body = (
            <>
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {!item.href && <span className="text-xs text-stone">Soon</span>}
            </>
          );
          const className = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
            active ? "bg-white text-ink shadow-[0_1px_2px_rgb(30_27_24/0.06)]" : "text-stone"
          }`;

          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${className} ${active ? "" : "hover:bg-white/60 hover:text-ink"}`}
            >
              {body}
            </Link>
          ) : (
            <span key={item.label} className={`${className} opacity-60`}>
              {body}
            </span>
          );
        })}
      </nav>
    </aside>
  );
}
