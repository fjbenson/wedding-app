import { notFound } from "next/navigation";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import { listGuests } from "@/lib/db/contacts";
import { getContribution } from "@/lib/db/contributions";
import { formOptions } from "@/lib/form-options";
import { deleteContributionAction, saveContributionAction } from "../../contribution-actions";
import ContributionForm from "../../contribution-form";

export const metadata = { title: "Money towards it — Wedding App" };

/** One gift towards the wedding, edited in place like a payment. */
export default async function ContributionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for another wedding's.
  const contribution = await getContribution(id);
  if (!contribution) notFound();
  const [{ areas }, guests] = await Promise.all([formOptions(contribution.wedding_id), listGuests(contribution.wedding_id)]);

  return (
    <FormPage backHref="/money/budget#paying" backLabel="The budget" title="Money towards it" error={error} detail={detail}>
      <ContributionForm
        action={saveContributionAction.bind(null, contribution.id)}
        contribution={contribution}
        guests={guests.map((g) => ({ id: g.id, name: [g.first_name, g.last_name].filter(Boolean).join(" ") }))}
        areas={areas}
      />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton
          action={deleteContributionAction.bind(null, contribution.id)}
          label="Remove this"
          question={`Remove ${contribution.name}'s ${contribution.amount ? "gift" : "entry"}?`}
        />
      </div>
    </FormPage>
  );
}
