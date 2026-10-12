import { cookies } from "next/headers";
import { cache } from "react";
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

/** The cookie that remembers which wedding this device has open. */
export const WEDDING_COOKIE = "wedding";

/**
 * The wedding the app is about right now. Usually a login has just one.
 * With more than one (the demo wedding, 12 Oct 2026), the one picked under
 * Settings › Your weddings is remembered on this device in a cookie;
 * without a pick it's the first one made, so a newer demo never takes over.
 *
 * Remembered for the rest of the request, so the shared frame and the page
 * inside it can both ask without a second trip to the database.
 */
export const getCurrentWedding = cache(async (): Promise<Wedding | null> => {
  const weddings = await listWeddings();
  const picked = (await cookies()).get(WEDDING_COOKIE)?.value;
  return weddings.find((w) => w.id === picked) ?? weddings[weddings.length - 1] ?? null;
});

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

/** The couple's names and the date, changed from Settings. */
export async function updateWedding(
  weddingId: string,
  fields: Pick<Wedding, "name" | "wedding_date">,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("weddings").update(fields).eq("id", weddingId);
  if (error) throw error;
}

