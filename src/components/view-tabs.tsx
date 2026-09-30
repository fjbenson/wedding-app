import Link from "next/link";

/**
 * A two-or-three-way switch between views of one page — Guests | Suppliers,
 * By date | By area. Each option is a link, so the view lives in the address
 * and survives a refresh or a shared link.
 */
export default function ViewTabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { label: string; href: string; active: boolean; count?: number }[];
}) {
  return (
    <nav
      aria-label={label}
      className="mt-4 grid auto-cols-fr grid-flow-col rounded-2xl border border-linen bg-cream/60 p-1 lg:max-w-sm"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm transition ${
            tab.active ? "bg-white text-ink shadow-[0_1px_2px_rgb(30_27_24/0.08)]" : "text-stone hover:text-ink"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={tab.active ? "text-champagne-600" : "text-stone/70"}>{tab.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
