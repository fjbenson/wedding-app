import { createClient } from "@/lib/supabase/server";
import type { ListItem, WeddingList } from "@/types/db";

/**
 * Lists (0029_lists.sql): plain tick-lists and their lines. Empty until 0029
 * is run, rather than breaking the screen.
 */
const missing = (error: { code?: string }) => error.code === "42P01" || error.code === "PGRST205";

export interface ListWithItems extends WeddingList {
  items: ListItem[];
}

export async function listLists(weddingId: string): Promise<ListWithItems[]> {
  const supabase = await createClient();
  const [lists, items] = await Promise.all([
    supabase.from("lists").select("*").eq("wedding_id", weddingId).order("sort_order").order("created_at"),
    supabase.from("list_items").select("*").eq("wedding_id", weddingId).order("sort_order").order("created_at"),
  ]);
  for (const r of [lists, items]) {
    if (r.error) {
      if (missing(r.error)) return [];
      throw r.error;
    }
  }
  return (lists.data ?? []).map((l) => ({ ...l, items: (items.data ?? []).filter((i) => i.list_id === l.id) }));
}

/** A new list with its first lines; gives back its id. */
export async function createList(weddingId: string, name: string, areaKey: string | null, lines: string[]): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("lists").insert({ wedding_id: weddingId, name, area_key: areaKey }).select("id").single();
  if (error) throw error;
  if (lines.length) {
    const { error: linesError } = await supabase
      .from("list_items")
      .insert(lines.map((text, sort_order) => ({ list_id: data.id, wedding_id: weddingId, text, sort_order })));
    if (linesError) throw linesError;
  }
  return data.id;
}

export async function updateList(id: string, fields: Partial<Pick<WeddingList, "name" | "area_key">>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("lists").update(fields).eq("id", id);
  if (error) throw error;
}

/** Removes the list and its lines. */
export async function deleteList(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw error;
}

/** A line at the end of the list; the (list, wedding) link refuses another wedding's list. */
export async function addListItem(weddingId: string, listId: string, text: string, sortOrder: number): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("list_items")
    .insert({ list_id: listId, wedding_id: weddingId, text, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateListItem(id: string, fields: Partial<Pick<ListItem, "text" | "done">>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("list_items").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteListItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("list_items").delete().eq("id", id);
  if (error) throw error;
}
