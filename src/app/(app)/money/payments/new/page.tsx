import MoneyAddPage from "../../money-add-page";

export const metadata = { title: "Add to Money — Wedding App" };

/** Add to Money, starting on Payment (money-add-page.tsx). */
export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; supplier?: string; amount?: string; area?: string; what?: string }>;
}) {
  return <MoneyAddPage kind="payment" searchParams={await searchParams} />;
}
