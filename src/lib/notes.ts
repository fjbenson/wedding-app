import type { Note } from "@/types/db";

/** Still waiting for a decision: not filed under an area, and not made into a to-do. */
export function toSort(note: Note): boolean {
  return !note.area_key && !note.milestone_id;
}
