import { notFound, redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listGroups } from "@/lib/db/groups";
import { getRunSheet } from "@/lib/db/run-sheets";
import { getCurrentWedding } from "@/lib/db/weddings";
import { deleteRunSheetAction, updateRunSheetAction } from "../../actions";
import RemoveSheet from "../../remove-sheet";
import SheetForm from "../../sheet-form";

export const metadata = { title: "Edit run sheet — Wedding App" };

export default async function EditRunSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { id } = await params;
  const { error, detail } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [sheet, groups] = await Promise.all([getRunSheet(id), listGroups(wedding.id)]);
  if (!sheet || sheet.wedding_id !== wedding.id) notFound();
  return (
    <FormPage backHref={`/day?sheet=${id}`} backLabel={sheet.name} title="Edit run sheet" error={error} detail={detail}>
      <SheetForm
        action={updateRunSheetAction.bind(null, id)}
        sheet={{ name: sheet.name, group_id: sheet.group_id }}
        groups={groups.map((g) => ({ id: g.id, name: g.name, count: g.members.length }))}
      />
      <RemoveSheet remove={deleteRunSheetAction.bind(null, id)} name={sheet.name} />
    </FormPage>
  );
}
