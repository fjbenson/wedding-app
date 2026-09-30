"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { STARTER_AREAS, areaKey } from "@/lib/areas";
import { createAreas } from "@/lib/db/areas";
import { createWedding, getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function failed(message: string, detail: string): never {
  redirect(`/setup?error=${encodeURIComponent(message)}&detail=${encodeURIComponent(detail)}`);
}

/** Step 1: the couple and the date. Makes the wedding, and you its owner. */
export async function createWeddingAction(formData: FormData) {
  const names = [text(formData, "you"), text(formData, "partner")].filter(Boolean);
  if (names.length === 0) {
    redirect(`/setup?error=${encodeURIComponent("Please add at least one name.")}`);
  }

  // redirect() works by throwing, so the save is the only thing inside the try.
  let detail = "";
  try {
    await createWedding({ name: names.join(" & "), weddingDate: text(formData, "wedding_date") || null });
  } catch (error) {
    console.error("create_wedding failed", error);
    detail = describe(error);
  }
  if (detail) failed("That didn't save.", detail);

  redirect("/setup");
}

/**
 * Step 2: which areas apply. Every starter area is stored, ticked or not, so
 * an unticked one can be switched back on later; anything typed in "anything
 * else" is added after them.
 */
export async function saveAreasAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/setup");

  const chosen = new Set(formData.getAll("area").map(String));
  const areas = STARTER_AREAS.map((a) => ({ key: a.key, label: a.label, enabled: chosen.has(a.key) }));

  for (const label of text(formData, "extra").split(",").map((l) => l.trim()).filter(Boolean)) {
    const key = areaKey(label);
    if (key && !areas.some((a) => a.key === key)) areas.push({ key, label, enabled: true });
  }

  let detail = "";
  try {
    await createAreas(wedding.id, areas);
  } catch (error) {
    console.error("saving areas failed", error);
    detail = describe(error);
  }
  if (detail) failed("That didn't save.", detail);

  revalidatePath("/");
  redirect("/");
}
