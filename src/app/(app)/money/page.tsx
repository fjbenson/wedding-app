import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { moneyByArea, moneyFor, unscheduledBalances } from "@/lib/budget";
import { listAreas } from "@/lib/db/areas";
import { listPayments } from "@/lib/db/money";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import MoneyView from "./money-view";

export const metadata = { title: "Money — Wedding App" };

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { tab, error, detail } = await searchParams;

  const [areaRows, suppliers, found] = await Promise.all([
    listAreas(wedding.id),
    listSuppliers(wedding.id),
    listPayments(wedding.id),
  ]);
  const payments = found ?? [];
  const areas = areaOptions(areaRows).map((a) => ({ ...a, budget: areaRows?.find((r) => r.key === a.key)?.budget ?? null }));
  const name = (s: (typeof suppliers)[number]) =>
    s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");

  return (
    <MoneyView
      tab={tab === "payments" ? "payments" : "budget"}
      total={moneyFor(undefined, suppliers, payments, wedding.budget ?? null)}
      byArea={moneyByArea(areas, suppliers, payments)}
      payments={payments}
      suppliers={suppliers.map((s) => ({ id: s.id, name: name(s) }))}
      balances={unscheduledBalances(suppliers, payments).map((b) => ({
        supplierId: b.supplier.id,
        name: name(b.supplier),
        balance: Math.round(b.balance * 100) / 100,
      }))}
      ready={found !== null}
      error={error}
      detail={detail}
    />
  );
}
