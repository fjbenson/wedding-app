import { redirect } from "next/navigation";
import { listHouseholds } from "@/lib/db/contacts";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { ownNeeds } from "@/lib/dietary";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveGuestAction } from "../actions";
import FormPage from "@/components/form-page";
import GuestForm from "../guest-form";

export const metadata = { title: "Add a guest — Wedding App" };

export default async function NewGuestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; household?: string }>;
}) {
  const { error, detail, household } = await searchParams;
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const [households, events, rsvps] = await Promise.all([listHouseholds(wedding.id), listEvents(wedding.id), listRsvps(wedding.id)]);

  return (
    <FormPage backHref="/people" backLabel="People" title="Add a guest" error={error} detail={detail}>
      <GuestForm
        action={saveGuestAction}
        households={households}
        events={events}
        ownNeeds={ownNeeds(rsvps.map((r) => r.dietary_notes))}
        defaultHousehold={households.some((h) => h.id === household) ? household : undefined}
      />
    </FormPage>
  );
}
