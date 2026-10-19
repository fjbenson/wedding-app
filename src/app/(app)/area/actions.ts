"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guessIcon, iconByName } from "@/lib/area-icons";
import { areaKey } from "@/lib/areas";
import { addArea, getArea, listAreas, missingIcon, updateArea } from "@/lib/db/areas";
import { parseMoney } from "@/lib/money";
import { createNote, deleteNote, updateNote } from "@/lib/db/notes";
import { getCurrentWedding } from "@/lib/db/weddings";
import { updateSupplierParts } from "@/lib/db/suppliers";
import { describe } from "@/lib/errors";
import { SOUND_CHECK } from "@/lib/music";

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

/** A new icon for an area, from its page (tap the icon). Never throws. */
export async function setAreaIconAction(areaId: string, key: string, icon: string): Promise<{ error?: string }> {
  if (!iconByName(icon)) return { error: "That icon isn't one we have." };
  try {
    await updateArea(areaId, { icon });
  } catch (error) {
    console.error("set area icon failed", error);
    return { error: "That didn't save. Try again." };
  }
  refresh(key);
  revalidatePath("/settings");
  return {};
}

/**
 * The "+ Add an area" tile at the end of every area picker (owner, 12 Oct
 * 2026): adds the area (or brings an old one back) without leaving the form,
 * and returns it so the form can pick it. Never throws — the form shows the
 * message instead.
 */
export async function quickAddAreaAction(
  name: string,
  chosen: { icon?: string | null; budget?: string | null } = {},
): Promise<{ key?: string; label?: string; icon?: string; error?: string }> {
  try {
    const wedding = await getCurrentWedding();
    if (!wedding) return { error: "Couldn't find your wedding. Reload the page." };
    const label = name.trim().slice(0, 40);
    const key = areaKey(label) === "new" ? "new-area" : areaKey(label);
    if (!key) return { error: "Give the area a name." };
    if (key === "other") return { error: "Other is already there." };
    // The icon they picked, else a first guess from the name (changeable on its page).
    const icon = chosen.icon && iconByName(chosen.icon) ? chosen.icon : guessIcon(label);
    const budget = chosen.budget ? parseMoney(chosen.budget) : null;
    const existing = await getArea(wedding.id, key);
    if (existing) {
      await updateArea(existing.id, { enabled: true, show_on_hub: true, ...(budget !== null ? { budget } : {}) });
      if (chosen.icon) await updateArea(existing.id, { icon }).catch(() => undefined);
    } else await addArea(wedding.id, key, label, { icon, budget });
    refresh(key);
    revalidatePath("/money");
    return { key, label: existing?.label ?? label, icon: existing && !chosen.icon ? (existing.icon ?? undefined) : icon };
  } catch (error) {
    console.error("quick add area failed", error);
    return { error: "That didn't add it. Try again." };
  }
}

/** What the three steps offer when opened from a form: areas to bring back, and the budget still free. */
export async function areaStepsInfoAction(): Promise<{ hidden: string[]; stillFree: number | null }> {
  try {
    const wedding = await getCurrentWedding();
    if (!wedding) return { hidden: [], stillFree: null };
    const areas = (await listAreas(wedding.id)) ?? [];
    const shared = areas.filter((a) => a.enabled).reduce((sum, a) => sum + (a.budget ?? 0), 0);
    return {
      hidden: areas.filter((a) => !a.show_on_hub || !a.enabled).map((a) => a.label),
      stillFree: wedding.budget != null ? Math.max(0, wedding.budget - shared) : null,
    };
  } catch {
    return { hidden: [], stillFree: null };
  }
}

/**
 * The + on the ring (screen 7), in three steps (owner, 12 Oct 2026): a name,
 * an icon, a budget (or none). An area with that name already — switched off
 * or taken off the hub — comes back instead, with the new icon and budget.
 * Then its own page.
 */
export async function addAreaAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const label = String(formData.get("label") ?? "").trim().slice(0, 40);
  // "new" is this page's own address, so an area can't be called that.
  const key = areaKey(label) === "new" ? "new-area" : areaKey(label);
  if (!key || key === "other") {
    redirect(`/area/new?error=${encodeURIComponent(key ? "Other is already there — pick another name." : "Please give the area a name.")}`);
  }
  const chosen = String(formData.get("icon") ?? "");
  const icon = iconByName(chosen) ? chosen : guessIcon(label);
  const budget = formData.get("skip") ? null : parseMoney(formData.get("budget"));

  try {
    const existing = await getArea(wedding.id, key);
    if (existing) {
      await updateArea(existing.id, { enabled: true, show_on_hub: true, ...(budget !== null ? { budget } : {}) });
      try {
        await updateArea(existing.id, { icon });
      } catch (error) {
        if (!missingIcon(error as { code?: string })) throw error;
      }
    } else await addArea(wedding.id, key, label, { icon, budget });
  } catch (error) {
    failed("/area/new", "That didn't add it.", error);
  }

  refresh(key);
  revalidatePath("/money");
  redirect(`/area/${key}`);
}

/**
 * The area's two hand-set stage switches: "we're doing this ourselves"
 * (skips Quotes and Booked) and "we're ready" (the last stage).
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

  const fields = noteFields(formData);
  if (fields) {
    try {
      await createNote(wedding.id, { ...fields, area_key: key });
    } catch (error) {
      failed(`/area/${key}`, "That note didn't save.", error);
    }
    refreshNotes(key);
  }
  redirect(`/area/${key}#notes`);
}

/**
 * Saves changes to one of an area's notes; emptying it removes it. A note
 * captured with words *and* a link (`keepUrl`) only has its words edited
 * here, and keeps the link.
 */
export async function saveAreaNoteAction(key: string, noteId: string, keepUrl: string | null, formData: FormData) {
  const text = String(formData.get("body") ?? "").trim();
  const fields = keepUrl ? { body: text || null, url: keepUrl } : noteFields(formData);
  try {
    if (fields) await updateNote(noteId, fields);
    else await deleteNote(noteId);
  } catch (error) {
    failed(`/area/${key}`, "That note didn't save.", error);
  }
  refreshNotes(key);
  redirect(`/area/${key}#notes`);
}

export async function deleteAreaNoteAction(key: string, noteId: string) {
  try {
    await deleteNote(noteId);
  } catch (error) {
    failed(`/area/${key}`, "That note wasn't removed.", error);
  }
  refreshNotes(key);
  redirect(`/area/${key}#notes`);
}

/** The typed text as a note: a lone web address is kept as a link. Null if empty. */
function noteFields(formData: FormData): { body: string | null; url: string | null } | null {
  const text = String(formData.get("body") ?? "").trim();
  if (!text) return null;
  const isLink = /^https?:\/\/\S+$/i.test(text);
  return { body: isLink ? null : text, url: isLink ? text : null };
}

function refreshNotes(key: string) {
  revalidatePath(`/area/${key}`);
  revalidatePath("/inbox");
}

/**
 * Going back a stage (feedback item 1, 19 Oct 2026): a booked supplier who
 * isn't booked after all goes back to Quote in (or In touch with no quote),
 * so Booked steps back on the area page. Their payments are left alone.
 */
export async function unbookSupplierAction(key: string, supplierId: string, hasQuote: boolean) {
  try {
    await updateSupplierParts(supplierId, {}, { status: hasQuote ? "quoted" : "enquired" });
  } catch (error) {
    failed(`/area/${key}`, "That didn't change.", error);
  }
  refresh(key);
  revalidatePath("/people");
  revalidatePath("/money");
}

/**
 * The Music area's ready-made Sound check: a note with tick-boxes, filed
 * under the area (owner, 19 Oct 2026: is there a backup if the sound fails?).
 */
export async function startSoundCheckAction(key: string) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const area = /^[a-z0-9-]+$/.test(key) ? key : "music";
  try {
    await createNote(wedding.id, { body: [SOUND_CHECK.name, ...SOUND_CHECK.lines.map((l) => `[ ] ${l}`)].join("\n"), url: null, area_key: area });
  } catch (error) {
    failed(`/area/${area}`, "That didn't save.", error);
  }
  refreshNotes(area);
  redirect(`/area/${area}#notes`);
}
