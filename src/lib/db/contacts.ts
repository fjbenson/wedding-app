import { createClient } from "@/lib/supabase/server";
import type { Contact, ContactType, Household } from "@/types/db";

export async function listContacts(
  weddingId: string,
  options: { type?: ContactType } = {},
): Promise<Contact[]> {
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("last_name", { ascending: true });

  if (options.type) query = query.eq("contact_type", options.type);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Everyone on the guest list: guests and the bridal party, not suppliers. */
export async function listGuests(weddingId: string): Promise<Contact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("wedding_id", weddingId)
    .in("contact_type", ["guest", "bridal_party"])
    .order("last_name", { ascending: true, nullsFirst: false })
    .order("first_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getContact(contactId: string): Promise<Contact | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createContact(
  input: Omit<Contact, "id" | "created_at">,
): Promise<Contact> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContact(
  contactId: string,
  patch: Partial<Omit<Contact, "id" | "wedding_id" | "created_at">>,
): Promise<Contact> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update(patch)
    .eq("id", contactId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContact(contactId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) throw error;
}

export async function listHouseholds(weddingId: string): Promise<Household[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function createHousehold(input: {
  weddingId: string;
  name: string;
}): Promise<Household> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("households")
    .insert({ wedding_id: input.weddingId, name: input.name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .eq("id", householdId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

type HouseholdFields = Pick<
  Household,
  "name" | "address_line1" | "address_line2" | "city" | "postcode" | "country"
>;

export async function updateHousehold(householdId: string, fields: HouseholdFields): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("households").update(fields).eq("id", householdId);
  if (error) throw error;
}

/**
 * Removes a household. Its people stay on the guest list, just not in a
 * household (contacts.household_id is `on delete set null`); its invitation
 * goes, and their RSVPs keep their answers.
 */
export async function deleteHousehold(householdId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("households").delete().eq("id", householdId);
  if (error) throw error;
}
