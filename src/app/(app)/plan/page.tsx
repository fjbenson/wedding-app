import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { listAppointments } from "@/lib/db/appointments";
import { listAreas } from "@/lib/db/areas";
import { listMilestones } from "@/lib/db/milestones";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import TimelineView from "./timeline-view";
import { asWhen } from "./when";

export const metadata = { title: "Plan — Wedding App" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; as?: string; area?: string; when?: string; kind?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { view, as, area, when, kind } = await searchParams;
  const [milestones, areas, appointments, suppliers] = await Promise.all([
    listMilestones(wedding.id),
    listAreas(wedding.id),
    listAppointments(wedding.id),
    listSuppliers(wedding.id),
  ]);

  return (
    <TimelineView
      milestones={milestones}
      appointments={appointments}
      suppliers={suppliers.map((s) => ({
        id: s.id,
        name: s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" "),
        area: s.supplier_details?.category ?? null,
      }))}
      weddingDate={wedding.wedding_date}
      areas={areaOptions(areas)}
      // Old links (?as=list, ?view=area, ?view=todos) all land on the List.
      view={view === "list" || view === "area" || view === "todos" || as === "list" ? "list" : "calendar"}
      area={area || null}
      when={asWhen(when)}
      kind={kind === "appointments" ? "appointments" : "todos"}
    />
  );
}
