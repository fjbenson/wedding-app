import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveRunSheetItemAction } from "../../actions";
import { RunSheetForm } from "../../day-forms";

export const metadata = { title: "Add to the run sheet — Wedding App" };

export default async function NewRunSheetItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; area?: string; from?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, area, from } = await searchParams;
  const areas = areaOptions(await listAreas(wedding.id));
  // `?area=` picks the area; added from its page (`&from=area`), Save goes back there.
  const picked = areas.some((a) => a.key === area) ? area : undefined;
  const fromArea = from === "area" ? picked : undefined;
  return (
    <FormPage
      backHref={fromArea ? `/area/${fromArea}` : "/day"}
      backLabel={fromArea ? (areas.find((a) => a.key === fromArea)?.label ?? "Back") : "The Day"}
      title="Add a moment"
      error={error}
      detail={detail}
    >
      <RunSheetForm action={saveRunSheetItemAction.bind(null, null)} areas={areas} defaultArea={picked} fromArea={fromArea} />
    </FormPage>
  );
}
