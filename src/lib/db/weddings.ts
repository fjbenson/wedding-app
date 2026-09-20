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

/** Creates a wedding and makes the creator its owner. */
export async function createWedding(input: {
  name: string;
  weddingDate?: string | null;
}): Promise<Wedding> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: wedding, error } = await supabase
    .from("weddings")
    .insert({
      name: input.name,
      wedding_date: input.weddingDate ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  const { error: memberError } = await supabase
    .from("wedding_members")
    .insert({ wedding_id: wedding.id, user_id: user.id, role: "owner" });

  if (memberError) throw memberError;

  return wedding;
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
