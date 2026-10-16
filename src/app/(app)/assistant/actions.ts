"use server";

import {
  addAppointment,
  addGuest,
  addGuestToGroup,
  addNote,
  addPayment,
  addTodo,
  markPaymentPaid,
  moveGuest,
  setGuestAnswer,
  setGuestDiet,
  setGuestOf,
  setTodoDate,
  tickTodo,
} from "@/lib/jobs";
import type { Proposal } from "@/lib/assistant/blocks";
import { draftGroupMessage } from "@/lib/assistant/draft";

/**
 * The Yes on one of Your assistant's cards: saves exactly what the card
 * showed, through the same jobs as the forms (src/lib/jobs.ts), which find
 * the signed-in person's own wedding and check every value again. Returns a
 * message rather than throwing, so a failure shows on the card.
 */
export async function confirmProposalAction(
  proposal: Proposal,
): Promise<{ ok: true; link?: string; note?: string } | { ok: false; error: string }> {
  try {
    switch (proposal.kind) {
      case "add_guest": {
        const p = proposal.input;
        const r = await addGuest({
          fullName: String(p.fullName ?? ""),
          householdId: p.householdId ?? null,
          newHousehold: p.newHousehold ?? null,
          eventId: p.eventId ?? null,
          roles: Array.isArray(p.roles) ? p.roles.map(String) : [],
          email: p.email ?? null,
          phone: p.phone ?? null,
          isChild: Boolean(p.isChild),
          meal: p.meal ?? null,
          diet: p.diet ?? null,
          notes: p.notes ?? null,
          groupIds: Array.isArray(p.groupIds) ? p.groupIds.map(String) : [],
          stayId: p.stayId ?? null,
          answer: (["to_invite", "pending", "attending", "declined"] as const).find((a) => a === p.answer) ?? null,
        });
        return r.ok ? { ok: true, link: `/people?guest=${r.id}`, note: r.note } : { ok: false, error: r.error };
      }
      case "set_guest_answer": {
        const r = await setGuestAnswer(String(proposal.input.guestId), proposal.input.status);
        return r.ok ? { ok: true, link: `/people?guest=${proposal.input.guestId}` } : { ok: false, error: r.error };
      }
      case "add_appointment": {
        const p = proposal.input;
        const r = await addAppointment({
          title: String(p.title ?? ""),
          onDate: String(p.onDate ?? ""),
          atTime: p.atTime ?? null,
          location: p.location ?? null,
          supplierId: p.supplierId ?? null,
          area: p.area ?? null,
          notes: p.notes ?? null,
        });
        return r.ok ? { ok: true, link: `/plan/appointments/${r.id}` } : { ok: false, error: r.error };
      }
      case "move_guest": {
        const p = proposal.input;
        const r = await moveGuest(String(p.guestId), { householdId: p.householdId ?? null, newHousehold: p.newHousehold ?? null });
        return r.ok ? { ok: true, link: `/people?guest=${p.guestId}` } : { ok: false, error: r.error };
      }
      case "set_guest_of": {
        const r = await setGuestOf(String(proposal.input.guestId), String(proposal.input.eventId));
        return r.ok ? { ok: true, link: `/people?guest=${proposal.input.guestId}` } : { ok: false, error: r.error };
      }
      case "set_guest_diet": {
        const r = await setGuestDiet(String(proposal.input.guestId), proposal.input.diet ?? null);
        return r.ok ? { ok: true, link: `/people?guest=${proposal.input.guestId}` } : { ok: false, error: r.error };
      }
      case "add_guest_to_group": {
        const r = await addGuestToGroup(String(proposal.input.guestId), String(proposal.input.groupId));
        return r.ok ? { ok: true, link: `/people?guest=${proposal.input.guestId}` } : { ok: false, error: r.error };
      }
      case "set_todo_date": {
        const r = await setTodoDate(String(proposal.input.todoId), proposal.input.dueDate ?? null);
        return r.ok ? { ok: true, link: "/plan?view=list" } : { ok: false, error: r.error };
      }
      case "tick_todo": {
        const r = await tickTodo(String(proposal.input.todoId));
        return r.ok ? { ok: true, link: "/plan?view=list" } : { ok: false, error: r.error };
      }
      case "mark_payment_paid": {
        const r = await markPaymentPaid(String(proposal.input.paymentId), proposal.input.paidOn ?? null);
        return r.ok ? { ok: true, link: "/money?view=month" } : { ok: false, error: r.error };
      }
      case "add_todo": {
        const p = proposal.input;
        const r = await addTodo({ title: String(p.title ?? ""), dueDate: p.dueDate ?? null, area: p.area ?? null, notes: p.notes ?? null });
        return r.ok ? { ok: true, link: `/plan/${r.id}` } : { ok: false, error: r.error };
      }
      case "add_payment": {
        const p = proposal.input;
        const r = await addPayment({
          description: String(p.description ?? ""),
          amount: typeof p.amount === "number" ? p.amount : null,
          supplierId: p.supplierId ?? null,
          area: p.area ?? null,
          dueDate: p.dueDate ?? null,
          paid: Boolean(p.paid),
          paidOn: p.paidOn ?? null,
          notes: p.notes ?? null,
        });
        return r.ok ? { ok: true, link: "/money?view=month" } : { ok: false, error: r.error };
      }
      default:
        return { ok: false, error: "That isn't something I can save." };
    }
  } catch (error) {
    console.error("confirming proposal failed", error);
    return { ok: false, error: "That didn't save. Try again." };
  }
}

/** "Save it as a note" when the assistant couldn't answer, so nothing typed is lost. */
export async function saveNoteAction(body: string): Promise<{ error?: string }> {
  const r = await addNote({ body });
  return r.ok ? {} : { error: r.error };
}

/** Your assistant drafts a message to a group (see `draftGroupMessage`). Never throws. */
export async function draftGroupMessageAction(input: {
  groupName: string;
  kind: "email" | "text";
  about: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    return await draftGroupMessage(input);
  } catch {
    return { ok: false, error: "That didn't work just now. Try again." };
  }
}
