import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listAreas } from "@/lib/db/areas";
import { listGuests } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { formOptions } from "@/lib/form-options";
import { parseMoney } from "@/lib/money";
import { savePaymentAction } from "./actions";
import MoneyAddForm from "./money-add-form";

/**
 * Adding to Money — `/money/payments/new` (starts on Payment) and
 * `/money/budget/new` (starts on Budget) are the same page, with the
 * no switch since 16 Oct 2026: the + asks which first (add-menu.tsx).
 * `?area=` picks the area; `?supplier=&what=deposit` is a booked supplier card's
 * "+ Add a deposit" (23 Oct 2026); `?supplier=&amount=` come from "Add as a payment"
 * on a booked supplier's unscheduled balance.
 */
export default async function MoneyAddPage({
  kind,
  searchParams,
}: {
  kind: "payment" | "budget";
  searchParams: { error?: string; detail?: string; supplier?: string; amount?: string; area?: string; what?: string };
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, supplier, amount, area, what } = searchParams;
  const [{ areas, suppliers }, areaRows, guests] = await Promise.all([formOptions(wedding.id), listAreas(wedding.id), listGuests(wedding.id)]);
  const budgets = Object.fromEntries((areaRows ?? []).filter((a) => a.enabled).map((a) => [a.key, a.budget ?? null]));

  const from = suppliers.find((s) => s.id === supplier);
  const prefill = from
    ? { supplier: from.id, amount: parseMoney(amount ?? null) ?? undefined, description: `${from.name} ${what === "deposit" ? "deposit" : "balance"}` }
    : areas.some((a) => a.key === area)
      ? { area }
      : undefined;

  return (
    <FormPage
      backHref={kind === "budget" ? "/money" : "/money?view=month"}
      backLabel="Money"
      title={kind === "budget" ? "Set a budget" : "New payment"}
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
        guests={guests
          .map((g) => ({ id: g.id, name: [g.first_name, g.last_name].filter(Boolean).join(" ") }))
          .sort((a, b) => a.name.localeCompare(b.name))}
      />
    </FormPage>
  );
}
