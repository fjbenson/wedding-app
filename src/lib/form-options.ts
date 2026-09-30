import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { listSuppliers } from "@/lib/db/suppliers";

/** What the payment and appointment forms offer: the wedding's suppliers and areas. */
export async function formOptions(weddingId: string) {
  const [areaRows, suppliers] = await Promise.all([listAreas(weddingId), listSuppliers(weddingId)]);
  return {
    areas: areaOptions(areaRows),
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" "),
    })),
  };
}
