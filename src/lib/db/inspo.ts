import { createClient } from "@/lib/supabase/server";
import type { InspoItem } from "@/types/db";

/** An item with a picture ready to show: a signed link to an upload, or the link's own preview. */
export type InspoWithPicture = InspoItem & { picture: string | null };

const BUCKET = "inspo";

/** Uploaded pictures are private; these links to them last an hour. */
async function withPictures(items: InspoItem[]): Promise<InspoWithPicture[]> {
  const paths = items.map((i) => i.image_path).filter((p): p is string => !!p);
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }
  return items.map((i) => ({ ...i, picture: (i.image_path && signed.get(i.image_path)) || i.image_url }));
}

/**
 * A wedding's saved ideas, newest first; one folder (area key), Unsorted
 * (`folder: null`), or all. `null` means 0010_inspo.sql hasn't been run.
 */
export async function listInspo(weddingId: string, options: { folder?: string | null; limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase.from("inspo_items").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false });
  if (options.folder === null) query = query.is("area_key", null);
  else if (options.folder !== undefined) query = query.eq("area_key", options.folder);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw error;
  }
  return withPictures(data ?? []);
}

/** Every idea's id in one folder, newest first — for stepping through them one by one. */
export async function listInspoIds(weddingId: string, folder: string | null): Promise<string[]> {
  const supabase = await createClient();
  let query = supabase.from("inspo_items").select("id").eq("wedding_id", weddingId).order("created_at", { ascending: false });
  query = folder === null ? query.is("area_key", null) : query.eq("area_key", folder);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

/** How many ideas sit in each folder ("" for Unsorted). */
export async function countInspo(weddingId: string): Promise<Map<string, number> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("inspo_items").select("area_key").eq("wedding_id", weddingId);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw error;
  }
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.area_key ?? "", (counts.get(row.area_key ?? "") ?? 0) + 1);
  return counts;
}

export async function getInspo(id: string): Promise<InspoWithPicture | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("inspo_items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? (await withPictures([data]))[0] : null;
}

type InspoFields = Pick<InspoItem, "area_key" | "image_path" | "image_url" | "url" | "title" | "note">;

export async function createInspo(weddingId: string, fields: InspoFields): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("inspo_items").insert({ wedding_id: weddingId, ...fields }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateInspo(id: string, fields: Partial<Pick<InspoItem, "area_key" | "note">>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("inspo_items").update(fields).eq("id", id);
  if (error) throw error;
}

/** Removes an idea, and its uploaded picture if it had one. */
export async function deleteInspo(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: item } = await supabase.from("inspo_items").select("image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("inspo_items").delete().eq("id", id);
  if (error) throw error;
  if (item?.image_path) await supabase.storage.from(BUCKET).remove([item.image_path]);
}
