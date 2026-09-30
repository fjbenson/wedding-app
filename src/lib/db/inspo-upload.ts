import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a picture straight from the phone to the wedding's private Inspo
 * folder (docs/ERD.md: "clients upload directly to Supabase Storage" — a
 * phone photo is too big to pass through a Vercel function). Shrinks it
 * first: a 6 MB photo becomes a few hundred KB that looks the same on
 * screen. Returns the stored path, which the save action records.
 *
 * The one query here that runs in the browser; the storage policies in
 * 0010_inspo.sql are what stop it writing anywhere but this wedding's folder.
 */
export async function uploadInspoPicture(weddingId: string, file: File): Promise<string> {
  const blob = await shrink(file);
  const path = `${weddingId}/${crypto.randomUUID()}.jpg`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("inspo").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Longest side 2000px, as a JPEG. Falls back to the original if the browser can't. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}
