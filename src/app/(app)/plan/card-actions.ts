"use server";

import { revalidatePath } from "next/cache";
import { deleteAppointment, getAppointment, updateAppointment } from "@/lib/db/appointments";
import { deleteMilestone, getMilestone, updateMilestone } from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { formOptions } from "@/lib/form-options";
import { refreshMoney, refreshPlan } from "@/lib/jobs";
import { deletePayment, getPayment, updatePayment } from "@/lib/db/money";
import { parseMoney } from "@/lib/money";
import type { AreaOption } from "@/lib/areas";
import type { Appointment, Milestone, Payment } from "@/types/db";

/**
 * The to-do and appointment cards (plan-cards.tsx): each change saves on its
 * own and returns a message rather than moving to another screen, so the
 * card stays open over whatever page you're on.
 */

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
    }
  | {
      kind: "payment";
      payment: Payment;
      areas: AreaOption[];
      suppliers: { id: string; name: string; area?: string | null }[];
      weddingDate: string | null;
    };

export type CardKind = PlanCardData["kind"];

/** What a card needs; null when it's gone (or another wedding's — row-level security). */
export async function loadPlanCardAction(kind: CardKind, id: string): Promise<PlanCardData | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const wedding = await getCurrentWedding();
  if (!wedding) return null;
  const [item, options] = await Promise.all([
    kind === "todo" ? getMilestone(id) : kind === "appointment" ? getAppointment(id) : getPayment(id),
    formOptions(wedding.id),
  ]);
  if (!item) return null;
  const common = { areas: options.areas, suppliers: options.suppliers, weddingDate: wedding.wedding_date };
  if (kind === "todo") return { kind, milestone: item as Milestone, ...common };
  if (kind === "appointment") return { kind, appointment: item as Appointment, ...common };
  return { kind, payment: item as Payment, ...common };
}

function refreshAll() {
  refreshPlan();
  refreshMoney();
  revalidatePath("/standing");
}

type TodoFields = Partial<Pick<Milestone, "title" | "due_date" | "category" | "description">>;
type AppointmentFields = Partial<Pick<Appointment, "title" | "on_date" | "at_time" | "location" | "contact_id" | "area_key" | "notes">>;

/**
 * One change from a card, saved at once (owner, 16 Oct 2026: taps save
 * straight away, typing gets a small Save — like the guest card). Only the
 * fields named here can be changed.
 */
export async function updatePlanFieldsAction(
  kind: CardKind,
  id: string,
  fields: TodoFields | AppointmentFields | Record<string, string | null>,
): Promise<{ error?: string }> {
  const allowed = {
    todo: ["title", "due_date", "category", "description"],
    appointment: ["title", "on_date", "at_time", "location", "contact_id", "area_key", "notes"],
    payment: ["description", "amount", "due_date", "paid_on", "contact_id", "area_key", "notes"],
  }[kind];
  const tidy: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key)) continue;
    tidy[key] = typeof value === "string" ? value.trim() || null : null;
  }
  if (("title" in tidy && !tidy.title) || ("description" in tidy && kind === "payment" && !tidy.description)) {
    return { error: "It needs a name." };
  }
  if (kind === "appointment" && "on_date" in tidy && !tidy.on_date) return { error: "An appointment needs a date." };
  try {
    if (kind === "todo") {
      // Giving an old "start around" nudge a date makes it an ordinary to-do (12 Oct 2026).
      await updateMilestone(id, "due_date" in tidy ? { ...tidy, remind_at: null } : tidy);
    } else if (kind === "appointment") {
      await updateAppointment(id, tidy);
    } else {
      const { amount, ...rest } = tidy;
      const patch: Partial<Payment> = rest;
      if ("amount" in tidy) {
        const value = parseMoney(amount);
        if (value === null) return { error: "Please give an amount, like 250." };
        patch.amount = value;
      }
      await updatePayment(id, patch);
    }
  } catch (error) {
    console.error("saving from a plan card failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  refreshAll();
  return {};
}

export async function removePlanCardAction(kind: CardKind, id: string): Promise<{ error?: string }> {
  try {
    if (kind === "todo") await deleteMilestone(id);
    else if (kind === "appointment") await deleteAppointment(id);
    else await deletePayment(id);
  } catch (error) {
    console.error("removing from its card failed", error);
    return { error: `That didn't remove it. ${describe(error)}` };
  }
  refreshAll();
  return {};
}
