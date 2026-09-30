import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { Field, SubmitButton } from "@/components/form-bits";
import { INPUT } from "@/components/form-styles";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveBudgetsAction } from "../actions";

export const metadata = { title: "Budget — Wedding App" };

const MONEY = `${INPUT.replace("mt-2 ", "")} pl-8`;

function Pounds({ name, value, label }: { name: string; value?: number | null; label: string }) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone">£</span>
      <input name={name} aria-label={label} inputMode="decimal" defaultValue={value ?? ""} placeholder="0" className={MONEY} />
    </span>
  );
}

/** The whole budget, and each area's share of it. Any of them can be left blank. */
export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail } = await searchParams;
  const areas = ((await listAreas(wedding.id)) ?? []).filter((a) => a.enabled);

  return (
    <FormPage backHref="/money" backLabel="Money" title="Budgets" error={error} detail={detail}>
      <form action={saveBudgetsAction} className="space-y-8">
        <Field label="The whole wedding">
          <span className="mt-2 block">
            <Pounds name="total" value={wedding.budget} label="The whole wedding" />
          </span>
        </Field>

        {areas.length > 0 && (
          <fieldset>
            <legend className="text-sm text-ink">
              By area <span className="text-stone">(optional — leave any blank)</span>
            </legend>
            <div className="mt-3 divide-y divide-linen">
              {areas.map((a) => (
                <label key={a.id} className="flex items-center gap-4 py-2">
                  <span className="flex-1 text-[15px] text-ink">{a.label}</span>
                  <span className="w-36 shrink-0">
                    <Pounds name={`area-${a.id}`} value={a.budget} label={`${a.label} budget`} />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <SubmitButton label="Save budgets" />
      </form>
    </FormPage>
  );
}
