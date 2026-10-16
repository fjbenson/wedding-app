"use server";

import { revalidatePath } from "next/cache";
import { deleteAppointment, getAppointment, updateAppointment } from "@/lib/db/appointments";
import { deleteMilestone, getMilestone, updateMilestone } from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { formOptions } from "@/lib/form-options";
import { refreshMoney, refreshPlan } from "@/lib/jobs";
import { deletePayment, getPayment, updatePayment } from "@/lib/db/money";
import { deleteRunSheetItem, deleteTransportRun, getRunSheetItem, saveRunSheetItem, saveTransportRun } from "@/lib/db/day";
import { parseMoney } from "@/lib/money";
import { deleteInspo, getInspo, listInspoIds, updateInspo, type InspoWithPicture } from "@/lib/db/inspo";
import type { AreaOption } from "@/lib/areas";
import { listGuests } from "@/lib/db/contacts";
import { addInvolved, getInvolved, listForGuest, removeInvolved, type InvolvedKind } from "@/lib/db/involved";
import type { Appointment, Milestone, Payment, RunSheetItem, TransportRun } from "@/types/db";

/**
 * The to-do and appointment cards (plan-cards.tsx): each change saves on its
 * own and returns a message rather than moving to another screen, so the
 * card stays open over whatever page you're on.
 */

export type PlanCardData =
  | {
      kind: "todo";
      milestone: Milestone;
      involved: Involved;
      areas: AreaOption[];
      suppliers: { id: string; name: string; area?: string | null }[];
      weddingDate: string | null;
    }
  | {
      kind: "appointment";
      appointment: Appointment;
      involved: Involved;
      areas: AreaOption[];
      suppliers: { id: string; name: string; area?: string | null }[];
      weddingDate: string | null;
    }
  | {
      kind: "moment";
      moment: RunSheetItem;
      areas: AreaOption[];
      suppliers: { id: string; name: string; area?: string | null }[];
      weddingDate: string | null;
    }
  | {
      kind: "idea";
      idea: InspoWithPicture;
      /** Its folder's ideas, newest first, to step through with ‹ ›. */
      folderIds: string[];
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

/** Who's tagged on a to-do or appointment, and everyone who could be. */
export interface Involved {
  ids: string[];
  guests: { id: string; name: string }[];
}

async function loadInvolved(weddingId: string, kind: InvolvedKind, id: string): Promise<Involved> {
  const [ids, guests] = await Promise.all([getInvolved(kind, id), listGuests(weddingId)]);
  return {
    ids,
    guests: guests
      .map((g) => ({ id: g.id, name: [g.first_name, g.last_name].filter(Boolean).join(" ") }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export type CardKind = PlanCardData["kind"];
/** What `updatePlanFieldsAction` can change: the cards, plus a journey on Travel's card. */
type FieldKind = CardKind | "journey";

/** What a card needs; null when it's gone (or another wedding's — row-level security). */
export async function loadPlanCardAction(kind: CardKind, id: string): Promise<PlanCardData | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const wedding = await getCurrentWedding();
  if (!wedding) return null;
  const [item, options] = await Promise.all([
    kind === "todo"
      ? getMilestone(id)
      : kind === "appointment"
        ? getAppointment(id)
        : kind === "moment"
          ? getRunSheetItem(id)
          : kind === "idea"
            ? getInspo(id)
            : getPayment(id),
    formOptions(wedding.id),
  ]);
  if (!item) return null;
  const common = { areas: options.areas, suppliers: options.suppliers, weddingDate: wedding.wedding_date };
  if (kind === "todo") return { kind, milestone: item as Milestone, involved: await loadInvolved(wedding.id, kind, id), ...common };
  if (kind === "appointment") return { kind, appointment: item as Appointment, involved: await loadInvolved(wedding.id, kind, id), ...common };
  if (kind === "moment") return { kind, moment: item as RunSheetItem, ...common };
  if (kind === "idea") {
    const idea = item as InspoWithPicture;
    return { kind, idea, folderIds: await listInspoIds(wedding.id, idea.area_key), ...common };
  }
  return { kind, payment: item as Payment, ...common };
}

function refreshAll() {
  refreshPlan();
  refreshMoney();
  revalidatePath("/day");
  revalidatePath("/inspo");
  revalidatePath("/inbox");
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
  kind: FieldKind,
  id: string,
  fields: TodoFields | AppointmentFields | Record<string, string | null>,
): Promise<{ error?: string }> {
  const allowed = {
    todo: ["title", "due_date", "category", "description"],
    appointment: ["title", "on_date", "at_time", "location", "contact_id", "area_key", "notes"],
    payment: ["description", "amount", "due_date", "paid_on", "contact_id", "area_key", "notes"],
    moment: ["title", "at_time", "location", "who", "notes", "area_key"],
    journey: ["vehicle", "at_time", "from_place", "to_place", "notes"],
    idea: ["area_key", "note"],
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
  if ((kind === "moment" || kind === "journey") && "at_time" in tidy && !tidy.at_time) return { error: "It needs a time." };
  if (kind === "journey" && "vehicle" in tidy && !tidy.vehicle) return { error: "It needs a name, like Coach 1." };
  try {
    if (kind === "todo") {
      // Giving an old "start around" nudge a date makes it an ordinary to-do (12 Oct 2026).
      await updateMilestone(id, "due_date" in tidy ? { ...tidy, remind_at: null } : tidy);
    } else if (kind === "appointment") {
      await updateAppointment(id, tidy);
    } else if (kind === "idea") {
      await updateInspo(id, tidy);
    } else if (kind === "moment" || kind === "journey") {
      const wedding = await getCurrentWedding();
      if (!wedding) return { error: "No wedding found." };
      if (kind === "moment") await saveRunSheetItem(wedding.id, id, tidy as Partial<RunSheetItem> as RunSheetItem);
      else await saveTransportRun(wedding.id, id, tidy as Partial<TransportRun> as TransportRun);
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

export async function removePlanCardAction(kind: FieldKind, id: string): Promise<{ error?: string }> {
  try {
    if (kind === "todo") await deleteMilestone(id);
    else if (kind === "appointment") await deleteAppointment(id);
    else if (kind === "moment") await deleteRunSheetItem(id);
    else if (kind === "journey") await deleteTransportRun(id);
    else if (kind === "idea") await deleteInspo(id);
    else await deletePayment(id);
  } catch (error) {
    console.error("removing from its card failed", error);
    return { error: `That didn't remove it. ${describe(error)}` };
  }
  refreshAll();
  return {};
}

/**
 * Tag a guest on a to-do or appointment, or take them off (0021_involved.sql).
 * The database only links a guest and an item of the same wedding.
 */
export async function setInvolvedAction(kind: InvolvedKind, id: string, contactId: string, on: boolean): Promise<{ error?: string }> {
  if (kind !== "todo" && kind !== "appointment") return { error: "That can't have people on it." };
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    if (on) await addInvolved(wedding.id, kind, id, [contactId]);
    else await removeInvolved(kind, id, contactId);
  } catch (error) {
    console.error("tagging a guest failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  refreshAll();
  revalidatePath("/people");
  return {};
}

/** What a guest is tagged on, for their card (row-level security keeps it to this wedding). */
export async function guestPlanAction(contactId: string): Promise<Awaited<ReturnType<typeof listForGuest>>> {
  if (!/^[0-9a-f-]{36}$/i.test(contactId)) return { todos: [], appointments: [] };
  return listForGuest(contactId);
}
