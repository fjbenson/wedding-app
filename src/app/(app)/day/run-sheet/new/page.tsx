import FormPage from "@/components/form-page";
import { saveRunSheetItemAction } from "../../actions";
import { RunSheetForm } from "../../day-forms";

export const metadata = { title: "Add to the run sheet — Wedding App" };

export default async function NewRunSheetItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;
  return (
    <FormPage backHref="/day" backLabel="The Day" title="Add to the run sheet" error={error} detail={detail}>
      <RunSheetForm action={saveRunSheetItemAction.bind(null, null)} />
    </FormPage>
  );
}
