"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AssistantSheet from "@/components/assistant/assistant-sheet";
import AccountButton from "@/components/account-button";
import { coupleName } from "@/lib/couple-name";
import { NAV } from "@/lib/nav";

/**
 * The laptop's menu down the left (canvas 4 "Laptop · Round 7", G, owner's
 * pick 20 Oct 2026): it gives the Hub's ring a column either side, as the
 * first sidebar did, but set like a magazine's contents rather than an app's
 * menu — whose wedding, the five tabs numbered in Fraunces with no icons,
 * then Your notes, Inspo, Ask Juno, and Settings at the foot (behind the
 * couple's monogram since 23 Oct 2026, `AccountButton`). It replaced the
 * bar along the top (18 Oct 2026). Phones keep the floating menu bar.
 */
export default function SideBar({ name, inboxCount }: { name: string; inboxCount: number }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const quiet = (active: boolean) => `flex items-center justify-between text-sm ${active ? "text-ink" : "text-stone hover:text-ink"}`;
  const tabs = NAV.filter((t) => t.href);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col border-r border-champagne-400/45 bg-[#FFFDF8]/55 px-[30px] pb-8 pt-10 print:!hidden lg:flex">
      <Link href="/" className="block">
        <span className="label">The wedding of</span>
        <span className="mt-2 block font-display text-[28px] font-light italic leading-[1.1] tracking-[-0.01em] text-ink">{coupleName(name)}</span>
        <span aria-hidden className="mt-2 block h-px w-10 bg-champagne-400" />
      </Link>

      <nav aria-label="Main" className="mt-8 flex flex-col">
        {tabs.map((tab, i) => {
          const on = isActive(tab.href!);
          return (
            <Link
              key={tab.label}
              href={tab.href!}
              prefetch
              aria-current={on ? "page" : undefined}
              className={`flex items-baseline gap-3.5 py-2.5 ${on ? "text-ink" : "text-stone hover:text-ink"}`}
            >
              <span className={`font-display text-[13px] ${on ? "text-champagne-600" : "text-stone/60"}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className={`font-display text-[22px] ${on ? "italic" : ""}`}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex flex-col gap-3 border-t border-champagne-400/50 pt-5">
        <Link href="/inbox" aria-current={pathname === "/inbox" ? "page" : undefined} className={quiet(pathname === "/inbox")}>
          Your notes
          {inboxCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-champagne-100 px-1 text-xs text-champagne-600">{inboxCount}</span>
          )}
        </Link>
        <Link href="/inspo" aria-current={pathname.startsWith("/inspo") ? "page" : undefined} className={quiet(pathname.startsWith("/inspo"))}>
          Inspo
        </Link>
      </div>

      <div className="mt-6">
        <AssistantSheet variant="hub" />
      </div>

      <AccountButton name={name} />
    </aside>
  );
}
