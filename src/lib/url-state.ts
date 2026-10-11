/**
 * Keeping a screen's view in its web address (owner's call, 11 Oct 2026):
 * the calendar's month, the guest list's search and filters. Each change
 * *replaces* the current address rather than adding one, so the back button
 * still goes to the previous screen — and coming back from an item returns
 * to this exact view. Tapping the tab in the menu opens it fresh.
 *
 * Browser-only: call from event handlers or effects.
 */
export function replaceQuery(changes: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(changes)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
