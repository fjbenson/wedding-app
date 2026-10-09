"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createContact, createHousehold, deleteContact, updateContact } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { joinRoles } from "@/lib/guest-roles";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

/**
 * Adds a guest (guestId null) or saves changes to one.
 *
 * The household picker sends an existing household's id, "none", or "new"
 * with a name — a new household is created first so the guest can join it.
 */
export async function saveGuestAction(guestId: string | null, formData: FormData) {
  const back = guestId ? `/people/${guestId}` : "/people/new";

  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const firstName = text(formData, "first_name");
  if (!firstName) {
    redirect(`${back}?error=${encodeURIComponent("Please add a first name.")}`);
  }
  const lastName = text(formData, "last_name");

  let detail = "";
  try {
    let householdId = text(formData, "household");
    if (householdId === "none") householdId = null;
    if (householdId === "new") {
      const name = text(formData, "new_household") ?? `${lastName ?? firstName} household`;
      householdId = (await createHousehold({ weddingId: wedding.id, name })).id;
    }

    // Ticked roles plus any they typed in; one guest can have several.
    const role = joinRoles([
      ...formData.getAll("roles").map(String),
      ...(text(formData, "custom_role") ?? "").split(","),
    ]);
    const fields = {
      household_id: householdId,
      // Anyone with a job on the day counts as the bridal party (the plan's filter).
      contact_type: role ? ("bridal_party" as const) : ("guest" as const),
      role_on_the_day: role,
      first_name: firstName,
      last_name: lastName,
      email: text(formData, "email"),
      phone: text(formData, "phone"),
      notes: text(formData, "notes"),
      is_child: Boolean(formData.get("is_child")),
    };

    try {
      if (guestId) await updateContact(guestId, fields);
      else await createContact({ wedding_id: wedding.id, ...fields });
    } catch (error) {
      // Until 0004_guest_roles.sql is run in Supabase the column isn't there;
      // save everything else rather than fail.
      if ((error as { code?: string }).code !== "PGRST204") throw error;
      const { role_on_the_day: _unsaved, ...rest } = fields;
      if (guestId) await updateContact(guestId, rest);
      else await createContact({ wedding_id: wedding.id, ...rest } as Parameters<typeof createContact>[0]);
    }
  } catch (error) {
    console.error("saving guest failed", error);
    detail = describe(error);
  }

  if (detail) {
    redirect(
      `${back}?error=${encodeURIComponent("That didn't save.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  revalidatePath("/people");
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
    if (!first) return { error: "Please add a first name." };
    fields.first_name = first;
  }
  if (edit.last_name !== undefined) fields.last_name = tidy(edit.last_name);
  if (edit.email !== undefined) fields.email = tidy(edit.email);
  if (edit.phone !== undefined) fields.phone = tidy(edit.phone);
  if (edit.notes !== undefined) fields.notes = tidy(edit.notes);
  if (edit.is_child !== undefined) fields.is_child = edit.is_child;

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
