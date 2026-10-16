import { notFound, redirect } from "next/navigation";

export const metadata = { title: "Household — Wedding App" };

/**
 * An old link to a household. Since 16 Oct 2026 a household opens as a card
 * over the guest list, like a guest's (household-view.tsx), so this opens it there.
 */
export default async function HouseholdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  redirect(`/people?household=${id}`);
}
