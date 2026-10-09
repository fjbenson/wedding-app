import { createClient } from "@/lib/supabase/server";
import type { Contact, Invitation, Rsvp, RsvpStatus, WeddingEvent } from "@/types/db";

export async function listEvents(weddingId: string): Promise<WeddingEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getEvent(eventId: string): Promise<WeddingEvent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();

  if (error) throw error;
  return data;
}

type EventFields = Pick<WeddingEvent, "name" | "location">;

/** Adds one or more events — "The day", "The evening". */
export async function createEvents(
  weddingId: string,
  events: EventFields[],
): Promise<WeddingEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert(events.map((event) => ({ wedding_id: weddingId, ...event })))
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function updateEvent(eventId: string, fields: EventFields): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").update(fields).eq("id", eventId);
  if (error) throw error;
}

/** Removes an event and every RSVP for it. */
export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

/** RSVPs for a wedding, optionally narrowed to one event. */
export async function listRsvps(
  weddingId: string,
  options: { eventId?: string } = {},
): Promise<Rsvp[]> {
  const supabase = await createClient();

  let query = supabase.from("rsvps").select("*").eq("wedding_id", weddingId);
  if (options.eventId) query = query.eq("event_id", options.eventId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getRsvp(rsvpId: string): Promise<Rsvp | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("rsvps").select("*").eq("id", rsvpId).maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Changes an answer and/or its details, leaving anything not passed alone —
 * so a quick yes/no tap doesn't wipe a meal choice. `responded_at` follows
 * the answer: set when there is one, cleared when it goes back to pending.
 */
export async function updateRsvp(
  rsvpId: string,
  fields: Partial<Pick<Rsvp, "status" | "meal_choice" | "dietary_notes">>,
): Promise<void> {
  const supabase = await createClient();
  const update: Partial<Rsvp> = { ...fields };
  if (fields.status) {
    update.responded_at = fields.status === "pending" || fields.status === "to_invite" ? null : new Date().toISOString();
  }

  const { error } = await supabase.from("rsvps").update(update).eq("id", rsvpId);
  if (error) throw error;
}

/** Takes someone off an event's list. */
export async function deleteRsvp(rsvpId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("rsvps").delete().eq("id", rsvpId);
  if (error) throw error;
}

/**
 * Invites guests to an event: a pending RSVP each, tied to their household's
 * invitation (made if it doesn't exist yet). Guests not in a household get
 * an RSVP with no invitation. Anyone already invited is left alone.
 */
export async function inviteGuestsToEvent(
  weddingId: string,
  eventId: string,
  guests: Pick<Contact, "id" | "household_id">[],
): Promise<void> {
  if (guests.length === 0) return;
  const supabase = await createClient();

  const householdIds = [...new Set(guests.map((g) => g.household_id).filter((id): id is string => !!id))];
  const invitationFor = new Map<string, string>();

  if (householdIds.length > 0) {
    const { data: invitations, error } = await supabase
      .from("invitations")
      .upsert(
        householdIds.map((household_id) => ({ wedding_id: weddingId, household_id })),
        { onConflict: "wedding_id,household_id" },
      )
      .select("id, household_id");

    if (error) throw error;
    for (const invitation of invitations ?? []) {
      invitationFor.set(invitation.household_id, invitation.id);
    }
  }

  const rows = (status: RsvpStatus) =>
    guests.map((guest) => ({
      wedding_id: weddingId,
      invitation_id: guest.household_id ? (invitationFor.get(guest.household_id) ?? null) : null,
      contact_id: guest.id,
      event_id: eventId,
      status,
    }));
  const options = { onConflict: "contact_id,event_id", ignoreDuplicates: true };

  // New to the list: "To invite". Until 0013_to_invite.sql is run that
  // status doesn't exist (22P02), so they go straight to "Invited".
  let { error } = await supabase.from("rsvps").upsert(rows("to_invite"), options);
  if (error?.code === "22P02") ({ error } = await supabase.from("rsvps").upsert(rows("pending"), options));
  if (error) throw error;
}

export async function setRsvpStatus(
  rsvpId: string,
  status: RsvpStatus,
  details: { mealChoice?: string | null; dietaryNotes?: string | null } = {},
): Promise<Rsvp> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rsvps")
    .update({
      status,
      meal_choice: details.mealChoice ?? null,
      dietary_notes: details.dietaryNotes ?? null,
      responded_at: new Date().toISOString(),
    })
    .eq("id", rsvpId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Creates a pending RSVP row for every contact in the household, for one event.
 * Existing rows are left alone.
 */
export async function inviteHouseholdToEvent(
  weddingId: string,
  householdId: string,
  eventId: string,
): Promise<Rsvp[]> {
  const supabase = await createClient();

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id")
    .eq("household_id", householdId);

  if (contactsError) throw contactsError;
  if (!contacts?.length) return [];

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .upsert(
      { wedding_id: weddingId, household_id: householdId },
      { onConflict: "wedding_id,household_id" },
    )
    .select()
    .single();

  if (invitationError) throw invitationError;

  const { data, error } = await supabase
    .from("rsvps")
    .upsert(
      contacts.map((contact) => ({
        wedding_id: weddingId,
        invitation_id: invitation.id,
        contact_id: contact.id,
        event_id: eventId,
        status: "pending" as const,
      })),
      { onConflict: "contact_id,event_id", ignoreDuplicates: true },
    )
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function getInvitationByToken(
  token: string,
): Promise<Invitation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Headline counts for the RSVP dashboard. */
export async function getRsvpSummary(weddingId: string, eventId?: string) {
  const rsvps = await listRsvps(weddingId, { eventId });

  return {
    total: rsvps.length,
    attending: rsvps.filter((r) => r.status === "attending").length,
    declined: rsvps.filter((r) => r.status === "declined").length,
    pending: rsvps.filter((r) => r.status === "pending").length,
  };
}

/** One guest's answer, set across every event they're on (a day guest's evening follows the day). */
export async function setContactStatus(contactId: string, status: RsvpStatus): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rsvps")
    .update({
      status,
      responded_at: status === "pending" || status === "to_invite" ? null : new Date().toISOString(),
    })
    .eq("contact_id", contactId);
  if (error) throw error;
}
