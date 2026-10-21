"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addPassenger,
  addTable,
  deleteRunSheetItem,
  deleteTable,
  deleteTransportRun,
  getDay,
  placeTable,
  removePassenger,
  saveRunSheetItem,
  saveTransportRun,
  seatGuest,
  seatGuestAt,
  pinSeats,
  unseatGuest,
  updateTable,
} from "@/lib/db/day";
import { copyMoments, createRunSheet, deleteRunSheet, listRunSheets, updateRunSheet } from "@/lib/db/run-sheets";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { returnTo, stayAfterSave } from "@/lib/return-to";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function failed(back: string, message: string, error: unknown): never {
  console.error(message, error);
  const code = (error as { code?: string }).code;
  const detail =
    code === "PGRST205" || code === "42P01" ? "Run supabase/migrations/0009_the_day.sql in Supabase first." : describe(error);
  redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}&detail=${encodeURIComponent(detail)}`);
}

async function weddingId() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  return wedding.id;
}

const refresh = () => revalidatePath("/day");

// Run sheet ------------------------------------------------------------------

/** "open.spotify.com/…" gets https:// in front, so it opens (and passes 0028's check). */
const musicUrl = (url: string | null) => (url && !/^https?:\/\//i.test(url) ? `https://${url}` : url);

export async function saveRunSheetItemAction(id: string | null, formData: FormData) {
  const back = id ? `/day/run-sheet/${id}` : "/day/run-sheet/new";
  const wid = await weddingId();
  const at = text(formData, "at_time");
  const title = text(formData, "title");
  if (!at || !title) redirect(`${back}?error=${encodeURIComponent("Please give it a time and say what happens.")}`);

  // A new moment goes on the run sheet it was added from (0035); editing leaves it where it is.
  const sheet = text(formData, "sheet_id");
  try {
    await saveRunSheetItem(wid, id, {
      at_time: at,
      title,
      location: text(formData, "location"),
      // In charge: one supplier or guest from the list, or a typed name (0031).
      contact_id: /^[0-9a-f-]{36}$/i.test(text(formData, "in_charge") ?? "") ? text(formData, "in_charge") : null,
      who: text(formData, "in_charge") === "typed" ? text(formData, "who") : null,
      notes: text(formData, "notes"),
      area_key: text(formData, "area_key"),
      music: text(formData, "music"),
      music_url: musicUrl(text(formData, "music_url")),
      music_kind: text(formData, "music_kind") === "playlist" ? "playlist" : text(formData, "music") ? "song" : null,
      ...(!id && sheet && /^[0-9a-f-]{36}$/i.test(sheet) ? { sheet_id: sheet } : {}),
    });
  } catch (error) {
    failed(back, "That didn't save.", error);
  }
  refresh();
  // Added from an area page: back to its The Day section.
  const fromArea = text(formData, "from_area");
  if (fromArea && /^[a-z0-9-]+$/.test(fromArea)) {
    revalidatePath(`/area/${fromArea}`);
    redirect(`/area/${fromArea}#day`);
  }
  redirect(id ? stayAfterSave(`/day/run-sheet/${id}`) : returnTo(formData, "/day"));
}

// More than one run sheet (0035) ----------------------------------------------

const uuid = (v: string | null) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

/** A new run sheet, optionally tied to a group and starting with copies of some of the main sheet's moments. */
export async function createRunSheetAction(formData: FormData) {
  const back = "/day/sheets/new";
  const wid = await weddingId();
  const name = text(formData, "name");
  if (!name) redirect(`${back}?error=${encodeURIComponent("Give the run sheet a name.")}`);
  let id: string;
  try {
    const order = (await listRunSheets(wid)).length;
    id = await createRunSheet(wid, name, uuid(text(formData, "group_id")), order);
    if (text(formData, "start") === "copy") {
      await copyMoments(wid, formData.getAll("copy_id").map(String).filter((m) => uuid(m)), id);
    }
  } catch (error) {
    failed(back, "That didn't save.", error);
  }
  refresh();
  redirect(`/day?sheet=${id}`);
}

export async function updateRunSheetAction(id: string, formData: FormData) {
  const back = `/day/sheets/${id}`;
  const name = text(formData, "name");
  if (!name) redirect(`${back}?error=${encodeURIComponent("Give the run sheet a name.")}`);
  try {
    await updateRunSheet(id, { name, group_id: uuid(text(formData, "group_id")) });
  } catch (error) {
    failed(back, "That didn't save.", error);
  }
  refresh();
  redirect(`/day?sheet=${id}`);
}

/** Removes the run sheet and its moments (the screen asks first). */
export async function deleteRunSheetAction(id: string) {
  try {
    await deleteRunSheet(id);
  } catch (error) {
    failed(`/day/sheets/${id}`, "That didn't remove it.", error);
  }
  refresh();
  revalidatePath("/area/[key]", "page");
  redirect("/day");
}

export async function deleteRunSheetItemAction(id: string) {
  try {
    await deleteRunSheetItem(id);
  } catch (error) {
    failed(`/day/run-sheet/${id}`, "That didn't remove it.", error);
  }
  refresh();
  redirect("/day");
}

// Seating --------------------------------------------------------------------

const SEATING = "/day?tab=seating";

export async function addTableAction(formData: FormData) {
  const wid = await weddingId();
  const capacity = Math.max(1, Math.min(40, Number(text(formData, "capacity")) || 8));
  try {
    const day = await getDay(wid);
    const count = day?.tables.length ?? 0;
    const asked = text(formData, "shape");
    const shape = asked === "long" || asked === "top" ? asked : "round";
    await addTable(wid, text(formData, "name") ?? `Table ${count + 1}`, capacity, count, shape);
  } catch (error) {
    failed(SEATING, "That didn't add the table.", error);
  }
  refresh();
}

/** The full-screen "Add a table" form (Seating's black +): adds it, then back to Seating. */
export async function addTableAndBackAction(formData: FormData) {
  await addTableAction(formData);
  redirect(SEATING);
}

export async function updateTableAction(id: string, formData: FormData) {
  const name = text(formData, "name");
  const capacity = Math.max(1, Math.min(40, Number(text(formData, "capacity")) || 8));
  if (!name) return;
  try {
    await updateTable(id, { name, capacity });
  } catch (error) {
    failed(SEATING, "That didn't save.", error);
  }
  refresh();
}

export async function deleteTableAction(id: string) {
  try {
    await deleteTable(id);
  } catch (error) {
    failed(SEATING, "That didn't remove the table.", error);
  }
  refresh();
}

/** Seats the guest picked in a table's "Add someone" list. */
export async function seatGuestAction(tableId: string, formData: FormData) {
  const wid = await weddingId();
  const guest = text(formData, "guest");
  if (!guest) return;
  try {
    await seatGuest(wid, guest, tableId);
  } catch (error) {
    failed(SEATING, "That didn't seat them.", error);
  }
  refresh();
}

export async function unseatGuestAction(contactId: string) {
  try {
    await unseatGuest(contactId);
  } catch (error) {
    failed(SEATING, "That didn't move them.", error);
  }
  refresh();
}

// Floor plan -----------------------------------------------------------------
// Called straight from the floor plan, which updates on screen first and
// only needs to hear back if the save failed. They return a message rather
// than redirecting, so a drag doesn't reload the page.

function floorPlanError(error: unknown): string {
  console.error(error);
  const code = (error as { code?: string }).code;
  // 42703 / PGRST204: the columns don't exist yet.
  return code === "42703" || code === "PGRST204"
    ? "The floor plan needs one more database step: run supabase/migrations/0011_floor_plan.sql in Supabase."
    : `That didn't save. ${describe(error)}`;
}

// −300 … 400, as 0036_floor_plan_wider.sql allows: a table may stand outside the room.
const clamp = (n: number) => Math.max(-300, Math.min(400, Math.round(n * 10) / 10));

export async function moveTableAction(id: string, x: number, y: number): Promise<string | null> {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  try {
    await placeTable(id, { pos_x: clamp(x), pos_y: clamp(y) });
  } catch (error) {
    return floorPlanError(error);
  }
  refresh();
  return null;
}

/** A new table dropped (or placed) on the floor plan's panel: adds it where it landed. */
export async function addTableAtAction(shape: string, capacity: number, x: number, y: number): Promise<string | null> {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const wid = await weddingId();
  const asked = shape === "long" || shape === "top" ? shape : "round";
  const chairs = Math.max(1, Math.min(40, Math.round(Number(capacity)) || 8));
  try {
    const day = await getDay(wid);
    const count = day?.tables.length ?? 0;
    await addTable(wid, `Table ${count + 1}`, chairs, count, asked, { x: clamp(x), y: clamp(y) });
  } catch (error) {
    return floorPlanError(error);
  }
  refresh();
  return null;
}

export async function setTableShapeAction(id: string, shape: string): Promise<string | null> {
  if (shape !== "round" && shape !== "long" && shape !== "top") return null;
  try {
    await placeTable(id, { shape });
  } catch (error) {
    return floorPlanError(error);
  }
  refresh();
  return null;
}

export async function seatOnPlanAction(contactId: string, tableId: string): Promise<string | null> {
  const wid = await weddingId();
  try {
    await seatGuest(wid, contactId, tableId);
  } catch (error) {
    return floorPlanError(error);
  }
  refresh();
  return null;
}

/**
 * Sits a guest in one chair at a table (swapping with whoever was there).
 * `pins` first gives chairs to the table's guests who had none, as drawn.
 */
export async function seatAtAction(
  contactId: string,
  tableId: string,
  seatNo: number,
  pins: { contactId: string; seatNo: number }[] = [],
): Promise<string | null> {
  if (!Number.isInteger(seatNo) || seatNo < 1) return null;
  const wid = await weddingId();
  try {
    await pinSeats(
      tableId,
      pins.filter((p) => Number.isInteger(p.seatNo) && p.seatNo >= 1),
    );
    await seatGuestAt(wid, contactId, tableId, seatNo);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "42703" || code === "PGRST204") {
      return "Choosing a chair needs one more database step: run supabase/migrations/0025_seat_number.sql in Supabase.";
    }
    return floorPlanError(error);
  }
  refresh();
  return null;
}

export async function unseatOnPlanAction(contactId: string): Promise<string | null> {
  try {
    await unseatGuest(contactId);
  } catch (error) {
    return floorPlanError(error);
  }
  refresh();
  return null;
}

/**
 * Sits a guest at a table, or takes them off (null), from their guest card.
 * Returns a message rather than redirecting, like the card's other saves.
 */
export async function setGuestTableAction(contactId: string, tableId: string | null): Promise<{ error?: string }> {
  const message = tableId ? await seatOnPlanAction(contactId, tableId) : await unseatOnPlanAction(contactId);
  revalidatePath("/people");
  return message ? { error: message } : {};
}

// Transport ------------------------------------------------------------------

const TRANSPORT = "/day?tab=travel";

export async function saveTransportRunAction(id: string | null, formData: FormData) {
  const back = id ? `/day/transport/${id}` : "/day/transport/new";
  const wid = await weddingId();
  const at = text(formData, "at_time");
  const vehicle = text(formData, "vehicle");
  if (!at || !vehicle) redirect(`${back}?error=${encodeURIComponent("Please give it a time and a vehicle.")}`);

  let runId: string | null = null;
  try {
    runId = await saveTransportRun(wid, id, {
      at_time: at,
      vehicle,
      from_place: text(formData, "from_place"),
      to_place: text(formData, "to_place"),
      notes: text(formData, "notes"),
    });
  } catch (error) {
    failed(back, "That didn't save.", error);
  }
  // A new journey's "Who's going": the database only links guests of this wedding.
  if (!id && runId) {
    for (const guest of formData.getAll("member").map(String).filter((v) => /^[0-9a-f-]{36}$/i.test(v))) {
      try {
        await addPassenger(wid, runId, guest);
      } catch (error) {
        console.error("adding a passenger to a new journey failed", error);
      }
    }
  }
  refresh();
  redirect(id ? stayAfterSave(`/day/transport/${id}`) : TRANSPORT);
}

export async function deleteTransportRunAction(id: string) {
  try {
    await deleteTransportRun(id);
  } catch (error) {
    failed(`/day/transport/${id}`, "That didn't remove it.", error);
  }
  refresh();
  redirect(TRANSPORT);
}

export async function addPassengerAction(runId: string, formData: FormData) {
  const wid = await weddingId();
  const guest = text(formData, "guest");
  if (!guest) return;
  try {
    await addPassenger(wid, runId, guest);
  } catch (error) {
    failed(TRANSPORT, "That didn't add them.", error);
  }
  refresh();
}

export async function removePassengerAction(runId: string, contactId: string) {
  try {
    await removePassenger(runId, contactId);
  } catch (error) {
    failed(TRANSPORT, "That didn't remove them.", error);
  }
  refresh();
}
