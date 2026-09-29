import { notFound } from "next/navigation";
import { getContact, listHouseholds } from "@/lib/db/contacts";
import { deleteGuestAction, saveGuestAction } from "../actions";
import FormPage from "../form-page";
import GuestForm, { RemoveGuestButton } from "../guest-form";

export const metadata = { title: "Guest — Wedding App" };

export default async function EditGuestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;

  // A mangled link isn't an id at all, and the database would reject it.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for a guest from someone else's wedding.
  const guest = await getContact(id);
  if (!guest) notFound();

  const households = await listHouseholds(guest.wedding_id);
  const name = [guest.first_name, guest.last_name].filter(Boolean).join(" ");

  return (
    <FormPage title={name} error={error} detail={detail}>
      <GuestForm
        action={saveGuestAction.bind(null, guest.id)}
        households={households}
        guest={guest}
      />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveGuestButton action={deleteGuestAction.bind(null, guest.id)} name={name} />
      </div>
    </FormPage>
  );
}
