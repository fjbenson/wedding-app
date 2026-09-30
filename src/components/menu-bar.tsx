"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

/**
 * The floating glass menu bar at the bottom of the screen. Phones and tablets
 * only, and only on the main screens — on a form it would sit over the save
 * button.
 */
export default function MenuBar() {
  const pathname = usePathname();
  if (!NAV.some((tab) => tab.href === pathname)) return null;

  return (
    <nav
      aria-label="Main"
      className="glass fixed print:hidden bottom-[max(12px,env(safe-area-inset-bottom))] md:bottom-6 left-1/2 lg:hidden z-10 flex -translate-x-1/2 gap-0.5 rounded-full p-1"
    >
      {NAV.map((tab) => {
        const Icon = tab.icon;
        const active = tab.href === pathname;
        const className = `flex h-11 w-14 items-center justify-center rounded-full text-ink ${
          active ? "bg-ink/[0.08]" : ""
        } ${tab.href ? "" : "opacity-40"}`;
        const icon = <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} aria-hidden />;

        return tab.href ? (
          <Link
            key={tab.label}
            href={tab.href}
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
  );
}
