import PlanAddPage from "../plan-add-page";

export const metadata = { title: "Add to the plan — Wedding App" };

/** Add to the plan, starting as a to-do (plan-add-page.tsx). */
export default async function NewMilestonePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; area?: string; date?: string }>;
}) {
  return <PlanAddPage kind="todo" searchParams={await searchParams} />;
}
