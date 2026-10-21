import { createClient } from "@/lib/supabase/server";
import type { GuestGroup, GuestGroupMember } from "@/types/db";

/** A group with the ids of the guests in it. */
export interface GroupWithMembers extends GuestGroup {
  members: string[];
}

/** One group's name, or null if it isn't there (or isn't this wedding's: row-level security). */
export async function getGroup(groupId: string): Promise<GuestGroup | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("guest_groups").select("*").eq("id", groupId).maybeSingle();
  return (data as GuestGroup | null) ?? null;
}

/**
 * The wedding's groups of guests (0019_guest_groups.sql), A–Z, each with who's
 * in it. Empty until 0019 is run, rather than breaking the guest list.
 */
export async function listGroups(weddingId: string): Promise<GroupWithMembers[]> {
  const supabase = await createClient();
  const [groups, members] = await Promise.all([
    supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("name"),
    supabase.from("guest_group_members").select("group_id, contact_id").eq("wedding_id", weddingId),
  ]);
  const error = groups.error ?? members.error;
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  const rows = (members.data ?? []) as Pick<GuestGroupMember, "group_id" | "contact_id">[];
  return ((groups.data ?? []) as GuestGroup[]).map((g) => ({
    ...g,
    members: rows.filter((m) => m.group_id === g.id).map((m) => m.contact_id),
  }));
}

export async function createGroup(weddingId: string, name: string): Promise<GuestGroup> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("guest_groups").insert({ wedding_id: weddingId, name }).select().single();
  if (error) throw error;
  return data;
}

export async function renameGroup(groupId: string, name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("guest_groups").update({ name }).eq("id", groupId);
  if (error) throw error;
}

/** Removes the group only; its people stay on the guest list. */
export async function deleteGroup(groupId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("guest_groups").delete().eq("id", groupId);
  if (error) throw error;
}

/** Puts a guest in a group (no harm if they're already in it). */
export async function addToGroup(weddingId: string, groupId: string, contactId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guest_group_members")
    .upsert({ wedding_id: weddingId, group_id: groupId, contact_id: contactId }, { onConflict: "group_id,contact_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeFromGroup(groupId: string, contactId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("guest_group_members").delete().eq("group_id", groupId).eq("contact_id", contactId);
  if (error) throw error;
}
