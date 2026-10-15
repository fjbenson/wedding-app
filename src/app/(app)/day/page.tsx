import { redirect } from "next/navigation";
import { listGuests } from "@/lib/db/contacts";
import { getDay } from "@/lib/db/day";
import { listAreas } from "@/lib/db/areas";
import { areaOptions } from "@/lib/areas";
import { listRsvps } from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listStays } from "@/lib/db/stays";
import { listGroups } from "@/lib/db/groups";
import DayView, { type DayTab } from "./day-view";

export const metadata = { title: "The Day — Wedding App" };

export default async function DayPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; view?: string; area?: string; open?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { tab, view, area, open, error, detail } = await searchParams;
  const [day, guests, rsvps, areaRows, stays, groups] = await Promise.all([
    getDay(wedding.id),
    listGuests(wedding.id),
    listRsvps(wedding.id),
    listAreas(wedding.id),
    listStays(wedding.id),
    // Only Seating uses them (seat a group together).
    tab === "seating" ? listGroups(wedding.id) : Promise.resolve([]),
  ]);
  // Transport became Travel (15 Oct 2026); old ?tab=transport links still land there.
  const current: DayTab = tab === "seating" ? "seating" : tab === "travel" || tab === "transport" ? "travel" : "run-sheet";

  return (
    <DayView
      tab={current}
      stays={stays}
      groups={groups}
      open={open ?? null}
      seatingView={view === "list" ? "list" : "plan"}
      coupleName={wedding.name}
      weddingDate={wedding.wedding_date}
      day={day}
      guests={guests}
      rsvps={rsvps}
      areas={areaOptions(areaRows)}
      area={area || null}
      error={error}
      detail={detail}
    />
  );
}
