import { redirect } from "next/navigation";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import AreaSteps from "./area-steps";

export const metadata = { title: "Add an area — Wedding App" };

/**
 * The + on the hub's ring (screen 7): add an area of your own in three steps
 * (name, icon, budget — area-steps.tsx), or bring back one that was taken off
 * the hub or switched off by tapping its name on the first step.
 */
export default async function NewAreaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error } = await searchParams;
  const areas = (await listAreas(wedding.id)) ?? [];
  const shared = areas.filter((a) => a.enabled).reduce((sum, a) => sum + (a.budget ?? 0), 0);

  return (
    <main className="page">
      <AreaSteps
        hidden={areas.filter((a) => !a.show_on_hub || !a.enabled).map((a) => a.label)}
        taken={areas.filter((a) => a.show_on_hub && a.enabled).map((a) => a.label)}
        stillFree={wedding.budget != null ? Math.max(0, wedding.budget - shared) : null}
        error={error}
      />
    </main>
  );
}
