import { createClient } from "@/lib/supabase/server";

/**
 * One search across the whole wedding (owner, 19 Oct 2026: "search the word
 * easels and it finds it all across the app"). Runs here, as the signed-in
 * person, so row-level security keeps it to their own wedding; nothing goes
 * to the assistant or anywhere else. Each result says what it is and where a
 * tap takes you.
 */

export type SearchKind =
  | "guest"
  | "household"
  | "group"
  | "supplier"
  | "todo"
  | "appointment"
  | "payment"
  | "moment"
  | "decor"
  | "list"
  | "note"
  | "area"
  | "idea"
  | "menu"
  | "drink"
  | "table"
  | "stay";

export interface SearchResult {
  kind: SearchKind;
  id: string;
  title: string;
  /** Where it matched, or a short fact about it. */
  line: string | null;
  href: string;
}

const EACH = 6;

/** The words, safe for a PostgREST `or` filter (no commas, brackets or wildcards). */
function clean(q: string): string {
  return q.replace(/[,()%_*\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

/** The bit of a longer text around the match, for the grey line. */
function around(text: string | null | undefined, q: string): string | null {
  if (!text) return null;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return null;
  const start = Math.max(0, i - 24);
  const end = Math.min(text.length, i + q.length + 40);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "…" : ""}`;
}

type Row = Record<string, unknown> & { id: string };

export async function searchWedding(weddingId: string, query: string): Promise<SearchResult[]> {
  const q = clean(query);
  if (q.length < 2) return [];
  const supabase = await createClient();
  const like = `%${q}%`;
  const any = (cols: string[]) => cols.map((c) => `${c}.ilike.${like}`).join(",");
  const words = q.split(" ");

  // Every table at once; a table that isn't there yet (an older database) just gives nothing.
  const run = async (table: string, cols: string, match: string[]) => {
    const { data, error } = await supabase.from(table).select(cols).eq("wedding_id", weddingId).or(any(match)).limit(EACH);
    return error ? [] : ((data ?? []) as unknown as Row[]);
  };

  const [
    people,
    fullNames,
    households,
    groups,
    supplierDetails,
    todos,
    appointments,
    payments,
    moments,
    decor,
    notes,
    areas,
    ideas,
    dishes,
    courses,
    drinks,
    tables,
    stays,
  ] = await Promise.all([
    run("contacts", "id, first_name, last_name, contact_type, notes, role_on_the_day", ["first_name", "last_name", "notes", "role_on_the_day"]),
    // "Jo Hale": first word in the first name, last word in the surname.
    words.length > 1
      ? supabase
          .from("contacts")
          .select("id, first_name, last_name, contact_type, notes, role_on_the_day")
          .eq("wedding_id", weddingId)
          .ilike("first_name", `%${words[0]}%`)
          .ilike("last_name", `%${words[words.length - 1]}%`)
          .limit(EACH)
          .then(({ data }) => (data ?? []) as unknown as Row[])
      : Promise.resolve([] as Row[]),
    run("households", "id, name", ["name"]),
    run("guest_groups", "id, name", ["name"]),
    supabase
      .from("supplier_details")
      .select("contact_id, company_name, contacts!inner(wedding_id)")
      .eq("contacts.wedding_id", weddingId)
      .ilike("company_name", like)
      .limit(EACH)
      .then(({ data, error }) => (error ? [] : ((data ?? []) as unknown as (Row & { contact_id: string })[]))),
    run("milestones", "id, title, description", ["title", "description"]),
    run("appointments", "id, title, location, notes, on_date", ["title", "location", "notes"]),
    run("payments", "id, description, notes, amount", ["description", "notes"]),
    run("run_sheet_items", "id, title, location, who, notes, music, at_time", ["title", "location", "who", "notes", "music"]),
    run("decor_items", "id, name, place, notes, from_name", ["name", "place", "notes", "from_name"]),
    run("notes", "id, body, url", ["body", "url"]),
    run("areas", "id, key, label, details", ["label", "details"]),
    run("inspo_items", "id, title, note", ["title", "note"]),
    run("menu_dishes", "id, name, instead", ["name", "instead"]),
    run("menu_courses", "id, name, note", ["name", "note"]),
    run("drinks", "id, name, supplied_by", ["name", "supplied_by"]),
    run("seating_tables", "id, name", ["name"]),
    run("stays", "id, name", ["name"]),
  ]);

  const out: SearchResult[] = [];
  const seen = new Set<string>();
  const add = (r: SearchResult) => {
    const key = `${r.kind}:${r.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(r);
  };
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const name = (r: Row) => [str(r.first_name), str(r.last_name)].filter(Boolean).join(" ");

  // Businesses first, so a supplier shows by its business name.
  for (const r of supplierDetails) {
    add({ kind: "supplier", id: r.contact_id, title: str(r.company_name) ?? "A supplier", line: null, href: `/people?tab=suppliers&supplier=${r.contact_id}` });
  }
  for (const r of [...fullNames, ...people]) {
    const supplier = r.contact_type === "supplier";
    add({
      kind: supplier ? "supplier" : "guest",
      id: r.id,
      title: name(r),
      line: supplier ? "Supplier" : (str(r.role_on_the_day) ?? around(str(r.notes), q)),
      href: supplier ? `/people?tab=suppliers&supplier=${r.id}` : `/people?guest=${r.id}`,
    });
  }
  for (const r of households) add({ kind: "household", id: r.id, title: str(r.name) ?? "A household", line: null, href: `/people?household=${r.id}` });
  for (const r of groups) add({ kind: "group", id: r.id, title: str(r.name) ?? "A group", line: null, href: `/people?groupcard=${r.id}` });
  for (const r of todos) add({ kind: "todo", id: r.id, title: str(r.title) ?? "A to-do", line: around(str(r.description), q), href: `/plan/${r.id}` });
  for (const r of appointments) add({ kind: "appointment", id: r.id, title: str(r.title) ?? "An appointment", line: str(r.location) ?? around(str(r.notes), q), href: `/plan/appointments/${r.id}` });
  for (const r of payments) add({ kind: "payment", id: r.id, title: str(r.description) ?? "A payment", line: around(str(r.notes), q), href: `/money/payments/${r.id}` });
  for (const r of moments) {
    add({ kind: "moment", id: r.id, title: str(r.title) ?? "A moment", line: around(str(r.music), q) ?? str(r.location) ?? around(str(r.notes), q), href: `/day/run-sheet/${r.id}` });
  }
  for (const r of decor) add({ kind: "decor", id: r.id, title: str(r.name) ?? "A decor item", line: str(r.place) ?? around(str(r.notes), q), href: `/day/decor?thing=${r.id}` });
  // Tick-box and bullet marks don't show in a result.
  const plain = (t: string | null) => t?.replace(/^\s*(\[( |x|X)\]|[-*•])\s?/gm, "") ?? null;
  for (const r of notes) add({ kind: "note", id: r.id, title: around(plain(str(r.body)), q) ?? plain(str(r.body))?.slice(0, 60) ?? str(r.url) ?? "A note", line: null, href: `/inbox?note=${r.id}` });
  for (const r of areas) add({ kind: "area", id: r.id, title: str(r.label) ?? "An area", line: around(str(r.details), q), href: `/area/${str(r.key)}` });
  for (const r of ideas) add({ kind: "idea", id: r.id, title: str(r.title) ?? around(str(r.note), q) ?? "An idea", line: str(r.title) ? around(str(r.note), q) : null, href: `/inspo/${r.id}` });
  for (const r of [...courses, ...dishes]) add({ kind: "menu", id: r.id, title: str(r.name) ?? "On the menu", line: "The menu", href: "/menu" });
  for (const r of drinks) add({ kind: "drink", id: r.id, title: str(r.name) ?? "A drink", line: str(r.supplied_by), href: "/drinks" });
  for (const r of tables) add({ kind: "table", id: r.id, title: str(r.name) ?? "A table", line: "Seating", href: "/day?tab=seating" });
  for (const r of stays) add({ kind: "stay", id: r.id, title: str(r.name) ?? "A place to stay", line: "Travel", href: `/day?tab=travel&open=stay:${r.id}` });
  return out;
}
