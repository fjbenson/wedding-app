import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { countInspo, listInspo } from "@/lib/db/inspo";
import { getCurrentWedding } from "@/lib/db/weddings";
import InspoView from "./inspo-view";

export const metadata = { title: "Inspo — Wedding App" };

/** Inspo (screens 29, 30, 33). `?folder=<area key>` or `?folder=unsorted`. */
export default async function InspoPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { folder: raw, error, detail } = await searchParams;
  const folder = raw === undefined ? undefined : raw === "unsorted" ? null : raw;

  const [items, counts, areaRows] = await Promise.all([
    listInspo(wedding.id, { folder }),
    countInspo(wedding.id),
    listAreas(wedding.id),
  ]);

  return (
    <InspoView
      items={items ?? []}
      areas={areaOptions(areaRows)}
      counts={counts ?? new Map()}
      folder={folder}
      ready={items !== null}
      error={error}
      detail={detail}
    />
  );
}
