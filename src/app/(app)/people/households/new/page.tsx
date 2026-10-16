import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import FormPage from "@/components/form-page";
import { SubmitBar } from "@/components/form-bits";
import { BARE, CARD, Line, Part, TITLE_INPUT } from "@/components/visual-form";
import { listGuests, listHouseholds } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { saveNewHouseholdAction } from "../../household-actions";
import PeoplePicker from "../../people-picker";
import { fullName } from "../../guest-table";

export const metadata = { title: "New household — Wedding App" };

/**
 * A new household on its own screen (owner, 16 Oct 2026: adding something
 * new gets a full screen, like Add a guest; the card is for one that
 * exists): its name large, where the post goes, and who lives there.
 */
export default async function NewHouseholdPage({ searchParams }: { searchParams: Promise<{ error?: string; detail?: string }> }) {
  const { error, detail } = await searchParams;
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const [guests, households] = await Promise.all([listGuests(wedding.id), listHouseholds(wedding.id)]);
  const named = new Map(households.map((h) => [h.id, h.name]));

  return (
    <FormPage backHref="/people" backLabel="People" title="New household" error={error} detail={detail}>
      <form action={saveNewHouseholdAction}>
        <input name="name" required autoFocus autoComplete="off" aria-label="The household's name" placeholder="e.g. The Reids" className={TITLE_INPUT} />

        <Part label="Where the post goes">
          <div className={CARD}>
            <Line icon={MapPin} label="Address" top>
              <span className="flex w-full flex-col divide-y divide-linen">
                <input name="address_line1" autoComplete="off" placeholder="House and street" aria-label="House and street" className={BARE} />
                <input name="address_line2" autoComplete="off" placeholder="Second line (optional)" aria-label="Second line" className={BARE} />
                <input name="city" autoComplete="off" placeholder="Town" aria-label="Town" className={BARE} />
                <input name="postcode" autoComplete="off" placeholder="Postcode" aria-label="Postcode" className={`${BARE} uppercase`} />
              </span>
            </Line>
          </div>
        </Part>

        <Part label="Who lives there">
          <PeoplePicker
            people={guests.map((g) => ({
              id: g.id,
              name: fullName(g),
              note: g.household_id && named.get(g.household_id) ? `Now in ${named.get(g.household_id)} — moves here` : undefined,
            }))}
            note="Someone new? Add the household first, then add them from its card."
          />
        </Part>

        <SubmitBar label="Add the household" />
      </form>
    </FormPage>
  );
}
