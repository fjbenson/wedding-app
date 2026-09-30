import { notFound } from "next/navigation";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import { getHousehold } from "@/lib/db/contacts";
import { deleteHouseholdAction, saveHouseholdAction } from "../../../household-actions";
import HouseholdForm from "../../../household-form";

export const metadata = { title: "Edit household — Wedding App" };

export default async function EditHouseholdPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for a household from another wedding.
  const household = await getHousehold(id);
  if (!household) notFound();

  return (
    <FormPage
      backHref={`/people/household/${household.id}`}
      backLabel={household.name}
      title="Edit household"
      error={error}
      detail={detail}
    >
      <HouseholdForm action={saveHouseholdAction.bind(null, household.id)} household={household} />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton
          action={deleteHouseholdAction.bind(null, household.id)}
          label="Remove this household"
          question={`Remove ${household.name}? The people in it stay on the guest list.`}
        />
      </div>
    </FormPage>
  );
}
