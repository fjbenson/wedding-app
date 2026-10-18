import { listAppointments } from "@/lib/db/appointments";
import { listAreas } from "@/lib/db/areas";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { getDay } from "@/lib/db/day";
import { countInspo } from "@/lib/db/inspo";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { listSuppliers } from "@/lib/db/suppliers";
import { whereThingsStand, type Standing } from "@/lib/where-things-stand";
import type { Wedding } from "@/types/db";

/**
 * Everything Where things stand needs, loaded and worked out. Used by the
 * page itself and by the laptop Hub's "At a glance" row, so the two always
 * agree.
 */
export async function loadStanding(wedding: Wedding): Promise<Standing> {
  const [areas, guests, households, events, rsvps, suppliers, payments, milestones, appointments, ideas, day] = await Promise.all([
    listAreas(wedding.id),
    listGuests(wedding.id),
    listHouseholds(wedding.id),
    listEvents(wedding.id),
    listRsvps(wedding.id),
    listSuppliers(wedding.id),
    listPayments(wedding.id),
    listMilestones(wedding.id),
    listAppointments(wedding.id),
    countInspo(wedding.id),
    getDay(wedding.id),
  ]);

  return whereThingsStand({
    budget: wedding.budget ?? null,
    areas: areas ?? [],
    guests,
    households,
    events,
    rsvps,
    suppliers,
    payments: payments ?? [],
    milestones,
    appointments: appointments ?? [],
    ideas,
    day,
  });
}
