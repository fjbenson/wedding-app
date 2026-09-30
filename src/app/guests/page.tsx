import { redirect } from "next/navigation";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import AppShell from "@/components/app-shell";
import GuestList from "./guest-list";

export const metadata = { title: "Guests — Wedding App" };

export default async function GuestsPage() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const [guests, households] = await Promise.all([
    listGuests(wedding.id),
    listHouseholds(wedding.id),
  ]);

  return (
    <AppShell current="/guests" wedding={wedding}>
      <GuestList guests={guests} households={households} />
    </AppShell>
  );
}
