import { createClient } from "@/lib/supabase/server";
import type { AreaRow } from "@/types/db";

/** True when the error means the `areas` table isn't there yet (0003 not run). */
function missingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205";
}

/**
 * A wedding's areas, in order. Empty means setup hasn't chosen them yet;
 * `null` means the database hasn't had 0003_areas.sql applied, so callers
 * fall back to the starter set rather than break.
 */
export async function listAreas(weddingId: string): Promise<AreaRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: true });

  if (error) {
    if (missingTable(error)) return null;
    throw error;
  }
  return data ?? [];
}

/** Saves the areas chosen at setup — every starter area, on or off, plus any added. */
export async function createAreas(
  weddingId: string,
  areas: Pick<AreaRow, "key" | "label" | "enabled">[],
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("areas").upsert(
    areas.map((area, index) => ({
      wedding_id: weddingId,
      ...area,
      show_on_hub: area.enabled,
      sort_order: index,
    })),
    { onConflict: "wedding_id,key", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function getArea(weddingId: string, key: string): Promise<AreaRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .eq("wedding_id", weddingId)
    .eq("key", key)
    .maybeSingle();

  if (error) {
    if (missingTable(error)) return null;
    throw error;
  }
  return data;
}

/** Changes an area's key facts, name, or whether it's planned / on the hub. */
export async function updateArea(
  areaId: string,
  fields: Partial<Pick<AreaRow, "label" | "details" | "enabled" | "show_on_hub" | "diy" | "ready">>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("areas").update(fields).eq("id", areaId);
  if (error) throw error;
}

/** Adds an area of the couple's own at the end of the ring. */
export async function addArea(weddingId: string, key: string, label: string): Promise<void> {
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("areas")
    .select("sort_order")
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("areas").insert({
    wedding_id: weddingId,
    key,
    label,
    enabled: true,
    show_on_hub: true,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw error;
}

/** Puts the areas in this order — the order of the ring and every list. */
export async function setAreaOrder(areaIds: string[]): Promise<void> {
  const supabase = await createClient();
  for (const [index, id] of areaIds.entries()) {
    const { error } = await supabase.from("areas").update({ sort_order: index }).eq("id", id);
    if (error) throw error;
  }
}
