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
import { listDrinks, listMenu } from "@/lib/db/menu";
import { areaGuestFacts, guestFactsKind } from "@/lib/area-guests";
import { coupleName } from "@/lib/couple-name";
import AreaView from "../area-view";
import { involvedNames } from "@/lib/db/involved";
import { RowPeopleProvider } from "@/components/row-people";
import { listDecor } from "@/lib/db/decor";
import { listLists } from "@/lib/db/lists";
import { isDecorArea } from "@/lib/decor";
import { decorPeople } from "../../decor/decor-people";
import { withInCharge } from "@/lib/music";

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

  const [milestones, suppliers, payments, appointments, notes, inspo, inspoCounts, areaRows, day, people, lists] = await Promise.all([
    listMilestones(wedding.id),
    listSuppliers(wedding.id),
    listPayments(wedding.id),
    listAppointments(wedding.id),
    listNotes(wedding.id, { area: area.key }),
    // Enough of the latest to find four with a picture for the cover.
    listInspo(wedding.id, { folder: area.key, limit: 12 }),
    countInspo(wedding.id),
    listAreas(wedding.id),
    getDay(wedding.id),
    involvedNames(wedding.id),
    listLists(wedding.id),
  ]);
  const allPayments = payments ?? [];

  // Food & drink, Stationery and Transport also show facts from the guest
  // list (src/lib/area-guests.ts); other areas don't ask for them.
  const kind = guestFactsKind(area.key);
  let guestFacts = null;
  if (kind) {
    const [guests, households, events, rsvps] = await Promise.all([
      listGuests(wedding.id),
      listHouseholds(wedding.id),
      listEvents(wedding.id),
      listRsvps(wedding.id),
    ]);
    guestFacts = areaGuestFacts(kind, { guests, households, events, rsvps, runs: day?.runs, passengers: day?.passengers });
  }
  // Food & drink also has the menu and the drinks (0024_menu_and_drinks.sql).
  let food = null;
  if (kind === "food") {
    const [courses, drinks] = await Promise.all([listMenu(wedding.id), listDrinks(wedding.id)]);
    food = {
      courses: courses.map((c) => ({ id: c.id, name: c.name, time: c.serve_time, dishes: c.dishes.length })),
      drinks: drinks.map((d) => ({ id: d.id, name: d.name, quantity: d.quantity, unit: d.unit, status: d.status })),
    };
  }
  // The Decor area shows its things in place of the stages (0027_decor.sql).
  const decor = isDecorArea(area.key)
    ? await Promise.all([listDecor(wedding.id), decorPeople(wedding.id)]).then(([items, people]) => ({ items, people, weddingDate: wedding.wedding_date }))
    : null;
  const areaSuppliers = suppliers.filter((s) => s.supplier_details?.category === area.key);
  const supplierIds = new Set(areaSuppliers.map((s) => s.id));

  return (
    <RowPeopleProvider people={people}>
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
      food={food}
      decor={decor}
      lists={lists.filter((l) => l.area_key === area.key)}
      music={area.key === "music"}
      // The Music area's The Day also has every moment with a song — the walk in, the first dance (owner, 19 Oct 2026).
      moments={withInCharge(day?.runSheet ?? [], await decorPeople(wedding.id)).filter((i) => i.area_key === area.key || (area.key === "music" && (i.music || i.music_url)))}
      couple={coupleName(wedding.name)}
      error={error}
      detail={detail}
    />
    </RowPeopleProvider>
  );
}
