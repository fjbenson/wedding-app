import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/types/db";

/**
 * A wedding's captures, newest first; narrowed to one area, or to the
 * unfiled ones (`area: null`). `null` means 0008_notes.sql hasn't been run.
 */
export async function listNotes(weddingId: string, options: { area?: string | null } = {}): Promise<Note[] | null> {
  const supabase = await createClient();
  let query = supabase.from("notes").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false });
  if (options.area === null) query = query.is("area_key", null);
  else if (options.area !== undefined) query = query.eq("area_key", options.area);

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw error;
  }
  return data ?? [];
}

export async function getNote(noteId: string): Promise<Note | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notes").select("*").eq("id", noteId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createNote(weddingId: string, fields: Pick<Note, "body" | "url" | "area_key">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").insert({ wedding_id: weddingId, ...fields });
  if (error) throw error;
}

export async function fileNote(noteId: string, areaKey: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").update({ area_key: areaKey }).eq("id", noteId);
  if (error) throw error;
}

export async function deleteNote(noteId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", noteId);
  if (error) throw error;
}
