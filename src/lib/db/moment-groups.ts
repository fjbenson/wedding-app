import { createClient } from "@/lib/supabase/server";

/**
 * Which groups of guests a run sheet moment is for (0034_food_moments_and_schedules.sql):
 * the bridesmaids' morning, the groomsmen's. A moment with no group is
 * everyone's. Empty until 0034 is run, rather than breaking the screen.
 */
const missing = (error: { code?: string }) => error.code === "42P01" || error.code === "PGRST205";

/** Moment id → the ids of the groups it's for. */
export async function listMomentGroups(weddingId: string): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("run_sheet_groups").select("moment_id, group_id").eq("wedding_id", weddingId);
  if (error) {
    if (missing(error)) return {};
    throw error;
  }
  const out: Record<string, string[]> = {};
  for (const r of data ?? []) (out[r.moment_id] ??= []).push(r.group_id);
  return out;
}

/** Replaces the groups a moment is for. The (id, wedding_id) links stop it pointing at another wedding's. */
export async function setMomentGroups(weddingId: string, momentId: string, groupIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { error: removed } = await supabase.from("run_sheet_groups").delete().eq("wedding_id", weddingId).eq("moment_id", momentId);
  if (removed) throw removed;
  if (groupIds.length === 0) return;
  const { error } = await supabase
    .from("run_sheet_groups")
    .insert([...new Set(groupIds)].map((group_id) => ({ wedding_id: weddingId, moment_id: momentId, group_id })));
  if (error) throw error;
}
