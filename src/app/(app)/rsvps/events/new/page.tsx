import FormPage from "@/components/form-page";
import { saveEventAction } from "../../actions";
import EventForm from "../../event-form";

export const metadata = { title: "Add an event — Wedding App" };

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;

  return (
    <FormPage backHref="/rsvps" backLabel="RSVPs" title="Add an event" error={error} detail={detail}>
      <EventForm action={saveEventAction.bind(null, null)} />
    </FormPage>
  );
}
