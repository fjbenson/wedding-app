"use server";

import { revalidatePath } from "next/cache";
import { createHousehold, deleteHousehold, updateHousehold } from "@/lib/db/contacts";
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

/** A new, empty household from the guest list's + (owner, 16 Oct 2026); its card opens next. */
export async function createHouseholdAction(name: string): Promise<{ error?: string; id?: string }> {
  const tidy = name.trim();
  if (!tidy) return { error: "Please give the household a name." };
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "No wedding found." };
  try {
    const household = await createHousehold({ weddingId: wedding.id, name: tidy });
    revalidatePath("/people");
    return { id: household.id };
  } catch (error) {
    console.error("creating household failed", error);
    return { error: `That didn't save. ${describe(error)}` };
  }
}
