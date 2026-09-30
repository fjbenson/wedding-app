"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createInspo, deleteInspo, updateInspo } from "@/lib/db/inspo";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { linkPreview } from "@/lib/link-preview";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function failed(back: string, message: string, error: unknown): never {
  console.error(message, error);
  const code = (error as { code?: string }).code;
  const detail =
    code === "PGRST205" || code === "42P01" ? "Run supabase/migrations/0010_inspo.sql in Supabase first." : describe(error);
  redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}&detail=${encodeURIComponent(detail)}`);
}

function refresh() {
  revalidatePath("/inspo");
  revalidatePath("/inbox");
  revalidatePath("/area/[key]", "page");
}

/** Only ever back to a page inside the app. */
function safeReturn(value: string | null, fallback: string): string {
  return value && /^\/[a-z0-9/_?=&%-]*$/i.test(value) && !value.startsWith("//") ? value : fallback;
}

/**
 * Saving something (screen 31): the picture's already uploaded from the
 * phone (its path arrives here), and/or a link, for which we fetch the
 * page's own preview picture and title.
 */
export async function saveInspoAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  // An uploaded path must be inside this wedding's folder — the storage
  // policies already insist, this just keeps the row honest too.
  const path = text(formData, "image_path");
  const imagePath = path && path.startsWith(`${wedding.id}/`) ? path : null;
  let url = text(formData, "url");
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  const folder = text(formData, "folder");
  const back = safeReturn(text(formData, "return_to"), folder ? `/inspo?folder=${folder}` : "/inspo");

  if (!imagePath && !url) redirect(`/inspo/new?error=${encodeURIComponent("Add a picture or paste a link.")}`);

  try {
    const preview = url && !imagePath ? await linkPreview(url) : { image: null, title: null };
    await createInspo(wedding.id, {
      area_key: folder,
      image_path: imagePath,
      image_url: preview.image,
      url,
      title: preview.title,
      note: text(formData, "note"),
    });
  } catch (error) {
    failed("/inspo/new", "That didn't save.", error);
  }

  refresh();
  redirect(back);
}

/** Moving an idea to another folder, or changing its note. */
export async function updateInspoAction(id: string, formData: FormData) {
  try {
    await updateInspo(id, { area_key: text(formData, "folder"), note: text(formData, "note") });
  } catch (error) {
    failed(`/inspo/${id}`, "That didn't save.", error);
  }
  refresh();
  redirect(`/inspo/${id}?saved=1`);
}

export async function deleteInspoAction(id: string) {
  try {
    await deleteInspo(id);
  } catch (error) {
    failed(`/inspo/${id}`, "That didn't remove it.", error);
  }
  refresh();
  redirect("/inspo");
}
