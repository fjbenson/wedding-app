import type { Milestone } from "@/types/db";

/**
 * A to-do is either "done by" a date (`due_date`) or a nudge to "start
 * around" one: "Start looking at photographers" in October (Plan round 4,
 * 10 Oct 2026). A nudge keeps its date in `remind_at` — a column 0001
 * already had — with no `due_date`, so it needed no migration. A nudge's
 * date passing doesn't make it overdue; it just means "start now".
 */
export function isNudge(m: Milestone): boolean {
  return !m.due_date && !!m.remind_at;
}

/** The day a to-do sits on in the plan: its due date, or a nudge's start date. */
export function planDate(m: Milestone): string | null {
  return m.due_date ?? m.remind_at?.slice(0, 10) ?? null;
}
