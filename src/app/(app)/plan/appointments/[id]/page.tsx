import { notFound } from "next/navigation";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import { getAppointment } from "@/lib/db/appointments";
import { formOptions } from "@/lib/form-options";
import { deleteAppointmentAction, saveAppointmentAction } from "../../appointment-actions";
import AppointmentForm from "../../appointment-form";

export const metadata = { title: "Appointment — Wedding App" };

/** One appointment (screen 21). */
export default async function AppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for an appointment from another wedding.
  const appointment = await getAppointment(id);
  if (!appointment) notFound();
  const { areas, suppliers } = await formOptions(appointment.wedding_id);

  return (
    <FormPage backHref="/plan?show=appointments" backLabel="Plan" title={appointment.title} error={error} detail={detail}>
      <AppointmentForm
        action={saveAppointmentAction.bind(null, appointment.id)}
        appointment={appointment}
        suppliers={suppliers}
        areas={areas}
      />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton
          action={deleteAppointmentAction.bind(null, appointment.id)}
          label="Remove this appointment"
          question={`Remove "${appointment.title}"?`}
        />
      </div>
    </FormPage>
  );
}
