import { createClient } from "@/lib/supabase/server";

/**
 * Who's involved in a to-do or an appointment (0021_involved.sql): guests
 * tagged on it — "Ask Amy about the readings". Only a link; nobody is told.
 * Every read is empty until 0021 is run, rather than breaking the page.
 */

export type InvolvedKind = "todo" | "appointment";

const TABLE = { todo: "milestone_guests", appointment: "appointment_guests" } as const;
const COLUMN = { todo: "milestone_id", appointment: "appointment_id" } as const;

const missing = (code?: string) => code === "42P01" || code === "PGRST205";

/** Everything tagged in the wedding: item id → the guests' ids. */
export async function listInvolved(weddingId: string): Promise<{ todo: Map<string, string[]>; appointment: Map<string, string[]> }> {
  const supabase = await createClient();
  const [todos, appointments] = await Promise.all([
    supabase.from(TABLE.todo).select("milestone_id, contact_id").eq("wedding_id", weddingId).order("created_at"),
    supabase.from(TABLE.appointment).select("appointment_id, contact_id").eq("wedding_id", weddingId).order("created_at"),
  ]);
  const group = (rows: Record<string, string>[] | null, column: string) => {
    const map = new Map<string, string[]>();
    for (const r of rows ?? []) map.set(r[column], [...(map.get(r[column]) ?? []), r.contact_id]);
    return map;
  };
  for (const r of [todos, appointments]) if (r.error && !missing(r.error.code)) throw r.error;
  return {
    todo: group(todos.error ? null : (todos.data as Record<string, string>[]), "milestone_id"),
    appointment: group(appointments.error ? null : (appointments.data as Record<string, string>[]), "appointment_id"),
  };
}

/** The guests tagged on one to-do or appointment, in the order they were added. */
export async function getInvolved(kind: InvolvedKind, itemId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(TABLE[kind]).select("contact_id").eq(COLUMN[kind], itemId).order("created_at");
  if (error) {
    if (missing(error.code)) return [];
    throw error;
  }
  return (data ?? []).map((r) => r.contact_id as string);
}

/** Tags guests on an item (no harm if they're already on it). */
export async function addInvolved(weddingId: string, kind: InvolvedKind, itemId: string, contactIds: string[]): Promise<void> {
  if (contactIds.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from(TABLE[kind])
    .upsert(
      contactIds.map((contact_id) => ({ wedding_id: weddingId, [COLUMN[kind]]: itemId, contact_id })),
      { onConflict: `${COLUMN[kind]},contact_id`, ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function removeInvolved(kind: InvolvedKind, itemId: string, contactId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from(TABLE[kind]).delete().eq(COLUMN[kind], itemId).eq("contact_id", contactId);
  if (error) throw error;
}

/** What one guest is tagged on, for their card. */
export async function listForGuest(contactId: string): Promise<{
  todos: { id: string; title: string; due_date: string | null; done: boolean }[];
  appointments: { id: string; title: string; on_date: string }[];
}> {
  const supabase = await createClient();
  const [todos, appointments] = await Promise.all([
    supabase.from(TABLE.todo).select("milestones (id, title, due_date, status)").eq("contact_id", contactId),
    supabase.from(TABLE.appointment).select("appointments (id, title, on_date)").eq("contact_id", contactId),
  ]);
  for (const r of [todos, appointments]) if (r.error && !missing(r.error.code)) throw r.error;
  type T = { id: string; title: string; due_date: string | null; status: string };
  type A = { id: string; title: string; on_date: string };
  const one = <X,>(v: X | X[] | null): X | null => (Array.isArray(v) ? (v[0] ?? null) : v);
  return {
    todos: (todos.error ? [] : ((todos.data ?? []) as unknown as { milestones: T | T[] | null }[]))
      .map((r) => one(r.milestones))
      .filter((m): m is T => !!m)
      .map((m) => ({ id: m.id, title: m.title, due_date: m.due_date, done: m.status !== "todo" && m.status !== "in_progress" }))
      .sort((a, b) => Number(a.done) - Number(b.done) || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")),
    appointments: (appointments.error ? [] : ((appointments.data ?? []) as unknown as { appointments: A | A[] | null }[]))
      .map((r) => one(r.appointments))
      .filter((a): a is A => !!a)
      .sort((a, b) => a.on_date.localeCompare(b.on_date)),
  };
}

/**
 * For the rows' little initials (`RowPeople`): "todo:<id>" / "appointment:<id>"
 * → the tagged guests' names. Only items that have someone tagged appear.
 */
export async function involvedNames(weddingId: string): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const [tags, guests] = await Promise.all([
    listInvolved(weddingId),
    supabase.from("contacts").select("id, first_name, last_name").eq("wedding_id", weddingId),
  ]);
  if (guests.error) throw guests.error;
  const names = new Map((guests.data ?? []).map((g) => [g.id as string, [g.first_name, g.last_name].filter(Boolean).join(" ")]));
  const out: Record<string, string[]> = {};
  for (const kind of ["todo", "appointment"] as const) {
    for (const [id, ids] of tags[kind]) out[`${kind}:${id}`] = ids.map((x) => names.get(x)).filter((n): n is string => !!n);
  }
  return out;
}
