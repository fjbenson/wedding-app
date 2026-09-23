import { createClient } from "@/lib/supabase/server";
import type { Wedding, WeddingMember } from "@/types/db";

/** Weddings the signed-in user can see. */
export async function listWeddings(): Promise<Wedding[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getWedding(weddingId: string): Promise<Wedding | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", weddingId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Creates a wedding and makes the creator its owner.
 *
 * Both inserts happen inside the `create_wedding` function in the database
 * (migration 0002). They can't be done from here: the row-level security
 * policies only let a member read a wedding, and only a host add members, so
 * the very first wedding has no one allowed to create it. The function runs as
 * its owner and takes the user from `auth.uid()`, so you can still only ever
 * create a wedding owned by yourself.
 */
export async function createWedding(input: {
  name: string;
  weddingDate?: string | null;
}): Promise<Wedding> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_wedding", {
    p_name: input.name,
    p_wedding_date: input.weddingDate ?? null,
  });

  if (error) throw error;
  return data as Wedding;
}

export async function listMembers(weddingId: string): Promise<WeddingMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wedding_members")
    .select("*")
    .eq("wedding_id", weddingId);

  if (error) throw error;
  return data ?? [];
}
