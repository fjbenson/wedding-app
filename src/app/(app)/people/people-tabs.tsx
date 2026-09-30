import Link from "next/link";

/**
 * Guests | Suppliers at the top of People (docs/information-architecture.md:
 * guests, bridal party and suppliers are tabs of one page). Bridal party
 * joins as a filtered view of guests later.
 */
export default function PeopleTabs({
  current,
  guestCount,
  supplierCount,
}: {
  current: "guests" | "suppliers";
  guestCount: number;
  supplierCount: number;
}) {
  const tabs = [
    { id: "guests", label: "Guests", count: guestCount, href: "/people" },
    { id: "suppliers", label: "Suppliers", count: supplierCount, href: "/people?tab=suppliers" },
  ] as const;

  return (
    <nav aria-label="People" className="mt-4 grid grid-cols-2 rounded-2xl border border-linen bg-cream/60 p-1 lg:max-w-sm">
      {tabs.map((tab) => {
        const active = tab.id === current;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm transition ${
              active ? "bg-white text-ink shadow-[0_1px_2px_rgb(30_27_24/0.08)]" : "text-stone hover:text-ink"
            }`}
          >
            {tab.label}
            <span className={active ? "text-champagne-600" : "text-stone/70"}>{tab.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
