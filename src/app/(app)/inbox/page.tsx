import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { listNotes } from "@/lib/db/notes";
import { getCurrentWedding } from "@/lib/db/weddings";
import InboxView from "./inbox-view";

export const metadata = { title: "Inbox — Wedding App" };

/** The capture inbox (screen 36). The display is in inbox-view.tsx. */
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail } = await searchParams;
  const [notes, areaRows] = await Promise.all([listNotes(wedding.id), listAreas(wedding.id)]);

  return <InboxView notes={notes} areas={areaOptions(areaRows)} error={error} detail={detail} />;
}
