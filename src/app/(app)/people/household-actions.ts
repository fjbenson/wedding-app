"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHousehold, deleteHousehold, listGuests, updateContact, updateHousehold } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

/** Remove a household from its page. Its people stay on the guest list. */
export async function removeHouseholdAction(householdId: string): Promise<{ error?: string }> {
  try {
    await deleteHousehold(householdId);
  } catch (error) {
    console.error("removing household failed", error);
    return { error: `That didn't remove it. ${describe(error)}` };
  }
  revalidatePath("/people");
  return {};
}

/** The household's address, saved from its page without leaving it. */
export async function saveAddressAction(
  householdId: string,
  address: { address_line1: string; address_line2: string; city: string; postcode: string },
): Promise<{ error?: string }> {
  const tidy = (v: string) => v.trim() || null;
  try {
    await updateHousehold(householdId, {
      address_line1: tidy(address.address_line1),
      address_line2: tidy(address.address_line2),
      city: tidy(address.city),
      postcode: tidy(address.postcode),
    });
  } catch (error) {
    console.error("saving address failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  revalidatePath("/people");
  return {};
}

/** A new name for the household, from its page. */
export async function renameHouseholdAction(householdId: string, name: string): Promise<{ error?: string }> {
  const tidy = name.trim();
  if (!tidy) return { error: "Please give the household a name." };
  try {
    await updateHousehold(householdId, { name: tidy });
  } catch (error) {
    console.error("renaming household failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
  revalidatePath("/people");
  return {};
}

/**
 * A new household from its own screen (`/people/households/new`, owner,
 * 16 Oct 2026: adding gets a full screen, a pop-up is for what exists): its
 * name, the address, and anyone already on the list moving in. Then its
 * card opens on the guest list.
 */
export async function saveNewHouseholdAction(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const name = text("name");
  const back = (error: string, detail = "") =>
    redirect(`/people/households/new?error=${encodeURIComponent(error)}${detail ? `&detail=${encodeURIComponent(detail)}` : ""}`);
  if (!name) back("Please give the household a name.");
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  let id = "";
  try {
    const household = await createHousehold({ weddingId: wedding.id, name: name! });
    id = household.id;
    await updateHousehold(id, {
      address_line1: text("address_line1"),
      address_line2: text("address_line2"),
      city: text("city"),
      postcode: text("postcode")?.toUpperCase() ?? null,
    });
    // Only this wedding's guests can move in (row-level security says so too).
    const guests = new Set((await listGuests(wedding.id)).map((g) => g.id));
    for (const member of formData.getAll("member").map(String).filter((m) => guests.has(m))) {
      await updateContact(member, { household_id: id });
    }
  } catch (error) {
    console.error("creating household failed", error);
    if (!id) back("That didn't save.", describe(error));
  }
  revalidatePath("/people");
  redirect(`/people?household=${id}`);
}
