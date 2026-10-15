"use server";

import { revalidatePath } from "next/cache";
import { addPassenger, removePassenger } from "@/lib/db/day";
import { createStay, deleteStay, listStays, setGuestStay, setOwnWay, updateStay } from "@/lib/db/stays";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

/**
 * Travel (0020_travel.sql): places to stay, who's staying where, and who's
 * on which journey. Called from Travel's cards and the guest card, so they
 * return a message rather than redirecting. Each finds the wedding itself;
 * row-level security and the (id, wedding_id) links stop a guest being put up
 * at, or carried by, another wedding's place or car.
 */
type Result = { error?: string; id?: string };

const done = () => {
  revalidatePath("/day");
  revalidatePath("/people");
  revalidatePath("/people/household/[id]", "page");
};

const failed = (what: string, error: unknown): Result => {
  console.error(`${what} failed`, error);
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01" || code === "PGRST205" || code === "42703" || code === "PGRST204") {
    return { error: "Travel isn't set up yet (0020_travel.sql)." };
  }
  return { error: `That didn't save. ${describe(error)}` };
};

const UUID = /^[0-9a-f-]{36}$/i;

export async function addStayAction(name: string): Promise<Result> {
  const tidy = name.trim();
  if (!tidy) return { error: "Give the place a name." };
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    const count = (await listStays(wedding.id)).length;
    const stay = await createStay(wedding.id, tidy, count);
    done();
    return { id: stay.id };
  } catch (error) {
    return failed("adding a place to stay", error);
  }
}

export async function renameStayAction(id: string, name: string): Promise<Result> {
  const tidy = name.trim();
  if (!tidy) return { error: "Give the place a name." };
  try {
    await updateStay(id, { name: tidy });
    done();
    return {};
  } catch (error) {
    return failed("renaming a place to stay", error);
  }
}

export async function saveStayNoteAction(id: string, note: string): Promise<Result> {
  try {
    await updateStay(id, { note: note.trim() || null });
    done();
    return {};
  } catch (error) {
    return failed("saving a note", error);
  }
}

/** Removes the place; its guests become "staying, not sure where". */
export async function deleteStayAction(id: string): Promise<Result> {
  try {
    await deleteStay(id);
    done();
    return {};
  } catch (error) {
    return failed("removing a place to stay", error);
  }
}

/**
 * Where a guest is staying: a place's id, "unsure" (staying, not sure
 * where), "no" (not staying over) or "" (not asked yet).
 */
export async function setStayAction(contactId: string, choice: string): Promise<Result> {
  try {
    if (choice === "no") await setGuestStay(contactId, "no", null);
    else if (choice === "unsure") await setGuestStay(contactId, "yes", null);
    else if (choice === "") await setGuestStay(contactId, null, null);
    else if (UUID.test(choice)) await setGuestStay(contactId, "yes", choice);
    else return { error: "That place wasn't found." };
    done();
    return {};
  } catch (error) {
    return failed("saving where they're staying", error);
  }
}

export async function setOwnWayAction(contactId: string, ownWay: boolean): Promise<Result> {
  try {
    await setOwnWay(contactId, ownWay);
    done();
    return {};
  } catch (error) {
    return failed("saving their own way", error);
  }
}

export async function boardAction(runId: string, contactId: string): Promise<Result> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    await addPassenger(wedding.id, runId, contactId);
    done();
    return {};
  } catch (error) {
    return failed("adding to a journey", error);
  }
}

export async function leaveAction(runId: string, contactId: string): Promise<Result> {
  try {
    await removePassenger(runId, contactId);
    done();
    return {};
  } catch (error) {
    return failed("taking off a journey", error);
  }
}
