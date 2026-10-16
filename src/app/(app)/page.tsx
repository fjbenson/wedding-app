import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/db/appointments";
import { listAreas } from "@/lib/db/areas";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { countInspo, listInspo } from "@/lib/db/inspo";
import { listNotes } from "@/lib/db/notes";
import { toSort } from "@/lib/notes";
import { areaOptions, STARTER_AREAS } from "@/lib/areas";
import Cover from "@/components/cover";
import HubTiles from "@/components/hub-tiles";
import AssistantSheet from "@/components/assistant/assistant-sheet";
import { formatDayMonth } from "@/lib/dates";
import ThisWeek from "@/components/this-week";

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

  const [milestones, areas, suppliers, appointments, payments, unfiled, inspo, latestInspo] = await Promise.all([
    listMilestones(wedding.id),
    listAreas(wedding.id),
    listSuppliers(wedding.id),
    listAppointments(wedding.id),
    listPayments(wedding.id),
    listNotes(wedding.id, { area: null }),
    countInspo(wedding.id),
    listInspo(wedding.id, { limit: 4 }),
  ]);
  const sortable = (unfiled ?? []).filter(toSort);
  const toSortCount = sortable.length;
  const ideas = inspo ? [...inspo.values()].reduce((a, b) => a + b, 0) : 0;
  // Empty: made before setup had an areas step, so send them to finish it.
  // null: the database hasn't got the areas table yet, so show the starter set.
  if (areas && areas.length === 0) redirect("/setup");
  const onHub = areas ? areas.filter((a) => a.enabled && a.show_on_hub) : STARTER_AREAS.map(({ key, label }) => ({ key, label }));

  // Under the ring (canvas 2, "Home · Round 2 · Calm under the ring",
  // option B, owner's pick 13 Oct 2026): a small pill — "Jot or ask…" since
  // Your assistant (13 Oct 2026) — that brings up its panel, This week on one glass card (in place of
  // the top three, owner, 13 Oct 2026), then Your notes and Inspo as two
  // tiles side by side ("Home · Round 3", option A).
  // Phone: the names and ring, then those under them.
  // Desktop: the ring fills the left, with those in a column beside it.
  return (
    <main className="relative min-h-dvh overflow-hidden pb-28 lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-8 lg:p-8 lg:pb-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Cover name={wedding.name} weddingDate={wedding.wedding_date} areas={onHub} />
      <div className="relative mx-auto mt-2 max-w-lg md:max-w-2xl lg:mx-0 lg:mt-0 lg:max-w-none lg:overflow-y-auto lg:pt-6">
        {/* null: 0008_notes.sql hasn't been run, so there's nowhere to save a note yet. */}
        {unfiled && (
          <div className="mb-6 flex justify-center">
            <AssistantSheet
              variant="hub"
              subtitle={[wedding.name, wedding.wedding_date && `${formatDayMonth(wedding.wedding_date)} ${wedding.wedding_date.slice(0, 4)}`]
                .filter(Boolean)
                .join(" · ")}
            />
          </div>
        )}
        <ThisWeek
          milestones={milestones}
          appointments={appointments ?? []}
          payments={payments ?? []}
          hasDate={wedding.wedding_date !== null}
          areas={areaOptions(areas)}
          suppliers={suppliers.map((s) => ({
            id: s.id,
            name: s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" "),
            area: s.supplier_details?.category ?? null,
          }))}
        />
        <HubTiles
          note={unfiled === null ? undefined : (sortable[0] ?? unfiled[0] ?? null)}
          toSort={toSortCount}
          pictures={(latestInspo ?? []).map((i) => i.picture)}
          ideas={ideas}
        />
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
