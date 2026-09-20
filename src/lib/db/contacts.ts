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
