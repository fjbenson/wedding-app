"use server";

import { revalidatePath } from "next/cache";
import { createWedding } from "@/lib/db/weddings";

/** Creates the wedding the hub is built around, and makes you its owner. */
export async function createWeddingAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const weddingDate = String(formData.get("wedding_date") ?? "").trim();

  if (!name) return;

  await createWedding({ name, weddingDate: weddingDate || null });
  revalidatePath("/");
}
