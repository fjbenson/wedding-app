/**
 * Where you were on each screen, so a form's "‹ Plan" and its Save take you
 * back to that exact view (the List, a month, a filter) rather than the
 * screen's fresh start. Kept for this visit only (sessionStorage), keyed by
 * the screen's path; `ViewMemory` in the (app) layout and `replaceQuery()`
 * record it. Tapping a tab in the menu still starts fresh — only the way
 * back uses this.
 *
 * Browser-only: call from event handlers or effects.
 */
const KEY = "last-view";

function read(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function rememberView(url: string) {
  try {
    const views = read();
    views[url.split("?")[0]] = url;
    sessionStorage.setItem(KEY, JSON.stringify(views));
  } catch {
    // Private browsing or storage blocked: the way back just starts fresh.
  }
}

/**
 * The view to go back to for `href` ("/plan", "/money?view=month"): the one
 * last seen on that screen, if it agrees with everything `href` asks for —
 * so going back to Payments never lands on Budget.
 */
export function lastView(href: string): string {
  const want = new URL(href, "http://x");
  const seen = read()[want.pathname];
  if (!seen) return href;
  const have = new URL(seen, "http://x");
  for (const [key, value] of want.searchParams) {
    if (have.searchParams.get(key) !== value) return href;
  }
  return seen;
}
