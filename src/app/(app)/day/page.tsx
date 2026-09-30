import { redirect } from "next/navigation";
import { listGuests } from "@/lib/db/contacts";
import { getDay } from "@/lib/db/day";
import { listRsvps } from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import DayView, { type DayTab } from "./day-view";

export const metadata = { title: "The Day — Wedding App" };

export default async function DayPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { tab, error, detail } = await searchParams;
  const [day, guests, rsvps] = await Promise.all([getDay(wedding.id), listGuests(wedding.id), listRsvps(wedding.id)]);

  return (
    <DayView
      tab={tab === "seating" || tab === "transport" ? (tab as DayTab) : "run-sheet"}
      weddingDate={wedding.wedding_date}
      day={day}
      guests={guests}
      rsvps={rsvps}
      error={error}
      detail={detail}
    />
  );
}
