"use server";

import { revalidatePath } from "next/cache";
import {
  createCourse,
  createDish,
  createDrink,
  deleteCourse,
  deleteDish,
  deleteDrink,
  listDrinks,
  listMenu,
  updateCourse,
  updateDish,
  updateDrink,
} from "@/lib/db/menu";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import type { DrinkKind, DrinkStatus } from "@/types/db";

/**
 * The menu and the drinks (0024_menu_and_drinks.sql). Called from the two
 * screens' cards, so each returns a message rather than redirecting. Each
 * finds the wedding itself; row-level security and the (id, wedding_id)
 * link stop a dish landing on another wedding's course.
 */
type Result = { error?: string; id?: string };

const done = () => {
  revalidatePath("/menu");
  revalidatePath("/drinks");
  revalidatePath("/area/[key]", "page");
};

const failed = (what: string, error: unknown): Result => {
  console.error(`${what} failed`, error);
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01" || code === "PGRST205") return { error: "The menu isn't set up yet (0024_menu_and_drinks.sql)." };
  return { error: `That didn't save. ${describe(error)}` };
};

const UUID = /^[0-9a-f-]{36}$/i;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const TAGS = new Set(["V", "VG", "GF"]);
const KINDS: DrinkKind[] = ["fizz", "wine", "beer", "spirits", "soft", "hot", "other"];
const STATUSES: DrinkStatus[] = ["undecided", "to_order", "ordered", "delivered"];

const time = (value: string): string | null => (TIME.test(value.trim()) ? value.trim() : null);
const text = (value: string): string | null => value.trim() || null;

// ---- the menu -------------------------------------------------------------

export async function addCourseAction(input: { name: string; time: string; note: string; evening: boolean }): Promise<Result> {
  const name = input.name.trim();
  if (!name) return { error: "Give the course a name." };
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    const count = (await listMenu(wedding.id)).length;
    const course = await createCourse(wedding.id, {
      name,
      serve_time: time(input.time),
      note: text(input.note),
      evening: input.evening,
      sort_order: count,
    });
    done();
    return { id: course.id };
  } catch (error) {
    return failed("adding a course", error);
  }
}

export async function updateCourseAction(
  id: string,
  input: { name: string; time: string; note: string; evening: boolean },
): Promise<Result> {
  if (!UUID.test(id)) return { error: "That course wasn't found." };
  const name = input.name.trim();
  if (!name) return { error: "Give the course a name." };
  try {
    await updateCourse(id, { name, serve_time: time(input.time), note: text(input.note), evening: input.evening });
    done();
    return {};
  } catch (error) {
    return failed("changing a course", error);
  }
}

export async function removeCourseAction(id: string): Promise<Result> {
  if (!UUID.test(id)) return { error: "That course wasn't found." };
  try {
    await deleteCourse(id);
    done();
    return {};
  } catch (error) {
    return failed("removing a course", error);
  }
}

export async function addDishAction(courseId: string, input: { name: string; tags: string[]; instead: string }): Promise<Result> {
  if (!UUID.test(courseId)) return { error: "That course wasn't found." };
  const name = input.name.trim();
  if (!name) return { error: "Give the dish a name." };
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    const course = (await listMenu(wedding.id)).find((c) => c.id === courseId);
    if (!course) return { error: "That course wasn't found." };
    const dish = await createDish(wedding.id, courseId, {
      name,
      tags: input.tags.filter((t) => TAGS.has(t)),
      instead: text(input.instead),
      sort_order: course.dishes.length,
    });
    done();
    return { id: dish.id };
  } catch (error) {
    return failed("adding a dish", error);
  }
}

export async function updateDishAction(id: string, input: { name: string; tags: string[]; instead: string }): Promise<Result> {
  if (!UUID.test(id)) return { error: "That dish wasn't found." };
  const name = input.name.trim();
  if (!name) return { error: "Give the dish a name." };
  try {
    await updateDish(id, { name, tags: input.tags.filter((t) => TAGS.has(t)), instead: text(input.instead) });
    done();
    return {};
  } catch (error) {
    return failed("changing a dish", error);
  }
}

export async function removeDishAction(id: string): Promise<Result> {
  if (!UUID.test(id)) return { error: "That dish wasn't found." };
  try {
    await deleteDish(id);
    done();
    return {};
  } catch (error) {
    return failed("removing a dish", error);
  }
}

// ---- the drinks -----------------------------------------------------------

export interface DrinkInput {
  name: string;
  moment: string;
  kind: string;
  time: string;
  quantity: string;
  unit: string;
  suppliedBy: string;
  status: string;
}

function drinkFields(input: DrinkInput) {
  const quantity = input.quantity.trim() === "" ? null : Number(input.quantity.replace(/,/g, ""));
  return {
    name: input.name.trim(),
    moment: text(input.moment),
    kind: (KINDS as string[]).includes(input.kind) ? (input.kind as DrinkKind) : "other",
    serve_time: time(input.time),
    quantity: quantity !== null && Number.isFinite(quantity) && quantity >= 0 ? quantity : null,
    unit: text(input.unit),
    supplied_by: text(input.suppliedBy),
    status: (STATUSES as string[]).includes(input.status) ? (input.status as DrinkStatus) : "undecided",
  };
}

export async function addDrinkAction(input: DrinkInput): Promise<Result> {
  if (!input.name.trim()) return { error: "Give the drink a name." };
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    const count = (await listDrinks(wedding.id)).length;
    const drink = await createDrink(wedding.id, { ...drinkFields(input), sort_order: count });
    done();
    return { id: drink.id };
  } catch (error) {
    return failed("adding a drink", error);
  }
}

export async function updateDrinkAction(id: string, input: DrinkInput): Promise<Result> {
  if (!UUID.test(id)) return { error: "That drink wasn't found." };
  if (!input.name.trim()) return { error: "Give the drink a name." };
  try {
    await updateDrink(id, drinkFields(input));
    done();
    return {};
  } catch (error) {
    return failed("changing a drink", error);
  }
}

/** The tap on a drink's mark: moves it one step on (or back to undecided from delivered). */
export async function setDrinkStatusAction(id: string, status: string): Promise<Result> {
  if (!UUID.test(id) || !(STATUSES as string[]).includes(status)) return { error: "That drink wasn't found." };
  try {
    await updateDrink(id, { status: status as DrinkStatus });
    done();
    return {};
  } catch (error) {
    return failed("changing a drink", error);
  }
}

export async function removeDrinkAction(id: string): Promise<Result> {
  if (!UUID.test(id)) return { error: "That drink wasn't found." };
  try {
    await deleteDrink(id);
    done();
    return {};
  } catch (error) {
    return failed("removing a drink", error);
  }
}
