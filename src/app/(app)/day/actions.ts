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
  unseatGuest,
  updateTable,
} from "@/lib/db/day";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

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

export async function saveRunSheetItemAction(id: string | null, formData: FormData) {
  const back = id ? `/day/run-sheet/${id}` : "/day/run-sheet/new";
  const wid = await weddingId();
  const at = text(formData, "at_time");
  const title = text(formData, "title");
  if (!at || !title) redirect(`${back}?error=${encodeURIComponent("Please give it a time and say what happens.")}`);

  try {
    await saveRunSheetItem(wid, id, {
      at_time: at,
      title,
      location: text(formData, "location"),
      who: text(formData, "who"),
      notes: text(formData, "notes"),
    });
  } catch (error) {
    failed(back, "That didn't save.", error);
  }
  refresh();
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
    await addTable(wid, text(formData, "name") ?? `Table ${count + 1}`, capacity, count);
  } catch (error) {
    failed(SEATING, "That didn't add the table.", error);
  }
  refresh();
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

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n * 10) / 10));

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

export async function setTableShapeAction(id: string, shape: string): Promise<string | null> {
  if (shape !== "round" && shape !== "long") return null;
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

export async function unseatOnPlanAction(contactId: string): Promise<string | null> {
  try {
    await unseatGuest(contactId);
  } catch (error) {
    return floorPlanError(error);
  }
  refresh();
  return null;
}

// Transport ------------------------------------------------------------------

const TRANSPORT = "/day?tab=transport";

export async function saveTransportRunAction(id: string | null, formData: FormData) {
  const back = id ? `/day/transport/${id}` : "/day/transport/new";
  const wid = await weddingId();
  const at = text(formData, "at_time");
  const vehicle = text(formData, "vehicle");
  if (!at || !vehicle) redirect(`${back}?error=${encodeURIComponent("Please give it a time and a vehicle.")}`);

  try {
    await saveTransportRun(wid, id, {
      at_time: at,
      vehicle,
      from_place: text(formData, "from_place"),
      to_place: text(formData, "to_place"),
      notes: text(formData, "notes"),
    });
  } catch (error) {
    failed(back, "That didn't save.", error);
  }
  refresh();
  redirect(TRANSPORT);
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
