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
