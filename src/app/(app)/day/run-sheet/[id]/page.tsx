import { notFound } from "next/navigation";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getRunSheetItem } from "@/lib/db/day";
import { deleteRunSheetItemAction, saveRunSheetItemAction } from "../../actions";
import { RunSheetForm } from "../../day-forms";
import { decorPeople } from "../../../decor/decor-people";

export const metadata = { title: "Run sheet — Wedding App" };

export default async function RunSheetItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Row-level security returns nothing from another wedding.
  const item = await getRunSheetItem(id);
  if (!item) notFound();

  return (
    <FormPage backHref="/day" backLabel="The Day" title="Moment" error={error} detail={detail}>
      <RunSheetForm action={saveRunSheetItemAction.bind(null, item.id)} item={item} areas={areaOptions(await listAreas(item.wedding_id))} people={await decorPeople(item.wedding_id)} />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton action={deleteRunSheetItemAction.bind(null, item.id)} label="Remove from the run sheet" question={`Remove "${item.title}"?`} />
      </div>
    </FormPage>
  );
}
