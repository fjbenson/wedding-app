import { CalendarDays, Clock, Orbit, PoundSterling, Users, type LucideIcon } from "lucide-react";

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
  { label: "Hub", icon: Orbit, href: "/" }, // the hub ring: areas around the centre
  { label: "People", icon: Users, href: "/people" },
  { label: "Plan", icon: CalendarDays, href: "/plan" },
  { label: "Money", icon: PoundSterling, href: "/money" },
  { label: "The Day", icon: Clock, href: "/day" },
];

/**
 * Screens that show the phone's menu bar: the five tabs, plus the pages
 * reached from them that aren't forms (area page, inbox, Inspo, one Inspo
 * idea, invitations, a household, settings) — so there's always a way home.
 * Forms leave it off, since it would sit over their save button; they have
 * their own "back" link instead. A new screen that isn't a form goes here.
 */
const SCREENS: RegExp[] = [
  /^\/(people|plan|money|day|inbox|inspo|invitations|settings)?$/,
  /^\/area\/(?!new$)[^/]+$/,
  /^\/inspo\/(?!new$)[^/]+$/,
  /^\/people\/household\/[^/]+$/,
];

export function showsMenuBar(pathname: string): boolean {
  return SCREENS.some((pattern) => pattern.test(pathname));
}
