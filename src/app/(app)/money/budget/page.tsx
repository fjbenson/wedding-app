import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import BudgetForm from "./budget-form";

export const metadata = { title: "Budget — Wedding App" };

/** The whole budget, and each area's share of it (reached by tapping Money's top card). */
export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail } = await searchParams;
  const areas = ((await listAreas(wedding.id)) ?? []).filter((a) => a.enabled);

  return (
    <FormPage backHref="/money" backLabel="Money" title="The budget" error={error} detail={detail}>
      <BudgetForm
        total={wedding.budget ?? null}
        areas={areas.map((a) => ({ id: a.id, key: a.key, label: a.label, budget: a.budget ?? null }))}
      />
    </FormPage>
  );
}
