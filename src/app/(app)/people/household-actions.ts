"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteHousehold, updateHousehold } from "@/lib/db/contacts";
import { describe } from "@/lib/errors";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function saveHouseholdAction(householdId: string, formData: FormData) {
  const back = `/people/household/${householdId}/edit`;
  const name = text(formData, "name");
  if (!name) redirect(`${back}?error=${encodeURIComponent("Please give the household a name.")}`);

  let detail = "";
  try {
    await updateHousehold(householdId, {
      name,
      address_line1: text(formData, "address_line1"),
      address_line2: text(formData, "address_line2"),
      city: text(formData, "city"),
      postcode: text(formData, "postcode"),
      country: text(formData, "country"),
    });
  } catch (error) {
    console.error("saving household failed", error);
    detail = describe(error);
  }
  if (detail) {
    redirect(`${back}?error=${encodeURIComponent("That didn't save.")}&detail=${encodeURIComponent(detail)}`);
  }

  revalidatePath("/people");
  redirect(`/people/household/${householdId}`);
}

export async function deleteHouseholdAction(householdId: string) {
  let detail = "";
  try {
    await deleteHousehold(householdId);
  } catch (error) {
    console.error("removing household failed", error);
    detail = describe(error);
  }
  if (detail) {
    redirect(
      `/people/household/${householdId}/edit?error=${encodeURIComponent("That didn't remove it.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  revalidatePath("/people");
  redirect("/people");
}
