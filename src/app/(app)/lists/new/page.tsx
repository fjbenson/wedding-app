import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { listAreas } from "@/lib/db/areas";
import { areaOptions } from "@/lib/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import NewListForm from "./new-list-form";

export const metadata = { title: "New list — Wedding App" };

/** A new list on its own screen (adding is a full screen): its name, its first lines, and an area if it has one. */
export default async function NewListPage({ searchParams }: { searchParams: Promise<{ back?: string; area?: string; error?: string }> }) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { back, area, error } = await searchParams;
  const safeBack = back && /^\/(inbox|area\/[\w-]+)$/.test(back) ? back : "/inbox";
  const areas = areaOptions(await listAreas(wedding.id));
  return (
    <FormPage backHref={safeBack} backLabel={safeBack === "/inbox" ? "Your notes" : "Back"} title="New list" error={error}>
      <NewListForm areas={areas} back={safeBack} area={area ?? ""} />
    </FormPage>
  );
}
