"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addToGroup, createGroup, deleteGroup, removeFromGroup, renameGroup } from "@/lib/db/groups";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

/**
 * Groups of guests (0019_guest_groups.sql). Each finds the wedding itself, so
 * nothing from the page can point it elsewhere; row-level security and the
 * tables' (id, wedding_id) links stop a group holding another wedding's guest.
 * They return a message rather than throwing, for the guest card and list.
 */
type Result = { error?: string; id?: string };

const done = () => {
  revalidatePath("/people");
  revalidatePath("/people/household/[id]", "page");
};

const failed = (what: string, error: unknown): Result => {
  console.error(`${what} failed`, error);
  const code = (error as { code?: string } | null)?.code;
  if (code === "23505") return { error: "There's already a group with that name." };
  if (code === "42P01" || code === "PGRST205") return { error: "Groups aren't set up yet (0019_guest_groups.sql)." };
  return { error: `That didn't save. ${describe(error)}` };
};

/** A new group, with someone already in it if `contactId` is given. */
export async function createGroupAction(name: string, contactId?: string): Promise<Result> {
  const tidy = name.trim();
  if (!tidy) return { error: "Give the group a name." };
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    const group = await createGroup(wedding.id, tidy);
    if (contactId) await addToGroup(wedding.id, group.id, contactId);
    done();
    return { id: group.id };
  } catch (error) {
    return failed("creating group", error);
  }
}

export async function addToGroupAction(groupId: string, contactId: string): Promise<Result> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    await addToGroup(wedding.id, groupId, contactId);
    done();
    return {};
  } catch (error) {
    return failed("adding to group", error);
  }
}

export async function removeFromGroupAction(groupId: string, contactId: string): Promise<Result> {
  try {
    await removeFromGroup(groupId, contactId);
    done();
    return {};
  } catch (error) {
    return failed("taking out of group", error);
  }
}

export async function renameGroupAction(groupId: string, name: string): Promise<Result> {
  const tidy = name.trim();
  if (!tidy) return { error: "Give the group a name." };
  try {
    await renameGroup(groupId, tidy);
    done();
    return {};
  } catch (error) {
    return failed("renaming group", error);
  }
}

/** Removes the group; the people in it stay on the guest list. */
export async function deleteGroupAction(groupId: string): Promise<Result> {
  try {
    await deleteGroup(groupId);
    done();
    return {};
  } catch (error) {
    return failed("removing group", error);
  }
}

/**
 * A new group from its own screen (`/people/groups/new`, owner, 16 Oct 2026:
 * adding gets a full screen): its name and who's in it. Then the guest list
 * opens showing that group.
 */
export async function saveNewGroupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const back = (error: string) => redirect(`/people/groups/new?error=${encodeURIComponent(error)}`);
  if (!name) back("Give the group a name.");
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  let id = "";
  try {
    const group = await createGroup(wedding.id, name);
    id = group.id;
    for (const member of new Set(formData.getAll("member").map(String))) await addToGroup(wedding.id, id, member);
  } catch (error) {
    if (!id) back(failed("creating group", error).error ?? "That didn't save.");
    console.error("adding people to a new group failed", error);
  }
  done();
  redirect(`/people?group=${id}`);
}
