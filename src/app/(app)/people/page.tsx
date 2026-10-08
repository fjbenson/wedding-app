import { redirect } from "next/navigation";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { listSuppliers } from "@/lib/db/suppliers";
import { listAreas } from "@/lib/db/areas";
import { areaOptions } from "@/lib/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import PeopleTabs from "./people-tabs";
import PeopleView from "./people-view";
import SupplierList from "./supplier-list";

export const metadata = { title: "People — Wedding App" };

/**
 * People (docs/information-architecture.md): the guest list with RSVPs and
 * the bridal party folded in (screens 8 and 11), and the suppliers (screen
 * 12) via ?tab=suppliers.
 *
 * Links can open the guest list a particular way: ?event= picks whose answers
 * the totals show, ?guest= opens someone's card, ?view=households groups it,
 * and ?tab=party (the old Bridal party tab) starts on that filter.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; event?: string; guest?: string; view?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { tab, event: eventId, guest, view, error, detail } = await searchParams;
  const [guests, households, events, rsvps, suppliers, areaRows] = await Promise.all([
    listGuests(wedding.id),
    listHouseholds(wedding.id),
    listEvents(wedding.id),
    listRsvps(wedding.id),
    listSuppliers(wedding.id),
    listAreas(wedding.id),
  ]);
  const current = tab === "suppliers" ? "suppliers" : "guests";

  return (
    <main className="page pb-28 lg:max-w-6xl lg:pb-16">
      <p className="label">People</p>
      <PeopleTabs
        current={current}
        guestCount={guests.length}
        supplierCount={suppliers.length}
      />
      {current === "suppliers" ? (
        <SupplierList suppliers={suppliers} areas={areaOptions(areaRows)} />
      ) : (
        <PeopleView
          guests={guests}
          households={households}
          events={events}
          rsvps={rsvps}
          eventId={eventId}
          guestId={guest}
          filter={tab === "party" ? "party" : undefined}
          view={view === "households" ? "households" : undefined}
          error={error}
          detail={detail}
        />
      )}
    </main>
  );
}
