import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listMilestones } from "@/lib/db/milestones";
import { STARTER_AREAS } from "@/lib/areas";
import Cover from "@/components/cover";
import ThisMonth from "@/components/this-month";

export default async function HomePage() {
  const supabase = await createClient();
  // getClaims reads the signed-in user from the session cookie, checking its
  // signature here rather than asking Supabase — one less trip per visit.
  const [{ data: auth }, wedding] = await Promise.all([
    supabase.auth.getClaims(),
    getCurrentWedding(),
  ]);
  const email = auth?.claims?.email as string | undefined;

  // First visit: the setup screens make the wedding and choose its areas.
  if (!wedding) redirect("/setup");

  const [milestones, areas] = await Promise.all([
    listMilestones(wedding.id),
    listAreas(wedding.id),
  ]);
  // Empty: made before setup had an areas step, so send them to finish it.
  // null: the database hasn't got the areas table yet, so show the starter set.
  if (areas && areas.length === 0) redirect("/setup");
  const onHub = areas ? areas.filter((a) => a.enabled && a.show_on_hub) : STARTER_AREAS;

  // Phone: the cover runs edge to edge, the list sits under it.
  // Desktop: the cover is a panel filling the screen's height, with the
  // list in a column beside it.
  return (
    <main className="min-h-dvh pb-28 lg:grid lg:pb-8 lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-8 lg:p-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Cover name={wedding.name} weddingDate={wedding.wedding_date} areas={onHub} />
      <div className="mx-auto max-w-lg md:max-w-2xl lg:mx-0 lg:max-w-none lg:overflow-y-auto lg:pt-6">
        <ThisMonth
          milestones={milestones}
          hasDate={wedding.wedding_date !== null}
          areaCount={onHub.length}
        />
        {/* No sign out while visitors are anonymous — signing out would lose the wedding. */}
        {email && <SignedIn email={email} />}
      </div>
    </main>
  );
}

/** Who's signed in, and the way out — quietly, at the foot of the page. */
function SignedIn({ email }: { email: string }) {
  return (
    <form action="/auth/sign-out" method="post" className="mt-10 text-center text-xs text-stone">
      {email} ·{" "}
      <button type="submit" className="underline underline-offset-4 hover:text-ink">
        Sign out
      </button>
    </form>
  );
}
