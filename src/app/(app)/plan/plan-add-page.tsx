import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listGuests } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { formOptions } from "@/lib/form-options";
import { saveMilestoneAction } from "./actions";
import { saveAppointmentAction } from "./appointment-actions";
import PlanAddForm from "./plan-add-form";

/**
 * Adding to the plan — `/plan/new` (starts as a to-do) and
 * `/plan/appointments/new` (starts as an appointment) are the same page, with
 * no switch since 16 Oct 2026: the + asks which first (add-menu.tsx).
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
  const [{ areas, suppliers }, guestRows] = await Promise.all([formOptions(wedding.id), listGuests(wedding.id)]);
  const guests = guestRows
    .map((g) => ({ id: g.id, name: [g.first_name, g.last_name].filter(Boolean).join(" ") }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const fromArea = areas.some((a) => a.key === area) ? area : undefined;

  return (
    <FormPage backHref="/plan" backLabel="Plan" title={kind === "todo" ? "New to-do" : "New appointment"} error={error} detail={detail}>
      <PlanAddForm
        kind={kind}
        saveTodo={saveMilestoneAction.bind(null, null)}
        saveAppointment={saveAppointmentAction.bind(null, null)}
        suppliers={suppliers}
        guests={guests}
        areas={areas}
        defaultArea={fromArea}
        defaultDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined}
        weddingDate={wedding.wedding_date}
      />
    </FormPage>
  );
}
