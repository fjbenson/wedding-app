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
