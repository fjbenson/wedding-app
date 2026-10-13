import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { formOptions } from "@/lib/form-options";
import { parseMoney } from "@/lib/money";
import { savePaymentAction } from "./actions";
import MoneyAddForm from "./money-add-form";

/**
 * Adding to Money — `/money/payments/new` (starts on Payment) and
 * `/money/budget/new` (starts on Budget) are the same page, with the
 * Payment | Budget switch at the top (owner, 13 Oct 2026).
 * `?area=` picks the area; `?supplier=&amount=` come from "Add as a payment"
 * on a booked supplier's unscheduled balance.
 */
export default async function MoneyAddPage({
  kind,
  searchParams,
}: {
  kind: "payment" | "budget";
  searchParams: { error?: string; detail?: string; supplier?: string; amount?: string; area?: string };
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, supplier, amount, area } = searchParams;
  const [{ areas, suppliers }, areaRows] = await Promise.all([formOptions(wedding.id), listAreas(wedding.id)]);
  const budgets = Object.fromEntries((areaRows ?? []).filter((a) => a.enabled).map((a) => [a.key, a.budget ?? null]));

  const from = suppliers.find((s) => s.id === supplier);
  const prefill = from
    ? { supplier: from.id, amount: parseMoney(amount ?? null) ?? undefined, description: `${from.name} balance` }
    : areas.some((a) => a.key === area)
      ? { area }
      : undefined;

  return (
    <FormPage
      backHref={kind === "budget" ? "/money" : "/money?view=month"}
      backLabel="Money"
      title="Add to Money"
      error={error}
      detail={detail}
    >
      <MoneyAddForm
        kind={kind}
        savePayment={savePaymentAction.bind(null, null)}
        suppliers={suppliers}
        areas={areas}
        budgets={budgets}
        weddingBudget={wedding.budget ?? null}
        prefill={prefill}
        weddingDate={wedding.wedding_date}
      />
    </FormPage>
  );
}
