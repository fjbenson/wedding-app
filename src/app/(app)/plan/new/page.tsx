import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveMilestoneAction } from "../actions";
import MilestoneForm from "../milestone-form";

export const metadata = { title: "Add a to-do — Wedding App" };

export default async function NewMilestonePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; area?: string }>;
}) {
  const { error, detail, area } = await searchParams;
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const areas = areaOptions(await listAreas(wedding.id));
  const fromArea = areas.some((a) => a.key === area) ? area : undefined;

  return (
    <FormPage
      backHref={fromArea ? "/plan?view=area" : "/plan"}
      backLabel="Plan"
      title="Add a to-do"
      error={error}
      detail={detail}
    >
      <MilestoneForm action={saveMilestoneAction.bind(null, null)} areas={areas} defaultArea={fromArea} />
    </FormPage>
  );
}
