import { getAppointment } from "@/lib/db/appointments";
import { getContact } from "@/lib/db/contacts";
import { appointmentIcs } from "@/lib/ics";

/**
 * An appointment as a calendar file, for "Add to my calendar" on its card.
 * Read as the signed-in person, so row-level security keeps it to their own
 * wedding; the file goes only to their own phone.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAppointment(id);
  if (!a) return new Response("Not found", { status: 404 });
  const who = a.contact_id ? await getContact(a.contact_id) : null;
  const name = who ? [who.first_name, who.last_name].filter(Boolean).join(" ") : null;
  const file = a.title.replace(/[^\w ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "appointment";
  return new Response(appointmentIcs(a, name), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${file}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
