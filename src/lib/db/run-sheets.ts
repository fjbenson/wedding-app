import { createClient } from "@/lib/supabase/server";
import type { RunSheet, RunSheetItem } from "@/types/db";

/**
 * Run sheets besides the main one (0035_run_sheets.sql): the bridesmaids',
 * the groomsmen's. "The day" is the main sheet — a moment with no sheet is on
 * it. Before 0035 is run there are no sheets, rather than a broken screen.
 */
const missing = (error: { code?: string }) => error.code === "42P01" || error.code === "PGRST205" || error.code === "42703";

export async function listRunSheets(weddingId: string): Promise<RunSheet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("run_sheets").select("*").eq("wedding_id", weddingId).order("sort_order").order("created_at");
  if (error) {
    if (missing(error)) return [];
    throw error;
  }
  return (data ?? []) as RunSheet[];
}

export async function getRunSheet(id: string): Promise<RunSheet | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("run_sheets").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return (data as RunSheet | null) ?? null;
}

export async function createRunSheet(weddingId: string, name: string, groupId: string | null, sortOrder: number): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("run_sheets")
    .insert({ wedding_id: weddingId, name, group_id: groupId, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateRunSheet(id: string, fields: Partial<Pick<RunSheet, "name" | "group_id">>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("run_sheets").update(fields).eq("id", id);
  if (error) throw error;
}

/** Removes a sheet and, with it, its moments. */
export async function deleteRunSheet(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("run_sheets").delete().eq("id", id);
  if (error) throw error;
}

/** What a copy of a moment keeps: not its food links, nor anything else tied to the original. */
const COPIED = ["at_time", "title", "location", "who", "notes", "area_key", "music", "music_url", "music_kind", "music_played", "music_who", "contact_id"] as const;

/** Puts a copy of each moment on a sheet (null: the main one). A copy is its own moment. */
export async function copyMoments(weddingId: string, momentIds: string[], sheetId: string | null): Promise<number> {
  if (momentIds.length === 0) return 0;
  const supabase = await createClient();
  const { data, error } = await supabase.from("run_sheet_items").select("*").eq("wedding_id", weddingId).in("id", momentIds);
  if (error) throw error;
  const rows = ((data ?? []) as RunSheetItem[]).map((m) => {
    const copy: Record<string, unknown> = { wedding_id: weddingId, sheet_id: sheetId };
    for (const k of COPIED) copy[k] = (m as unknown as Record<string, unknown>)[k] ?? null;
    return copy;
  });
  if (rows.length === 0) return 0;
  const { error: inserted } = await supabase.from("run_sheet_items").insert(rows);
  if (inserted) throw inserted;
  return rows.length;
}

/** Moves a moment to a sheet (null: the main one). */
export async function moveMoment(momentId: string, sheetId: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("run_sheet_items").update({ sheet_id: sheetId }).eq("id", momentId);
  if (error) throw error;
}
