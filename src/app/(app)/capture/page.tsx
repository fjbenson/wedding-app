import Link from "next/link";
import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { Field, SubmitButton } from "@/components/form-bits";
import { INPUT } from "@/components/form-styles";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { captureAction } from "./actions";

export const metadata = { title: "Capture — Wedding App" };

/**
 * Quick capture (screen 35): get an idea down in four seconds without
 * deciding where it goes. Left unfiled, it waits in the inbox.
 */
export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; area?: string; from?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { error, detail, area, from } = await searchParams;
  const areas = areaOptions(await listAreas(wedding.id));
  const back = from && from.startsWith("/") && !from.startsWith("//") ? from : "/";

  return (
    <FormPage backHref={back} backLabel="Back" title="Capture something" error={error} detail={detail}>
      <form action={captureAction} className="space-y-5">
        <input type="hidden" name="return_to" value={back} />
        <label className="block">
          <span className="sr-only">What&apos;s on your mind?</span>
          <textarea
            name="body"
            rows={5}
            autoFocus
            placeholder="What's on your mind? An idea, a name, something someone said…"
            className={`${INPUT} mt-0 text-[16px] leading-relaxed`}
          />
        </label>

        <Field label="A link" hint="optional">
          <input name="url" inputMode="url" placeholder="Paste a link — Pinterest, a supplier, a recipe" className={INPUT} />
        </Field>

        <Field label="File it under" hint="or leave it for later">
          <select name="area" defaultValue={areas.some((a) => a.key === area) ? area : ""} className={INPUT}>
            <option value="">Leave it in the inbox</option>
            {areas.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>

        <SubmitButton label="Save" />
      </form>

      <Link href="/inbox" className="mt-6 block text-center text-sm text-stone underline underline-offset-4 hover:text-ink">
        See the inbox
      </Link>
    </FormPage>
  );
}
