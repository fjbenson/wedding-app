import {
  Brush,
  Cake,
  Camera,
  CalendarDays,
  Car,
  Flower2,
  Mail,
  MapPin,
  Music,
  Shirt,
  Sparkles,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/**
 * The area picker on a to-do (Plan). This was the hub's original hard-coded
 * set of dots; the hub now draws each wedding's own `areas` rows instead.
 * Screen 18 (tasks grouped by area) should move to those rows too, and drop
 * the Guests and Timeline entries, which are tabs rather than areas.
 */
export interface Area {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string | null;
}

export const AREAS: Area[] = [
  { id: "guests", label: "Guests", icon: Users, href: "/people" },
  { id: "timeline", label: "Timeline", icon: CalendarDays, href: "/plan" },
  { id: "venue", label: "Venue", icon: MapPin, href: null },
  { id: "flowers", label: "Flowers", icon: Flower2, href: null },
  { id: "cake", label: "Cake", icon: Cake, href: null },
  { id: "photography", label: "Photos", icon: Camera, href: null },
  { id: "music", label: "Music", icon: Music, href: null },
  { id: "attire", label: "Attire", icon: Shirt, href: null },
];

/** "venue" → "Venue". Falls back to whatever was stored. */
export function areaLabel(id: string | null): string | null {
  if (!id) return null;
  return AREAS.find((area) => area.id === id)?.label ?? id;
}

/**
 * The starter areas offered at first-run setup (docs/information-architecture.md:
 * "A starter set ships … and couples add or delete"). Once chosen they're rows
 * in the `areas` table; this list only supplies the defaults and each key's
 * icon. An area a couple adds themselves gets a plain sparkle.
 */
export const STARTER_AREAS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "venue", label: "Venue", icon: MapPin },
  { key: "photography", label: "Photos", icon: Camera },
  { key: "food", label: "Food & drink", icon: UtensilsCrossed },
  { key: "flowers", label: "Flowers", icon: Flower2 },
  { key: "cake", label: "Cake", icon: Cake },
  { key: "music", label: "Music", icon: Music },
  { key: "attire", label: "Attire", icon: Shirt },
  { key: "hair-makeup", label: "Hair & makeup", icon: Brush },
  { key: "stationery", label: "Stationery", icon: Mail },
  { key: "transport", label: "Transport", icon: Car },
];

export function areaIcon(key: string): LucideIcon {
  return STARTER_AREAS.find((a) => a.key === key)?.icon ?? Sparkles;
}

/** "Fireworks!" → "fireworks", "Hair & makeup" → "hair-makeup". */
export function areaKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * What a supplier does. These are the plan's starter areas
 * (docs/information-architecture.md, "Areas are rows"), so when areas become
 * database rows a supplier's category lines up with its area by `id`.
 */
export const SUPPLIER_CATEGORIES: { id: string; label: string }[] = [
  { id: "venue", label: "Venue" },
  { id: "photography", label: "Photography" },
  { id: "food", label: "Food & drink" },
  { id: "flowers", label: "Flowers" },
  { id: "cake", label: "Cake" },
  { id: "music", label: "Music" },
  { id: "attire", label: "Attire" },
  { id: "hair-makeup", label: "Hair & makeup" },
  { id: "stationery", label: "Stationery" },
  { id: "transport", label: "Transport" },
  { id: "other", label: "Other" },
];

export function supplierCategoryLabel(id: string | null): string | null {
  if (!id) return null;
  return SUPPLIER_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
