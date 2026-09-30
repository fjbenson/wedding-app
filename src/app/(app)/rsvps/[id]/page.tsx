import { notFound } from "next/navigation";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import { getContact } from "@/lib/db/contacts";
import { getEvent, getRsvp } from "@/lib/db/rsvps";
import { saveRsvpAction, uninviteAction } from "../actions";
import RsvpForm from "../rsvp-form";

export const metadata = { title: "RSVP — Wedding App" };

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const rsvp = await getRsvp(id);
  if (!rsvp) notFound();

  const [guest, event] = await Promise.all([getContact(rsvp.contact_id), getEvent(rsvp.event_id)]);
  if (!guest || !event) notFound();

  const name = [guest.first_name, guest.last_name].filter(Boolean).join(" ");

  return (
    <FormPage
      backHref={`/rsvps?event=${event.id}`}
      backLabel={`RSVPs · ${event.name}`}
      title={name}
      error={error}
      detail={detail}
    >
      <RsvpForm action={saveRsvpAction.bind(null, rsvp.id)} rsvp={rsvp} eventName={event.name} />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton
          action={uninviteAction.bind(null, rsvp.id, event.id)}
          label={`Take off the list for ${event.name.toLowerCase()}`}
          question={`Take ${name} off the list for ${event.name.toLowerCase()}?`}
        />
      </div>
    </FormPage>
  );
}
