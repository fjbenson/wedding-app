/**
 * Suggested roles on the day, offered on the guest form and the guest card.
 * It's free text underneath, so a couple can add their own.
 */
export const GUEST_ROLES = [
  "Maid of honour",
  "Bridesmaid",
  "Best man",
  "Groomsman",
  "Usher",
  "Flower girl",
  "Page boy",
  "Ring bearer",
  "Reader",
  "Officiant",
  "Parent of the couple",
];

/**
 * A guest can have more than one role (a bridesmaid who also does a reading).
 * They live in the one `role_on_the_day` column, joined with " · " — so the
 * run sheet and seating, which just print the column, read naturally, and no
 * new column was needed.
 */
const SEPARATOR = " · ";

export function rolesOf(guest: { role_on_the_day: string | null }): string[] {
  return (guest.role_on_the_day ?? "")
    .split("·")
    .map((role) => role.trim())
    .filter(Boolean);
}

/** The column's value for a list of roles: tidied, no repeats, null for none. */
export function joinRoles(roles: string[]): string | null {
  const tidy = roles.map((role) => role.replace(/·/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  const unique = tidy.filter((role, i) => tidy.findIndex((r) => r.toLowerCase() === role.toLowerCase()) === i);
  return unique.length > 0 ? unique.join(SEPARATOR) : null;
}

/** Roles in the usual order (maid of honour first), then a couple's own. */
export function roleRank(role: string): number {
  const i = GUEST_ROLES.indexOf(role);
  return i === -1 ? GUEST_ROLES.length : i;
}
