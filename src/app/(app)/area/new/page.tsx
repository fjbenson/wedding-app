import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { Field, InlineSubmit, SubmitButton } from "@/components/form-bits";
import { INPUT } from "@/components/form-styles";
import { areaIcon } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { addAreaAction, setAreaAction } from "../actions";

export const metadata = { title: "Add an area — Wedding App" };

/**
 * The + on the hub's ring (screen 7): add an area of your own, or put back
 * one that's been taken off the hub or switched off.
 */
export default async function NewAreaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail } = await searchParams;
  const hidden = ((await listAreas(wedding.id)) ?? []).filter((a) => !a.show_on_hub);

  return (
    <FormPage backHref="/" backLabel="Hub" title="Add an area" error={error} detail={detail}>
      <form action={addAreaAction} className="space-y-5">
        <Field label="What's it called?">
          <input name="label" required placeholder="e.g. Honeymoon, Fireworks, The dog" className={INPUT} />
        </Field>
        <SubmitButton label="Add to the hub" />
      </form>

      {hidden.length > 0 && (
        <section className="mt-10">
          <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">Or bring one back</h2>
          <ul>
            {hidden.map((area) => {
              const Icon = areaIcon(area.key);
              return (
                <li key={area.id} className="flex items-center gap-3 border-b border-linen py-3 last:border-b-0">
                  <Icon className="h-[18px] w-[18px] shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
                  <span className="flex-1 text-[15px] text-ink">
                    {area.label}
                    {!area.enabled && <span className="block text-xs text-stone">Not planning</span>}
                  </span>
                  <form action={setAreaAction.bind(null, area.id, area.key, "bring-back")}>
                    <InlineSubmit label="Bring back" pendingLabel="Adding…" />
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </FormPage>
  );
}
