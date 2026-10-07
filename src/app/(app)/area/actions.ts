"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { areaKey } from "@/lib/areas";
import { addArea, getArea, updateArea } from "@/lib/db/areas";
import { createNote } from "@/lib/db/notes";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

function failed(back: string, message: string, error: unknown): never {
  console.error(message, error);
  const code = (error as { code?: string }).code;
  // The details column arrives with 0005_area_details.sql; say so plainly.
  const detail =
    code === "PGRST204" ? "Run the newest files in supabase/migrations in Supabase first (0012_area_stages.sql)." : describe(error);
  redirect(`${back}?error=${encodeURIComponent(message)}&detail=${encodeURIComponent(detail)}`);
}

/** Everywhere an area's name or visibility shows. */
function refresh(key: string) {
  revalidatePath("/");
  revalidatePath(`/area/${key}`);
  revalidatePath("/plan");
}

/** The key-facts block. */
export async function saveAreaDetailsAction(areaId: string, key: string, formData: FormData) {
  const details = String(formData.get("details") ?? "").trim() || null;
  try {
    await updateArea(areaId, { details });
  } catch (error) {
    failed(`/area/${key}`, "That didn't save.", error);
  }
  revalidatePath(`/area/${key}`);
  // Back to the notes, not the top of the page.
  redirect(`/area/${key}#notes`);
}

/**
 * Takes an area off the hub (still planned, still in the lists), stops
 * planning it altogether, or brings it back — the plan keeps "in use" and
 * "shows as a dot" as two separate switches.
 */
export async function setAreaAction(
  areaId: string,
  key: string,
  change: "hide" | "stop" | "bring-back",
) {
  const fields =
    change === "hide"
      ? { show_on_hub: false }
      : change === "stop"
        ? { enabled: false, show_on_hub: false }
        : { enabled: true, show_on_hub: true };
  try {
    await updateArea(areaId, fields);
  } catch (error) {
    failed(`/area/${key}`, "That didn't change.", error);
  }
  refresh(key);
}

/** The + on the ring: a new area of the couple's own, or an old one back. */
export async function addAreaAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const label = String(formData.get("label") ?? "").trim();
  // "new" is this page's own address, so an area can't be called that.
  const key = areaKey(label) === "new" ? "new-area" : areaKey(label);
  if (!key) redirect(`/area/new?error=${encodeURIComponent("Please give the area a name.")}`);

  try {
    const existing = await getArea(wedding.id, key);
    if (existing) await updateArea(existing.id, { enabled: true, show_on_hub: true });
    else await addArea(wedding.id, key, label);
  } catch (error) {
    failed("/area/new", "That didn't add it.", error);
  }

  refresh(key);
  redirect(`/area/${key}`);
}

/**
 * The area's two hand-set stage switches: "we're doing this ourselves"
 * (skips Compare and Book) and "we're ready" (the last stage).
 */
export async function setAreaStageFlagAction(areaId: string, key: string, flag: "diy" | "ready", on: boolean) {
  try {
    await updateArea(areaId, { [flag]: on });
  } catch (error) {
    failed(`/area/${key}`, "That didn't change.", error);
  }
  refresh(key);
}

/**
 * A note written straight into an area's Notes card — the same little box
 * as key facts, rather than a trip to the capture page. A note that's just
 * a web address is kept as a link, as capture would.
 */
export async function addAreaNoteAction(key: string, formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const text = String(formData.get("body") ?? "").trim();
  if (text) {
    const isLink = /^https?:\/\/\S+$/i.test(text);
    try {
      await createNote(wedding.id, { body: isLink ? null : text, url: isLink ? text : null, area_key: key });
    } catch (error) {
      failed(`/area/${key}`, "That note didn't save.", error);
    }
    revalidatePath(`/area/${key}`);
    revalidatePath("/inbox");
  }
  redirect(`/area/${key}#notes`);
}
