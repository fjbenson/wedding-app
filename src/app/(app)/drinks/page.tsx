import { redirect } from "next/navigation";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listAreas } from "@/lib/db/areas";
import { listDrinks } from "@/lib/db/menu";
import DrinksEditor from "./drinks-editor";

export const metadata = { title: "Drinks — Wedding App" };

/** Every drink through the day, with how much and who is supplying it (canvas 3 "Food & drink · Round 1", C). */
export default async function DrinksPage() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const [drinks, areas] = await Promise.all([listDrinks(wedding.id), listAreas(wedding.id)]);
  const food = areas?.find((a) => a.key === "food" || a.key === "catering");
  return <DrinksEditor drinks={drinks} areaHref={food ? `/area/${food.key}` : "/"} areaLabel={food?.label ?? "Home"} />;
}
