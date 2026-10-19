import { formatClock } from "@/lib/dates";
import type { MenuCourseWithDishes } from "@/lib/db/menu";
import type { MealCounts } from "@/lib/meals";
import type { Drink, RunSheetItem } from "@/types/db";

/*
 * Food and drink through the day (canvas 3 "Food & drink · Round 2", A, owner's
 * pick 19 Oct 2026): the Food & drink area's moments, each with the courses and
 * drinks served at it and who they're for, worked out from the guest list.
 * Moments are ordinary run sheet moments, so they're on The Day too.
 */
export interface FoodMoment {
  courses: { name: string; dishes: string[] }[];
  drinks: { name: string }[];
  /** "75 day guests", "64 adult · 9 child's", "58 drinking · 17 soft". */
  chips: string[];
}

const n = (count: number, word: string) => `${count} ${word}`;

/** Moment id → what's served at it. Only moments with a course or drink linked. */
export function foodByMoment(
  moments: RunSheetItem[],
  courses: MenuCourseWithDishes[],
  drinks: Drink[],
  counts: { all: MealCounts; day: MealCounts },
): Record<string, FoodMoment> {
  const out: Record<string, FoodMoment> = {};
  for (const m of moments) {
    const cs = courses.filter((c) => c.moment_id === m.id);
    const ds = drinks.filter((d) => d.moment_id === m.id);
    if (cs.length + ds.length === 0) continue;
    const chips: string[] = [];
    // A course for the evening guests too is for everyone coming; otherwise it's the day guests.
    const fed = cs.some((c) => c.evening) ? counts.all : counts.day;
    if (cs.length) {
      const people = fed.adult + fed.child + fed.none;
      chips.push(
        [n(fed.adult, "adult"), fed.child ? n(fed.child, "child's") : "", fed.none ? n(fed.none, "no meal") : ""].filter(Boolean).join(" · ") ||
          n(people, "guests"),
      );
    }
    if (ds.length) {
      // Drinks before the evening are for the day guests; later ones for everyone.
      const who = m.at_time.slice(0, 5) < "18:00" ? counts.day : counts.all;
      chips.push(who.soft ? `${who.drinking} drinking · ${who.soft} soft` : n(who.drinking, "drinking"));
    }
    out[m.id] = { courses: cs.map((c) => ({ name: c.name, dishes: c.dishes.map((d) => d.name) })), drinks: ds.map((d) => ({ name: d.name })), chips };
  }
  return out;
}

/** "17:00 · Wedding breakfast" for a summary line. */
export const momentLine = (m: RunSheetItem) => `${m.title} · ${formatClock(m.at_time)}`;
