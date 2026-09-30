import { notFound } from "next/navigation";
import { getHousehold, listGuests } from "@/lib/db/contacts";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import HouseholdView from "../../household-view";

export const metadata = { title: "Household — Wedding App" };

/** One household, expanded — screen 9. The display is in household-view.tsx. */
export default async function HouseholdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for a household from another wedding.
  const household = await getHousehold(id);
  if (!household) notFound();

  const [guests, events, rsvps] = await Promise.all([
    listGuests(household.wedding_id),
    listEvents(household.wedding_id),
    listRsvps(household.wedding_id),
  ]);

  return <HouseholdView household={household} guests={guests} events={events} rsvps={rsvps} />;
}
