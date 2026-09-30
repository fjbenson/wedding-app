import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { listMilestones } from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import TimelineView from "./timeline-view";

export const metadata = { title: "Plan — Wedding App" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { view } = await searchParams;
  const [milestones, areas] = await Promise.all([listMilestones(wedding.id), listAreas(wedding.id)]);

  return (
    <TimelineView
      milestones={milestones}
      weddingDate={wedding.wedding_date}
      areas={areaOptions(areas)}
      view={view === "area" ? "area" : "date"}
    />
  );
}
