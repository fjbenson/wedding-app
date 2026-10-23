"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AssistantSheet from "@/components/assistant/assistant-sheet";
import AccountButton from "@/components/account-button";
import { NAV } from "@/lib/nav";

/**
 * The laptop's menu down the left (canvas 4 "Laptop · Round 7", G, owner's
 * pick 20 Oct 2026): it gives the Hub's ring a column either side, as the
 * first sidebar did, but set like a magazine's contents rather than an app's
 * menu — the logo (a placeholder for now), the five tabs numbered in Fraunces with no icons,
 * then Your notes, Inspo, Ask Juno, and Settings at the foot (behind the
 * couple's monogram since 23 Oct 2026, `AccountButton`). It replaced the
 * bar along the top (18 Oct 2026). Phones keep the floating menu bar.
 */
export default function SideBar({
  name,
  inboxCount,
  email,
  manyWeddings,
}: {
  name: string;
  inboxCount: number;
  email: string | null;
  manyWeddings: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const quiet = (active: boolean) => `flex items-center justify-between text-sm ${active ? "text-ink" : "text-stone hover:text-ink"}`;
  const tabs = NAV.filter((t) => t.href);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] flex-col border-r border-champagne-400/45 bg-[#FFFDF8]/55 px-[30px] pb-8 pt-10 print:!hidden lg:flex">
      {/* A placeholder logo (canvas 5 "Laptop · Round 17", B, owner's pick 23 Oct
          2026): a little ring like the Hub's and the working name, so the
          couple's names show once, at the foot. Swap it when the name's chosen. */}
      <Link href="/" className="flex items-center gap-3 text-ink">
        <RingMark />
        <span className="font-display text-[30px] font-light italic leading-none tracking-[-0.02em]">Rondé</span>
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

      <AccountButton name={name} email={email} manyWeddings={manyWeddings} />
    </aside>
  );
}

/** The placeholder mark: a fine gold ring with six small stops round it, like the Hub's. */
function RingMark() {
  const stops = Array.from({ length: 6 }, (_, i) => (i * Math.PI) / 3 - Math.PI / 2);
  return (
    <svg viewBox="0 0 32 32" width="34" height="34" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden className="shrink-0 text-champagne-600">
      <circle cx="16" cy="16" r="11" />
      {stops.map((a) => (
        <circle key={a} cx={(16 + 11 * Math.cos(a)).toFixed(2)} cy={(16 + 11 * Math.sin(a)).toFixed(2)} r="1.6" fill="#FFFDF8" />
      ))}
      <circle cx="16" cy="16" r="4.2" fill="#F1E7D4" stroke="none" />
    </svg>
  );
}
