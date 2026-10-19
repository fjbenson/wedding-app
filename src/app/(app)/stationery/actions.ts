"use server";

import { revalidatePath } from "next/cache";
import { markSent, sendingsFor, unmarkSent } from "@/lib/db/stationery";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { HOWS, isSendingKind, type SendHow, type SentRecord } from "@/lib/stationery";
import { todayISO } from "@/lib/dates";

/**
 * Marking a save the date, invitation or thank-you as sent (or not after
 * all). Return a message rather than throwing into the screen. Each finds the
 * wedding itself; row-level security and the (id, wedding_id) links stop it
 * touching another wedding's guests.
 */
type Result = { error?: string; marked?: number };

const UNIT = /^[hc]:[0-9a-f-]{36}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const failed = (error: unknown): Result => {
  console.error("marking a sending failed", error);
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01" || code === "PGRST205") return { error: "This needs the timeline set up first (0032_timeline.sql)." };
  return { error: `That didn't save. ${describe(error)}` };
};

const done = () => revalidatePath("/", "layout");

export async function markSentAction(input: { kind: string; how: string; date?: string; units: string[] }): Promise<Result> {
  if (!isSendingKind(input.kind)) return { error: "Pick what was sent." };
  if (!HOWS.some((h) => h.value === input.how)) return { error: "Pick how it went." };
  const units = [...new Set(input.units)].filter((u) => UNIT.test(u)).slice(0, 2000);
  if (units.length === 0) return { error: "Pick who it went to." };
  const date = input.date && ISO.test(input.date) ? input.date : todayISO();
  try {
    const wedding = await getCurrentWedding();
    if (!wedding) return { error: "No wedding found." };
    const marked = await markSent(wedding.id, input.kind, input.how as SendHow, date, units);
    done();
    return { marked };
  } catch (error) {
    return failed(error);
  }
}

export async function unmarkSentAction(kind: string, unit: string): Promise<Result> {
  if (!isSendingKind(kind) || !UNIT.test(unit)) return { error: "That isn't there any more." };
  try {
    const wedding = await getCurrentWedding();
    if (!wedding) return { error: "No wedding found." };
    await unmarkSent(wedding.id, kind, unit);
    done();
    return {};
  } catch (error) {
    return failed(error);
  }
}

/** What's been sent to one household or person, for their card. Never throws into the card. */
export async function sentToAction(unit: string): Promise<{ records: SentRecord[]; weddingDate: string | null; error?: string }> {
  if (!UNIT.test(unit)) return { records: [], weddingDate: null };
  try {
    const wedding = await getCurrentWedding();
    if (!wedding) return { records: [], weddingDate: null };
    return { records: await sendingsFor(wedding.id, unit), weddingDate: wedding.wedding_date };
  } catch (error) {
    console.error("loading sendings failed", error);
    return { records: [], weddingDate: null, error: "What's been sent didn't load." };
  }
}
