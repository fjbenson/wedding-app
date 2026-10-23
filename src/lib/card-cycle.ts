"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Cycling through the list a card was opened from: `‹ 2 of 9 ›` in its top row,
 * a sideways swipe, and the arrow keys on a laptop (owner, 23 Oct 2026, canvas 4
 * "Cards · Round 6", A plus swipe).
 *
 * Two ways a card learns who's next to it:
 * - Lists the app draws itself (the guest list, suppliers, decor…) register
 *   their ids in the order shown, with a way to open one (`useRegisterCycle`).
 * - Rows that are a `CardLink` (to-dos, appointments, payments, moments, Inspo)
 *   carry their id in the page; the card reads them off the page in the order
 *   they're drawn (`readCardLinks`), so whichever list you came from is the one
 *   it cycles through.
 */

export type Cycle = {
  /** 0-based place in the list. */
  index: number;
  total: number;
  prev?: () => void;
  next?: () => void;
};

type Registered = { ids: string[]; open: (id: string) => void };
const registry = new Map<string, Registered>();
const listeners = new Set<() => void>();
let version = 0;
const notify = () => {
  version += 1;
  listeners.forEach((l) => l());
};

/** A list says who's in it, in order, and how to open one. Call from the list; it unregisters itself on unmount. */
export function useRegisterCycle(kind: string, ids: string[], open: (id: string) => void) {
  const key = ids.join(",");
  useEffect(() => {
    registry.set(kind, { ids, open });
    notify();
    return () => {
      if (registry.get(kind)?.ids === ids) registry.delete(kind);
      notify();
    };
    // `ids` is compared by its contents (`key`), `open` is read at the time of use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, key]);
  // Keep the latest `open` without re-registering.
  useEffect(() => {
    const r = registry.get(kind);
    if (r) r.open = open;
  });
}

/** What a card of this kind should show for its neighbours: null with fewer than two in the list. */
export function useCycle(kind: string, id: string | null | undefined): Cycle | null {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => 0,
  );
  const r = registry.get(kind);
  if (!r || !id) return null;
  const index = r.ids.indexOf(id);
  if (index < 0 || r.ids.length < 2) return null;
  const n = r.ids.length;
  // Going round: the last one's next is the first.
  return { index, total: n, prev: () => r.open(r.ids[(index - 1 + n) % n]), next: () => r.open(r.ids[(index + 1) % n]) };
}

/**
 * The to-dos, appointments, payments, moments and ideas drawn on the page right now, in the order they
 * appear, one each (the same row can show in two sections). Skips what's hidden (a shut fold) and anything inside a card.
 */
export function readCardLinks(): { kind: string; id: string }[] {
  const seen = new Set<string>();
  const out: { kind: string; id: string }[] = [];
  document.querySelectorAll<HTMLElement>("a[data-card-id]").forEach((el) => {
    if (el.closest('[role="dialog"]') || el.getClientRects().length === 0) return;
    const id = el.dataset.cardId!;
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ kind: el.dataset.cardKind!, id });
  });
  return out;
}
