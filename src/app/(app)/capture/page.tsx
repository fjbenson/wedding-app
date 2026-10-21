import Link from "next/link";
import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { captureAction } from "./actions";
import CaptureForm from "./capture-form";

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
    <FormPage backHref={back} backLabel="Back" title="Jot a note" error={error} detail={detail}>
      <CaptureForm
        action={captureAction}
        areas={areas}
        defaultArea={areas.some((a) => a.key === area) ? area : undefined}
        returnTo={back}
      />

      <div className="mt-6 flex justify-center gap-6 text-sm">
        <Link href={`/inspo/new?from=${encodeURIComponent(back)}`} className="text-stone underline underline-offset-4 hover:text-ink">
          Save a picture instead
        </Link>
        <Link href="/inbox" className="text-stone underline underline-offset-4 hover:text-ink">
          See your notes
        </Link>
      </div>
    </FormPage>
  );
}
