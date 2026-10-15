import { createClient } from "@/lib/supabase/server";
import type { Stay } from "@/types/db";

/**
 * Travel's places to stay (0020_travel.sql), in the couple's order. Empty
 * until 0020 is run, rather than breaking The Day or the guest card.
 */
export async function listStays(weddingId: string): Promise<Stay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stays")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("sort_order")
    .order("created_at");
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return data ?? [];
}

export async function createStay(weddingId: string, name: string, sortOrder: number): Promise<Stay> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stays")
    .insert({ wedding_id: weddingId, name, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStay(id: string, fields: Partial<Pick<Stay, "name" | "note">>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("stays").update(fields).eq("id", id);
  if (error) throw error;
}

/** Removes the place only; its guests stay, "staying, not sure where". */
export async function deleteStay(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("stays").delete().eq("id", id);
  if (error) throw error;
}

/** Whether a guest is staying over, and where (a place only with 'yes'). */
export async function setGuestStay(
  contactId: string,
  staying: "yes" | "no" | null,
  stayId: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ staying, stay_id: staying === "yes" ? stayId : null })
    .eq("id", contactId);
  if (error) throw error;
}

export async function setOwnWay(contactId: string, ownWay: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").update({ own_way: ownWay }).eq("id", contactId);
  if (error) throw error;
}

/**
 * What the guest card's Travel part needs: the places to stay, and each
 * guest's journeys as short labels ("Coach 1 at 12:45"), in time order.
 */
export async function travelForGuests(
  weddingId: string,
): Promise<{ stays: { id: string; name: string }[]; journeys: Record<string, string[]> }> {
  const supabase = await createClient();
  const [stays, runs, passengers] = await Promise.all([
    listStays(weddingId),
    supabase.from("transport_runs").select("id, vehicle, at_time").eq("wedding_id", weddingId).order("at_time"),
    supabase.from("transport_passengers").select("run_id, contact_id").eq("wedding_id", weddingId),
  ]);
  const journeys: Record<string, string[]> = {};
  if (!runs.error && !passengers.error) {
    for (const run of runs.data ?? []) {
      const label = `${run.vehicle} at ${String(run.at_time).slice(0, 5)}`;
      for (const p of passengers.data ?? []) {
        if (p.run_id === run.id) (journeys[p.contact_id] ??= []).push(label);
      }
    }
  }
  return { stays: stays.map((s) => ({ id: s.id, name: s.name })), journeys };
}
