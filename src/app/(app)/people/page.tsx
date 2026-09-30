import { redirect } from "next/navigation";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import PeopleView from "./people-view";

export const metadata = { title: "People — Wedding App" };

/**
 * The guest list, with RSVPs folded in (docs/information-architecture.md,
 * screen 8): "Everyone" by default, or one event at a time via ?event=.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { event: eventId, error, detail } = await searchParams;
  const [guests, households, events, rsvps] = await Promise.all([
    listGuests(wedding.id),
    listHouseholds(wedding.id),
    listEvents(wedding.id),
    listRsvps(wedding.id),
  ]);

  return (
    <PeopleView
      guests={guests}
      households={households}
      events={events}
      event={events.find((e) => e.id === eventId) ?? null}
      rsvps={rsvps}
      error={error}
      detail={detail}
    />
  );
}
