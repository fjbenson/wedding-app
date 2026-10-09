import { notFound } from "next/navigation";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import { getEvent } from "@/lib/db/rsvps";
import { deleteEventAction, saveEventAction } from "../../rsvp-actions";
import EventForm from "../../event-form";

export const metadata = { title: "Event — Wedding App" };

export default async function EditEventPage({
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

  // Row-level security returns nothing for an event from someone else's wedding.
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <FormPage
      backHref="/people"
      backLabel="People"
      title={event.name}
      error={error}
      detail={detail}
    >
      <EventForm action={saveEventAction.bind(null, event.id)} event={event} />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton
          action={deleteEventAction.bind(null, event.id)}
          label="Remove this event"
          question={`Remove ${event.name}? Everyone's answers for it will go too.`}
        />
      </div>
    </FormPage>
  );
}
