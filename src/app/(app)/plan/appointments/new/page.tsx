import PlanAddPage from "../../plan-add-page";

export const metadata = { title: "Add to the plan — Wedding App" };

/** Add to the plan, starting as an appointment (plan-add-page.tsx). */
export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; area?: string; date?: string }>;
}) {
  return <PlanAddPage kind="appointment" searchParams={await searchParams} />;
}
