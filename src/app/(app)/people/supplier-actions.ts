"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteContact } from "@/lib/db/contacts";
import { createSupplier, updateSupplier } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { parseMoney } from "@/lib/money";
import { SUPPLIER_STATUSES } from "@/lib/supplier-status";
import type { SupplierStatus } from "@/types/db";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

const LIST = "/people?tab=suppliers";

/** Adds a supplier (supplierId null) or saves changes to one. */
export async function saveSupplierAction(supplierId: string | null, formData: FormData) {
  const back = supplierId ? `/people/${supplierId}` : "/people/suppliers/new";

  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const company = text(formData, "company_name");
  const person = text(formData, "contact_name");
  if (!company && !person) {
    redirect(`${back}?error=${encodeURIComponent("Please add the business's name.")}`);
  }

  // A contact needs a first name, so a business with no named person uses
  // its own name there. The list always shows the business name first.
  const [firstName, ...rest] = person ? person.split(/\s+/) : [company!];
  const contact = {
    first_name: firstName,
    last_name: rest.join(" ") || null,
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    notes: text(formData, "notes"),
  };

  const status = String(formData.get("status")) as SupplierStatus;
  const details = {
    company_name: company,
    category: text(formData, "category"),
    status: SUPPLIER_STATUSES.some((s) => s.status === status) ? status : ("enquired" as const),
    quoted_cost: parseMoney(formData.get("quoted_cost")),
    deposit_paid: parseMoney(formData.get("deposit_paid")),
    contract_url: text(formData, "contract_url"),
  };

  let detail = "";
  try {
    if (supplierId) await updateSupplier(supplierId, contact, details);
    else await createSupplier(wedding.id, contact, details);
  } catch (error) {
    console.error("saving supplier failed", error);
    detail = describe(error);
    // "Quote in" arrives with 0012_area_stages.sql; say so plainly.
    if (status === "quoted" && /supplier_status/.test(detail)) {
      detail = "Run supabase/migrations/0012_area_stages.sql in Supabase first.";
    }
  }

  if (detail) {
    redirect(`${back}?error=${encodeURIComponent("That didn't save.")}&detail=${encodeURIComponent(detail)}`);
  }

  revalidatePath("/people");
  revalidatePath("/area/[key]", "page");
  redirect(LIST);
}

export async function deleteSupplierAction(supplierId: string) {
  let detail = "";
  try {
    await deleteContact(supplierId);
  } catch (error) {
    console.error("removing supplier failed", error);
    detail = describe(error);
  }

  if (detail) {
    redirect(
      `/people/${supplierId}?error=${encodeURIComponent("That didn't remove them.")}&detail=${encodeURIComponent(detail)}`,
    );
  }

  revalidatePath("/people");
  revalidatePath("/area/[key]", "page");
  redirect(LIST);
}
