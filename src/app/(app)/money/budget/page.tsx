import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { areaOptions } from "@/lib/areas";
import { listContributions } from "@/lib/db/contributions";
import BudgetForm from "./budget-form";
import Paying from "./paying";

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
  const [areaRows, contributions] = await Promise.all([listAreas(wedding.id), listContributions(wedding.id)]);
  const areas = (areaRows ?? []).filter((a) => a.enabled);

  return (
    <FormPage backHref="/money" backLabel="Money" title="The budget" error={error} detail={detail}>
      <BudgetForm
        total={wedding.budget ?? null}
        areas={areas.map((a) => ({ id: a.id, key: a.key, label: a.label, budget: a.budget ?? null }))}
      />
      <Paying contributions={contributions} areas={areaOptions(areaRows)} />
    </FormPage>
  );
}
