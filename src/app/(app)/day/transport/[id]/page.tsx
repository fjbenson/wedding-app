import { notFound } from "next/navigation";
import FormPage from "@/components/form-page";
import { RemoveButton } from "@/components/form-bits";
import { getTransportRun } from "@/lib/db/day";
import { deleteTransportRunAction, saveTransportRunAction } from "../../actions";
import { TransportForm } from "../../day-forms";

export const metadata = { title: "Transport — Wedding App" };

export default async function TransportRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Row-level security returns nothing from another wedding.
  const run = await getTransportRun(id);
  if (!run) notFound();

  return (
    <FormPage backHref="/day?tab=transport" backLabel="The Day" title={run.vehicle} error={error} detail={detail}>
      <TransportForm action={saveTransportRunAction.bind(null, run.id)} run={run} />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton action={deleteTransportRunAction.bind(null, run.id)} label="Remove this run" question={`Remove ${run.vehicle}?`} />
      </div>
    </FormPage>
  );
}
