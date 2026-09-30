import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { areaOptions, supplierCategories } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveSupplierAction } from "../../supplier-actions";
import SupplierForm from "../../supplier-form";

export const metadata = { title: "Add a supplier — Wedding App" };

export default async function NewSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; category?: string }>;
}) {
  const { error, detail, category } = await searchParams;
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const categories = supplierCategories(areaOptions(await listAreas(wedding.id)));
  const fromArea = categories.some((c) => c.key === category) ? category : undefined;

  return (
    <FormPage
      backHref={fromArea ? `/area/${fromArea}` : "/people?tab=suppliers"}
      backLabel={fromArea ? (categories.find((c) => c.key === fromArea)?.label ?? "Back") : "Suppliers"}
      title="Add a supplier"
      error={error}
      detail={detail}
    >
      <SupplierForm
        action={saveSupplierAction.bind(null, null)}
        categories={categories}
        defaultCategory={fromArea}
      />
    </FormPage>
  );
}
