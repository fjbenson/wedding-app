import { createClient } from "@/lib/supabase/server";
import type { Invitation, Rsvp, RsvpStatus, WeddingEvent } from "@/types/db";

export async function listEvents(weddingId: string): Promise<WeddingEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("starts_at", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
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
