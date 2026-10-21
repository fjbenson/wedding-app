import { createClient } from "@/lib/supabase/server";
import { isStationeryArea } from "@/lib/stationery";
import type { Appointment, Milestone, Payment, TimelineEntry, WeddingFile } from "@/types/db";

/**
 * The timeline (0032_timeline.sql): what was said and sent, with a supplier,
 * guest, household or area. Payments, to-dos, appointments and files are
 * only read here, to be put in date order beside them.
 */
const missing = (error: { code?: string }) => error.code === "42P01" || error.code === "PGRST205";

/** Who a timeline is about. */
export type TimelineScope =
  | { supplier: string }
  | { guest: string }
  | { household: string }
  | { group: string }
  | { area: string };

export type EntryFields = Omit<TimelineEntry, "id" | "wedding_id" | "created_at">;

export interface TimelineSources {
  entries: TimelineEntry[];
  payments: Payment[];
  appointments: Appointment[];
  todos: Milestone[];
  files: WeddingFile[];
  /** Contact id → name, for "with Wild & Gather" on an area's timeline. */
  names: Record<string, string>;
  /** Stationery's page: sendings to many households are gathered into one line each ("Posted to 12 households"). */
  groupSendings?: boolean;
}

/** Adds an entry and gives back its id. */
export async function createEntry(weddingId: string, fields: Partial<EntryFields> & Pick<EntryFields, "kind">): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("timeline_entries").insert({ wedding_id: weddingId, ...fields }).select("id").single();
  if (error) throw error;
  return data.id;
}

/** What's been emailed or texted to one group, newest first (empty before 0032). */
export async function listGroupMessages(weddingId: string, groupId: string): Promise<TimelineEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timeline_entries")
    .select("*")
    .eq("wedding_id", weddingId)
    .eq("group_id", groupId)
    .in("kind", ["email", "message"])
    .order("happened_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    if (missing(error)) return [];
    throw error;
  }
  return (data ?? []) as TimelineEntry[];
}

export async function updateEntry(id: string, fields: Partial<EntryFields>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("timeline_entries").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("timeline_entries").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Writes "Quote in" / "Booked" on a supplier's timeline. Quietly does
 * nothing before 0032 is run, or if it fails: the stage itself has saved.
 */
export async function logStage(weddingId: string, contactId: string, areaKey: string | null, summary: string): Promise<void> {
  try {
    await createEntry(weddingId, { kind: "stage", summary, contact_id: contactId, area_key: areaKey });
  } catch (error) {
    if (!missing(error as { code?: string })) console.error("logging a stage failed", error);
  }
}

/** Everything that belongs on one timeline. Empty parts when a table isn't there yet. */
export async function loadTimeline(weddingId: string, scope: TimelineScope): Promise<TimelineSources> {
  const supabase = await createClient();
  const rows = <T,>(r: { data: unknown; error: { code?: string } | null }): T[] => {
    if (r.error) {
      if (missing(r.error)) return [];
      throw r.error;
    }
    return (r.data ?? []) as T[];
  };

  // Who's in it: one supplier or guest, a household's people, or an area's suppliers.
  let contactIds: string[] = [];
  let areaKey: string | null = null;
  const names: Record<string, string> = {};
  if ("supplier" in scope) contactIds = [scope.supplier];
  else if ("guest" in scope) contactIds = [scope.guest];
  else if ("group" in scope) contactIds = [];
  else if ("household" in scope) {
    const r = await supabase.from("contacts").select("id").eq("household_id", scope.household);
    contactIds = rows<{ id: string }>(r).map((c) => c.id);
  } else {
    areaKey = scope.area;
    const r = await supabase
      .from("supplier_details")
      .select("contact_id, company_name, contacts!inner (wedding_id, first_name)")
      .eq("category", scope.area)
      .eq("contacts.wedding_id", weddingId);
    for (const s of rows<{ contact_id: string; company_name: string | null; contacts: { first_name: string } | { first_name: string }[] }>(r)) {
      contactIds.push(s.contact_id);
      const c = Array.isArray(s.contacts) ? s.contacts[0] : s.contacts;
      names[s.contact_id] = s.company_name ?? c?.first_name ?? "";
    }
  }
  const ids = contactIds.length ? contactIds : ["00000000-0000-0000-0000-000000000000"];
  const isGuestSide = "guest" in scope || "household" in scope || "group" in scope;

  // Timeline entries: theirs, the household's own, or the area's and its suppliers'.
  let entriesQuery = supabase.from("timeline_entries").select("*").eq("wedding_id", weddingId);
  if ("group" in scope) entriesQuery = entriesQuery.eq("group_id", scope.group);
  else if ("household" in scope) entriesQuery = entriesQuery.or(`household_id.eq.${scope.household},contact_id.in.(${ids.join(",")})`);
  else if (areaKey !== null)
    // Stationery's own timeline also holds everything sent to guests: save the dates, invitations, thank-yous.
    entriesQuery = entriesQuery.or(
      `area_key.eq.${areaKey},contact_id.in.(${ids.join(",")})${isStationeryArea(areaKey) ? ",kind.in.(save_the_date,invitation,thank_you)" : ""}`,
    );
  else entriesQuery = entriesQuery.in("contact_id", ids);

  const [entriesR, filesR] = await Promise.all([
    entriesQuery.order("happened_on", { ascending: false }).order("created_at", { ascending: false }),
    isGuestSide
      ? Promise.resolve({ data: [], error: null })
      : areaKey !== null
        ? supabase.from("files").select("*").eq("wedding_id", weddingId).or(`area_key.eq.${areaKey},contact_id.in.(${ids.join(",")})`)
        : supabase.from("files").select("*").in("contact_id", ids),
  ]);
  const entries = rows<TimelineEntry>(entriesR);
  const files = rows<WeddingFile>(filesR);

  let payments: Payment[] = [];
  let appointments: Appointment[] = [];
  let todos: Milestone[] = [];
  const fromCalls = entries.map((e) => e.id);
  const callIds = fromCalls.length ? fromCalls : ["00000000-0000-0000-0000-000000000000"];

  if (isGuestSide) {
    // A guest's side: bills they're paying, and to-dos and appointments they're on.
    const [payers, onTodos, onAppts, callTodos] = await Promise.all([
      supabase.from("payment_payers").select("payments (*)").in("contact_id", ids),
      supabase.from("milestone_guests").select("milestones (*)").in("contact_id", ids),
      supabase.from("appointment_guests").select("appointments (*)").in("contact_id", ids),
      supabase.from("milestones").select("*").in("timeline_entry_id", callIds),
    ]);
    const nested = <T,>(r: { data: unknown; error: { code?: string } | null }, key: string): T[] =>
      rows<Record<string, T | T[] | null>>(r).flatMap((x) => {
        const v = x[key];
        return v ? (Array.isArray(v) ? v : [v]) : [];
      });
    payments = nested<Payment>(payers, "payments");
    appointments = nested<Appointment>(onAppts, "appointments");
    todos = [...nested<Milestone>(onTodos, "milestones"), ...rows<Milestone>(callTodos)];
  } else {
    const or = (field: string) => (areaKey !== null ? `${field}.eq.${areaKey},contact_id.in.(${ids.join(",")})` : `contact_id.in.(${ids.join(",")})`);
    const [p, a, t] = await Promise.all([
      supabase.from("payments").select("*").eq("wedding_id", weddingId).or(or("area_key")),
      supabase.from("appointments").select("*").eq("wedding_id", weddingId).or(or("area_key")),
      areaKey !== null
        ? supabase.from("milestones").select("*").eq("wedding_id", weddingId).or(`category.eq.${areaKey},timeline_entry_id.in.(${callIds.join(",")})`)
        : supabase.from("milestones").select("*").in("timeline_entry_id", callIds),
    ]);
    payments = rows<Payment>(p);
    appointments = rows<Appointment>(a);
    todos = rows<Milestone>(t);
  }

  const unique = <T extends { id: string }>(list: T[]) => [...new Map(list.map((x) => [x.id, x])).values()];
  return {
    entries,
    payments: unique(payments),
    appointments: unique(appointments),
    todos: unique(todos),
    files,
    names,
    groupSendings: areaKey !== null && isStationeryArea(areaKey),
  };
}
