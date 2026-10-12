"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteContact } from "@/lib/db/contacts";
import { createSupplier, getSupplier, updateSupplier, updateSupplierParts } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { parseMoney } from "@/lib/money";
import { SUPPLIER_STATUSES } from "@/lib/supplier-status";
import { splitName } from "@/lib/names";
import type { SupplierStatus } from "@/types/db";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

const LIST = "/people?tab=suppliers";

/** The database hasn't got the website column yet (0015 not run). */
function missingWebsite(error: unknown) {
  const e = error as { code?: string; message?: string };
  return (e.code === "PGRST204" || e.code === "42703") && /website/.test(e.message ?? "");
}

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
    website: text(formData, "website"),
  };

  let detail = "";
  try {
    try {
      if (supplierId) await updateSupplier(supplierId, contact, details);
      else await createSupplier(wedding.id, contact, details);
    } catch (error) {
      // Before 0015_supplier_website.sql there's no website column: save
      // everything else rather than nothing.
      if (!missingWebsite(error)) throw error;
      const { website: _dropped, ...rest } = details;
      void _dropped;
      if (supplierId) await updateSupplier(supplierId, contact, rest);
      else await createSupplier(wedding.id, contact, rest);
    }
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

/** One thing changed on the supplier card (a tap, then Save). */
export type SupplierEdit =
  | { field: "company_name" | "category" | "contract_url" | "website" | "phone" | "email" | "notes" | "contact_name"; value: string }
  | { field: "quoted_cost" | "deposit_paid"; value: string }
  | { field: "status"; value: SupplierStatus };

/**
 * Saves one change from the supplier card and returns a message rather than
 * redirecting, so the card stays open (like the guest card).
 */
export async function updateSupplierAction(supplierId: string, edit: SupplierEdit): Promise<{ error?: string }> {
  const value = String(edit.value).trim();
  try {
    if (edit.field === "contact_name") {
      // A contact needs a first name: with no person named, the business's
      // own name stands in, as when adding.
      const supplier = await getSupplier(supplierId);
      if (!supplier) return { error: "That supplier isn't there any more." };
      const { first, last } = splitName(value || supplier.supplier_details?.company_name || supplier.first_name);
      await updateSupplierParts(supplierId, { first_name: first, last_name: last }, {});
    } else if (edit.field === "phone" || edit.field === "email" || edit.field === "notes") {
      await updateSupplierParts(supplierId, { [edit.field]: value || null }, {});
    } else if (edit.field === "company_name") {
      if (!value) return { error: "Please give the business a name." };
      await updateSupplierParts(supplierId, {}, { company_name: value });
    } else if (edit.field === "quoted_cost" || edit.field === "deposit_paid") {
      const amount = parseMoney(value);
      if (value && amount === null) return { error: "That doesn't look like an amount — try 1800 or £1,800." };
      await updateSupplierParts(supplierId, {}, { [edit.field]: amount });
    } else if (edit.field === "status") {
      if (!SUPPLIER_STATUSES.some((s) => s.status === value)) return { error: "That isn't a stage we know." };
      await updateSupplierParts(supplierId, {}, { status: value as SupplierStatus });
    } else {
      await updateSupplierParts(supplierId, {}, { [edit.field]: value || null });
    }
  } catch (error) {
    console.error("saving supplier failed", error);
    const detail = describe(error);
    if (edit.field === "website" && missingWebsite(error)) {
      return { error: "Websites need one database step: run supabase/migrations/0015_supplier_website.sql in Supabase." };
    }
    if (edit.field === "status" && edit.value === "quoted" && /supplier_status/.test(detail)) {
      return { error: "\"Quote in\" needs one database step: run supabase/migrations/0012_area_stages.sql in Supabase." };
    }
    return { error: "That didn't save." };
  }
  revalidatePath("/people");
  revalidatePath("/money");
  revalidatePath("/area/[key]", "page");
  return {};
}

/**
 * Saves the supplier card — the add form filled in with their details (owner,
 * 12 Oct 2026) — and returns a message rather than redirecting, so the card
 * stays open. Only what the form sent is changed: a folded-away box (notes,
 * contract) is left alone, and "not taken" stays unless a stage is picked.
 */
export async function saveSupplierCardAction(supplierId: string, formData: FormData): Promise<{ error?: string }> {
  const company = text(formData, "company_name");
  if (!company) return { error: "Please give the business a name." };
  const sent = (key: string) => formData.has(key);

  const { first, last } = splitName(text(formData, "contact_name") ?? company);
  const contact: Record<string, string | null> = { first_name: first, last_name: last };
  for (const key of ["phone", "email", "notes"] as const) if (sent(key)) contact[key] = text(formData, key);

  const details: Record<string, unknown> = { company_name: company };
  if (sent("category")) details.category = text(formData, "category");
  const status = String(formData.get("status") ?? "");
  if (SUPPLIER_STATUSES.some((s) => s.status === status)) details.status = status;
  for (const key of ["quoted_cost", "deposit_paid"] as const) {
    const raw = text(formData, key);
    const amount = parseMoney(formData.get(key));
    if (raw && amount === null) return { error: "That doesn't look like an amount — try 1800 or £1,800." };
    details[key] = amount;
  }
  for (const key of ["contract_url", "website"] as const) if (sent(key)) details[key] = text(formData, key);

  try {
    try {
      await updateSupplierParts(supplierId, contact, details);
    } catch (error) {
      if (!missingWebsite(error)) throw error;
      const { website: _dropped, ...rest } = details;
      void _dropped;
      await updateSupplierParts(supplierId, contact, rest);
    }
  } catch (error) {
    console.error("saving supplier card failed", error);
    if (status === "quoted" && /supplier_status/.test(describe(error))) {
      return { error: "\"Quote in\" needs one database step: run supabase/migrations/0012_area_stages.sql in Supabase." };
    }
    return { error: "That didn't save. Try again." };
  }
  revalidatePath("/people");
  revalidatePath("/money");
  revalidatePath("/area/[key]", "page");
  return {};
}
