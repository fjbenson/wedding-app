import { redirect } from "next/navigation";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listAreas } from "@/lib/db/areas";
import { listMenu } from "@/lib/db/menu";
import { formatLongDate } from "@/lib/dates";
import { coupleName } from "@/lib/couple-name";
import MenuEditor from "./menu-editor";

export const metadata = { title: "The menu — Wedding App" };

/** The menu as a printed card (canvas 3 "Food & drink · Round 1", A, owner 18 Oct 2026). One menu for everyone. */
export default async function MenuPage() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const [courses, areas] = await Promise.all([listMenu(wedding.id), listAreas(wedding.id)]);
  const food = areas?.find((a) => a.key === "food" || a.key === "catering");
  return (
    <MenuEditor
      courses={courses}
      couple={coupleName(wedding.name)}
      date={wedding.wedding_date ? formatLongDate(wedding.wedding_date) : null}
      areaHref={food ? `/area/${food.key}` : "/"}
      areaLabel={food?.label ?? "Home"}
    />
  );
}
