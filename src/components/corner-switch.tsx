import Link from "next/link";

/**
 * A tab's views as a small rounded switch — Guests | Suppliers, Calendar |
 * List — on the same row as the tab's title (canvas 3 "Tab tops · Round 1",
 * option A, owner's pick 16 Oct 2026). It floats right, so the `PageTitle`
 * that follows sits beside it; on a very narrow phone the title drops under
 * it. No back arrow: the menu bar's house goes home. Each half is a link, so
 * the view lives in the address.
 */
export default function CornerSwitch({
  label,
  tabs,
}: {
  label: string;
  tabs: { label: string; href: string; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="float-right ml-3 py-0.5">
      <span className="flex rounded-full bg-cream p-[3px]">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`flex h-8 items-center rounded-full px-3 text-[13px] transition ${
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
