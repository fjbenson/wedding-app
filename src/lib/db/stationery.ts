import { createClient } from "@/lib/supabase/server";
import type { SendHow, SendingKind, SentRecord } from "@/lib/stationery";

/**
 * Stationery's sendings: a save the date, invitation or thank-you going to a
 * household (or someone not in one) is a timeline entry of that kind
 * (0032_timeline.sql), so it shows on their timeline too. Empty before 0032
 * is run, rather than breaking the screen.
 */
const missing = (error: { code?: string }) => error.code === "42P01" || error.code === "PGRST205";

const KINDS: SendingKind[] = ["save_the_date", "invitation", "thank_you"];

export async function listSendings(weddingId: string): Promise<SentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timeline_entries")
    .select("id, kind, household_id, contact_id, happened_on, how")
    .eq("wedding_id", weddingId)
    .in("kind", KINDS);
  if (error) {
    if (missing(error)) return [];
    throw error;
  }
  return (data ?? []) as SentRecord[];
}

/**
 * Marks a sending as gone to these households ("h:<id>") and people ("c:<id>").
 * The (id, wedding_id) links stop it pointing at another wedding's guests.
 * An invitation going out moves their guests from To invite to Yet to respond.
 * Gives back how many were marked.
 */
export async function markSent(
  weddingId: string,
  kind: SendingKind,
  how: SendHow,
  date: string,
  unitKeys: string[],
): Promise<number> {
  const supabase = await createClient();
  const households = unitKeys.filter((k) => k.startsWith("h:")).map((k) => k.slice(2));
  const contacts = unitKeys.filter((k) => k.startsWith("c:")).map((k) => k.slice(2));
  const rows = [
    ...households.map((id) => ({ wedding_id: weddingId, kind, how, happened_on: date, household_id: id })),
    ...contacts.map((id) => ({ wedding_id: weddingId, kind, how, happened_on: date, contact_id: id })),
  ];
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("timeline_entries").insert(rows);
  if (error) throw error;

  if (kind === "invitation") {
    let people = contacts;
    if (households.length) {
      const { data, error: e } = await supabase.from("contacts").select("id").eq("wedding_id", weddingId).in("household_id", households);
      if (e) throw e;
      people = [...people, ...(data ?? []).map((c) => c.id)];
    }
    if (people.length) {
      const { error: e } = await supabase
        .from("rsvps")
        .update({ status: "pending", responded_at: null })
        .eq("wedding_id", weddingId)
        .eq("status", "to_invite")
        .in("contact_id", people);
      if (e) throw e;
    }
  }
  return rows.length;
}

/** Takes a sending off one household or person (and its people). Answers stay as they are. */
export async function unmarkSent(weddingId: string, kind: SendingKind, unitKey: string): Promise<void> {
  const supabase = await createClient();
  const id = unitKey.slice(2);
  let query = supabase.from("timeline_entries").delete().eq("wedding_id", weddingId).eq("kind", kind);
  if (unitKey.startsWith("h:")) {
    const { data, error } = await supabase.from("contacts").select("id").eq("wedding_id", weddingId).eq("household_id", id);
    if (error) throw error;
    const people = (data ?? []).map((c) => c.id);
    query = query.or([`household_id.eq.${id}`, ...(people.length ? [`contact_id.in.(${people.join(",")})`] : [])].join(","));
  } else {
    query = query.eq("contact_id", id);
  }
  const { error } = await query;
  if (error) throw error;
}

/** One household's (with its people's) or one person's sendings. */
export async function sendingsFor(weddingId: string, unitKey: string): Promise<SentRecord[]> {
  const supabase = await createClient();
  const id = unitKey.slice(2);
  let query = supabase
    .from("timeline_entries")
    .select("id, kind, household_id, contact_id, happened_on, how")
    .eq("wedding_id", weddingId)
    .in("kind", KINDS);
  if (unitKey.startsWith("h:")) {
    const { data, error } = await supabase.from("contacts").select("id").eq("wedding_id", weddingId).eq("household_id", id);
    if (error) throw error;
    const people = (data ?? []).map((c) => c.id);
    query = query.or([`household_id.eq.${id}`, ...(people.length ? [`contact_id.in.(${people.join(",")})`] : [])].join(","));
  } else {
    query = query.eq("contact_id", id);
  }
  const { data, error } = await query.order("happened_on");
  if (error) {
    if (missing(error)) return [];
    throw error;
  }
  return (data ?? []) as SentRecord[];
}
