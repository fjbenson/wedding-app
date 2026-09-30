import FormPage from "@/components/form-page";
import { saveTransportRunAction } from "../../actions";
import { TransportForm } from "../../day-forms";

export const metadata = { title: "Add transport — Wedding App" };

export default async function NewTransportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;
  return (
    <FormPage backHref="/day?tab=transport" backLabel="The Day" title="Add a car or coach" error={error} detail={detail}>
      <TransportForm action={saveTransportRunAction.bind(null, null)} />
    </FormPage>
  );
}
