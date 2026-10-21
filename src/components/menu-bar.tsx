"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AssistantSheet from "@/components/assistant/assistant-sheet";
import { NAV, showsMenuBar } from "@/lib/nav";

/**
 * The floating glass menu bar at the bottom of the screen, with Juno in a
 * round button of its own beside it (owner, 21 Oct 2026, canvas 4 "Phone ·
 * Round 1", A: the floating pen covered the right edge of lists). Phones and
 * tablets only, on every screen except forms (see showsMenuBar) — on a form
 * it would sit over the save button.
 */
export default function MenuBar() {
  const pathname = usePathname();
  if (!showsMenuBar(pathname)) return null;

  return (
    // No z-index here: Juno's panel opens inside it and has to sit above the page.
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] flex items-center justify-center gap-2.5 print:hidden md:bottom-6 lg:hidden">
    <nav aria-label="Main" className="glass pointer-events-auto relative z-10 flex gap-0.5 rounded-full p-1">
      {NAV.map((tab) => {
        const Icon = tab.icon;
        // A tab stays lit on the pages inside it (People on a household).
        const active = tab.href === "/" ? pathname === "/" : !!tab.href && pathname.startsWith(tab.href);
        const className = `flex h-11 w-10 items-center min-[360px]:w-11 justify-center rounded-full text-ink ${
          active ? "bg-ink/[0.08]" : ""
        } ${tab.href ? "" : "opacity-40"}`;
        const icon = <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} aria-hidden />;

        return tab.href ? (
          <Link
            key={tab.label}
            href={tab.href}
            // Fetch each tab in full while the bar is on screen, so a tap
            // shows the real page at once instead of a placeholder.
            prefetch
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            {icon}
          </Link>
        ) : (
          <span key={tab.label} title={`${tab.label} — coming soon`} className={className}>
            {icon}
          </span>
        );
      })}
    </nav>
    <AssistantSheet variant="tab" />
    </div>
  );
}
