import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import type { Contact, Household, Rsvp, RsvpStatus, WeddingEvent } from "@/types/db";
import { addStarterEventsAction, inviteAction } from "./rsvp-actions";
import StatusButtons from "./status-buttons";

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function fullName(guest: Contact) {
  return [guest.first_name, guest.last_name].filter(Boolean).join(" ");
}

const ANSWER: Record<RsvpStatus, string> = {
  attending: "coming",
  declined: "not coming",
  pending: "not heard",
};

/**
 * The Guests tab of People: the guest list, grouped by household — the people who share an invitation.
 * With "Everyone" picked it's the list itself; with an event picked, the same
 * list becomes that event's RSVPs: invite, and yes / no / ? per person.
 */
export default function PeopleView({
  guests,
  households,
  events,
  event,
  rsvps,
  error,
  detail,
}: {
  guests: Contact[];
  households: Household[];
  events: WeddingEvent[];
  event: WeddingEvent | null;
  rsvps: Rsvp[];
  error?: string;
  detail?: string;
}) {
  const groups = households
    .map((h) => ({ id: h.id, name: h.name, guests: guests.filter((g) => g.household_id === h.id) }))
    .filter((group) => group.guests.length > 0);
  const loose = guests.filter((g) => !g.household_id);
  if (loose.length > 0) groups.push({ id: "none", name: "Not in a household yet", guests: loose });

  const children = guests.filter((g) => g.is_child).length;
  const eventRsvps = event ? rsvps.filter((r) => r.event_id === event.id) : [];
  const rsvpFor = new Map(eventRsvps.map((r) => [r.contact_id, r]));
  const uninvited = event ? guests.filter((g) => !rsvpFor.has(g.id)) : [];

  return (
    <>
      <h1 className="mt-8 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {guests.length === 0 ? "No one on the list yet." : "The guest list"}
      </h1>
      <p className="mt-2 text-sm text-stone">
        {guests.length === 0
          ? "Start with the people you can't imagine the day without."
          : [
              plural(guests.length, "guest"),
              plural(groups.filter((g) => g.id !== "none").length, "household"),
              children > 0 && plural(children, "child", "children"),
            ]
              .filter(Boolean)
              .join(" · ")}
      </p>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}

      <Link
        href="/people/new"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Add a guest
      </Link>

      {guests.length > 0 &&
        (events.length === 0 ? <StartRsvps /> : <EventTabs events={events} current={event} />)}

      {event && guests.length > 0 && (
        <>
          <p className="mt-6 text-sm text-stone">
            {eventRsvps.length === 0
              ? `No one invited to ${event.name.toLowerCase()} yet.`
              : [
                  `${eventRsvps.filter((r) => r.status === "attending").length} coming`,
                  `${eventRsvps.filter((r) => r.status === "declined").length} not coming`,
                  `${eventRsvps.filter((r) => r.status === "pending").length} not heard from`,
                  uninvited.length > 0 && `${uninvited.length} not invited`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
          {uninvited.length > 0 && (
            <form action={inviteAction.bind(null, event.id, uninvited.map((g) => g.id))} className="mt-4">
              <InlineSubmit
                label={
                  eventRsvps.length === 0
                    ? `Invite all ${plural(guests.length, "guest")}`
                    : `Invite the other ${plural(uninvited.length, "guest")}`
                }
                pendingLabel="Inviting…"
              />
            </form>
          )}
        </>
      )}

      <div className="mt-10 space-y-8">
        {groups.map((group, index) => {
          const toInvite = event ? group.guests.filter((g) => !rsvpFor.has(g.id)) : [];
          return (
            <section key={group.id}>
              <div className="flex items-center gap-3 border-b border-champagne-400 pb-2">
                <span className="font-display text-sm text-champagne-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="min-w-0 flex-1 text-xl text-ink">{group.name}</h2>
                {event && toInvite.length > 0 ? (
                  <form action={inviteAction.bind(null, event.id, toInvite.map((g) => g.id))}>
                    <InlineSubmit label="Invite" pendingLabel="Inviting…" />
                  </form>
                ) : (
                  !event && (
                    <span className="text-xs uppercase tracking-[0.14em] text-stone">
                      {plural(group.guests.length, "guest")}
                    </span>
                  )
                )}
              </div>
              <ul>
                {group.guests.map((guest) =>
                  event ? (
                    <RsvpRow key={guest.id} guest={guest} rsvp={rsvpFor.get(guest.id)} />
                  ) : (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      events={events}
                      rsvps={rsvps.filter((r) => r.contact_id === guest.id)}
                    />
                  ),
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

/** Before any events: a small nudge to start tracking replies. */
function StartRsvps() {
  return (
    <div className="mt-6 rounded-2xl border border-linen bg-white p-5">
      <p className="text-[15px] text-ink">Keeping track of RSVPs?</p>
      <p className="mt-1 text-sm leading-relaxed text-stone">
        Most weddings have day guests and evening guests, each with their own list of who&apos;s said yes.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <form action={addStarterEventsAction}>
          <InlineSubmit label="Add the day and the evening" pendingLabel="Adding…" />
        </form>
        <Link href="/people/events/new" className="text-sm text-stone underline underline-offset-4 hover:text-ink">
          Or name your own
        </Link>
      </div>
    </div>
  );
}

/** Everyone, then one tab per event, and a + to add another. */
function EventTabs({ events, current }: { events: WeddingEvent[]; current: WeddingEvent | null }) {
  const tab = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition ${
      active ? "border-ink bg-ink text-ivory" : "border-linen bg-white text-ink hover:border-champagne-400"
    }`;

  return (
    <div className="mt-8">
      {/* Scrolls sideways within itself if there are lots, never the page. */}
      <nav aria-label="Show" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link href="/people" aria-current={!current ? "page" : undefined} className={tab(!current)}>
          Everyone
        </Link>
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/people?event=${e.id}`}
            aria-current={e.id === current?.id ? "page" : undefined}
            className={tab(e.id === current?.id)}
          >
            {e.name}
          </Link>
        ))}
        <Link
          href="/people/events/new"
          aria-label="Add an event"
          className="flex shrink-0 items-center justify-center rounded-full border border-dashed border-champagne-400 px-3 text-champagne-600 hover:bg-champagne-100"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </Link>
      </nav>
      {current && (
        <p className="mt-2 text-xs text-stone">
          {current.location && <>{current.location} · </>}
          <Link href={`/people/events/${current.id}`} className="underline underline-offset-4 hover:text-ink">
            Rename or remove
          </Link>
        </p>
      )}
    </div>
  );
}

/** A guest in the Everyone view: their details, and their answer per event. */
function GuestRow({ guest, events, rsvps }: { guest: Contact; events: WeddingEvent[]; rsvps: Rsvp[] }) {
  const tags = [
    guest.contact_type === "bridal_party" && "Wedding party",
    guest.is_child && "Child",
  ].filter(Boolean);
  const answers = events
    .map((e) => {
      const rsvp = rsvps.find((r) => r.event_id === e.id);
      return rsvp && `${e.name}: ${ANSWER[rsvp.status]}`;
    })
    .filter(Boolean);
  const lines = [...tags, ...answers];

  return (
    <li className="border-b border-linen last:border-b-0">
      <Link href={`/people/${guest.id}`} className="flex items-center gap-3 py-3 hover:bg-cream/60">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] text-ink">{fullName(guest)}</span>
          {lines.length > 0 && <span className="mt-0.5 block text-xs text-stone">{lines.join(" · ")}</span>}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
      </Link>
    </li>
  );
}

/** A guest in an event's view: yes / no / ?, or not invited. */
function RsvpRow({ guest, rsvp }: { guest: Contact; rsvp?: Rsvp }) {
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
      <Link href={`/people/rsvp/${rsvp.id}`} className="flex min-w-0 flex-1 items-center gap-2 py-3 hover:bg-cream/60">
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
