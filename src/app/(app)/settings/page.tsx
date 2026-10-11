import { redirect } from "next/navigation";
import { getLogin } from "@/lib/db/auth";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding, listMembers } from "@/lib/db/weddings";
import SettingsView from "./settings-view";

export const metadata = { title: "Settings — Wedding App" };

/** Settings (screen 37). The display is in settings-view.tsx. */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { saved, error, detail } = await searchParams;

  const [login, areas, members] = await Promise.all([
    getLogin(),
    listAreas(wedding.id),
    listMembers(wedding.id),
  ]);

  return (
    <SettingsView
      wedding={wedding}
      areas={areas ?? []}
      members={members}
      login={login}
      saved={saved}
      error={error}
      detail={detail}
    />
  );
}
