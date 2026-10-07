/**
 * The couple's names as the home screen sets them: "Frankie & Sam", never
 * "Frankie and Sam". Setup joins the two names with " & ", but Settings is a
 * free-text box, so a typed "and" (or "+") is turned into an ampersand too.
 * Only a whole word between two names changes — "Alexandra" stays as it is.
 */
export function coupleName(name: string): string {
  return name.trim().replace(/\s+(?:and|\+)\s+/i, " & ");
}
