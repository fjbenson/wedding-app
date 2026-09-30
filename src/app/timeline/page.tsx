import { redirect } from "next/navigation";
import { listMilestones } from "@/lib/db/milestones";
import { getCurrentWedding } from "@/lib/db/weddings";
import AppShell from "@/components/app-shell";
import TimelineView from "./timeline-view";

export const metadata = { title: "Timeline — Wedding App" };

export default async function TimelinePage() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const milestones = await listMilestones(wedding.id);

  return (
    <AppShell current="/timeline" wedding={wedding}>
      <TimelineView milestones={milestones} weddingDate={wedding.wedding_date} />
    </AppShell>
  );
}
