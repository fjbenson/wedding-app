import { notFound } from "next/navigation";
import { RemoveButton } from "@/components/form-bits";
import FormPage from "@/components/form-page";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getMilestone } from "@/lib/db/milestones";
import { deleteMilestoneAction, saveMilestoneAction } from "../actions";
import MilestoneForm from "../milestone-form";

export const metadata = { title: "To-do — Wedding App" };

export default async function EditMilestonePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { error, detail } = await searchParams;

  // A mangled link isn't an id at all, and the database would reject it.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for someone else's milestone.
  const milestone = await getMilestone(id);
  if (!milestone) notFound();
  const areas = areaOptions(await listAreas(milestone.wedding_id));

  return (
    <FormPage
      backHref="/plan"
      backLabel="Plan"
      title={milestone.title}
      error={error}
      detail={detail}
    >
      <MilestoneForm action={saveMilestoneAction.bind(null, milestone.id)} milestone={milestone} areas={areas} />
      <div className="mt-6 border-t border-linen pt-4">
        <RemoveButton
          action={deleteMilestoneAction.bind(null, milestone.id)}
          label="Remove from the plan"
          question={`Remove "${milestone.title}" from the plan?`}
        />
      </div>
    </FormPage>
  );
}
