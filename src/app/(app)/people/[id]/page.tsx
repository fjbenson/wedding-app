import { notFound, redirect } from "next/navigation";
import { getContact } from "@/lib/db/contacts";
import { getSupplier } from "@/lib/db/suppliers";
import { listAreas } from "@/lib/db/areas";
import { areaOptions, supplierCategories } from "@/lib/areas";
import { deleteSupplierAction, saveSupplierAction } from "../supplier-actions";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import SupplierForm from "../supplier-form";

export const metadata = { title: "People — Wedding App" };

/** One supplier's details (screen 13). A guest's link opens their card in the list. */
export default async function EditPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;

  // A mangled link isn't an id at all, and the database would reject it.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for someone from another wedding.
  const person = await getContact(id);
  if (!person) notFound();

  const name = [person.first_name, person.last_name].filter(Boolean).join(" ");

  if (person.contact_type === "supplier") {
    const supplier = await getSupplier(id);
    if (!supplier) notFound();
    const title = supplier.supplier_details?.company_name ?? name;
    const categories = supplierCategories(areaOptions(await listAreas(person.wedding_id)));

    return (
      <FormPage backHref="/people?tab=suppliers" backLabel="Suppliers" title={title} error={error} detail={detail}>
        <SupplierForm action={saveSupplierAction.bind(null, supplier.id)} supplier={supplier} categories={categories} />
        <div className="mt-6 border-t border-linen pt-4">
          <RemoveButton
            action={deleteSupplierAction.bind(null, supplier.id)}
            label="Remove this supplier"
            question={`Remove ${title}?`}
          />
        </div>
      </FormPage>
    );
  }

  // A guest is edited on their card in the list now (owner's call, 9 Oct
  // 2026), so an old link to here opens that card instead.
  redirect(`/people?guest=${person.id}`);
}
