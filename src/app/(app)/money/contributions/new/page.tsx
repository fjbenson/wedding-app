import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listGuests } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { formOptions } from "@/lib/form-options";
import { saveContributionAction } from "../../contribution-actions";
import ContributionForm from "../../contribution-form";

export const metadata = { title: "Money from family — Wedding App" };

/** Money's + › Money towards it: who's paying for what (0022_contributions.sql). */
export default async function NewContributionPage({ searchParams }: { searchParams: Promise<{ error?: string; detail?: string }> }) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail } = await searchParams;
  const [{ areas }, guests] = await Promise.all([formOptions(wedding.id), listGuests(wedding.id)]);

  return (
    <FormPage backHref="/money" backLabel="Money" title="Money towards it" error={error} detail={detail}>
      <ContributionForm
        action={saveContributionAction.bind(null, null)}
        guests={guests.map((g) => ({ id: g.id, name: [g.first_name, g.last_name].filter(Boolean).join(" ") }))}
        areas={areas}
      />
    </FormPage>
  );
}
