import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listGuests } from "@/lib/db/contacts";
import { listRsvps } from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveTransportRunAction } from "../../actions";
import { TransportForm } from "../../day-forms";

export const metadata = { title: "New journey — Wedding App" };

export default async function NewTransportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail } = await searchParams;
  const [guests, rsvps] = await Promise.all([listGuests(wedding.id), listRsvps(wedding.id)]);
  // Everyone except those who've said no to everything, as Travel lists them.
  const coming = guests.filter((g) => {
    const theirs = rsvps.filter((r) => r.contact_id === g.id);
    return theirs.length === 0 || theirs.some((r) => r.status !== "declined");
  });
  return (
    <FormPage backHref="/day?tab=travel" backLabel="Travel" title="New journey" error={error} detail={detail}>
      <TransportForm
        action={saveTransportRunAction.bind(null, null)}
        guests={coming
          .map((g) => ({ id: g.id, name: [g.first_name, g.last_name].filter(Boolean).join(" ") }))
          .sort((a, b) => a.name.localeCompare(b.name))}
      />
    </FormPage>
  );
}
