import Link from "next/link";
import { ChevronRight, Mail, Phone } from "lucide-react";
import { GUEST_ROLES } from "@/lib/guest-roles";
import type { Contact, Household, Rsvp, WeddingEvent } from "@/types/db";
import { Answer } from "./guest-table";
import RolePicker from "./role-picker";

function fullName(g: Contact) {
  return [g.first_name, g.last_name].filter(Boolean).join(" ");
}

/**
 * The Bridal party tab of People (screen 11): not a separate list, just the
 * guests who have a job on the day, grouped by that job in the usual order,
 * with a way to call or email each of them — which is what you want on the
 * morning itself.
 */
export default function PartyList({
  guests,
  households,
  events,
  rsvps,
  error,
  detail,
}: {
  guests: Contact[];
  households: Household[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  error?: string;
  detail?: string;
}) {
  const party = guests.filter((g) => g.role_on_the_day);
  const others = guests.filter((g) => !g.role_on_the_day).map((g) => ({ id: g.id, name: fullName(g) }));

  // Roles in the usual order, then any a couple wrote themselves.
  const rank = (role: string) => {
    const i = GUEST_ROLES.indexOf(role);
    return i === -1 ? GUEST_ROLES.length : i;
  };
  const roles = [...new Set(party.map((g) => g.role_on_the_day!))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const firstEvent = events[0];

  return (
    <>
      <h1 className="mt-8 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {party.length === 0 ? "No bridal party yet." : "The bridal party"}
      </h1>
      <p className="mt-2 text-sm text-stone">
        {party.length === 0
          ? "Bridesmaids, ushers, readers — anyone with a job on the day."
          : `${party.length} ${party.length === 1 ? "person" : "people"} with a job on the day`}
      </p>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}

      {others.length > 0 ? (
        <RolePicker guests={others} />
      ) : (
        guests.length === 0 && (
          <p className="mt-6 text-sm text-stone">
            Add people to the{" "}
            <Link href="/people" className="text-ink underline underline-offset-4">
              guest list
            </Link>{" "}
            first, then give them a role here.
          </p>
        )
      )}

      <div className="mt-10 space-y-8">
        {roles.map((role) => {
          const people = party.filter((g) => g.role_on_the_day === role);
          return (
            <section key={role}>
              <div className="flex items-baseline justify-between border-b border-champagne-400 pb-2">
                <h2 className="text-xl text-ink">{role}</h2>
                <span className="text-xs uppercase tracking-[0.14em] text-stone">{people.length}</span>
              </div>
              <ul>
                {people.map((g) => {
                  const household = households.find((h) => h.id === g.household_id)?.name;
                  const rsvp = firstEvent && rsvps.find((r) => r.contact_id === g.id && r.event_id === firstEvent.id);
                  return (
                    <li key={g.id} className="flex items-center gap-2 border-b border-linen last:border-b-0">
                      <Link href={`/people/${g.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 hover:bg-cream/60">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] text-ink">{fullName(g)}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone">
                            {firstEvent && <Answer rsvp={rsvp || undefined} event={firstEvent.name.replace(/^The /, "")} short />}
                            {household && <span className="truncate">{household}</span>}
                            {g.is_child && <span>Child</span>}
                          </span>
                        </span>
                      </Link>
                      {g.phone && (
                        <a
                          href={`tel:${g.phone.replace(/\s+/g, "")}`}
                          aria-label={`Call ${g.first_name}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-linen text-ink hover:border-champagne-400"
                        >
                          <Phone className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                        </a>
                      )}
                      {g.email && (
                        <a
                          href={`mailto:${g.email}`}
                          aria-label={`Email ${g.first_name}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-linen text-ink hover:border-champagne-400"
                        >
                          <Mail className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                        </a>
                      )}
                      <Link href={`/people/${g.id}`} aria-label={`Edit ${g.first_name}`} className="p-1 text-stone hover:text-ink">
                        <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
