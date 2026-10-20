import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { getDay } from "@/lib/db/day";
import { listGroups } from "@/lib/db/groups";
import { getCurrentWedding } from "@/lib/db/weddings";
import { formatClock } from "@/lib/dates";
import { createRunSheetAction } from "../../actions";
import SheetForm from "../../sheet-form";

export const metadata = { title: "New run sheet — Wedding App" };

/** A run sheet besides the main one, on its own full screen (canvas 3 "Run sheets · Round 1"). */
export default async function NewRunSheetPage({ searchParams }: { searchParams: Promise<{ error?: string; detail?: string }> }) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail } = await searchParams;
  const [groups, day] = await Promise.all([listGroups(wedding.id), getDay(wedding.id)]);
  const main = (day?.runSheet ?? []).filter((i) => !i.sheet_id);
  return (
    <FormPage backHref="/day" backLabel="The Day" title="New run sheet" error={error} detail={detail}>
      <SheetForm
        action={createRunSheetAction}
        groups={groups.map((g) => ({ id: g.id, name: g.name, count: g.members.length }))}
        moments={main.map((m) => ({ id: m.id, time: formatClock(m.at_time), title: m.title }))}
      />
    </FormPage>
  );
}
