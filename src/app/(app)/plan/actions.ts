"use server";

import { redirect } from "next/navigation";
import {
  completeMilestone,
  createMilestones,
  listMilestones,
  deleteMilestone,
  reopenMilestone,
  updateMilestone,
} from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import { todayISO } from "@/lib/dates";
import { describe } from "@/lib/errors";
import { addTodo, refreshPlan } from "@/lib/jobs";
import { returnTo, stayAfterSave } from "@/lib/return-to";
import { starterPlan } from "@/lib/starter-plan";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

/** Everywhere a milestone shows up. */
const refresh = refreshPlan;

/** Adds a to-do (milestoneId null) or saves changes to one. */
export async function saveMilestoneAction(milestoneId: string | null, formData: FormData) {
  const back = milestoneId ? `/plan/${milestoneId}` : "/plan/new";

  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const title = text(formData, "title");
  if (!title) {
    redirect(`${back}?error=${encodeURIComponent("Please say what needs doing.")}`);
  }

  // One kind of to-do: every one just has a date (owner, 12 Oct 2026). Saving
  // an old "start around" nudge makes it ordinary.
  const due = text(formData, "when");
  const fields = {
    title,
    due_date: due,
    remind_at: null,
    category: text(formData, "category"),
    description: text(formData, "description"),
  };

  let error = "";
  let detail = "";
  if (milestoneId) {
    try {
      await updateMilestone(milestoneId, fields);
    } catch (e) {
      console.error("saving milestone failed", e);
      error = "That didn't save.";
      detail = describe(e);
    }
  } else {
    const result = await addTodo({ title, dueDate: due, area: fields.category, notes: fields.description });
    if (!result.ok) ({ error, detail = "" } = result);
  }

  if (error) {
    redirect(`${back}?error=${encodeURIComponent(error)}${detail ? `&detail=${encodeURIComponent(detail)}` : ""}`);
  }

  refresh();
  // Editing stays on the to-do; adding goes back to the plan.
  redirect(milestoneId ? stayAfterSave(`/plan/${milestoneId}`) : returnTo(formData, "/plan"));
}

/** The tick box: done ↔ not done. Stays on the page. */
export async function toggleMilestoneAction(milestoneId: string, done: boolean) {
  if (done) await completeMilestone(milestoneId);
  else await reopenMilestone(milestoneId);
  refresh();
}

export async function deleteMilestoneAction(milestoneId: string, formData?: FormData) {
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
  redirect(returnTo(formData, "/plan"));
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
