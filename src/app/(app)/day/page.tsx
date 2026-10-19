import { redirect } from "next/navigation";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { getDay } from "@/lib/db/day";
import { listAreas } from "@/lib/db/areas";
import { areaOptions } from "@/lib/areas";
import { listRsvps } from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listStays } from "@/lib/db/stays";
import { listGroups } from "@/lib/db/groups";
import { listDecor } from "@/lib/db/decor";
import { listMomentGroups } from "@/lib/db/moment-groups";
import { withInCharge } from "@/lib/music";
import { decorPeople } from "../decor/decor-people";
import DayView, { type DayTab } from "./day-view";

export const metadata = { title: "The Day — Wedding App" };

export default async function DayPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; view?: string; area?: string; group?: string; open?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { q, tab, view, area, group, open, error, detail } = await searchParams;
  const [day, guests, rsvps, areaRows, stays, groups, households, decor, people, momentGroups] = await Promise.all([
    getDay(wedding.id),
    listGuests(wedding.id),
    listRsvps(wedding.id),
    listAreas(wedding.id),
    listStays(wedding.id),
    // Seating seats a group together; the run sheet gives a group its own schedule.
    tab === "travel" ? Promise.resolve([]) : listGroups(wedding.id),
    // Seating seats a household together too.
    tab === "seating" ? listHouseholds(wedding.id) : Promise.resolve([]),
    // Only the run sheet's Decor tile uses it.
    tab === "seating" || tab === "travel" ? Promise.resolve([]) : listDecor(wedding.id),
    // Who's in charge of each moment, by name (0031).
    tab === "seating" || tab === "travel" ? Promise.resolve([]) : decorPeople(wedding.id),
    // Which groups each moment is for (0034).
    tab === "seating" || tab === "travel" ? Promise.resolve({}) : listMomentGroups(wedding.id),
  ]);
  // Transport became Travel (15 Oct 2026); old ?tab=transport links still land there.
  const current: DayTab = tab === "seating" ? "seating" : tab === "travel" || tab === "transport" ? "travel" : "run-sheet";

  return (
    <DayView
      tab={current}
      decor={{ all: decor.length, toGet: decor.filter((d) => d.status === "to_get").length }}
      stays={stays}
      groups={groups}
      households={households.map((h) => ({ id: h.id, name: h.name }))}
      open={open ?? null}
      seatingView={view === "list" ? "list" : "plan"}
      coupleName={wedding.name}
      weddingDate={wedding.wedding_date}
      day={day && { ...day, runSheet: withInCharge(day.runSheet, people) }}
      guests={guests}
      rsvps={rsvps}
      areas={areaOptions(areaRows)}
      area={area || null}
      group={group || null}
      momentGroups={momentGroups}
      query={q?.trim() || ""}
      error={error}
      detail={detail}
    />
  );
}
