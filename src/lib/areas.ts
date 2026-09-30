import {
  Cake,
  Camera,
  CalendarDays,
  Flower2,
  MapPin,
  Music,
  Shirt,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The dots around the hub — one per area of the wedding.
 *
 * `href` is null until that area has a screen. A dot with no screen still
 * shows (it just doesn't open anything), so the shape of the app is visible
 * from day one.
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
