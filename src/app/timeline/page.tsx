import { redirect } from "next/navigation";
import { listMilestones } from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import TimelineView from "./timeline-view";

export const metadata = { title: "Timeline — Wedding App" };

export default async function TimelinePage() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const milestones = await listMilestones(wedding.id);

  return <TimelineView milestones={milestones} weddingDate={wedding.wedding_date} />;
}
