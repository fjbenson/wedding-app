import { CalendarDays, CircleDot, Clock, PoundSterling, Users, type LucideIcon } from "lucide-react";

/**
 * The five tabs from docs/information-architecture.md. The phone's bottom
 * menu bar and the desktop sidebar both draw from this list, so they can't
 * drift apart.
 */
export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string | null; // null until that tab is built
}

export const NAV: NavItem[] = [
  { label: "Hub", icon: CircleDot, href: "/" },
  { label: "People", icon: Users, href: "/people" },
  { label: "Plan", icon: CalendarDays, href: "/plan" },
  { label: "Money", icon: PoundSterling, href: "/money" },
  { label: "The Day", icon: Clock, href: null },
];
