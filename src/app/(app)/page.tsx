import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/db/appointments";
import { listAreas } from "@/lib/db/areas";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { countInspo } from "@/lib/db/inspo";
import { listNotes } from "@/lib/db/notes";
import { toSort } from "@/lib/notes";
import { STARTER_AREAS } from "@/lib/areas";
import Cover from "@/components/cover";
import JotSheet from "@/components/jot-sheet";
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

  const [milestones, areas, appointments, payments, unfiled, inspo] = await Promise.all([
    listMilestones(wedding.id),
    listAreas(wedding.id),
    listAppointments(wedding.id),
    listPayments(wedding.id),
    listNotes(wedding.id, { area: null }),
    countInspo(wedding.id),
  ]);
  const toSortCount = (unfiled ?? []).filter(toSort).length;
  const ideas = inspo ? [...inspo.values()].reduce((a, b) => a + b, 0) : 0;
  // Empty: made before setup had an areas step, so send them to finish it.
  // null: the database hasn't got the areas table yet, so show the starter set.
  if (areas && areas.length === 0) redirect("/setup");
  const onHub = areas ? areas.filter((a) => a.enabled && a.show_on_hub) : STARTER_AREAS.map(({ key, label }) => ({ key, label }));

  // Under the ring (canvas 2, "Home · Round 2 · Calm under the ring",
  // option B, owner's pick 13 Oct 2026): a small "Jot something down" pill
  // that brings up the jot sheet, your top three on one glass card, then
  // Your notes and Inspo as two quiet lines.
  // Phone: the names and ring, then those under them.
  // Desktop: the ring fills the left, with those in a column beside it.
  return (
    <main className="relative min-h-dvh overflow-hidden pb-28 lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-8 lg:p-8 lg:pb-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Cover name={wedding.name} weddingDate={wedding.wedding_date} areas={onHub} />
      <div className="relative mx-auto mt-2 max-w-lg md:max-w-2xl lg:mx-0 lg:mt-0 lg:max-w-none lg:overflow-y-auto lg:pt-6">
        {/* null: 0008_notes.sql hasn't been run, so there's nowhere to save a note yet. */}
        {unfiled && (
          <div className="mb-6 flex justify-center">
            <JotSheet />
          </div>
        )}
        <ThisMonth
          milestones={milestones}
          appointments={appointments ?? []}
          payments={payments ?? []}
          hasDate={wedding.wedding_date !== null}
        />
        <nav aria-label="More" className="relative mx-5 mt-4 lg:mx-0">
          {unfiled && (
            <QuietLine href="/inbox" label="Your notes" detail={toSortCount ? `${toSortCount} to sort` : "All sorted"} />
          )}
          {/* Inspo is reached from the Hub, not a tab of its own (the plan). */}
          <QuietLine href="/inspo" label="Inspo" detail={ideas ? `${ideas} ${ideas === 1 ? "idea" : "ideas"}` : "Ideas you’ve saved"} last />
        </nav>
        {email && <SignedIn email={email} />}
      </div>
    </main>
  );
}

/** Your notes and Inspo under the top three: a plain line each, no card. */
function QuietLine({ href, label, detail, last = false }: { href: string; label: string; detail: string; last?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-12 items-center gap-3 px-1.5 py-3 text-[15px] text-ink ${last ? "" : "border-b border-linen"}`}
    >
      <span className="flex-1">
        {label} <span className="text-stone">· {detail}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
    </Link>
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
