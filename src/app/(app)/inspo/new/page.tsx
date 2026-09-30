import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveInspoAction } from "../actions";
import SaveForm from "../save-form";

export const metadata = { title: "Save an idea — Wedding App" };

export default async function NewInspoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; folder?: string; from?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, folder, from } = await searchParams;
  const areas = areaOptions(await listAreas(wedding.id));
  const back = from && from.startsWith("/") && !from.startsWith("//") ? from : "/inspo";

  return (
    <FormPage backHref={back} backLabel="Back" title="Save an idea" error={error} detail={detail}>
      <SaveForm
        action={saveInspoAction}
        weddingId={wedding.id}
        areas={areas}
        defaultFolder={areas.some((a) => a.key === folder) ? folder : undefined}
        returnTo={from ? back : undefined}
      />
    </FormPage>
  );
}
