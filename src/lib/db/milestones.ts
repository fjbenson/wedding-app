import { createClient } from "@/lib/supabase/server";
import type { Milestone, MilestoneStatus } from "@/types/db";

export async function listMilestones(
  weddingId: string,
  options: { status?: MilestoneStatus } = {},
): Promise<Milestone[]> {
  const supabase = await createClient();

  let query = supabase
    .from("milestones")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createMilestone(
  input: Omit<Milestone, "id" | "created_at" | "completed_at">,
): Promise<Milestone> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestones")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMilestone(
  milestoneId: string,
  patch: Partial<Omit<Milestone, "id" | "wedding_id" | "created_at">>,
): Promise<Milestone> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestones")
    .update(patch)
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Marks a milestone done and stamps the completion time. */
export async function completeMilestone(milestoneId: string): Promise<Milestone> {
  return updateMilestone(milestoneId, {
    status: "done",
    completed_at: new Date().toISOString(),
  });
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);
  if (error) throw error;
}
