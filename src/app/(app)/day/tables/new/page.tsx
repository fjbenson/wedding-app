import FormPage from "@/components/form-page";
import TableForm from "./table-form";

export const metadata = { title: "Add a table — Wedding App" };

/** Seating's black +: a table on its own full screen, like every other add (owner, 17 Oct 2026). */
export default async function NewTablePage({ searchParams }: { searchParams: Promise<{ error?: string; detail?: string }> }) {
  const { error, detail } = await searchParams;
  return (
    <FormPage backHref="/day?tab=seating" backLabel="Seating" title="New table" error={error} detail={detail}>
      <TableForm />
    </FormPage>
  );
}
