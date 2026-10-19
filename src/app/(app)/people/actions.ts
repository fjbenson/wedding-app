"use server";

import { isMealKind, mealFields, type MealKind } from "@/lib/meals";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHousehold, deleteContact, updateContact } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { joinRoles } from "@/lib/guest-roles";
import { addGuest } from "@/lib/jobs";
import { splitName } from "@/lib/names";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

/**
 * Adds a guest from the add form (`addGuest` does the work).
 *
 * The household picker sends an existing household's id, "none", or "new"
 * with a name — a new household is created first so the guest can join it.
 */
export async function saveGuestAction(formData: FormData) {
  const back = "/people/new";
  const fullName = text(formData, "full_name") ?? "";
  const household = text(formData, "household");
  const result = await addGuest({
    fullName,
    householdId: household === "none" || household === "new" ? null : household,
    newHousehold:
      household === "new"
        ? (text(formData, "new_household") ?? `${splitName(fullName).last ?? splitName(fullName).first} household`)
        : null,
    // Ticked roles plus any they typed in; one guest can have several.
    roles: [...formData.getAll("roles").map(String), ...(text(formData, "custom_role") ?? "").split(",")],
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    notes: text(formData, "notes"),
    mealKind: isMealKind(text(formData, "meal_kind")) ? (text(formData, "meal_kind") as MealKind) : undefined,
    noAlcohol: text(formData, "no_alcohol") === "yes" ? true : text(formData, "no_alcohol") === "no" ? false : undefined,
    eventId: text(formData, "event_id"),
    meal: text(formData, "meal_choice"),
    diet: text(formData, "dietary_notes"),
  });

  if (!result.ok) {
    const detail = result.detail ? `&detail=${encodeURIComponent(result.detail)}` : "";
    redirect(`${back}?error=${encodeURIComponent(result.error)}${detail}`);
  }

  // Only ever back to a household page — never anywhere a form field says.
  const returnTo = text(formData, "return_to");
  redirect(returnTo && /^\/people\/household\/[0-9a-f-]{36}$/i.test(returnTo) ? returnTo : "/people");
}

export async function deleteGuestAction(guestId: string) {
  let detail = "";
  try {
    await deleteContact(guestId);
  } catch (error) {
    console.error("removing guest failed", error);
    detail = describe(error);
  }

  if (detail) {
    redirect(
      `/people?error=${encodeURIComponent("That didn't remove them.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  revalidatePath("/people");
  redirect("/people");
}

/**
 * Sets a guest's roles from their card (tap a pill on or off). Anyone with
 * a role counts as the bridal party, as in saveGuestAction. The card shows
 * the change straight away; if saving fails, the next refresh shows the truth.
 */
export async function setRolesAction(guestId: string, roles: string[]) {
  const role = joinRoles(roles);
  try {
    await updateContact(guestId, {
      role_on_the_day: role,
      contact_type: role ? "bridal_party" : "guest",
    });
  } catch (error) {
    console.error("saving roles failed", error);
  }
  revalidatePath("/people");
}

/** What the guest card can change in place, one field at a time. */
export interface GuestEdit {
  first_name?: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  is_child?: boolean;
  /** Adult, child's or no meal (a child or baby starts on soft drinks only); and soft drinks only. */
  meal_kind?: MealKind;
  no_alcohol?: boolean;
  /** An existing household's id, null for none, or "new" with `new_household`. */
  household_id?: string | null;
  new_household?: string;
}

/**
 * Saves one change from the guest card. Unlike saveGuestAction it stays on
 * the page: the card shows the new value as soon as the list refreshes, and
 * any problem comes back as a short message to show beside the field.
 */
export async function updateGuestAction(guestId: string, edit: GuestEdit): Promise<{ error?: string }> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "Your wedding couldn't be found." };

  const tidy = (value: string | null | undefined) => (value ?? "").trim() || null;
  const fields: Parameters<typeof updateContact>[1] = {};
  if (edit.first_name !== undefined) {
    const first = tidy(edit.first_name);
    if (!first) return { error: "Please add their name." };
    fields.first_name = first;
  }
  if (edit.last_name !== undefined) fields.last_name = tidy(edit.last_name);
  if (edit.email !== undefined) fields.email = tidy(edit.email);
  if (edit.phone !== undefined) fields.phone = tidy(edit.phone);
  if (edit.notes !== undefined) fields.notes = tidy(edit.notes);
  if (edit.is_child !== undefined) fields.is_child = edit.is_child;
  if (edit.meal_kind !== undefined) {
    if (!isMealKind(edit.meal_kind)) return { error: "Pick adult, child's or no meal." };
    Object.assign(fields, mealFields(edit.meal_kind));
  }
  if (edit.no_alcohol !== undefined) fields.no_alcohol = Boolean(edit.no_alcohol);

  try {
    if (edit.household_id === "new") {
      const name = tidy(edit.new_household);
      if (!name) return { error: "Please give the household a name." };
      fields.household_id = (await createHousehold({ weddingId: wedding.id, name })).id;
    } else if (edit.household_id !== undefined) {
      fields.household_id = edit.household_id;
    }
    await updateContact(guestId, fields);
  } catch (error) {
    console.error("saving guest failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }

  revalidatePath("/people");
  return {};
}
