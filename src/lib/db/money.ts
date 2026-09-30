import { createClient } from "@/lib/supabase/server";
import type { Payment } from "@/types/db";

type PaymentFields = Omit<Payment, "id" | "wedding_id" | "created_at">;

/** True when the error means 0006_money.sql hasn't been run yet. */
function notSetUp(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205";
}

/**
 * A wedding's payments: unpaid first by due date, then paid, newest first.
 * `null` means the payments table isn't there yet (0006 not run).
 */
export async function listPayments(weddingId: string): Promise<Payment[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    if (notSetUp(error)) return null;
    throw error;
  }
  // numeric columns can arrive as strings; the rest of the app does sums.
  return (data ?? []).map((p) => ({ ...p, amount: Number(p.amount) }));
}

export async function getPayment(paymentId: string): Promise<Payment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (error) throw error;
  return data && { ...data, amount: Number(data.amount) };
}

export async function createPayment(weddingId: string, fields: PaymentFields): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({ wedding_id: weddingId, ...fields });
  if (error) throw error;
}

export async function updatePayment(paymentId: string, fields: Partial<PaymentFields>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").update(fields).eq("id", paymentId);
  if (error) throw error;
}

export async function deletePayment(paymentId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) throw error;
}

/** Sets the whole-wedding budget and each area's share in one go. */
export async function saveBudgets(
  weddingId: string,
  total: number | null,
  areas: { id: string; budget: number | null }[],
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("weddings").update({ budget: total }).eq("id", weddingId);
  if (error) throw error;

  for (const area of areas) {
    const { error: areaError } = await supabase.from("areas").update({ budget: area.budget }).eq("id", area.id);
    if (areaError) throw areaError;
  }
}
