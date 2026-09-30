import Link from "next/link";
import { Check, ChevronRight, Minus, X } from "lucide-react";
import type { Contact, Rsvp, RsvpStatus, WeddingEvent } from "@/types/db";

/**
 * The "Everyone" view of the guest list, two ways from the same data:
 * phones get a row per guest that opens to show the rest; desktops (lg+) get
 * the whole thing as a table. Households are the groups in both.
 */

export interface GuestGroup {
  id: string;
  name: string;
  guests: Contact[];
}

function fullName(guest: Contact) {
  return [guest.first_name, guest.last_name].filter(Boolean).join(" ");
}

/** The first meal and dietary note given for any event. */
function mealAndDiet(rsvps: Rsvp[]) {
  return {
    meal: rsvps.find((r) => r.meal_choice)?.meal_choice ?? null,
    diet: rsvps.find((r) => r.dietary_notes)?.dietary_notes ?? null,
  };
}

const ANSWER: Record<RsvpStatus, { label: string; className: string; icon: typeof Check }> = {
  attending: { label: "Coming", className: "bg-ink text-ivory", icon: Check },
  declined: { label: "Not coming", className: "bg-cream text-stone", icon: X },
  pending: {
    label: "Waiting",
    className: "border border-dashed border-champagne-400 text-champagne-600",
    icon: Minus,
  },
};

/** An answer as a small pill. `short` drops the word, for tight phone rows. */
function Answer({ rsvp, event, short = false }: { rsvp?: Rsvp; event?: string; short?: boolean }) {
  if (!rsvp) {
    return <span className="text-xs text-stone/60">{short ? `${event} —` : "Not invited"}</span>;
  }
  const a = ANSWER[rsvp.status];
  const Icon = a.icon;
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs ${a.className}`}
      title={event ? `${event}: ${a.label}` : a.label}
    >
      <Icon className="h-3 w-3" strokeWidth={2.4} aria-hidden />
      {short ? event : a.label}
    </span>
  );
}

function RoleLabel({ guest }: { guest: Contact }) {
  const bits = [guest.role_on_the_day, guest.is_child && "Child"].filter(Boolean);
  if (bits.length === 0) return null;
  return (
    <span className="text-xs font-medium uppercase tracking-[0.12em] text-champagne-600">
      {bits.join(" · ")}
    </span>
  );
}

/** Phones and tablets: tap a guest to see everything about them. */
export function GuestCards({
  groups,
  events,
  rsvps,
}: {
  groups: GuestGroup[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
}) {
  return (
    <div className="mt-10 space-y-8 lg:hidden">
      {groups.map((group, index) => (
        <section key={group.id}>
          <div className="flex items-center gap-3 border-b border-champagne-400 pb-2">
            <span className="font-display text-sm text-champagne-600">{String(index + 1).padStart(2, "0")}</span>
            <h2 className="min-w-0 flex-1 text-xl text-ink">{group.name}</h2>
            <span className="text-xs uppercase tracking-[0.14em] text-stone">
              {group.guests.length} {group.guests.length === 1 ? "guest" : "guests"}
            </span>
          </div>
          <ul>
            {group.guests.map((guest) => {
              const theirs = rsvps.filter((r) => r.contact_id === guest.id);
              const { meal, diet } = mealAndDiet(theirs);
              const details = [
                ["Email", guest.email],
                ["Phone", guest.phone],
                ["Meal", meal],
                ["Dietary", diet],
                ["Notes", guest.notes],
              ].filter(([, value]) => value) as [string, string][];

              return (
                <li key={guest.id} className="border-b border-linen last:border-b-0">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] text-ink">{fullName(guest)}</span>
                        <RoleLabel guest={guest} />
                        {events.length > 0 && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
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
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-stone transition group-open:rotate-90"
                        strokeWidth={1.8}
                        aria-hidden
                      />
                    </summary>

                    <div className="mb-4 rounded-xl bg-cream/70 px-4 py-3 text-sm">
                      {details.length > 0 ? (
                        <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5">
                          {details.map(([label, value]) => (
                            <div key={label} className="contents">
                              <dt className="text-stone">{label}</dt>
                              <dd className="min-w-0 break-words text-ink">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-stone">No details yet.</p>
                      )}
                      <Link
                        href={`/people/${guest.id}`}
                        className="mt-3 inline-block text-sm text-ink underline underline-offset-4"
                      >
                        Edit {guest.first_name}
                      </Link>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Desktop: every guest, every detail, one table. */
export function GuestTable({
  groups,
  events,
  rsvps,
}: {
  groups: GuestGroup[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
}) {
  const head = "pb-3 pr-4 text-xs font-medium uppercase tracking-[0.14em] text-stone";

  return (
    <table className="mt-10 hidden w-full border-collapse text-left lg:table">
      <thead>
        <tr className="border-b border-champagne-400">
          <th scope="col" className={head}>Guest</th>
          <th scope="col" className={head}>Role</th>
          {events.map((e) => (
            <th key={e.id} scope="col" className={head}>{e.name}</th>
          ))}
          <th scope="col" className={head}>Meal &amp; dietary</th>
          <th scope="col" className={head}>Contact</th>
          <th scope="col" className="w-8"><span className="sr-only">Edit</span></th>
        </tr>
      </thead>
      {groups.map((group, index) => (
        <tbody key={group.id}>
          <tr>
            <th colSpan={events.length + 5} scope="colgroup" className="pb-2 pt-8 text-left font-normal">
              <span className="font-display text-sm text-champagne-600">{String(index + 1).padStart(2, "0")}</span>{" "}
              <span className="font-display text-xl text-ink">{group.name}</span>
            </th>
          </tr>
          {group.guests.map((guest) => {
            const theirs = rsvps.filter((r) => r.contact_id === guest.id);
            const { meal, diet } = mealAndDiet(theirs);
            return (
              <tr key={guest.id} className="border-t border-linen align-top hover:bg-cream/60">
                <td className="py-3 pr-4">
                  <Link href={`/people/${guest.id}`} className="text-[15px] text-ink hover:underline">
                    {fullName(guest)}
                  </Link>
                  {guest.is_child && <span className="block text-xs text-stone">Child</span>}
                </td>
                <td className="py-3 pr-4 text-sm text-champagne-600">{guest.role_on_the_day ?? ""}</td>
                {events.map((e) => (
                  <td key={e.id} className="py-3 pr-4">
                    <Answer rsvp={theirs.find((r) => r.event_id === e.id)} />
                  </td>
                ))}
                <td className="py-3 pr-4 text-sm">
                  {meal && <span className="block text-ink">{meal}</span>}
                  {diet && <span className="block text-stone">{diet}</span>}
                </td>
                <td className="max-w-56 py-3 pr-4 text-sm text-stone">
                  {guest.email && <span className="block truncate">{guest.email}</span>}
                  {guest.phone && <span className="block">{guest.phone}</span>}
                </td>
                <td className="py-3">
                  <Link href={`/people/${guest.id}`} aria-label={`Edit ${fullName(guest)}`} className="text-stone hover:text-ink">
                    <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      ))}
    </table>
  );
}
