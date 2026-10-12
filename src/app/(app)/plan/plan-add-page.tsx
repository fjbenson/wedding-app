import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { getCurrentWedding } from "@/lib/db/weddings";
import { formOptions } from "@/lib/form-options";
import { saveMilestoneAction } from "./actions";
import { saveAppointmentAction } from "./appointment-actions";
import PlanAddForm from "./plan-add-form";

/**
 * Adding to the plan — `/plan/new` (starts as a to-do) and
 * `/plan/appointments/new` (starts as an appointment) are the same page, with
 * the To-do | Appointment switch at the top (owner, 12 Oct 2026).
 * `?area=` and `?date=` fill those in.
 */
export default async function PlanAddPage({
  kind,
  searchParams,
}: {
  kind: "todo" | "appointment";
  searchParams: { error?: string; detail?: string; area?: string; date?: string };
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, area, date } = searchParams;
  const { areas, suppliers } = await formOptions(wedding.id);
  const fromArea = areas.some((a) => a.key === area) ? area : undefined;

  return (
    <FormPage backHref="/plan" backLabel="Plan" title="Add to the plan" error={error} detail={detail}>
      <PlanAddForm
        kind={kind}
        saveTodo={saveMilestoneAction.bind(null, null)}
        saveAppointment={saveAppointmentAction.bind(null, null)}
        suppliers={suppliers}
        areas={areas}
        defaultArea={fromArea}
        defaultDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined}
        weddingDate={wedding.wedding_date}
      />
    </FormPage>
  );
}
