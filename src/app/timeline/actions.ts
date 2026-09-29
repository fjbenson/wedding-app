"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  completeMilestone,
  createMilestone,
  deleteMilestone,
  reopenMilestone,
  updateMilestone,
} from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

/** Everywhere a milestone shows up. */
function refresh() {
  revalidatePath("/timeline");
  revalidatePath("/");
}

/** Adds a to-do (milestoneId null) or saves changes to one. */
export async function saveMilestoneAction(milestoneId: string | null, formData: FormData) {
  const back = milestoneId ? `/timeline/${milestoneId}` : "/timeline/new";

  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const title = text(formData, "title");
  if (!title) {
    redirect(`${back}?error=${encodeURIComponent("Please say what needs doing.")}`);
  }

  const fields = {
    title,
    due_date: text(formData, "due_date"),
    category: text(formData, "category"),
    description: text(formData, "description"),
  };

  let detail = "";
  try {
    if (milestoneId) await updateMilestone(milestoneId, fields);
    else
      await createMilestone({
        wedding_id: wedding.id,
        ...fields,
        status: "todo",
        remind_at: null,
        assigned_to: null,
      });
  } catch (error) {
    console.error("saving milestone failed", error);
    detail = describe(error);
  }

  if (detail) {
    redirect(
      `${back}?error=${encodeURIComponent("That didn't save.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  refresh();
  redirect("/timeline");
}

/** The tick box: done ↔ not done. Stays on the page. */
export async function toggleMilestoneAction(milestoneId: string, done: boolean) {
  if (done) await completeMilestone(milestoneId);
  else await reopenMilestone(milestoneId);
  refresh();
}

export async function deleteMilestoneAction(milestoneId: string) {
  let detail = "";
  try {
    await deleteMilestone(milestoneId);
  } catch (error) {
    console.error("removing milestone failed", error);
    detail = describe(error);
  }

  if (detail) {
    redirect(
      `/timeline/${milestoneId}?error=${encodeURIComponent("That didn't remove it.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  refresh();
  redirect("/timeline");
}
