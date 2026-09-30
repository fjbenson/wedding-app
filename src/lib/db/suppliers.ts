import { createClient } from "@/lib/supabase/server";
import type { Contact, SupplierDetails } from "@/types/db";

/**
 * A supplier is a contact with `contact_type` "supplier", plus one row of
 * `supplier_details` for the business side (docs/ERD.md).
 */
export type Supplier = Contact & { supplier_details: SupplierDetails | null };

type ContactFields = Pick<Contact, "first_name" | "last_name" | "email" | "phone" | "notes">;
type DetailFields = Omit<SupplierDetails, "contact_id" | "created_at">;

export async function listSuppliers(weddingId: string): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, supplier_details(*)")
    .eq("wedding_id", weddingId)
    .eq("contact_type", "supplier")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Supplier[];
}

export async function getSupplier(contactId: string): Promise<Supplier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, supplier_details(*)")
    .eq("id", contactId)
    .eq("contact_type", "supplier")
    .maybeSingle();

  if (error) throw error;
  return data as Supplier | null;
}

/** Adds the contact, then its business details. */
export async function createSupplier(
  weddingId: string,
  contact: ContactFields,
  details: DetailFields,
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert({ wedding_id: weddingId, contact_type: "supplier", household_id: null, is_child: false, ...contact })
    .select("id")
    .single();
  if (error) throw error;

  const { error: detailsError } = await supabase
    .from("supplier_details")
    .insert({ contact_id: data.id, ...details });
  if (detailsError) {
    // Don't leave a supplier with no business side behind.
    await supabase.from("contacts").delete().eq("id", data.id);
    throw detailsError;
  }

  return data.id;
}

export async function updateSupplier(
  contactId: string,
  contact: ContactFields,
  details: DetailFields,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").update(contact).eq("id", contactId);
  if (error) throw error;

  const { error: detailsError } = await supabase
    .from("supplier_details")
    .upsert({ contact_id: contactId, ...details }, { onConflict: "contact_id" });
  if (detailsError) throw detailsError;
}
