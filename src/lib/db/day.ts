import { createClient } from "@/lib/supabase/server";
import type { RunSheetItem, Seat, SeatingTable, TransportPassenger, TransportRun, TableShape } from "@/types/db";

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

type RunSheetFields = Pick<RunSheetItem, "at_time" | "title" | "location" | "who" | "notes" | "area_key" | "music" | "music_url" | "music_kind" | "music_played" | "music_who" | "contact_id">;

export async function getRunSheetItem(id: string): Promise<RunSheetItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("run_sheet_items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveRunSheetItem(weddingId: string, id: string | null, fields: RunSheetFields): Promise<string> {
  const supabase = await createClient();
  const save = (f: Partial<RunSheetFields>) =>
    id
      ? supabase.from("run_sheet_items").update(f).eq("id", id).select("id").single()
      : supabase.from("run_sheet_items").insert({ wedding_id: weddingId, ...f }).select("id").single();
  let { data, error } = await save(fields);
  // Before 0017_run_sheet_area.sql there's no area column: save without it.
  if (error && (error.code === "PGRST204" || error.code === "42703") && /area_key/.test(error.message ?? "")) {
    const { area_key: _dropped, ...rest } = fields;
    void _dropped;
    ({ data, error } = await save(rest));
  }
  if (error) throw error;
  return data!.id as string;
}

export async function deleteRunSheetItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("run_sheet_items").delete().eq("id", id);
  if (error) throw error;
}

// Seating --------------------------------------------------------------------

export async function addTable(
  weddingId: string,
  name: string,
  capacity: number,
  sortOrder: number,
  shape: TableShape = "round",
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("seating_tables")
    .insert({ wedding_id: weddingId, name, capacity, sort_order: sortOrder, shape });
  if (error) throw error;
}

export async function updateTable(id: string, fields: Pick<SeatingTable, "name" | "capacity">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("seating_tables").update(fields).eq("id", id);
  if (error) throw error;
}

/** Moves a table on the floor plan, or turns it round or long. */
export async function placeTable(
  id: string,
  fields: Partial<Pick<SeatingTable, "pos_x" | "pos_y" | "shape">>,
): Promise<void> {
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

/** 42703 / PGRST204: seats.seat_no doesn't exist yet (0025_seat_number.sql not run). */
const noSeatNo = (error: { code?: string } | null) => error?.code === "42703" || error?.code === "PGRST204";

/** Seats a guest at a table, moving them if they were sat elsewhere — in any free chair. */
export async function seatGuest(weddingId: string, contactId: string, tableId: string): Promise<void> {
  const supabase = await createClient();
  const row = { contact_id: contactId, wedding_id: weddingId, table_id: tableId };
  let { error } = await supabase.from("seats").upsert({ ...row, seat_no: null }, { onConflict: "contact_id" });
  if (noSeatNo(error)) ({ error } = await supabase.from("seats").upsert(row, { onConflict: "contact_id" }));
  if (error) throw error;
}

/**
 * Gives chair numbers to guests at a table whose chair was only drawn, as the
 * close-up drew them — so nobody jumps about once chairs start being chosen.
 * Only touches guests at this table; the chairs given are free ones.
 */
export async function pinSeats(tableId: string, pins: { contactId: string; seatNo: number }[]): Promise<void> {
  if (pins.length === 0) return;
  const supabase = await createClient();
  const results = await Promise.all(
    pins.map((p) =>
      supabase.from("seats").update({ seat_no: p.seatNo }).eq("contact_id", p.contactId).eq("table_id", tableId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

/**
 * Sits a guest in one chair. If someone's already in it they swap: they take
 * the chair the guest left (when it was at this table), or any free one.
 * Not one transaction — at worst, after a failure, someone sits "anywhere at
 * this table" rather than in their chair.
 */
export async function seatGuestAt(weddingId: string, contactId: string, tableId: string, seatNo: number): Promise<void> {
  const supabase = await createClient();
  const [{ data: mine, error: e1 }, { data: theirs, error: e2 }] = await Promise.all([
    supabase.from("seats").select("table_id, seat_no").eq("contact_id", contactId).maybeSingle(),
    supabase.from("seats").select("contact_id").eq("table_id", tableId).eq("seat_no", seatNo).maybeSingle(),
  ]);
  if (e1 || e2) throw e1 ?? e2;
  const other = theirs?.contact_id && theirs.contact_id !== contactId ? (theirs.contact_id as string) : null;
  if (other) {
    const { error } = await supabase.from("seats").update({ seat_no: null }).eq("contact_id", other);
    if (error) throw error;
  }
  const { error } = await supabase
    .from("seats")
    .upsert({ contact_id: contactId, wedding_id: weddingId, table_id: tableId, seat_no: seatNo }, { onConflict: "contact_id" });
  if (error) throw error;
  if (other && mine?.table_id === tableId && mine.seat_no) {
    const { error: e3 } = await supabase.from("seats").update({ seat_no: mine.seat_no }).eq("contact_id", other);
    if (e3) throw e3;
  }
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

/** Adds or changes a journey; gives back its id (a new one's passengers are added next). */
export async function saveTransportRun(weddingId: string, id: string | null, fields: RunFields): Promise<string> {
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("transport_runs").update(fields).eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await supabase.from("transport_runs").insert({ wedding_id: weddingId, ...fields }).select("id").single();
  if (error) throw error;
  return data.id as string;
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

/** The tables, and which one each guest sits at — for the guest card. */
export interface GuestSeating {
  tables: { id: string; name: string }[];
  /** Guest id → table id. */
  tableOf: Record<string, string>;
}

/**
 * The wedding's tables and who sits where, for the guest card (its Table
 * figure and the Table row to change it) and the guest list's View › Table.
 * Empty until 0009_the_day.sql is run.
 */
export async function guestSeating(weddingId: string): Promise<GuestSeating> {
  const supabase = await createClient();
  const [tables, seats] = await Promise.all([
    supabase.from("seating_tables").select("id, name").eq("wedding_id", weddingId).order("sort_order").order("created_at"),
    supabase.from("seats").select("contact_id, table_id").eq("wedding_id", weddingId),
  ]);
  if (tables.error || seats.error) return { tables: [], tableOf: {} };
  const list = (tables.data ?? []).map((t) => ({ id: t.id as string, name: t.name as string }));
  const ids = new Set(list.map((t) => t.id));
  return {
    tables: list,
    tableOf: Object.fromEntries(
      (seats.data ?? []).flatMap((s) => (ids.has(s.table_id) ? [[s.contact_id as string, s.table_id as string]] : [])),
    ),
  };
}

/** Guest id → the name of their table. */
export function tableNamesOf(seating: GuestSeating): Record<string, string> {
  const name = new Map(seating.tables.map((t) => [t.id, t.name]));
  return Object.fromEntries(Object.entries(seating.tableOf).map(([guest, table]) => [guest, name.get(table)!]));
}
