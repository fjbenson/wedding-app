"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAppointment, deleteAppointment, updateAppointment } from "@/lib/db/appointments";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function failed(back: string, message: string, error: unknown): never {
  console.error(message, error);
  const code = (error as { code?: string }).code;
  const detail =
    code === "PGRST205" || code === "42P01"
      ? "Run supabase/migrations/0007_appointments.sql in Supabase first."
      : describe(error);
  redirect(`${back}?error=${encodeURIComponent(message)}&detail=${encodeURIComponent(detail)}`);
}

function refresh() {
  revalidatePath("/plan");
  revalidatePath("/");
}

/** Adds an appointment (id null) or saves changes to one. */
export async function saveAppointmentAction(appointmentId: string | null, formData: FormData) {
  const back = appointmentId ? `/plan/appointments/${appointmentId}` : "/plan/appointments/new";
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const title = text(formData, "title");
  const onDate = text(formData, "on_date");
  if (!title || !onDate) redirect(`${back}?error=${encodeURIComponent("Please say what it is and when.")}`);

  const fields = {
    title,
    on_date: onDate,
    at_time: text(formData, "at_time"),
    location: text(formData, "location"),
    contact_id: text(formData, "supplier"),
    area_key: text(formData, "area"),
    notes: text(formData, "notes"),
  };

  try {
    if (appointmentId) await updateAppointment(appointmentId, fields);
    else await createAppointment(wedding.id, fields);
  } catch (error) {
    failed(back, "That didn't save.", error);
  }

  refresh();
  redirect("/plan?show=appointments");
}

export async function deleteAppointmentAction(appointmentId: string) {
  try {
    await deleteAppointment(appointmentId);
  } catch (error) {
    failed(`/plan/appointments/${appointmentId}`, "That didn't remove it.", error);
  }
  refresh();
  redirect("/plan?show=appointments");
}
