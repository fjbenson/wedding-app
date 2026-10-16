import { rememberView } from "./last-view";

/**
 * Keeping a screen's view in its web address (owner's call, 11 Oct 2026):
 * the calendar's month, the guest list's search and filters. Each change
 * *replaces* the current address rather than adding one, so the back button
 * still goes to the previous screen — and coming back from an item returns
 * to this exact view. Tapping the tab in the menu opens it fresh.
 *
 * Browser-only: call from event handlers or effects.
 */
export function replaceQuery(changes: Record<string, string | null>, { sync = false }: { sync?: boolean } = {}) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(changes)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  // Passing the current history entry on marks the change as Next.js's own,
  // so `useSearchParams()` doesn't hear of it — right for a screen keeping
  // its own view (search, filters). `sync` passes none, so Next.js copies its
  // bits in and every `useSearchParams()` updates: the cards (?todo=, ?idea=…)
  // open and close by it (16 Oct 2026: without it, tapping an Inspo picture
  // did nothing and its card wouldn't close).
  window.history.replaceState(sync ? null : window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  rememberView(`${url.pathname}${url.search}`);
}
