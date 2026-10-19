import { createClient } from "@/lib/supabase/server";
import type { Drink, MenuCourse, MenuDish } from "@/types/db";

/**
 * The menu (0024_menu_and_drinks.sql): courses with their dishes, and the
 * drinks. Both empty until 0024 is run, rather than breaking the screen.
 */
const missing = (error: { code?: string }) => error.code === "42P01" || error.code === "PGRST205";

export interface MenuCourseWithDishes extends MenuCourse {
  dishes: MenuDish[];
}

export async function listMenu(weddingId: string): Promise<MenuCourseWithDishes[]> {
  const supabase = await createClient();
  const [courses, dishes] = await Promise.all([
    supabase.from("menu_courses").select("*").eq("wedding_id", weddingId).order("sort_order").order("serve_time", { nullsFirst: false }).order("created_at"),
    supabase.from("menu_dishes").select("*").eq("wedding_id", weddingId).order("sort_order").order("created_at"),
  ]);
  for (const r of [courses, dishes]) {
    if (r.error) {
      if (missing(r.error)) return [];
      throw r.error;
    }
  }
  return (courses.data ?? []).map((c) => ({ ...c, dishes: (dishes.data ?? []).filter((d) => d.course_id === c.id) }));
}

export async function createCourse(
  weddingId: string,
  fields: Pick<MenuCourse, "name" | "serve_time" | "note" | "evening" | "sort_order">,
): Promise<MenuCourse> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("menu_courses").insert({ wedding_id: weddingId, ...fields }).select().single();
  if (error) throw error;
  return data;
}

export async function updateCourse(
  id: string,
  fields: Partial<Pick<MenuCourse, "name" | "serve_time" | "note" | "evening">>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_courses").update(fields).eq("id", id);
  if (error) throw error;
}

/** Removes the course and its dishes. */
export async function deleteCourse(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_courses").delete().eq("id", id);
  if (error) throw error;
}

export async function createDish(
  weddingId: string,
  courseId: string,
  fields: Pick<MenuDish, "name" | "tags" | "instead" | "sort_order">,
): Promise<MenuDish> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_dishes")
    .insert({ wedding_id: weddingId, course_id: courseId, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDish(id: string, fields: Partial<Pick<MenuDish, "name" | "tags" | "instead">>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_dishes").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteDish(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_dishes").delete().eq("id", id);
  if (error) throw error;
}

export async function listDrinks(weddingId: string): Promise<Drink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drinks")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("serve_time", { nullsFirst: false })
    .order("sort_order")
    .order("created_at");
  if (error) {
    if (missing(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function createDrink(
  weddingId: string,
  fields: Pick<Drink, "name" | "moment" | "kind" | "serve_time" | "quantity" | "unit" | "supplied_by" | "status" | "sort_order">,
): Promise<Drink> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("drinks").insert({ wedding_id: weddingId, ...fields }).select().single();
  if (error) throw error;
  return data;
}

export async function updateDrink(
  id: string,
  fields: Partial<Pick<Drink, "name" | "moment" | "kind" | "serve_time" | "quantity" | "unit" | "supplied_by" | "status">>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("drinks").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteDrink(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("drinks").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Says which courses and drinks are served at a run sheet moment
 * (0034_food_moments_and_schedules.sql): those listed are linked to it, any
 * that were linked to it and aren't listed are let go. Each only moves if it's
 * this wedding's, and the (id, wedding_id) link stops it pointing at another's.
 */
export async function linkFoodToMoment(weddingId: string, momentId: string, courseIds: string[], drinkIds: string[]): Promise<void> {
  const supabase = await createClient();
  for (const [table, ids] of [
    ["menu_courses", courseIds],
    ["drinks", drinkIds],
  ] as const) {
    const freed = supabase.from(table).update({ moment_id: null }).eq("wedding_id", weddingId).eq("moment_id", momentId);
    const { error: e1 } = ids.length ? await freed.not("id", "in", `(${ids.join(",")})`) : await freed;
    if (e1) throw e1;
    if (ids.length) {
      const { error: e2 } = await supabase.from(table).update({ moment_id: momentId }).eq("wedding_id", weddingId).in("id", ids);
      if (e2) throw e2;
    }
  }
}
