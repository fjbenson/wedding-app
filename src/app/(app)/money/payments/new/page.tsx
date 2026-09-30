import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { getCurrentWedding } from "@/lib/db/weddings";
import { parseMoney } from "@/lib/money";
import { savePaymentAction } from "../../actions";
import PaymentForm from "../../payment-form";
import { formOptions } from "@/lib/form-options";

export const metadata = { title: "Add a payment — Wedding App" };

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; supplier?: string; amount?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, supplier, amount } = await searchParams;
  const { areas, suppliers } = await formOptions(wedding.id);

  // From "Add as a payment" on a booked supplier's unscheduled balance.
  const from = suppliers.find((s) => s.id === supplier);
  const prefill = from
    ? { supplier: from.id, amount: parseMoney(amount ?? null) ?? undefined, description: `${from.name} balance` }
    : undefined;

  return (
    <FormPage backHref="/money?tab=payments" backLabel="Money" title="Add a payment" error={error} detail={detail}>
      <PaymentForm action={savePaymentAction.bind(null, null)} suppliers={suppliers} areas={areas} prefill={prefill} />
    </FormPage>
  );
}
