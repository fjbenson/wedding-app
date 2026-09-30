import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { listAppointments } from "@/lib/db/appointments";
import { listAreas } from "@/lib/db/areas";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import type { AgendaFilter } from "./agenda";
import TimelineView from "./timeline-view";

export const metadata = { title: "Plan — Wedding App" };

const FILTERS: AgendaFilter[] = ["todos", "appointments", "payments"];

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; show?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { view, show } = await searchParams;
  const [milestones, areas, appointments, payments, suppliers] = await Promise.all([
    listMilestones(wedding.id),
    listAreas(wedding.id),
    listAppointments(wedding.id),
    listPayments(wedding.id),
    listSuppliers(wedding.id),
  ]);

  return (
    <TimelineView
      milestones={milestones}
      appointments={appointments}
      payments={payments ?? []}
      suppliers={suppliers.map((s) => ({
        id: s.id,
        name: s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" "),
      }))}
      weddingDate={wedding.wedding_date}
      areas={areaOptions(areas)}
      view={view === "area" ? "area" : "agenda"}
      show={FILTERS.includes(show as AgendaFilter) ? (show as AgendaFilter) : "all"}
    />
  );
}
