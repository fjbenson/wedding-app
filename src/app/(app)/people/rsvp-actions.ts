"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { listGuests } from "@/lib/db/contacts";
import {
  createEvents,
  deleteEvent,
  deleteRsvp,
  inviteGuestsToEvent,
  listEvents,
  listRsvps,
  setContactStatus,
  markAllInvited,
  updateEvent,
  updateRsvp,
} from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import type { RsvpStatus } from "@/types/db";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function failed(back: string, message: string, error: unknown): never {
  console.error(message, error);
  redirect(`${back}?error=${encodeURIComponent(message)}&detail=${encodeURIComponent(describe(error))}`);
}

const STATUSES: RsvpStatus[] = ["to_invite", "pending", "attending", "declined"];

/** The usual two: day guests and evening guests. */
export async function addStarterEventsAction() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  try {
    await createEvents(wedding.id, [
      { name: "The day", location: null },
      { name: "The evening", location: null },
    ]);
  } catch (error) {
    failed("/people", "That didn't add them.", error);
  }

  revalidatePath("/people");
}

/** Adds an event (eventId null) or saves changes to one. */
export async function saveEventAction(eventId: string | null, formData: FormData) {
  const back = eventId ? `/people/events/${eventId}` : "/people/events/new";

  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const name = text(formData, "name");
  if (!name) redirect(`${back}?error=${encodeURIComponent("Please give it a name.")}`);

  const fields = { name, location: text(formData, "location") };
  try {
    if (eventId) await updateEvent(eventId, fields);
    else await createEvents(wedding.id, [fields]);
  } catch (error) {
    failed(back, "That didn't save.", error);
  }

  revalidatePath("/people");
  redirect("/people");
}

export async function deleteEventAction(eventId: string) {
  try {
    await deleteEvent(eventId);
  } catch (error) {
    failed(`/people/events/${eventId}`, "That didn't remove it.", error);
  }

  revalidatePath("/people");
  redirect("/people");
}

/** Meal and dietary needs for one event, saved from the guest card. */
export async function saveMealAction(
  rsvpId: string,
  meal: string,
  diet: string,
): Promise<{ error?: string }> {
  try {
    await updateRsvp(rsvpId, { meal_choice: meal.trim() || null, dietary_notes: diet.trim() || null });
  } catch (error) {
    console.error("saving meal failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  revalidatePath("/people");
  return {};
}

/** "We've sent them": everyone at "To invite" moves to "Invited". */
export async function markInvitedAction(): Promise<void> {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  try {
    await markAllInvited(wedding.id);
  } catch (error) {
    failed("/people", "That didn't save.", error);
  }
  revalidatePath("/people");
}

/**
 * Day or evening guest, from their card: on that event and every one after
 * it, off any before it. Their answer carries over (new rows start at "To
 * invite" for someone who hasn't got one yet).
 */
export async function setGuestOfAction(guestId: string, eventId: string): Promise<{ error?: string }> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "Your wedding couldn't be found." };
  try {
    const [events, guests, rsvps] = await Promise.all([
      listEvents(wedding.id),
      listGuests(wedding.id),
      listRsvps(wedding.id),
    ]);
    const guest = guests.find((g) => g.id === guestId);
    const from = events.findIndex((e) => e.id === eventId);
    if (!guest || from === -1) return { error: "That couldn't be found." };

    const theirs = rsvps.filter((r) => r.contact_id === guestId);
    const earlier = new Set(events.slice(0, from).map((e) => e.id));
    for (const r of theirs.filter((r) => earlier.has(r.event_id))) await deleteRsvp(r.id);
    for (const event of events.slice(from)) await inviteGuestsToEvent(wedding.id, event.id, [guest]);
    const kept = theirs.find((r) => !earlier.has(r.event_id)) ?? theirs[0];
    if (kept) await setContactStatus(guestId, kept.status);
  } catch (error) {
    console.error("setting day or evening failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  revalidatePath("/people");
  return {};
}

/** A guest's one answer — To invite, Invited, Coming or Can't come — from their card. */
export async function setGuestAnswerAction(guestId: string, status: RsvpStatus): Promise<{ error?: string }> {
  if (!STATUSES.includes(status)) return { error: "That isn't an answer." };
  try {
    await setContactStatus(guestId, status);
  } catch (error) {
    console.error("saving answer failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  revalidatePath("/people");
  return {};
}
