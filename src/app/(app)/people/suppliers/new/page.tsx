import FormPage from "@/components/form-page";
import { saveSupplierAction } from "../../supplier-actions";
import SupplierForm from "../../supplier-form";

export const metadata = { title: "Add a supplier — Wedding App" };

export default async function NewSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;

  return (
    <FormPage
      backHref="/people?tab=suppliers"
      backLabel="Suppliers"
      title="Add a supplier"
      error={error}
      detail={detail}
    >
      <SupplierForm action={saveSupplierAction.bind(null, null)} />
    </FormPage>
  );
}
