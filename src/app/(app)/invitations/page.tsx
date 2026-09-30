import { redirect } from "next/navigation";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { listEvents, listInvitations, listRsvps } from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import InvitationsView from "./invitations-view";

export const metadata = { title: "Invitations — Wedding App" };

/** Screen 15: who's been sent an invitation, who hasn't, and who to chase. */
export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail } = await searchParams;

  const [guests, households, events, rsvps, invitations] = await Promise.all([
    listGuests(wedding.id),
    listHouseholds(wedding.id),
    listEvents(wedding.id),
    listRsvps(wedding.id),
    listInvitations(wedding.id),
  ]);

  return (
    <InvitationsView
      coupleName={wedding.name}
      guests={guests}
      households={households}
      events={events}
      rsvps={rsvps}
      invitations={invitations}
      error={error}
      detail={detail}
    />
  );
}
