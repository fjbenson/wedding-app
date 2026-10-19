"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addListItem, createList, deleteList, deleteListItem, updateList, updateListItem } from "@/lib/db/lists";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { SOUND_CHECK } from "@/lib/music";

/**
 * Lists (0029_lists.sql), which live with Your notes (owner, 19 Oct 2026:
 * a note or a list, filed under an area like a note). The card's saves
 * return a message rather than redirecting; a new list opens its card where
 * it was made. Each finds the wedding itself;
 * row-level security and the (list, wedding) link keep lines to their list.
 */
type Result = { error?: string; id?: string };

const done = () => {
  revalidatePath("/inbox");
  revalidatePath("/area/[key]", "page");
};

const failed = (what: string, error: unknown): Result => {
  console.error(`${what} failed`, error);
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01" || code === "PGRST205") return { error: "Lists aren't set up yet (0029_lists.sql)." };
  return { error: `That didn't save. ${describe(error)}` };
};

const text = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** The new-list screen: its name, an optional area, and first lines (one per line). */
export async function saveNewListAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  // Back to Your notes or the area page it was made from.
  const sent = text(formData.get("back"));
  const back = sent && /^\/(inbox|area\/[\w-]+)$/.test(sent) ? sent : "/inbox";
  const name = text(formData.get("name"));
  if (!name) redirect(`/lists/new?back=${encodeURIComponent(back)}&error=${encodeURIComponent("It needs a name.")}`);
  const area = text(formData.get("area"));
  const lines = (text(formData.get("lines")) ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 200);
  let id: string;
  try {
    id = await createList(wedding.id, name, area, lines);
  } catch (error) {
    redirect(`/lists/new?back=${encodeURIComponent(back)}&error=${encodeURIComponent(failed("Making a list", error).error ?? "That didn't save.")}`);
  }
  done();
  redirect(`${back}?list=${id}`);
}

export async function updateListAction(id: string, fields: { name?: string; area_key?: string | null }): Promise<Result> {
  const tidy: { name?: string; area_key?: string | null } = {};
  if ("name" in fields) {
    const name = fields.name?.trim();
    if (!name) return { error: "It needs a name." };
    tidy.name = name;
  }
  if ("area_key" in fields) tidy.area_key = fields.area_key?.trim() || null;
  try {
    await updateList(id, tidy);
  } catch (error) {
    return failed("Changing a list", error);
  }
  done();
  return {};
}

export async function removeListAction(id: string): Promise<Result> {
  try {
    await deleteList(id);
  } catch (error) {
    return failed("Removing a list", error);
  }
  done();
  return {};
}

export async function addLineAction(listId: string, line: string, sortOrder: number): Promise<Result> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "Sign in again." };
  const tidy = line.trim();
  if (!tidy) return { error: "Type something first." };
  try {
    return { id: await addListItem(wedding.id, listId, tidy, sortOrder) };
  } catch (error) {
    return failed("Adding a line", error);
  } finally {
    done();
  }
}

export async function updateLineAction(id: string, fields: { text?: string; done?: boolean }): Promise<Result> {
  const tidy: { text?: string; done?: boolean } = {};
  if (typeof fields.done === "boolean") tidy.done = fields.done;
  if ("text" in fields) {
    const t = fields.text?.trim();
    if (!t) return { error: "A line needs some words." };
    tidy.text = t;
  }
  try {
    await updateListItem(id, tidy);
  } catch (error) {
    return failed("Changing a line", error);
  }
  done();
  return {};
}

export async function removeLineAction(id: string): Promise<Result> {
  try {
    await deleteListItem(id);
  } catch (error) {
    return failed("Removing a line", error);
  }
  done();
  return {};
}

/** The Music area's ready-made Sound check list, filed under it, then its card opens. */
export async function startSoundCheckAction(areaKey: string) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const key = /^[a-z0-9-]+$/.test(areaKey) ? areaKey : "music";
  let id: string;
  try {
    id = await createList(wedding.id, SOUND_CHECK.name, key, SOUND_CHECK.lines);
  } catch (error) {
    redirect(`/area/${key}?error=${encodeURIComponent(failed("Starting the sound check", error).error ?? "That didn't save.")}`);
  }
  done();
  redirect(`/area/${key}?list=${id}`);
}
