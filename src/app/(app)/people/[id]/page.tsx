import { notFound, redirect } from "next/navigation";
import { getContact } from "@/lib/db/contacts";

export const metadata = { title: "People — Wedding App" };

/**
 * An old link to one person. Guests and suppliers are both changed on their
 * cards in the list now (owner's call: guests 9 Oct, suppliers 12 Oct 2026),
 * so this opens that card instead.
 */
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // A mangled link isn't an id at all, and the database would reject it.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for someone from another wedding.
  const person = await getContact(id);
  if (!person) notFound();

  if (person.contact_type === "supplier") redirect(`/people?tab=suppliers&supplier=${person.id}`);
  redirect(`/people?guest=${person.id}`);
}
