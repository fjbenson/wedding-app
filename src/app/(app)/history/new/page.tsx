import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { getArea } from "@/lib/db/areas";
import { getContact, getHousehold } from "@/lib/db/contacts";
import { getSupplier } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { parseScope } from "../actions";
import EntryForm from "../entry-form";

export const metadata = { title: "Add to history — Wedding App" };

/**
 * Add to history (canvas 3 "History · Round 2", 3): a call, a meeting, an
 * email, a message or a note with a supplier, guest, household or area —
 * what was said, and any to-dos that came out of it. A full screen, like all
 * adding.
 */
export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; back?: string; error?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const params = await searchParams;
  const scope = await parseScope(params.with ?? "");
  const back = params.back?.startsWith("/") && !params.back.startsWith("//") ? params.back : "/";
  if (!scope) redirect(back);

  // Who it's with, for the back link and the line under the form; the
  // area a to-do from it goes under.
  let name = "";
  let area: string | null = null;
  if ("supplier" in scope) {
    const s = await getSupplier(scope.supplier);
    name = s?.supplier_details?.company_name ?? s?.first_name ?? "";
    area = s?.supplier_details?.category ?? null;
  } else if ("guest" in scope) {
    const g = await getContact(scope.guest);
    name = [g?.first_name, g?.last_name].filter(Boolean).join(" ");
  } else if ("household" in scope) {
    name = (await getHousehold(scope.household))?.name ?? "";
  } else {
    name = (await getArea(wedding.id, scope.area))?.label ?? scope.area;
    area = scope.area;
  }
  if (!name) redirect(back);

  const self = `/history/new?with=${encodeURIComponent(params.with ?? "")}&back=${encodeURIComponent(back)}`;
  return (
    <FormPage backHref={back} backLabel={name} title="Add to history" error={params.error}>
      <EntryForm with={params.with ?? ""} back={back} self={self} name={name} area={area} weddingDate={wedding.wedding_date} />
    </FormPage>
  );
}
