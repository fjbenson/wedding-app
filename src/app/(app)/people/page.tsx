import { redirect } from "next/navigation";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { listSuppliers } from "@/lib/db/suppliers";
import { listPayments } from "@/lib/db/money";
import { listAreas } from "@/lib/db/areas";
import { guestSeating, tableNamesOf } from "@/lib/db/day";
import { listGroups } from "@/lib/db/groups";
import { travelForGuests } from "@/lib/db/stays";
import { areaOptions } from "@/lib/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listSendings } from "@/lib/db/stationery";
import { isSendingKind } from "@/lib/stationery";
import PeopleTabs from "./people-tabs";
import PeopleView from "./people-view";
import SupplierList from "./supplier-list";

export const metadata = { title: "People — Wedding App" };

/**
 * People (docs/information-architecture.md): the guest list with RSVPs and
 * the bridal party folded in (screens 8 and 11), and the suppliers (screens
 * 12 and 13) via ?tab=suppliers — ?supplier= opens one's card.
 *
 * Links can open the guest list a particular way: ?guest= opens someone's
 * card, ?view=households groups it (?view=invitation and the other sendings
 * group it by who's been sent that), and ?tab=party (the old Bridal party
 * tab) starts on that filter.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; guest?: string; household?: string; view?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { tab, guest, household, view, error, detail } = await searchParams;
  const [guests, households, events, rsvps, suppliers, areaRows] = await Promise.all([
    listGuests(wedding.id),
    listHouseholds(wedding.id),
    listEvents(wedding.id),
    listRsvps(wedding.id),
    listSuppliers(wedding.id),
    listAreas(wedding.id),
  ]);
  const current = tab === "suppliers" ? "suppliers" : "guests";
  // The supplier card shows each one's payments (null until 0006 is run).
  const payments = current === "suppliers" ? ((await listPayments(wedding.id)) ?? []) : [];
  // The guest card shows their table, and can change it.
  const seating = current === "guests" ? await guestSeating(wedding.id) : { tables: [], tableOf: {} };
  const tables = tableNamesOf(seating);
  const groups = current === "guests" ? await listGroups(wedding.id) : [];
  // Save the dates, invitations and thank-yous sent: View › Sent on the guest list.
  const sendings = current === "guests" ? await listSendings(wedding.id) : [];
  // The guest card's Travel part: where they're staying, their journeys.
  const travel = current === "guests" ? await travelForGuests(wedding.id) : undefined;
  const areas = areaOptions(areaRows).map((a) => ({ ...a, budget: areaRows?.find((r) => r.key === a.key)?.budget ?? null }));

  return (
    <main className="page pb-28 lg:max-w-[1640px] lg:pb-16">
      <PeopleTabs current={current} />
      {current === "suppliers" ? (
        <SupplierList suppliers={suppliers} areas={areas} payments={payments} />
      ) : (
        <PeopleView
          guests={guests}
          households={households}
          events={events}
          rsvps={rsvps}
          tables={tables}
          seating={seating}
          travel={travel}
          groups={groups.map((g) => ({ id: g.id, name: g.name, members: g.members }))}
          weddingName={wedding.name}
          guestId={guest}
          householdId={household}
          filter={tab === "party" ? "party" : undefined}
          view={view === "households" || view === "diet" || (view && isSendingKind(view)) ? (view as "households" | "diet" | "save_the_date" | "invitation" | "thank_you") : undefined}
          sendings={sendings}
          error={error}
          detail={detail}
        />
      )}
    </main>
  );
}
