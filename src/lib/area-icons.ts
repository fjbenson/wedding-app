import { Dress, Suit } from "./clothes-icons";
import {
  Armchair,
  Baby,
  BedDouble,
  Beer,
  Bell,
  Bike,
  BookOpen,
  Brush,
  Bus,
  Cake,
  Camera,
  Car,
  Cat,
  Church,
  Clock,
  Coffee,
  Cookie,
  Crown,
  Dog,
  Feather,
  Flame,
  Flower2,
  Gamepad2,
  Gem,
  Gift,
  Guitar,
  HandHeart,
  Heart,
  Landmark,
  Leaf,
  Lightbulb,
  Mail,
  MapPin,
  Martini,
  Mic,
  Moon,
  Music,
  Palette,
  PartyPopper,
  Plane,
  Rainbow,
  Ribbon,
  Scissors,
  Shirt,
  Ship,
  Sparkles,
  Speaker,
  Star,
  Sun,
  Tent,
  Ticket,
  TreePine,
  Umbrella,
  Users,
  UtensilsCrossed,
  Video,
  Wine,
  type LucideIcon,
} from "lucide-react";

/**
 * The icons an area can have (owner, 12 Oct 2026): a shortlist from Lucide,
 * the icon set the whole app uses, each with the words people might search
 * for. An area stores the icon's name (`areas.icon`, 0016_area_icon.sql).
 * To offer another, add a line here — nothing else changes.
 */
export const AREA_ICONS: { name: string; icon: LucideIcon; words: string }[] = [
  { name: "MapPin", icon: MapPin, words: "venue place location where" },
  { name: "Camera", icon: Camera, words: "photos photography photographer pictures" },
  { name: "Video", icon: Video, words: "video film videographer" },
  { name: "UtensilsCrossed", icon: UtensilsCrossed, words: "food catering caterer meal dinner breakfast menu" },
  { name: "Cake", icon: Cake, words: "cake dessert" },
  { name: "Cookie", icon: Cookie, words: "favours sweets treats biscuits" },
  { name: "Wine", icon: Wine, words: "drinks wine bar toast" },
  { name: "Martini", icon: Martini, words: "cocktails drinks bar" },
  { name: "Beer", icon: Beer, words: "beer pub drinks bar" },
  { name: "Coffee", icon: Coffee, words: "coffee tea" },
  { name: "Flower2", icon: Flower2, words: "flowers florist bouquet" },
  { name: "Leaf", icon: Leaf, words: "greenery plants garden decor" },
  { name: "TreePine", icon: TreePine, words: "outdoor woods garden" },
  { name: "Music", icon: Music, words: "music band dj songs dancing" },
  { name: "Guitar", icon: Guitar, words: "band musicians live music" },
  { name: "Mic", icon: Mic, words: "speeches singer host" },
  { name: "Speaker", icon: Speaker, words: "sound pa speakers" },
  // Drawn for us (clothes-icons.ts): Lucide has no dress or suit.
  { name: "Dress", icon: Dress, words: "attire outfits dress gown bride bridesmaids clothes" },
  { name: "Suit", icon: Suit, words: "attire outfits suit tux tuxedo groom groomsmen clothes" },
  { name: "Shirt", icon: Shirt, words: "clothes shirt casual" },
  { name: "Brush", icon: Brush, words: "hair makeup beauty" },
  { name: "Scissors", icon: Scissors, words: "hair diy crafts" },
  { name: "Gem", icon: Gem, words: "rings jewellery engagement" },
  { name: "Crown", icon: Crown, words: "bridal tiara queen king" },
  { name: "Mail", icon: Mail, words: "stationery invitations invites save the dates post" },
  { name: "BookOpen", icon: BookOpen, words: "vows readings guestbook order of service" },
  { name: "Feather", icon: Feather, words: "calligraphy writing vows" },
  { name: "Car", icon: Car, words: "transport car cars travel" },
  { name: "Bus", icon: Bus, words: "transport coach bus travel" },
  { name: "Plane", icon: Plane, words: "honeymoon travel flights abroad" },
  { name: "Ship", icon: Ship, words: "honeymoon cruise boat" },
  { name: "BedDouble", icon: BedDouble, words: "accommodation hotel rooms stay" },
  { name: "Tent", icon: Tent, words: "marquee tent glamping camping" },
  { name: "Church", icon: Church, words: "ceremony church" },
  { name: "Landmark", icon: Landmark, words: "registry office ceremony legal notice" },
  { name: "Lightbulb", icon: Lightbulb, words: "lighting lights fairy lights" },
  { name: "Flame", icon: Flame, words: "fireworks candles fire pit sparklers" },
  { name: "Sparkles", icon: Sparkles, words: "sparkle magic extras other" },
  { name: "PartyPopper", icon: PartyPopper, words: "party hen stag celebration entertainment" },
  { name: "Gamepad2", icon: Gamepad2, words: "games entertainment" },
  { name: "Ticket", icon: Ticket, words: "entertainment photo booth activities" },
  { name: "Palette", icon: Palette, words: "decor styling colours theme" },
  { name: "Armchair", icon: Armchair, words: "furniture hire chairs tables" },
  { name: "Gift", icon: Gift, words: "gifts presents registry favours" },
  { name: "Ribbon", icon: Ribbon, words: "favours decorations bows" },
  { name: "Heart", icon: Heart, words: "love us the two of us" },
  { name: "HandHeart", icon: HandHeart, words: "charity giving thank you" },
  { name: "Users", icon: Users, words: "guests family friends people" },
  { name: "Baby", icon: Baby, words: "children kids babysitter creche" },
  { name: "Dog", icon: Dog, words: "dog pets" },
  { name: "Cat", icon: Cat, words: "cat pets" },
  { name: "Bike", icon: Bike, words: "bike cycling" },
  { name: "Umbrella", icon: Umbrella, words: "weather rain plan b" },
  { name: "Sun", icon: Sun, words: "weather sun summer daytime" },
  { name: "Moon", icon: Moon, words: "evening night" },
  { name: "Star", icon: Star, words: "star special" },
  { name: "Rainbow", icon: Rainbow, words: "rainbow pride colour" },
  { name: "Bell", icon: Bell, words: "bells reminders" },
  { name: "Clock", icon: Clock, words: "timings schedule day" },
];

export function iconByName(name: string | null | undefined): LucideIcon | undefined {
  return name ? AREA_ICONS.find((i) => i.name === name)?.icon : undefined;
}

/** The icons matching a search ("lights" finds the bulb); everything when empty. */
export function searchIcons(query: string) {
  // Little words ("the dog", "hen do") would match everything.
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !["the", "and", "our", "for", "do", "of", "us", "an", "to", "my"].includes(w));
  if (words.length === 0) return query.trim() ? [] : AREA_ICONS;
  // "lights" matches "lighting", "flower" matches "flowers": match on the start.
  return AREA_ICONS.filter((i) => {
    const own = `${i.name.toLowerCase()} ${i.words}`.split(" ");
    return words.some((w) => own.some((o) => o.startsWith(w.slice(0, Math.max(4, w.length - 1))) || (o.length >= 4 && w.startsWith(o))));
  });
}

/** A first guess from the area's name ("Fireworks" → the flame), or the sparkle. */
export function guessIcon(label: string): string {
  return (label.trim() && searchIcons(label)[0]?.name) || "Sparkles";
}
