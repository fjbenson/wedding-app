import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { moneyByArea, moneyFor, paymentArea, unscheduledBalances } from "@/lib/budget";
import { listAreas } from "@/lib/db/areas";
import { listPayments } from "@/lib/db/money";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import MoneyView from "./money-view";

export const metadata = { title: "Money — Wedding App" };

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tab?: string; area?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { view, tab, area, error, detail } = await searchParams;

  const [areaRows, allSuppliers, found] = await Promise.all([
    listAreas(wedding.id),
    listSuppliers(wedding.id),
    listPayments(wedding.id),
  ]);
  const allPayments = found ?? [];
  const areas = areaOptions(areaRows).map((a) => ({ ...a, budget: areaRows?.find((r) => r.key === a.key)?.budget ?? null }));
  // The area filter (`?area=<key>`, or `none` for Other): the same money,
  // narrowed to one area, so an area page's "In Money ›" lands on just it.
  const filter = area || null;
  const inArea = (key: string | null) =>
    filter === null ? true : filter === "none" ? !key || key === "other" || !areas.some((a) => a.key === key) : key === filter;
  const shownSuppliers = allSuppliers.filter((s) => inArea(s.supplier_details?.category ?? null));
  const payments = allPayments.filter((p) => inArea(paymentArea(p, allSuppliers)));
  const picked = filter && filter !== "none" ? areas.find((a) => a.key === filter) : null;
  const name = (s: (typeof allSuppliers)[number]) =>
    s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");

  return (
    <MoneyView
      // ?tab=payments is the old link to what is now By month.
      view={view === "month" || tab === "payments" ? "month" : "area"}
      weddingDate={wedding.wedding_date}
      total={moneyFor(undefined, shownSuppliers, payments, filter === null ? (wedding.budget ?? null) : (picked?.budget ?? null))}
      byArea={moneyByArea(areas, allSuppliers, allPayments).filter((a) => filter === null || (filter === "none" ? a.key === "" : a.key === filter))}
      payments={payments}
      suppliers={allSuppliers.map((s) => ({ id: s.id, name: name(s) }))}
      areas={areas}
      area={filter}
      scope={filter === null ? null : filter === "none" ? "Other" : (picked?.label ?? filter)}
      balances={unscheduledBalances(shownSuppliers, payments).map((b) => ({
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
