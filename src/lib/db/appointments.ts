import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/types/db";

type AppointmentFields = Omit<Appointment, "id" | "wedding_id" | "created_at">;

/**
 * A wedding's appointments in date and time order. `null` means the table
 * isn't there yet (0007_appointments.sql not run).
 */
export async function listAppointments(weddingId: string): Promise<Appointment[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("on_date", { ascending: true })
    .order("at_time", { ascending: true, nullsFirst: true });

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw error;
  }
  return data ?? [];
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("appointments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createAppointment(weddingId: string, fields: AppointmentFields): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert({ wedding_id: weddingId, ...fields });
  if (error) throw error;
}

export async function updateAppointment(id: string, fields: AppointmentFields): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteAppointment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}
