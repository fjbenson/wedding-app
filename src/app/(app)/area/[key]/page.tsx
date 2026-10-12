import { notFound, redirect } from "next/navigation";
import { getArea, listAreas } from "@/lib/db/areas";
import { areaOptions } from "@/lib/areas";
import { listAppointments } from "@/lib/db/appointments";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { listNotes } from "@/lib/db/notes";
import { countInspo, listInspo } from "@/lib/db/inspo";
import { moneyFor, paymentArea } from "@/lib/budget";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { getDay } from "@/lib/db/day";
import { areaGuestFacts, guestFactsKind } from "@/lib/area-guests";
import { coupleName } from "@/lib/couple-name";
import AreaView from "../area-view";

export const metadata = { title: "Area — Wedding App" };

/** One area, opened from its dot on the hub. The display is in area-view.tsx. */
export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ error?: string; detail?: string; edit?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { key } = await params;
  const { error, detail, edit } = await searchParams;
  const area = await getArea(wedding.id, decodeURIComponent(key));
  if (!area) notFound();

  const [milestones, suppliers, payments, appointments, notes, inspo, inspoCounts, areaRows] = await Promise.all([
    listMilestones(wedding.id),
    listSuppliers(wedding.id),
    listPayments(wedding.id),
    listAppointments(wedding.id),
    listNotes(wedding.id, { area: area.key }),
    // Enough of the latest to find four with a picture for the cover.
    listInspo(wedding.id, { folder: area.key, limit: 12 }),
    countInspo(wedding.id),
    listAreas(wedding.id),
  ]);
  const allPayments = payments ?? [];

  // Food & drink, Stationery and Transport also show facts from the guest
  // list (src/lib/area-guests.ts); other areas don't ask for them.
  const kind = guestFactsKind(area.key);
  let guestFacts = null;
  if (kind) {
    const [guests, households, events, rsvps, day] = await Promise.all([
      listGuests(wedding.id),
      listHouseholds(wedding.id),
      listEvents(wedding.id),
      listRsvps(wedding.id),
      kind === "transport" ? getDay(wedding.id) : Promise.resolve(null),
    ]);
    guestFacts = areaGuestFacts(kind, { guests, households, events, rsvps, runs: day?.runs, passengers: day?.passengers });
  }
  const areaSuppliers = suppliers.filter((s) => s.supplier_details?.category === area.key);
  const supplierIds = new Set(areaSuppliers.map((s) => s.id));

  return (
    <AreaView
      area={area}
      areas={areaOptions(areaRows).map((a) => ({ ...a, budget: areaRows?.find((r) => r.key === a.key)?.budget ?? null }))}
      milestones={milestones.filter((m) => m.category === area.key)}
      suppliers={areaSuppliers}
      money={moneyFor(area.key, suppliers, allPayments, area.budget ?? null)}
      payments={allPayments.filter((p) => paymentArea(p, suppliers) === area.key)}
      // An appointment with one of this area's suppliers belongs here even if it wasn't tagged.
      appointments={(appointments ?? []).filter(
        (a) => a.area_key === area.key || (!a.area_key && a.contact_id !== null && supplierIds.has(a.contact_id)),
      )}
      notes={notes ?? []}
      photos={(inspo ?? []).filter((i) => i.picture).slice(0, 4)}
      ideaCount={inspoCounts?.get(area.key) ?? 0}
      editing={
        edit === "facts" || edit === "note" || (edit && /^note:[0-9a-f-]{36}$/i.test(edit)) ? edit : null
      }
      guestFacts={guestFacts}
      couple={coupleName(wedding.name)}
      error={error}
      detail={detail}
    />
  );
}
