"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { coupleName } from "@/lib/couple-name";
import { listAreas, setAreaOrder, updateArea } from "@/lib/db/areas";
import { getCurrentWedding, updateWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

function failed(message: string, error: unknown): never {
  console.error(message, error);
  redirect(`/settings?error=${encodeURIComponent(message)}&detail=${encodeURIComponent(describe(error))}`);
}

/** Areas and the wedding show up everywhere; refresh the lot. */
function refresh() {
  revalidatePath("/", "layout");
}

export async function saveWeddingAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const name = coupleName(String(formData.get("name") ?? ""));
  const date = String(formData.get("wedding_date") ?? "").trim();
  if (!name) redirect(`/settings?error=${encodeURIComponent("The wedding needs a name.")}`);

  try {
    await updateWedding(wedding.id, { name, wedding_date: date || null });
  } catch (error) {
    failed("That didn't save.", error);
  }
  refresh();
  redirect("/settings?saved=wedding");
}

/**
 * The plan's two switches: planning this area at all, and showing it as a
 * dot. A dot only makes sense for an area you're planning, so switching
 * planning off also hides the dot, and showing the dot switches planning on.
 */
export async function toggleAreaAction(areaId: string, field: "enabled" | "show_on_hub", value: boolean) {
  const fields =
    field === "enabled"
      ? value
        ? { enabled: true }
        : { enabled: false, show_on_hub: false }
      : value
        ? { show_on_hub: true, enabled: true }
        : { show_on_hub: false };
  try {
    await updateArea(areaId, fields);
  } catch (error) {
    failed("That didn't change.", error);
  }
  refresh();
}

/** Moves an area one place earlier or later — round the ring and in lists. */
export async function moveAreaAction(areaId: string, direction: -1 | 1) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  try {
    const ids = ((await listAreas(wedding.id)) ?? []).map((a) => a.id);
    const i = ids.indexOf(areaId);
    const j = i + direction;
    if (i === -1 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await setAreaOrder(ids);
  } catch (error) {
    failed("That didn't move.", error);
  }
  refresh();
}

export async function renameAreaAction(areaId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  try {
    await updateArea(areaId, { label });
  } catch (error) {
    failed("That didn't rename it.", error);
  }
  refresh();
}
