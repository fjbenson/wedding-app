import MoneyAddPage from "../../money-add-page";

export const metadata = { title: "Add to Money — Wedding App" };

/** Add to Money, starting on Budget (money-add-page.tsx). */
export default async function NewBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; area?: string }>;
}) {
  return <MoneyAddPage kind="budget" searchParams={await searchParams} />;
}
