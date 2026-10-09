import Link from "next/link";

/**
 * Guests | Suppliers, as a small rounded switch in the top-right corner of
 * People (owner's pick, canvas "Guest list · Round 13", 9 Oct 2026). Each
 * half is a link, so the tab lives in the address.
 */
export default function PeopleTabs({ current }: { current: "guests" | "suppliers" }) {
  const tabs = [
    { key: "guests", label: "Guests", href: "/people" },
    { key: "suppliers", label: "Suppliers", href: "/people?tab=suppliers" },
  ] as const;

  return (
    <nav aria-label="People" className="flex justify-end">
      <span className="flex rounded-full bg-cream p-[3px]">
        {tabs.map((tab) => {
          const on = tab.key === current;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={on ? "page" : undefined}
              className={`flex h-8 items-center rounded-full px-3.5 text-[13px] transition ${
                on ? "bg-white text-ink shadow-[0_1px_4px_rgb(60_50_40/0.12)]" : "text-stone hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </span>
    </nav>
  );
}
