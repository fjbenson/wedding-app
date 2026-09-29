"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createContact, createHousehold, deleteContact, updateContact } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

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
  const back = guestId ? `/guests/${guestId}` : "/guests/new";

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

    const fields = {
      household_id: householdId,
      contact_type: formData.get("bridal_party") ? ("bridal_party" as const) : ("guest" as const),
      first_name: firstName,
      last_name: lastName,
      email: text(formData, "email"),
      phone: text(formData, "phone"),
      notes: text(formData, "notes"),
      is_child: Boolean(formData.get("is_child")),
    };

    if (guestId) await updateContact(guestId, fields);
    else await createContact({ wedding_id: wedding.id, ...fields });
  } catch (error) {
    console.error("saving guest failed", error);
    detail = describe(error);
  }

  if (detail) {
    redirect(
      `${back}?error=${encodeURIComponent("That didn't save.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  revalidatePath("/guests");
  redirect("/guests");
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
      `/guests/${guestId}?error=${encodeURIComponent("That didn't remove them.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  revalidatePath("/guests");
  redirect("/guests");
}
