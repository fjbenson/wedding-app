"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import AssistantSheet from "@/components/assistant/assistant-sheet";
import { coupleName } from "@/lib/couple-name";
import { NAV } from "@/lib/nav";

/**
 * The bar along the top on laptops (canvas 3 "Laptop · Round 2", owner's pick
 * 18 Oct 2026: a sidebar felt too clinical for a wedding — "this is about
 * weddings and love"). Whose wedding on the left (the Hub says "The wedding
 * of", since its names are large underneath), the five tabs in a glass pill,
 * then Your notes, Inspo, the assistant's pen (the Hub has its own pill) and
 * Settings. Phones keep the floating menu bar.
 */
export default function TopBar({ name, inboxCount }: { name: string; inboxCount: number }) {
  const pathname = usePathname();
  const onHub = pathname === "/";
  const isActive = (href: string) => (href === "/" ? onHub : pathname.startsWith(href));
  const quiet = (active: boolean) =>
    `flex h-10 items-center gap-2 rounded-full px-3.5 text-sm ${active ? "bg-white text-ink" : "text-stone hover:text-ink"}`;

  return (
    <header className="sticky top-0 z-20 hidden bg-[#FBF7F0]/85 backdrop-blur-md print:!hidden lg:block">
      <div className="mx-auto flex h-[76px] max-w-[1328px] items-center gap-4 border-b border-champagne-400/60 px-14 [box-sizing:content-box]">
        <Link href="/" className="min-w-0 shrink truncate">
          {onHub ? (
            <span className="label">The wedding of</span>
          ) : (
            <span className="font-display text-[22px] font-light italic tracking-[-0.01em] text-ink">{coupleName(name)}</span>
          )}
        </Link>

        <nav
          aria-label="Main"
          className="ml-auto flex gap-0.5 rounded-full bg-white/55 p-1 shadow-[0_0_0_0.5px_rgb(60_50_40/0.1),0_12px_26px_-18px_rgb(60_50_40/0.4)]"
        >
          {NAV.map((tab) =>
            tab.href ? (
              <Link
                key={tab.label}
                href={tab.href}
                prefetch
                aria-current={isActive(tab.href) ? "page" : undefined}
                className={`flex h-9 items-center rounded-full px-4 text-sm ${
                  isActive(tab.href) ? "bg-white text-ink shadow-[0_1px_3px_rgb(60_50_40/0.15)]" : "text-stone hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            ) : null,
          )}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/inbox" aria-current={pathname === "/inbox" ? "page" : undefined} className={quiet(pathname === "/inbox")}>
            Notes
            {inboxCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-champagne-600 px-1 text-xs text-white">
                {inboxCount}
              </span>
            )}
          </Link>
          <Link href="/inspo" aria-current={pathname.startsWith("/inspo") ? "page" : undefined} className={quiet(pathname.startsWith("/inspo"))}>
            Inspo
          </Link>
          {!onHub && <AssistantSheet variant="bar" />}
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${pathname === "/settings" ? "bg-white text-ink" : "text-stone hover:text-ink"}`}
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
