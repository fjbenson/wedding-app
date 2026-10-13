import { createClient } from "@/lib/supabase/server";
import type { WeddingFile } from "@/types/db";

/** A file with a link to open it: signed, an hour long (the bucket is private). */
export type FileWithLink = WeddingFile & { link: string | null };

const BUCKET = "files";

/** A supplier's files, newest first. `null` means 0018_files.sql hasn't been run. */
export async function listSupplierFiles(contactId: string): Promise<FileWithLink[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw error;
  }
  const files = (data ?? []) as WeddingFile[];
  const links = new Map<string, string>();
  if (files.length > 0) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(files.map((f) => f.path), 60 * 60);
    for (const s of signed ?? []) if (s.path && s.signedUrl) links.set(s.path, s.signedUrl);
  }
  return files.map((f) => ({ ...f, link: links.get(f.path) ?? null }));
}

export async function createFile(
  weddingId: string,
  fields: Pick<WeddingFile, "contact_id" | "area_key" | "kind" | "signed" | "name" | "path" | "size_bytes" | "mime_type">,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("files").insert({ wedding_id: weddingId, ...fields });
  if (error) throw error;
}

/** Takes the file off: its row, then the stored file itself. */
export async function deleteFile(fileId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("files").delete().eq("id", fileId).select("path").maybeSingle();
  if (error) throw error;
  if (data?.path) await supabase.storage.from(BUCKET).remove([data.path]);
}
