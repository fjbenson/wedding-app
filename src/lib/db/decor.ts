import { createClient } from "@/lib/supabase/server";
import type { DecorItem } from "@/types/db";

/**
 * Decor (0027_decor.sql): the wedding's things, each with who sets it up.
 * Empty until 0027 is run, rather than breaking the screen.
 */
const missing = (error: { code?: string }) => error.code === "42P01" || error.code === "PGRST205";

export type DecorFields = Omit<DecorItem, "id" | "wedding_id" | "sort_order" | "created_at">;

export interface DecorWithHelpers extends DecorItem {
  /** Guests and suppliers who set it up. */
  helpers: string[];
}

export async function listDecor(weddingId: string): Promise<DecorWithHelpers[]> {
  const supabase = await createClient();
  const [items, helpers] = await Promise.all([
    supabase.from("decor_items").select("*").eq("wedding_id", weddingId).order("sort_order").order("created_at"),
    supabase.from("decor_helpers").select("decor_id, contact_id").eq("wedding_id", weddingId).order("created_at"),
  ]);
  for (const r of [items, helpers]) {
    if (r.error) {
      if (missing(r.error)) return [];
      throw r.error;
    }
  }
  return (items.data ?? []).map((item) => ({
    ...item,
    helpers: (helpers.data ?? []).filter((h) => h.decor_id === item.id).map((h) => h.contact_id),
  }));
}

/** Adds a thing and gives back its id. */
export async function createDecor(weddingId: string, fields: DecorFields): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("decor_items").insert({ wedding_id: weddingId, ...fields }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateDecor(id: string, fields: Partial<DecorFields>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("decor_items").update(fields).eq("id", id);
  if (error) throw error;
}

/** Removes the thing and who was setting it up. */
export async function deleteDecor(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("decor_items").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Who sets it up: the whole new list. The (id, wedding_id) links refuse
 * anyone from another wedding.
 */
export async function setDecorHelpers(weddingId: string, decorId: string, contactIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { error: removeError } = await supabase.from("decor_helpers").delete().eq("decor_id", decorId);
  if (removeError) throw removeError;
  if (contactIds.length === 0) return;
  const { error } = await supabase
    .from("decor_helpers")
    .insert(contactIds.map((contact_id) => ({ decor_id: decorId, contact_id, wedding_id: weddingId })));
  if (error) throw error;
}

/** What one guest or supplier is lending — for their card. */
export async function listDecorFrom(contactId: string): Promise<DecorItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("decor_items").select("*").eq("from_contact_id", contactId).order("return_on", { nullsFirst: false });
  if (error) {
    if (missing(error)) return [];
    throw error;
  }
  return data ?? [];
}
