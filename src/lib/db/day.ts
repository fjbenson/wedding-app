import { createClient } from "@/lib/supabase/server";
import type { RunSheetItem, Seat, SeatingTable, TransportPassenger, TransportRun } from "@/types/db";

/** Everything the Day tab shows. `null` means 0009_the_day.sql hasn't been run. */
export async function getDay(weddingId: string): Promise<{
  runSheet: RunSheetItem[];
  tables: SeatingTable[];
  seats: Seat[];
  runs: TransportRun[];
  passengers: TransportPassenger[];
} | null> {
  const supabase = await createClient();
  const [runSheet, tables, seats, runs, passengers] = await Promise.all([
    supabase.from("run_sheet_items").select("*").eq("wedding_id", weddingId).order("at_time"),
    supabase.from("seating_tables").select("*").eq("wedding_id", weddingId).order("sort_order").order("created_at"),
    supabase.from("seats").select("*").eq("wedding_id", weddingId),
    supabase.from("transport_runs").select("*").eq("wedding_id", weddingId).order("at_time"),
    supabase.from("transport_passengers").select("*").eq("wedding_id", weddingId),
  ]);

  const first = [runSheet, tables, seats, runs, passengers].find((r) => r.error)?.error;
  if (first) {
    if (first.code === "42P01" || first.code === "PGRST205") return null;
    throw first;
  }
  return {
    runSheet: runSheet.data ?? [],
    tables: tables.data ?? [],
    seats: seats.data ?? [],
    runs: runs.data ?? [],
    passengers: passengers.data ?? [],
  };
}

// Run sheet ------------------------------------------------------------------

type RunSheetFields = Pick<RunSheetItem, "at_time" | "title" | "location" | "who" | "notes">;

export async function getRunSheetItem(id: string): Promise<RunSheetItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("run_sheet_items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveRunSheetItem(weddingId: string, id: string | null, fields: RunSheetFields): Promise<void> {
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("run_sheet_items").update(fields).eq("id", id)
    : await supabase.from("run_sheet_items").insert({ wedding_id: weddingId, ...fields });
  if (error) throw error;
}

export async function deleteRunSheetItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("run_sheet_items").delete().eq("id", id);
  if (error) throw error;
}

// Seating --------------------------------------------------------------------

export async function addTable(weddingId: string, name: string, capacity: number, sortOrder: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("seating_tables").insert({ wedding_id: weddingId, name, capacity, sort_order: sortOrder });
  if (error) throw error;
}

export async function updateTable(id: string, fields: Pick<SeatingTable, "name" | "capacity">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("seating_tables").update(fields).eq("id", id);
  if (error) throw error;
}

/** Removes a table; its guests become unseated. */
export async function deleteTable(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("seating_tables").delete().eq("id", id);
  if (error) throw error;
}

/** Seats a guest at a table, moving them if they were sat elsewhere. */
export async function seatGuest(weddingId: string, contactId: string, tableId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("seats")
    .upsert({ contact_id: contactId, wedding_id: weddingId, table_id: tableId }, { onConflict: "contact_id" });
  if (error) throw error;
}

export async function unseatGuest(contactId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("seats").delete().eq("contact_id", contactId);
  if (error) throw error;
}

// Transport ------------------------------------------------------------------

type RunFields = Pick<TransportRun, "at_time" | "vehicle" | "from_place" | "to_place" | "notes">;

export async function getTransportRun(id: string): Promise<TransportRun | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("transport_runs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveTransportRun(weddingId: string, id: string | null, fields: RunFields): Promise<void> {
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("transport_runs").update(fields).eq("id", id)
    : await supabase.from("transport_runs").insert({ wedding_id: weddingId, ...fields });
  if (error) throw error;
}

export async function deleteTransportRun(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("transport_runs").delete().eq("id", id);
  if (error) throw error;
}

export async function addPassenger(weddingId: string, runId: string, contactId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transport_passengers")
    .upsert({ run_id: runId, contact_id: contactId, wedding_id: weddingId }, { onConflict: "run_id,contact_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function removePassenger(runId: string, contactId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("transport_passengers").delete().eq("run_id", runId).eq("contact_id", contactId);
  if (error) throw error;
}
