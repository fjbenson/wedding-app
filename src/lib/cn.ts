/**
 * Joins class names, dropping anything falsy.
 *
 *   cn("p-4", isActive && "bg-rose-50")  ->  "p-4 bg-rose-50"
 *
 * Deliberately tiny — it saves a dependency, and conditional classes are the
 * only thing we actually need.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
