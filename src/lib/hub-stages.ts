/**
 * The laptop Hub's ring shows where each area stands, and a "Needs a push"
 * card beside it lists the areas furthest behind with their next step
 * (canvas 4 "Laptop · Round 8", C, owner's pick 21 Oct 2026). Worked out
 * the same way as the area page and Where things stand, so all three agree.
 */
import { areaStage, STAGES, type AreaStage } from "@/lib/area-stage";
import { moneyFor } from "@/lib/budget";
import { isDecorArea } from "@/lib/decor";
import { formatMoney } from "@/lib/money";
import { isStationeryArea } from "@/lib/stationery";
import type { Supplier } from "@/lib/db/suppliers";
import type { AreaRow, Payment } from "@/types/db";

export interface HubPush {
  key: string;
  label: string;
  line: string;
  action: string;
  href: string;
}

/** How many areas "Needs a push" lists. */
const PUSH_LENGTH = 4;

/** Decor and Stationery have their own parts in place of the five stages. */
const hasStages = (key: string) => !isDecorArea(key) && !isStationeryArea(key);

/** Each area's stage, by key; areas without stages are left out. */
export function hubStages(
  areas: AreaRow[],
  suppliers: Supplier[],
  payments: Payment[],
  /** Its inspo and its notes together, by area. */
  ideas: Map<string, number>,
): Map<string, AreaStage> {
  const stages = new Map<string, AreaStage>();
  for (const a of areas) {
    if (!a.enabled || !hasStages(a.key)) continue;
    const theirs = suppliers.filter((s) => s.supplier_details?.category === a.key);
    const money = moneyFor(a.key, suppliers, payments, a.budget ?? null);
    stages.set(a.key, areaStage(a, theirs, money, ideas.get(a.key) ?? 0));
  }
  return stages;
}

/** The areas furthest behind, in the Hub's order, each with one next step. */
export function needsAPush(
  areas: AreaRow[],
  stages: Map<string, AreaStage>,
  suppliers: Supplier[],
  payments: Payment[],
): HubPush[] {
  const behind = areas
    .filter((a) => a.enabled && a.show_on_hub)
    .flatMap((a) => {
      const stage = stages.get(a.key);
      return stage && stage.current < STAGES.length ? [{ area: a, stage }] : [];
    })
    .sort((x, y) => x.stage.current - y.stage.current);

  return behind.slice(0, PUSH_LENGTH).map(({ area, stage }) => {
    const href = (id: string) => `/area/${encodeURIComponent(area.key)}?stage=${id}`;
    const theirs = suppliers.filter(
      (s) => s.supplier_details?.category === area.key && s.supplier_details?.status !== "cancelled",
    );
    const base = { key: area.key, label: area.label };
    switch (stage.current) {
      case 0:
        return { ...base, line: "Nothing saved yet", action: "Add an idea", href: href("ideas") };
      case 1: {
        const inTouch = theirs.length;
        return {
          ...base,
          line: inTouch ? `No quotes yet · in touch with ${inTouch}` : "No quotes yet",
          action: "Get a quote",
          href: href("quotes"),
        };
      }
      case 2: {
        const quoted = theirs.filter((s) => s.supplier_details?.status === "quoted").length;
        return {
          ...base,
          line: quoted === 1 ? "One quote in" : `${quoted} quotes in`,
          action: quoted > 1 ? "Choose one" : "Book",
          href: href("booked"),
        };
      }
      case 3: {
        const m = moneyFor(area.key, suppliers, payments, area.budget ?? null);
        const toPay = Math.max(m.committed - m.paid, 0);
        return { ...base, line: toPay ? `Booked · ${formatMoney(toPay)} to pay` : "Booked · no price yet", action: "Payments", href: href("paid") };
      }
      default:
        return { ...base, line: "Booked and paid", action: "Mark ready", href: href("ready") };
    }
  });
}
