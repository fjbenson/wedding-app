import { redirect } from "next/navigation";
import FormPage from "@/components/form-page";
import { getCurrentWedding } from "@/lib/db/weddings";
import { decorPeople } from "../decor-people";
import DecorForm from "../decor-form";

export const metadata = { title: "New thing — Wedding App" };

/** A new decor thing on its own screen (adding is a full screen). */
export default async function NewDecorPage({
  searchParams,
}: {
  searchParams: Promise<{ back?: string; place?: string; error?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { back, place, error } = await searchParams;
  const safeBack = back && /^\/(area\/[\w-]+|day\/decor)$/.test(back) ? back : "/day/decor";
  const people = await decorPeople(wedding.id);
  return (
    <FormPage backHref={safeBack} backLabel={safeBack.startsWith("/area/") ? "Decor" : "The Day"} title="New thing" error={error}>
      <DecorForm people={people} back={safeBack} place={place ?? ""} weddingDate={wedding.wedding_date} />
    </FormPage>
  );
}
