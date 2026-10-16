import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { SubmitBar } from "@/components/form-bits";
import { Part } from "@/components/visual-form";
import { listGuests } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveNewGroupAction } from "../../group-actions";
import PeoplePicker from "../../people-picker";
import { fullName } from "../../guest-table";
import GroupName from "./group-name";

export const metadata = { title: "New group — Wedding App" };

/**
 * A new group of guests on its own screen (owner, 16 Oct 2026: adding gets a
 * full screen): its name large, then who's in it. A guest can be in any
 * number of groups, so picking someone never takes them out of another.
 */
export default async function NewGroupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const guests = await listGuests(wedding.id);

  return (
    <FormPage backHref="/people" backLabel="People" title="New group" error={error}>
      <form action={saveNewGroupAction}>
        <GroupName />
        <Part label="Who's in it">
          <PeoplePicker people={guests.map((g) => ({ id: g.id, name: fullName(g) }))} />
        </Part>
        <SubmitBar label="Add the group" />
      </form>
    </FormPage>
  );
}
