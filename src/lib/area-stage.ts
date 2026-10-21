import type { Money } from "@/lib/budget";
import type { Supplier } from "@/lib/db/suppliers";
import type { AreaRow } from "@/types/db";

/**
 * The five stages every area goes through, the same for all of them (area
 * page design, round 4, 7 Oct 2026). The first four tick themselves from
 * what's recorded; Ready is the one the couple ticks.
 */
// Short instructions, what to do at each (owner, 21 Oct 2026: "Booked" read
// as already booked while you were still choosing; then Ideas · Quotes ·
// Booking · Payment · Ready the same day). The laptop Hub's ring says the
// same in the past tense, what's done: Quoted, Booked, Paid (hub.tsx).
export const STAGES = ["Ideas", "Quote", "Book", "Pay", "Ready"] as const;

export interface AreaStage {
  /** Which stages are done, in order. A later stage done counts the earlier ones done too. */
  done: boolean[];
  /** The first stage not yet done; STAGES.length when the area is ready. */
  current: number;
}

export function areaStage(
  area: Pick<AreaRow, "diy" | "ready">,
  suppliers: Supplier[],
  money: Money,
  /** Its inspo and its notes together (owner, 21 Oct 2026: an idea is either). */
  ideaCount: number,
): AreaStage {
  const statuses = suppliers.map((s) => s.supplier_details?.status);
  const booked = statuses.includes("booked");
  const diy = !!area.diy;
  const toPay = money.committed - money.paid;

  const done = [
    ideaCount > 0,
    diy || booked || statuses.includes("quoted"),
    diy || booked,
    // Paid up: nothing left owing, and something actually agreed (a booked
    // supplier with no price yet isn't "paid", it's unknown).
    (diy || booked) && toPay <= 0 && (money.committed > 0 || diy),
    !!area.ready,
  ];
  for (let i = done.length - 1; i > 0; i--) if (done[i]) done[i - 1] = true;

  const current = done.indexOf(false);
  return { done, current: current === -1 ? STAGES.length : current };
}
