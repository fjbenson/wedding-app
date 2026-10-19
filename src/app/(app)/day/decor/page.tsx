import Link from "next/link";
import { redirect } from "next/navigation";
import { listAreas } from "@/lib/db/areas";
import { listDecor } from "@/lib/db/decor";
import { getCurrentWedding } from "@/lib/db/weddings";
import { isDecorArea } from "@/lib/decor";
import { decorPeople } from "../../decor/decor-people";
import { PackList } from "../../decor/decor-things";

export const metadata = { title: "Decor — The Day — Wedding App" };

/**
 * The Day › Decor: every decor thing as the day's pack list — before the
 * day, set up at the venue, after the day (canvas 3 "Decor · Round 2", 3,
 * owner's pick 19 Oct 2026). The same things as the Decor area's page.
 */
export default async function DayDecorPage() {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const [items, people, areas] = await Promise.all([listDecor(wedding.id), decorPeople(wedding.id), listAreas(wedding.id)]);
  const decorArea = areas?.find((a) => isDecorArea(a.key) && a.enabled);

  return (
    <main className="page pb-40 lg:max-w-3xl lg:pb-16">
      {/* A piece of The Day: the pill back, no back arrow (canvas 3 "The Day · Round 2"). */}
      <Link href="/day" className="inline-flex h-8 items-center rounded-full bg-cream px-3 text-[13px] text-stone hover:text-ink">
        The Day ›
      </Link>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h1 className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">Decor</h1>
        {decorArea && (
          <Link href={`/area/${decorArea.key}`} className="text-[14px] text-champagne-600 hover:text-ink">
            Decor page ›
          </Link>
        )}
      </div>
      <PackList items={items} people={people} weddingDate={wedding.wedding_date} />
    </main>
  );
}
