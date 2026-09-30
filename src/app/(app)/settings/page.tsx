import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const [{ data: auth }, areas, members] = await Promise.all([
    supabase.auth.getClaims(),
    listAreas(wedding.id),
    listMembers(wedding.id),
  ]);

  return (
    <SettingsView
      wedding={wedding}
      areas={areas ?? []}
      members={members}
      currentUserId={auth?.claims?.sub ?? null}
      saved={saved}
      error={error}
      detail={detail}
    />
  );
}
