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
 * shows, greyed, so the shape of the app is visible from day one.
 */
export interface Area {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string | null;
}

export const AREAS: Area[] = [
  { id: "guests", label: "Guests", icon: Users, href: null },
  { id: "timeline", label: "Timeline", icon: CalendarDays, href: null },
  { id: "venue", label: "Venue", icon: MapPin, href: null },
  { id: "flowers", label: "Flowers", icon: Flower2, href: null },
  { id: "cake", label: "Cake", icon: Cake, href: null },
  { id: "photography", label: "Photos", icon: Camera, href: null },
  { id: "music", label: "Music", icon: Music, href: null },
  { id: "attire", label: "Attire", icon: Shirt, href: null },
];
