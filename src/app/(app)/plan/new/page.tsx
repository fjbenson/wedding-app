import FormPage from "@/components/form-page";
import { saveMilestoneAction } from "../actions";
import MilestoneForm from "../milestone-form";

export const metadata = { title: "Add a to-do — Wedding App" };

export default async function NewMilestonePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;

  return (
    <FormPage
      backHref="/plan"
      backLabel="Plan"
      title="Add a to-do"
      error={error}
      detail={detail}
    >
      <MilestoneForm action={saveMilestoneAction.bind(null, null)} />
    </FormPage>
  );
}
