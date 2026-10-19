import { formatDayMonth, todayISO } from "@/lib/dates";
import type { DecorItem, DecorSource, DecorStatus } from "@/types/db";

/*
 * Decor as its own special area (canvas 3 "Decor · Round 2 · Its own area",
 * owner's pick 19 Oct 2026). Its area page lists the things grouped by where
 * they go in place of the five stages, and The Day shows the same things as a
 * pack list. Plain values, so server and client screens can both use them.
 */

/** The area keys that get Decor's page. */
export const isDecorArea = (key: string) => key === "decor" || key === "decorations" || key === "styling";

/** Where things usually go, offered as one-tap picks; any other place can be typed. */
export const PLACES = [
  "Ceremony",
  "Arrival and entrance",
  "The tables",
  "The room",
  "Outside",
  "Bar and cake",
  "Evening",
  "Toilets",
  "Kit box",
];

export const STATUSES: { value: DecorStatus; label: string }[] = [
  { value: "to_get", label: "Still to get" },
  { value: "got", label: "Got it" },
  { value: "packed", label: "Packed" },
  { value: "returned", label: "Given back" },
];

export const SOURCES: { value: DecorSource; label: string }[] = [
  { value: "own", label: "Own" },
  { value: "borrowed", label: "Borrowed" },
  { value: "hired", label: "Hired" },
  { value: "bought", label: "Bought" },
  { value: "made", label: "Made" },
];

export const sourceLabel = (s: DecorSource | null) => SOURCES.find((x) => x.value === s)?.label ?? null;
export const statusLabel = (s: DecorStatus) => STATUSES.find((x) => x.value === s)?.label ?? s;

/** Borrowed and hired things go back after the day (or anything given a date to). */
export const goesBack = (item: Pick<DecorItem, "source" | "return_on">) =>
  item.source === "borrowed" || item.source === "hired" || !!item.return_on;

/** The circle's next step: still to get → got it → packed, then given back for what goes back. */
export function nextStatus(item: Pick<DecorItem, "status" | "source" | "return_on">): DecorStatus | null {
  if (item.status === "to_get") return "got";
  if (item.status === "got") return "packed";
  if (item.status === "packed" && goesBack(item)) return "returned";
  return null;
}

/** "40 jam jars" — the number only when there's more than one. */
export const withQuantity = (item: Pick<DecorItem, "name" | "quantity">) =>
  item.quantity && item.quantity > 1 ? `${item.quantity} × ${item.name}` : item.name;

/** Things grouped by where they go, in the usual order, then the couple's own places, then "Somewhere". */
export function byPlace<T extends Pick<DecorItem, "place">>(items: T[]): { place: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const place = item.place?.trim() || "Not placed yet";
    groups.set(place, [...(groups.get(place) ?? []), item]);
  }
  const rank = (p: string) => (p === "Not placed yet" ? 999 : PLACES.indexOf(p) === -1 ? 500 : PLACES.indexOf(p));
  return [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b)).map(([place, items]) => ({ place, items }));
}

/** Soonest first; no date last. */
const byDate = (a: string | null, b: string | null) => (a ?? "9999").localeCompare(b ?? "9999");

/**
 * The Day's pack list: what to get or collect before the day, what's set up
 * where, and what goes back after it.
 */
export function packList<T extends DecorItem>(items: T[]) {
  const before = items.filter((i) => i.status === "to_get" || i.status === "got").sort((a, b) => byDate(a.collect_on, b.collect_on));
  const setUp = byPlace(items.filter((i) => i.status !== "returned"));
  const after = items.filter((i) => goesBack(i)).sort((a, b) => Number(a.status === "returned") - Number(b.status === "returned") || byDate(a.return_on, b.return_on));
  return { before, setUp, after };
}

export function decorCounts(items: Pick<DecorItem, "status" | "source" | "return_on" | "collect_on">[]) {
  return {
    all: items.length,
    toGet: items.filter((i) => i.status === "to_get").length,
    got: items.filter((i) => i.status === "got").length,
    packed: items.filter((i) => i.status === "packed").length,
    toCollect: items.filter((i) => i.status === "to_get" && !!i.collect_on).length,
    goBack: items.filter((i) => goesBack(i) && i.status !== "returned").length,
  };
}

/** What to say on the Decor page's Next up card. */
export function decorNextUp(items: DecorItem[], people: { id: string; name: string }[]): { title: string; line?: string } {
  const today = todayISO();
  const toCollect = items
    .filter((i) => i.status === "to_get" && i.collect_on)
    .sort((a, b) => (a.collect_on ?? "").localeCompare(b.collect_on ?? ""))[0];
  const toGet = items.filter((i) => i.status === "to_get");
  if (items.length === 0) return { title: "Start the list of things", line: "Jam jars, candles, the easel for the table plan…" };
  if (toCollect) {
    const who = people.find((p) => p.id === toCollect.from_contact_id)?.name ?? toCollect.from_name;
    return {
      title: `${toCollect.source === "borrowed" || toCollect.source === "hired" ? "Collect" : "Get"} ${withQuantity(toCollect).toLowerCase()}${who ? ` from ${who}` : ""}`,
      line: `${toCollect.collect_on! < today ? "Was due " : ""}${formatDayMonth(toCollect.collect_on!)}${toGet.length > 1 ? ` · then ${toGet.length - 1} more to get` : ""}`,
    };
  }
  if (toGet.length) return { title: `Get ${withQuantity(toGet[0]).toLowerCase()}`, line: toGet.length > 1 ? `Then ${toGet.length - 1} more to get` : undefined };
  const toPack = items.filter((i) => i.status === "got");
  if (toPack.length) return { title: `Pack ${toPack.length === 1 ? withQuantity(toPack[0]).toLowerCase() : `the last ${toPack.length} things`}`, line: "Tap a ring when it's packed." };
  const back = items.filter((i) => goesBack(i) && i.status !== "returned");
  if (back.length) return { title: `Give back ${back.length === 1 ? withQuantity(back[0]).toLowerCase() : `${back.length} things`}`, line: "After the day." };
  return { title: "All packed. Ready to dance." };
}
