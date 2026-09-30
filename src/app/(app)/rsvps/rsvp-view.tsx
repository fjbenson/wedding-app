import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import type { Contact, Household, Rsvp, WeddingEvent } from "@/types/db";
import { addStarterEventsAction, inviteAction } from "./actions";
import StatusButtons from "./status-buttons";

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function fullName(guest: Contact) {
  return [guest.first_name, guest.last_name].filter(Boolean).join(" ");
}

/** Who's been asked to what, and who's said yes — one event at a time. */
export default function RsvpView({
  events,
  event,
  guests,
  households,
  rsvps,
  error,
  detail,
}: {
  events: WeddingEvent[];
  event: WeddingEvent | null;
  guests: Contact[];
  households: Household[];
  rsvps: Rsvp[];
  error?: string;
  detail?: string;
}) {
  const rsvpFor = new Map(rsvps.map((r) => [r.contact_id, r]));
  const uninvited = guests.filter((g) => !rsvpFor.has(g.id));
  const coming = rsvps.filter((r) => r.status === "attending").length;
  const notComing = rsvps.filter((r) => r.status === "declined").length;
  const waiting = rsvps.filter((r) => r.status === "pending").length;

  const groups = households
    .map((h) => ({ id: h.id, name: h.name, guests: guests.filter((g) => g.household_id === h.id) }))
    .filter((group) => group.guests.length > 0);
  const loose = guests.filter((g) => !g.household_id);
  if (loose.length > 0) groups.push({ id: "none", name: "Not in a household yet", guests: loose });

  return (
    <main className="page pb-28 lg:pb-16">
      <p className="label">RSVPs</p>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {!event ? "Who's invited to what?" : "Who's coming"}
      </h1>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}

      {!event ? (
        <NoEvents />
      ) : (
        <>
          <EventTabs events={events} current={event} />

          {guests.length === 0 ? (
            <p className="mt-8 text-sm text-stone">
              No one on the guest list yet.{" "}
              <Link href="/guests/new" className="text-ink underline underline-offset-4">
                Add your first guest
              </Link>{" "}
              and they&apos;ll show up here to invite.
            </p>
          ) : (
            <>
              <p className="mt-6 text-sm text-stone">
                {rsvps.length === 0
                  ? `No one invited to ${event.name.toLowerCase()} yet.`
                  : [
                      `${coming} coming`,
                      `${notComing} not coming`,
                      `${waiting} not heard from`,
                      uninvited.length > 0 && `${uninvited.length} not invited`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>

              {uninvited.length > 0 && (
                <form action={inviteAction.bind(null, event.id, uninvited.map((g) => g.id))} className="mt-5">
                  <InlineSubmit
                    primary
                    label={
                      rsvps.length === 0
                        ? `Invite all ${plural(guests.length, "guest")}`
                        : `Invite the other ${plural(uninvited.length, "guest")}`
                    }
                    pendingLabel="Inviting…"
                  />
                </form>
              )}

              <div className="mt-10 space-y-8">
                {groups.map((group, index) => {
                  const toInvite = group.guests.filter((g) => !rsvpFor.has(g.id));
                  return (
                    <section key={group.id}>
                      <div className="flex items-center gap-3 border-b border-champagne-400 pb-2">
                        <span className="font-display text-sm text-champagne-600">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h2 className="min-w-0 flex-1 text-xl text-ink">{group.name}</h2>
                        {toInvite.length > 0 && (
                          <form action={inviteAction.bind(null, event.id, toInvite.map((g) => g.id))}>
                            <InlineSubmit label="Invite" pendingLabel="Inviting…" />
                          </form>
                        )}
                      </div>
                      <ul>
                        {group.guests.map((guest) => (
                          <GuestRow key={guest.id} guest={guest} rsvp={rsvpFor.get(guest.id)} />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

/** Before any events: explain why, and offer the usual two. */
function NoEvents() {
  return (
    <div className="mt-8 rounded-3xl border border-linen bg-white p-6 shadow-[0_10px_30px_-18px_rgb(30_27_24/0.25)]">
      <p className="label">Start here</p>
      <h3 className="mt-3 text-[22px] leading-snug text-ink">
        Most weddings have day guests and evening guests.
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone">
        Each part of the wedding keeps its own list of who&apos;s invited and who&apos;s said yes.
        Start with the usual two, or name your own — a rehearsal dinner, a brunch the day after.
      </p>
      <form action={addStarterEventsAction} className="mt-5">
        <InlineSubmit primary label="Add the day and the evening" pendingLabel="Adding…" />
      </form>
      <Link
        href="/rsvps/events/new"
        className="mt-3 block text-center text-sm text-stone underline underline-offset-4 hover:text-ink"
      >
        Or name your own
      </Link>
    </div>
  );
}

/** One tab per event, a + to add another, and a way to rename this one. */
function EventTabs({ events, current }: { events: WeddingEvent[]; current: WeddingEvent }) {
  return (
    <div className="mt-6">
      {/* Scrolls sideways within itself if there are lots, never the page. */}
      <nav aria-label="Events" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {events.map((e) => {
          const active = e.id === current.id;
          return (
            <Link
              key={e.id}
              href={`/rsvps?event=${e.id}`}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                active ? "border-ink bg-ink text-ivory" : "border-linen bg-white text-ink hover:border-champagne-400"
              }`}
            >
              {e.name}
            </Link>
          );
        })}
        <Link
          href="/rsvps/events/new"
          aria-label="Add an event"
          className="flex shrink-0 items-center justify-center rounded-full border border-dashed border-champagne-400 px-3 text-champagne-600 hover:bg-champagne-100"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </Link>
      </nav>
      <p className="mt-2 text-xs text-stone">
        {current.location && <>{current.location} · </>}
        <Link href={`/rsvps/events/${current.id}`} className="underline underline-offset-4 hover:text-ink">
          Rename or remove
        </Link>
      </p>
    </div>
  );
}

function GuestRow({ guest, rsvp }: { guest: Contact; rsvp?: Rsvp }) {
  const name = fullName(guest);

  if (!rsvp) {
    return (
      <li className="flex items-center gap-3 border-b border-linen py-3 last:border-b-0">
        <span className="flex-1 text-[15px] text-stone">{name}</span>
        <span className="text-xs text-stone">Not invited</span>
      </li>
    );
  }

  const details = [rsvp.meal_choice, rsvp.dietary_notes].filter(Boolean);

  return (
    <li className="flex items-center gap-3 border-b border-linen last:border-b-0">
      <Link href={`/rsvps/${rsvp.id}`} className="flex min-w-0 flex-1 items-center gap-2 py-3 hover:bg-cream/60">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-ink">{name}</span>
          {details.length > 0 && (
            <span className="mt-0.5 block truncate text-xs text-stone">{details.join(" · ")}</span>
          )}
        </span>
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-stone sm:block" strokeWidth={1.8} aria-hidden />
      </Link>
      <StatusButtons rsvpId={rsvp.id} status={rsvp.status} name={name} />
    </li>
  );
}
