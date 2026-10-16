import { createClient } from "@/lib/supabase/server";
import type { Contribution } from "@/types/db";

type ContributionFields = Omit<Contribution, "id" | "wedding_id" | "created_at">;

/**
 * Who's paying for what (0022_contributions.sql): biggest first. `[]` until
 * the table exists, so Money never breaks on a project that hasn't run it.
 */
export async function listContributions(weddingId: string): Promise<Contribution[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("amount", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map((c) => ({ ...c, amount: Number(c.amount) }));
}

export async function getContribution(id: string): Promise<Contribution | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contributions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data && { ...data, amount: Number(data.amount) };
}

export async function createContribution(weddingId: string, fields: ContributionFields): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contributions").insert({ wedding_id: weddingId, ...fields });
  if (error) throw error;
}

export async function updateContribution(id: string, fields: Partial<ContributionFields>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contributions").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteContribution(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contributions").delete().eq("id", id);
  if (error) throw error;
}
