"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { listGuests } from "@/lib/db/contacts";
import {
  createEvents,
  deleteEvent,
  deleteRsvp,
  getRsvp,
  inviteGuestsToEvent,
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

const STATUSES: RsvpStatus[] = ["pending", "attending", "declined"];

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
  let savedId = eventId;
  try {
    if (eventId) await updateEvent(eventId, fields);
    else savedId = (await createEvents(wedding.id, [fields]))[0]?.id ?? null;
  } catch (error) {
    failed(back, "That didn't save.", error);
  }

  revalidatePath("/people");
  redirect(savedId ? `/people?event=${savedId}` : "/people");
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

/** Invites the given guests (a household, or everyone not yet asked). */
export async function inviteAction(eventId: string, guestIds: string[]) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  try {
    const wanted = new Set(guestIds);
    const guests = (await listGuests(wedding.id)).filter((g) => wanted.has(g.id));
    await inviteGuestsToEvent(wedding.id, eventId, guests);
  } catch (error) {
    failed("/people", "That didn't invite them.", error);
  }

  revalidatePath("/people");
}

/** The quick yes / no / not yet tap beside a name. */
export async function setStatusAction(rsvpId: string, status: RsvpStatus) {
  if (!STATUSES.includes(status)) return;
  try {
    await updateRsvp(rsvpId, { status });
  } catch (error) {
    // The button flips back to what's really saved when the page refreshes.
    console.error("saving answer failed", error);
  }
  revalidatePath("/people");
}

/** The full answer: yes/no plus meal and dietary needs. */
export async function saveRsvpAction(rsvpId: string, formData: FormData) {
  const status = String(formData.get("status")) as RsvpStatus;
  const rsvp = await getRsvp(rsvpId);
  if (!rsvp) redirect("/people");

  try {
    await updateRsvp(rsvpId, {
      status: STATUSES.includes(status) ? status : rsvp.status,
      meal_choice: text(formData, "meal_choice"),
      dietary_notes: text(formData, "dietary_notes"),
    });
  } catch (error) {
    failed(`/people/rsvp/${rsvpId}`, "That didn't save.", error);
  }

  revalidatePath("/people");
  redirect(`/people?guest=${rsvp.contact_id}`);
}

export async function uninviteAction(rsvpId: string, guestId: string) {
  try {
    await deleteRsvp(rsvpId);
  } catch (error) {
    failed(`/people/rsvp/${rsvpId}`, "That didn't take them off.", error);
  }

  revalidatePath("/people");
  redirect(`/people?guest=${guestId}`);
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

/** Takes a guest off one event, from their card. */
export async function removeFromEventAction(rsvpId: string): Promise<{ error?: string }> {
  try {
    await deleteRsvp(rsvpId);
  } catch (error) {
    console.error("removing from event failed", error);
    return { error: `That didn't take them off. ${describe(error)}` };
  }
  revalidatePath("/people");
  return {};
}
