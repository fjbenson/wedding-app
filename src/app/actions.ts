"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createWedding } from "@/lib/db/weddings";

/** Creates the wedding the hub is built around, and makes you its owner. */
export async function createWeddingAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const weddingDate = String(formData.get("wedding_date") ?? "").trim();

  if (!name) {
    redirect(`/?error=${encodeURIComponent("Please give the wedding a name.")}`);
  }

  // redirect() works by throwing, so the save is the only thing inside the try.
  let failed = false;
  try {
    await createWedding({ name, weddingDate: weddingDate || null });
  } catch (error) {
    console.error("create_wedding failed", error);
    failed = true;
  }

  if (failed) {
    redirect(
      `/?error=${encodeURIComponent("That didn't save. Please try again.")}`,
    );
  }

  revalidatePath("/");
  redirect("/");
}
