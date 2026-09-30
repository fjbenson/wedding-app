import {
  Brush,
  Cake,
  Camera,
  Car,
  Flower2,
  Mail,
  MapPin,
  Music,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** An area as the rest of the app needs it: its stable key and its name. */
export interface AreaOption {
  key: string;
  label: string;
}

/**
 * A wedding's areas to offer and group by: its own switched-on `areas` rows,
 * or the starter set if the database has no areas table yet (listAreas → null).
 */
export function areaOptions(rows: { key: string; label: string; enabled: boolean }[] | null): AreaOption[] {
  return rows ? rows.filter((r) => r.enabled) : STARTER_AREAS.map(({ key, label }) => ({ key, label }));
}

/**
 * Names for keys that aren't areas: "Guests" and "Timeline" are tabs, but
 * to-dos tagged before areas were rows may carry them; "other" is a
 * supplier that fits no area.
 */
const OLDER_KEYS: Record<string, string> = { guests: "Guests", timeline: "Timeline", other: "Other" };

/** What a supplier can be filed under: the wedding's areas, plus "Other". */
export function supplierCategories(areas: AreaOption[]): AreaOption[] {
  return [...areas, { key: "other", label: "Other" }];
}

/** The name for an area key, even one the wedding has since switched off. */
export function areaName(key: string | null, areas: AreaOption[]): string | null {
  if (!key) return null;
  return (
    areas.find((a) => a.key === key)?.label ??
    STARTER_AREAS.find((a) => a.key === key)?.label ??
    OLDER_KEYS[key] ??
    key
  );
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
