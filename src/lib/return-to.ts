/**
 * Where a form's Save (or Remove) goes afterwards: the `return_to` the form
 * sent (`<ReturnTo>`, the view you came from), if it's a page of the same
 * screen as `fallback`; otherwise `fallback`. Never another site.
 */
export function returnTo(formData: FormData | undefined, fallback: string): string {
  const sent = formData?.get("return_to");
  if (typeof sent !== "string") return fallback;
  const screen = fallback.split("?")[0];
  if (sent === screen || sent.startsWith(`${screen}?`)) return sent;
  return fallback;
}

/**
 * Where an edit form's Save lands: the same form, freshly loaded with what's
 * now saved (owner, 12 Oct 2026: saving or cancelling shouldn't leave the
 * form). `saved` makes the form start afresh and shows a "Saved" note
 * (`ResetBoundary` in FormPage).
 */
export function stayAfterSave(path: string): string {
  return `${path}?saved=${Date.now()}`;
}
