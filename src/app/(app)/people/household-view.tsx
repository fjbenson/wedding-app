import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Contact, Household, Rsvp, WeddingEvent } from "@/types/db";
import { Answer, RoleLabel } from "./guest-table";

/**
 * One household, expanded (screen 9 in docs/information-architecture.md):
 * where their invitation goes, who's in it, and what each of them has said
 * and needs. Invitations go to a household; answers come from each person.
 */
export default function HouseholdView({
  household,
  guests,
  events,
  rsvps,
}: {
  household: Household;
  guests: Contact[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
}) {
  const people = guests.filter((g) => g.household_id === household.id);
  const theirRsvps = rsvps.filter((r) => people.some((p) => p.id === r.contact_id));

  const address = [
    household.address_line1,
    household.address_line2,
    household.city,
    household.postcode,
    household.country,
  ].filter(Boolean);

  // Everything the caterer needs to know about this household, in one place.
  const dietary = people
    .map((p) => ({ name: p.first_name, note: theirRsvps.find((r) => r.contact_id === p.id && r.dietary_notes)?.dietary_notes }))
    .filter((d) => d.note);

  const children = people.filter((p) => p.is_child).length;

  return (
    <main className="page pb-28 lg:pb-16">
      <Link href="/people" className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-stone hover:text-ink">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        People
      </Link>

      <p className="label mt-4">Household</p>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">{household.name}</h1>
      <p className="mt-2 text-sm text-stone">
        {[
          `${people.length} ${people.length === 1 ? "person" : "people"}`,
          children > 0 && `${children} ${children === 1 ? "child" : "children"}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-linen bg-white p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="label font-body">Address</h2>
            <Link
              href={`/people/household/${household.id}/edit`}
              className="text-sm text-stone underline underline-offset-4 hover:text-ink"
            >
              {address.length > 0 ? "Edit" : "Add"}
            </Link>
          </div>
          {address.length > 0 ? (
            <address className="mt-3 text-[15px] not-italic leading-relaxed text-ink">
              {address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            <p className="mt-3 text-sm text-stone">No address yet — you&apos;ll want one for the invitation.</p>
          )}
        </section>

        <section className="rounded-2xl border border-linen bg-white p-5">
          <h2 className="label font-body">Dietary needs</h2>
          {dietary.length > 0 ? (
            <ul className="mt-3 space-y-1 text-[15px]">
              {dietary.map((d) => (
                <li key={d.name}>
                  <span className="text-ink">{d.name}</span> <span className="text-stone">— {d.note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stone">None noted.</p>
          )}
        </section>
      </div>

      <div className="mt-10 flex items-baseline justify-between border-b border-champagne-400 pb-2">
        <h2 className="text-xl text-ink">Who&apos;s in it</h2>
        <Link
          href={`/people/new?household=${household.id}`}
          className="inline-flex items-center gap-1 text-sm text-champagne-600 hover:text-ink"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          Add someone
        </Link>
      </div>

      {people.length === 0 ? (
        <p className="mt-4 text-sm text-stone">No one in this household yet.</p>
      ) : (
        <ul>
          {people.map((person) => {
            const theirs = theirRsvps.filter((r) => r.contact_id === person.id);
            const meal = theirs.find((r) => r.meal_choice)?.meal_choice;
            return (
              <li key={person.id} className="border-b border-linen last:border-b-0">
                <Link href={`/people?guest=${person.id}`} className="flex items-center gap-3 py-4 hover:bg-cream/60">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] text-ink">
                      {[person.first_name, person.last_name].filter(Boolean).join(" ")}
                    </span>
                    <RoleLabel guest={person} className="mt-1.5" />
                    {events.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {events.map((e) => (
                          <Answer
                            key={e.id}
                            rsvp={theirs.find((r) => r.event_id === e.id)}
                            event={e.name.replace(/^The /, "")}
                            short
                          />
                        ))}
                      </span>
                    )}
                    {meal && <span className="mt-1.5 block text-sm text-stone">Meal: {meal}</span>}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
