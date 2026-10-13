import { createClient } from "@/lib/supabase/client";

/** 20 MB, as the "files" bucket allows (0018_files.sql). */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/**
 * Uploads a contract, quote or invoice straight from the phone to the
 * wedding's private files folder (like Inspo's pictures: too big to pass
 * through a Vercel function). Returns the stored path, which the save action
 * records. The storage policies in 0018_files.sql stop it writing anywhere
 * but this wedding's folder.
 */
export async function uploadWeddingFile(weddingId: string, file: File): Promise<string> {
  const safe = file.name.replace(/[^\w.\-]+/g, "-").slice(-80) || "file";
  const path = `${weddingId}/${crypto.randomUUID()}-${safe}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("files").upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;
  return path;
}
