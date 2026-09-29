import Link from "next/link";
import { CalendarDays, Home, Mail, Users, type LucideIcon } from "lucide-react";

interface Tab {
  label: string;
  icon: LucideIcon;
  href: string | null; // null until that screen exists
}

const TABS: Tab[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Guests", icon: Users, href: "/guests" },
  { label: "Timeline", icon: CalendarDays, href: null },
  { label: "RSVPs", icon: Mail, href: null },
];

/** The floating glass menu bar at the bottom of the screen. */
export default function MenuBar({ current }: { current: string }) {
  return (
    <nav
      aria-label="Main"
      className="glass fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 gap-0.5 rounded-full p-1"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.href === current;
        const className = `flex h-10 w-14 items-center justify-center rounded-full text-ink ${
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
