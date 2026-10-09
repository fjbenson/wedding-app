import Link from "next/link";
import { Plus } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import type { Contact, Household, Rsvp, WeddingEvent } from "@/types/db";
import { addStarterEventsAction } from "./rsvp-actions";
import GuestBrowser, { type GuestFilter, type GuestView } from "./guest-browser";

/**
 * The Guests tab of People: the title, then the list itself (guest-browser.tsx),
 * which holds the answers, search, filters and each guest's card.
 */
export default function PeopleView({
  guests,
  households,
  events,
  rsvps,
  guestId,
  filter,
  view,
  error,
  detail,
}: {
  guests: Contact[];
  households: Household[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  guestId?: string;
  filter?: GuestFilter;
  view?: GuestView;
  error?: string;
  detail?: string;
}) {
  return (
    <>
      <h1 className="type-display mt-3 text-[40px] leading-[1.05] tracking-[-0.02em]">
        {guests.length === 0 ? "No one on the list yet." : "The guest list"}
      </h1>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}

      {guests.length === 0 ? (
        <>
          <p className="mt-3 text-sm text-stone">Start with the people you can&apos;t imagine the day without.</p>
          {/* With guests, "Add a guest" sits just above the list (guest-browser.tsx). */}
          <Link
            href="/people/new"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm text-ivory hover:bg-ink/90"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
            Add your first guest
          </Link>
        </>
      ) : (
        <>
          {events.length === 0 && <StartRsvps />}
          <GuestBrowser
            guests={guests}
            households={households.map((h) => ({
              id: h.id,
              name: h.name,
              hasAddress: Boolean(h.address_line1 || h.postcode),
            }))}
            events={events}
            rsvps={rsvps}
            initialGuestId={guestId}
            initialFilter={filter}
            initialView={view}
          />
        </>
      )}
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
