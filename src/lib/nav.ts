import { CalendarDays, Home, Mail, Users, type LucideIcon } from "lucide-react";

/**
 * The app's main screens. The phone's bottom menu bar and the desktop
 * sidebar both draw from this list, so they can't drift apart.
 */
export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string | null; // null until that screen exists
}

export const NAV: NavItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Guests", icon: Users, href: "/guests" },
  { label: "Timeline", icon: CalendarDays, href: "/timeline" },
  { label: "RSVPs", icon: Mail, href: "/rsvps" },
];
