import { redirect } from "next/navigation";
import { listHouseholds } from "@/lib/db/contacts";
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

  const households = await listHouseholds(wedding.id);

  return (
    <FormPage backHref="/people" backLabel="People" title="Add a guest" error={error} detail={detail}>
      <GuestForm
        action={saveGuestAction.bind(null, null)}
        households={households}
        defaultHousehold={households.some((h) => h.id === household) ? household : undefined}
      />
    </FormPage>
  );
}
