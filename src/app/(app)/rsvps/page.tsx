import { redirect } from "next/navigation";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import RsvpView from "./rsvp-view";

export const metadata = { title: "RSVPs — Wedding App" };

export default async function RsvpsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { event: eventId, error, detail } = await searchParams;
  const [events, guests, households, rsvps] = await Promise.all([
    listEvents(wedding.id),
    listGuests(wedding.id),
    listHouseholds(wedding.id),
    listRsvps(wedding.id),
  ]);

  const event = events.find((e) => e.id === eventId) ?? events[0] ?? null;

  return (
    <RsvpView
      events={events}
      event={event}
      guests={guests}
      households={households}
      rsvps={event ? rsvps.filter((r) => r.event_id === event.id) : []}
      error={error}
      detail={detail}
    />
  );
}
