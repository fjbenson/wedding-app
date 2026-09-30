import { notFound } from "next/navigation";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import { getPayment } from "@/lib/db/money";
import { deletePaymentAction, savePaymentAction } from "../../actions";
import PaymentForm from "../../payment-form";
import { formOptions } from "@/lib/form-options";

export const metadata = { title: "Payment — Wedding App" };

/** One payment or invoice (screen 24). */
export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for a payment from another wedding.
  const payment = await getPayment(id);
  if (!payment) notFound();
  const { areas, suppliers } = await formOptions(payment.wedding_id);

  return (
    <FormPage backHref="/money?tab=payments" backLabel="Money" title={payment.description} error={error} detail={detail}>
      <PaymentForm action={savePaymentAction.bind(null, payment.id)} payment={payment} suppliers={suppliers} areas={areas} />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton
          action={deletePaymentAction.bind(null, payment.id)}
          label="Remove this payment"
          question={`Remove "${payment.description}"?`}
        />
      </div>
    </FormPage>
  );
}
