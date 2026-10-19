import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { listNotes } from "@/lib/db/notes";
import { listInspo } from "@/lib/db/inspo";
import { getCurrentWedding } from "@/lib/db/weddings";
import { todayISO } from "@/lib/dates";
import { listLists } from "@/lib/db/lists";
import InboxView from "./inbox-view";

export const metadata = { title: "Your notes — Wedding App" };

/** The capture inbox (screen 36). The display is in inbox-view.tsx. */
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; note?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, note } = await searchParams;
  const [notes, areaRows, pictures, lists] = await Promise.all([
    listNotes(wedding.id),
    listAreas(wedding.id),
    listInspo(wedding.id, { folder: null }),
    listLists(wedding.id),
  ]);

  return (
    <InboxView
      notes={notes}
      lists={lists}
      pictures={pictures ?? []}
      areas={areaOptions(areaRows)}
      today={todayISO()}
      openNote={note}
      error={error}
      detail={detail}
    />
  );
}
