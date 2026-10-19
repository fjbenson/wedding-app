import { listGuests } from "@/lib/db/contacts";
import { listSuppliers } from "@/lib/db/suppliers";

export interface DecorPerson {
  id: string;
  name: string;
  kind: "guest" | "supplier";
}

/**
 * Who can lend a thing or set it up: the wedding's own guests and suppliers
 * (owner, 19 Oct 2026). Names only — nothing else about them is needed here.
 */
export async function decorPeople(weddingId: string): Promise<DecorPerson[]> {
  const [guests, suppliers] = await Promise.all([listGuests(weddingId), listSuppliers(weddingId)]);
  const name = (c: { first_name: string; last_name: string | null }) => [c.first_name, c.last_name].filter(Boolean).join(" ");
  return [
    ...guests.map((g) => ({ id: g.id, name: name(g), kind: "guest" as const })),
    ...suppliers.map((s) => ({ id: s.id, name: s.supplier_details?.company_name || name(s), kind: "supplier" as const })),
  ].sort((a, b) => a.name.localeCompare(b.name));
}
