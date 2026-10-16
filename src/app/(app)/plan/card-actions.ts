"use server";

import { revalidatePath } from "next/cache";
import { deleteAppointment, getAppointment, updateAppointment } from "@/lib/db/appointments";
import { deleteMilestone, getMilestone, updateMilestone } from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { formOptions } from "@/lib/form-options";
import { refreshPlan } from "@/lib/jobs";
import type { AreaOption } from "@/lib/areas";
import type { Appointment, Milestone } from "@/types/db";

/**
 * The to-do and appointment cards (src/components/plan-cards.tsx): the same
 * saves as the edit pages, but they return a message rather than moving to
 * another screen, so the card stays open over whatever page you're on.
 */

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export type PlanCardData =
  | {
      kind: "todo";
      milestone: Milestone;
      areas: AreaOption[];
      suppliers: { id: string; name: string; area?: string | null }[];
      weddingDate: string | null;
    }
  | {
      kind: "appointment";
      appointment: Appointment;
      areas: AreaOption[];
      suppliers: { id: string; name: string; area?: string | null }[];
      weddingDate: string | null;
    };

/** What a card needs; null when it's gone (or another wedding's — row-level security). */
export async function loadPlanCardAction(kind: "todo" | "appointment", id: string): Promise<PlanCardData | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const wedding = await getCurrentWedding();
  if (!wedding) return null;
  const [item, options] = await Promise.all([
    kind === "todo" ? getMilestone(id) : getAppointment(id),
    formOptions(wedding.id),
  ]);
  if (!item) return null;
  const common = { areas: options.areas, suppliers: options.suppliers, weddingDate: wedding.wedding_date };
  return kind === "todo"
    ? { kind, milestone: item as Milestone, ...common }
    : { kind, appointment: item as Appointment, ...common };
}

function refreshAll() {
  refreshPlan();
  revalidatePath("/standing");
}

export async function saveTodoCardAction(id: string, formData: FormData): Promise<{ error?: string }> {
  const title = text(formData, "title");
  if (!title) return { error: "Please say what needs doing." };
  try {
    // One kind of to-do (owner, 12 Oct 2026): saving an old "start around" nudge makes it ordinary.
    await updateMilestone(id, {
      title,
      due_date: text(formData, "when"),
      remind_at: null,
      category: text(formData, "category"),
      description: text(formData, "description"),
    });
  } catch (error) {
    console.error("saving to-do from its card failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  refreshAll();
  return {};
}

export async function saveAppointmentCardAction(id: string, formData: FormData): Promise<{ error?: string }> {
  const title = text(formData, "title");
  const onDate = text(formData, "on_date");
  if (!title || !onDate) return { error: "Please say what it is and when." };
  try {
    await updateAppointment(id, {
      title,
      on_date: onDate,
      at_time: text(formData, "at_time"),
      location: text(formData, "location"),
      contact_id: text(formData, "supplier"),
      area_key: text(formData, "area"),
      notes: text(formData, "notes"),
    });
  } catch (error) {
    console.error("saving appointment from its card failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  refreshAll();
  return {};
}

export async function removePlanCardAction(kind: "todo" | "appointment", id: string): Promise<{ error?: string }> {
  try {
    if (kind === "todo") await deleteMilestone(id);
    else await deleteAppointment(id);
  } catch (error) {
    console.error("removing from its card failed", error);
    return { error: `That didn't remove it. ${describe(error)}` };
  }
  refreshAll();
  return {};
}
