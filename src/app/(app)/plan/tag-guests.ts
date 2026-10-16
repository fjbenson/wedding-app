import { addInvolved } from "@/lib/db/involved";

/**
 * The guests picked under "Who's involved" on the add form (0021_involved.sql),
 * or "Who's paying" on a new payment (0023_payment_payers.sql).
 * The to-do or appointment is already saved, so a failure here is logged, not
 * shown — they can be added from its card. A plain file, not "use server", so
 * it can't be called from a phone on its own.
 */
export async function tagGuests(weddingId: string, kind: "todo" | "appointment" | "payment", id: string, formData: FormData) {
  const guests = formData.getAll("member").map(String).filter((v) => /^[0-9a-f-]{36}$/i.test(v));
  try {
    await addInvolved(weddingId, kind, id, guests);
  } catch (error) {
    console.error("tagging guests on a new item failed", error);
  }
}
