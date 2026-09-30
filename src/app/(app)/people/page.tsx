import { redirect } from "next/navigation";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import PeopleTabs from "./people-tabs";
import PeopleView from "./people-view";
import SupplierList from "./supplier-list";

export const metadata = { title: "People — Wedding App" };

/**
 * People (docs/information-architecture.md): the guest list with RSVPs folded
 * in (screen 8) — "Everyone", or one event at a time via ?event= — and the
 * suppliers (screen 12) via ?tab=suppliers.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; event?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { tab, event: eventId, error, detail } = await searchParams;
  const [guests, households, events, rsvps, suppliers] = await Promise.all([
    listGuests(wedding.id),
    listHouseholds(wedding.id),
    listEvents(wedding.id),
    listRsvps(wedding.id),
    listSuppliers(wedding.id),
  ]);
  const current = tab === "suppliers" ? "suppliers" : "guests";

  return (
    <main className="page pb-28 lg:pb-16">
      <p className="label">People</p>
      <PeopleTabs current={current} guestCount={guests.length} supplierCount={suppliers.length} />
      {current === "suppliers" ? (
        <SupplierList suppliers={suppliers} />
      ) : (
        <PeopleView
          guests={guests}
          households={households}
          events={events}
          event={events.find((e) => e.id === eventId) ?? null}
          rsvps={rsvps}
          error={error}
          detail={detail}
        />
      )}
    </main>
  );
}
