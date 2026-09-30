import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { getCurrentWedding } from "@/lib/db/weddings";
import { formOptions } from "@/lib/form-options";
import { saveAppointmentAction } from "../../appointment-actions";
import AppointmentForm from "../../appointment-form";

export const metadata = { title: "Add an appointment — Wedding App" };

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; area?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, area } = await searchParams;
  const { areas, suppliers } = await formOptions(wedding.id);

  return (
    <FormPage backHref="/plan?show=appointments" backLabel="Plan" title="Add an appointment" error={error} detail={detail}>
      <AppointmentForm
        action={saveAppointmentAction.bind(null, null)}
        suppliers={suppliers}
        areas={areas}
        defaultArea={areas.some((a) => a.key === area) ? area : undefined}
      />
    </FormPage>
  );
}
