import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * The top of a tab with two views: a back arrow to the Hub on the left
 * (phones — laptops have the sidebar), and the views as a small rounded
 * switch in the right-hand corner — Guests | Suppliers, By date | By area
 * (canvas "Guest list · Round 13", 9 Oct 2026). Each half is a link, so the
 * view lives in the address.
 */
export default function CornerSwitch({
  label,
  tabs,
}: {
  label: string;
  tabs: { label: string; href: string; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3">
      <Link
        href="/"
        aria-label="Back to the hub"
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-cream lg:invisible"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.6} aria-hidden />
      </Link>
      <span className="flex rounded-full bg-cream p-[3px]">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`flex h-8 items-center rounded-full px-3.5 text-[13px] transition ${
              tab.active ? "bg-white text-ink shadow-[0_1px_4px_rgb(60_50_40/0.12)]" : "text-stone hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </span>
    </nav>
  );
}
