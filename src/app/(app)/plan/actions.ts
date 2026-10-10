"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  completeMilestone,
  createMilestone,
  createMilestones,
  listMilestones,
  deleteMilestone,
  reopenMilestone,
  updateMilestone,
} from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import { todayISO } from "@/lib/dates";
import { describe } from "@/lib/errors";
import { starterPlan } from "@/lib/starter-plan";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

/** Everywhere a milestone shows up. */
function refresh() {
  revalidatePath("/plan");
  revalidatePath("/");
  revalidatePath("/area/[key]", "page");
}

/** Adds a to-do (milestoneId null) or saves changes to one. */
export async function saveMilestoneAction(milestoneId: string | null, formData: FormData) {
  const back = milestoneId ? `/plan/${milestoneId}` : "/plan/new";

  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const title = text(formData, "title");
  if (!title) {
    redirect(`${back}?error=${encodeURIComponent("Please say what needs doing.")}`);
  }

  // One date box: "Done by" saves it as the due date, "Start around" as a
  // nudge's start (src/lib/plan.ts).
  const when = text(formData, "when");
  const start = formData.get("when_kind") === "start";
  const fields = {
    title,
    due_date: start ? null : when,
    remind_at: start ? when : null,
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
  redirect("/plan");
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
      `/plan/${milestoneId}?error=${encodeURIComponent("That didn't remove it.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  refresh();
  redirect("/plan");
}

/**
 * Fills an empty timeline with the usual wedding to-dos. Does nothing if
 * there's already anything on it, so a double tap can't add them twice.
 */
export async function addStarterPlanAction(returnTo: "/" | "/plan") {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  let detail = "";
  try {
    const existing = await listMilestones(wedding.id);
    if (existing.length === 0) {
      await createMilestones(
        starterPlan(wedding.wedding_date, todayISO()).map((item) => ({
          wedding_id: wedding.id,
          ...item,
          description: null,
          status: "todo" as const,
          assigned_to: null,
        })),
      );
    }
  } catch (error) {
    console.error("adding starter plan failed", error);
    detail = describe(error);
  }

  if (detail) {
    redirect(
      `/plan/new?error=${encodeURIComponent("The starter list didn't save.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  refresh();
  redirect(returnTo);
}
