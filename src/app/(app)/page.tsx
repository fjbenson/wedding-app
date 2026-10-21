import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/db/appointments";
import { listAreas } from "@/lib/db/areas";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listMilestones } from "@/lib/db/milestones";
import { listPayments } from "@/lib/db/money";
import { countInspo, listInspo } from "@/lib/db/inspo";
import { countNotes, listNotes } from "@/lib/db/notes";
import { toSort } from "@/lib/notes";
import { areaOptions, STARTER_AREAS } from "@/lib/areas";
import Cover from "@/components/cover";
import HubTiles from "@/components/hub-tiles";
import AssistantSheet from "@/components/assistant/assistant-sheet";
import { formatDayMonth } from "@/lib/dates";
import ThisWeek from "@/components/this-week";
import { involvedNames } from "@/lib/db/involved";
import { RowPeopleProvider } from "@/components/row-people";
import NeedsAPush from "@/components/needs-a-push";
import { hubStages, needsAPush } from "@/lib/hub-stages";

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

  const [milestones, areas, suppliers, appointments, payments, unfiled, inspo, latestInspo, people, areaNotes] = await Promise.all([
    listMilestones(wedding.id),
    listAreas(wedding.id),
    listSuppliers(wedding.id),
    listAppointments(wedding.id),
    listPayments(wedding.id),
    listNotes(wedding.id, { area: null }),
    countInspo(wedding.id),
    listInspo(wedding.id, { limit: 4 }),
    involvedNames(wedding.id),
    countNotes(wedding.id),
  ]);
  const sortable = (unfiled ?? []).filter(toSort);
  const toSortCount = sortable.length;
  const ideas = inspo ? [...inspo.values()].reduce((a, b) => a + b, 0) : 0;
  // Empty: made before setup had an areas step, so send them to finish it.
  // null: the database hasn't got the areas table yet, so show the starter set.
  if (areas && areas.length === 0) redirect("/setup");
  // Where each area stands, for the laptop's ring and "Needs a push" (an
  // area's ideas are its inspo and its notes together, 21 Oct 2026).
  const ideasByArea = new Map(inspo ?? []);
  for (const [k, n] of areaNotes) ideasByArea.set(k, (ideasByArea.get(k) ?? 0) + n);
  const stages = areas ? hubStages(areas, suppliers, payments ?? [], ideasByArea) : new Map();
  const pushes = areas ? needsAPush(areas, stages, suppliers, payments ?? []) : [];
  const onHub = areas
    ? areas.filter((a) => a.enabled && a.show_on_hub).map((a) => ({ ...a, stage: stages.get(a.key)?.current }))
    : STARTER_AREAS.map(({ key, label }) => ({ key, label }));

  // Under the ring (canvas 2, "Home · Round 2 · Calm under the ring",
  // option B, owner's pick 13 Oct 2026): a small pill — "Jot or ask…" since
  // Your assistant (13 Oct 2026) — that brings up its panel, This week on one glass card (in place of
  // the top three, owner, 13 Oct 2026), then Your notes and Inspo as two
  // tiles side by side ("Home · Round 3", option A).
  const subtitle = [wedding.name, wedding.wedding_date && `${formatDayMonth(wedding.wedding_date)} ${wedding.wedding_date.slice(0, 4)}`]
    .filter(Boolean)
    .join(" · ");

  // Phone: the names and ring, then those under them.
  // Laptop (canvas 4 "Laptop · Round 8", C, owner's pick 21 Oct 2026): a
  // bigger ring whose buttons show how far along each area is, and a column
  // on the right that fills the screen — Needs a push, then This week.
  // Your notes and Inspo are in the sidebar there. Ask Juno too. The page
  // and the ring grow with the screen, the ring as tall as the window allows.
  return (
    <main className="relative min-h-dvh overflow-hidden pb-28 lg:mx-auto lg:grid lg:max-w-[1640px] lg:grid-cols-[minmax(0,1fr)_clamp(380px,26vw,480px)] lg:gap-7 lg:pb-10 lg:pl-8 lg:pr-11 lg:pt-10">
      <Cover name={wedding.name} weddingDate={wedding.wedding_date} areas={onHub} />
      <div className="relative mx-auto mt-2 max-w-lg md:max-w-2xl lg:mx-0 lg:mt-0 lg:flex lg:max-w-none lg:flex-col lg:gap-[18px]">
        <NeedsAPush items={pushes} />
        {/* null: 0008_notes.sql hasn't been run, so there's nowhere to save a note yet. */}
        {unfiled && (
          <div className="mb-6 flex justify-center lg:hidden">
            <AssistantSheet variant="hub" subtitle={subtitle} />
          </div>
        )}
        <RowPeopleProvider people={people}>
        <ThisWeek
          milestones={milestones}
          appointments={appointments ?? []}
          payments={payments ?? []}
          hasDate={wedding.wedding_date !== null}
          fill
          areas={areaOptions(areas)}
          suppliers={suppliers.map((s) => ({
            id: s.id,
            name: s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" "),
            area: s.supplier_details?.category ?? null,
          }))}
        />
        </RowPeopleProvider>
        <div className="lg:hidden">
        <HubTiles
          note={unfiled === null ? undefined : (sortable[0] ?? unfiled[0] ?? null)}
          toSort={toSortCount}
          pictures={(latestInspo ?? []).map((i) => i.picture)}
          ideas={ideas}
        />
        </div>
      </div>
      {email && <SignedIn email={email} />}
    </main>
  );
}

/** Who's signed in, and the way out — quietly, at the foot of the page. */
function SignedIn({ email }: { email: string }) {
  return (
    <form action="/auth/sign-out" method="post" className="relative mt-10 text-center text-xs text-stone lg:hidden">
      {email} ·{" "}
      <button type="submit" className="underline underline-offset-4 hover:text-ink">
        Sign out
      </button>
    </form>
  );
}
