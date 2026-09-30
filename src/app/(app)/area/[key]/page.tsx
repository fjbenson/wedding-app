import { notFound, redirect } from "next/navigation";
import { getArea } from "@/lib/db/areas";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { moneyFor } from "@/lib/budget";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import AreaView from "../area-view";

export const metadata = { title: "Area — Wedding App" };

/** One area, opened from its dot on the hub. The display is in area-view.tsx. */
export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const { key } = await params;
  const { error, detail } = await searchParams;
  const area = await getArea(wedding.id, decodeURIComponent(key));
  if (!area) notFound();

  const [milestones, suppliers, payments] = await Promise.all([
    listMilestones(wedding.id),
    listSuppliers(wedding.id),
    listPayments(wedding.id),
  ]);

  return (
    <AreaView
      area={area}
      milestones={milestones.filter((m) => m.category === area.key)}
      suppliers={suppliers.filter((s) => s.supplier_details?.category === area.key)}
      money={moneyFor(area.key, suppliers, payments ?? [], area.budget ?? null)}
      error={error}
      detail={detail}
    />
  );
}
