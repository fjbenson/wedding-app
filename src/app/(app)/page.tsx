import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Images } from "lucide-react";
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

  // Phone: the names and ring, then the list under them.
  // Desktop: the ring fills the left, with the list in a column beside it.
  return (
    <main className="relative min-h-dvh overflow-hidden pb-28 lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-8 lg:p-8 lg:pb-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      {/* The satin is behind every screen (globals.css); these soft glows
          give the glass cards more to blur. On a phone the lower two follow the cards, so
          they stay behind them however tall the ring is. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-16 h-56 w-56 rounded-full bg-[#E6D2B4] opacity-70 blur-[60px]" />
        <div className="absolute right-[260px] top-[120px] hidden h-64 w-64 rounded-full bg-[#E2C9A0] blur-[50px] lg:block" />
        <div className="absolute -right-16 top-[420px] hidden h-60 w-60 rounded-full bg-[#EED8C0] blur-[50px] lg:block" />
      </div>

      <Cover name={wedding.name} weddingDate={wedding.wedding_date} areas={onHub} />
      <div className="relative mx-auto mt-2 max-w-lg md:max-w-2xl lg:mx-0 lg:mt-0 lg:max-w-none lg:overflow-y-auto lg:pt-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -left-[70px] -top-6 h-64 w-64 rounded-full bg-[#E2C9A0] blur-[50px]" />
          <div className="absolute -right-[60px] top-16 h-60 w-60 rounded-full bg-[#EED8C0] blur-[50px]" />
        </div>
        <ThisMonth milestones={milestones} hasDate={wedding.wedding_date !== null} />
        {/* Inspo is reached from the Hub, not a tab of its own (the plan). */}
        <Link
          href="/inspo"
          className="glass-card relative mx-5 mt-4 flex items-center gap-3 rounded-[22px] px-5 py-4 hover:border-champagne-400 lg:mx-0"
        >
          <Images className="h-5 w-5 shrink-0 text-champagne-600" strokeWidth={1.5} aria-hidden />
          <span className="flex-1">
            <span className="block font-display text-[19px] leading-tight text-ink">Inspo</span>
            <span className="mt-1 block text-xs font-medium uppercase tracking-[0.2em] text-stone">Ideas you&apos;ve saved</span>
          </span>
          <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
        </Link>
        {/* No sign out while visitors are anonymous — signing out would lose the wedding. */}
        {email && <SignedIn email={email} />}
      </div>
    </main>
  );
}

/** Who's signed in, and the way out — quietly, at the foot of the page. */
function SignedIn({ email }: { email: string }) {
  return (
    <form action="/auth/sign-out" method="post" className="relative mt-10 text-center text-xs text-stone">
      {email} ·{" "}
      <button type="submit" className="underline underline-offset-4 hover:text-ink">
        Sign out
      </button>
    </form>
  );
}
