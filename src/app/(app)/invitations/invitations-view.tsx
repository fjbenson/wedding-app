import Link from "next/link";
import { ChevronLeft, Mail, MessageSquare, Phone } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { formatDayMonth } from "@/lib/dates";
import type { Contact, Household, Invitation, Rsvp, WeddingEvent } from "@/types/db";
import { markSentAction } from "./actions";

function fullName(g: Contact) {
  return [g.first_name, g.last_name].filter(Boolean).join(" ");
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Invitations (screen 15). An invitation belongs to a household and is made
 * when they're first invited to an event; answers come from each person.
 * So: households still to post to, households posted to, and the people in
 * them who haven't answered yet — with a nudge ready to send.
 */
export default function InvitationsView({
  coupleName,
  guests,
  households,
  events,
  rsvps,
  invitations,
  error,
  detail,
}: {
  coupleName: string;
  guests: Contact[];
  households: Household[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  invitations: Invitation[];
  error?: string;
  detail?: string;
}) {
  const members = (h: Household) => guests.filter((g) => g.household_id === h.id);
  const withPeople = households.filter((h) => members(h).length > 0);
  const invitationFor = new Map(invitations.map((i) => [i.household_id, i]));

  const toSend = withPeople.filter((h) => invitationFor.has(h.id) && !invitationFor.get(h.id)!.sent_at);
  const sent = withPeople
    .filter((h) => invitationFor.get(h.id)?.sent_at)
    .sort((a, b) => invitationFor.get(b.id)!.sent_at!.localeCompare(invitationFor.get(a.id)!.sent_at!));
  const notInvited = withPeople.filter((h) => !invitationFor.has(h.id));

  // Who to chase: anyone still "not heard" whose invitation has gone out —
  // or who has no household, so there's no envelope to wait for.
  const eventName = (id: string) => events.find((e) => e.id === id)?.name.replace(/^The /, "the ") ?? "";
  const pendingFor = (g: Contact) => rsvps.filter((r) => r.contact_id === g.id && r.status === "pending");
  const chase = guests
    .filter((g) => (g.household_id ? !!invitationFor.get(g.household_id)?.sent_at : true))
    .map((g) => ({ guest: g, pending: pendingFor(g) }))
    .filter((c) => c.pending.length > 0);

  const answered = (h: Household) => {
    const people = members(h);
    const theirs = rsvps.filter((r) => people.some((p) => p.id === r.contact_id));
    const heard = people.filter((p) => theirs.some((r) => r.contact_id === p.id && r.status !== "pending")).length;
    return `${heard} of ${people.length} answered`;
  };
  const hasAddress = (h: Household) => !!(h.address_line1 && (h.postcode || h.city));

  const nudge = (g: Contact) =>
    `Hi ${g.first_name}! Just checking whether you can make it to ${coupleName}'s wedding — let us know when you get a chance. x`;

  const section = "flex items-baseline justify-between border-b border-champagne-400 pb-2";
  const circle =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-linen text-ink hover:border-champagne-400";

  return (
    <main className="page pb-28 lg:pb-16">
      <Link href="/people" className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-stone hover:text-ink">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        People
      </Link>

      <p className="label mt-4">People</p>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {invitations.length === 0 ? "No invitations yet." : "Invitations"}
      </h1>
      <p className="mt-2 text-sm text-stone">
        {invitations.length === 0
          ? "An invitation is made for a household when you invite them to the day or the evening."
          : [
              `${sent.length} sent`,
              toSend.length > 0 && `${toSend.length} to send`,
              chase.length > 0 && `${plural(chase.length, "person", "people")} to chase`,
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

      {invitations.length === 0 && (
        <Link
          href={events[0] ? `/people?event=${events[0].id}` : "/people"}
          className="mt-6 inline-flex rounded-full border border-champagne-400 px-4 py-2 text-sm text-ink hover:bg-champagne-100"
        >
          {events.length === 0 ? "Set up the day and evening" : "Invite households"}
        </Link>
      )}

      <div className="mt-10 space-y-10">
        {toSend.length > 0 && (
          <section>
            <div className={section}>
              <h2 className="text-xl text-ink">To send</h2>
              {toSend.length > 1 && (
                <form action={markSentAction.bind(null, toSend.map((h) => invitationFor.get(h.id)!.id), true)}>
                  <InlineSubmit label="Mark all sent" pendingLabel="Saving…" />
                </form>
              )}
            </div>
            <ul>
              {toSend.map((h) => (
                <li key={h.id} className="flex items-center gap-3 border-b border-linen py-3 last:border-b-0">
                  <Link href={`/people/household/${h.id}`} className="min-w-0 flex-1 hover:opacity-80">
                    <span className="block text-[15px] text-ink">{h.name}</span>
                    <span className="mt-0.5 block text-xs text-stone">
                      {plural(members(h).length, "person", "people")}
                      {!hasAddress(h) && <span className="font-medium text-champagne-600"> · No address yet</span>}
                    </span>
                  </Link>
                  <form action={markSentAction.bind(null, [invitationFor.get(h.id)!.id], true)}>
                    <InlineSubmit label="Mark sent" pendingLabel="Saving…" />
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        {chase.length > 0 && (
          <section>
            <div className={section}>
              <h2 className="text-xl text-ink">Still to hear from</h2>
              <span className="text-xs uppercase tracking-[0.14em] text-stone">{chase.length}</span>
            </div>
            <ul>
              {chase.map(({ guest: g, pending }) => (
                <li key={g.id} className="flex items-center gap-2 border-b border-linen py-3 last:border-b-0">
                  <Link href={`/people/${g.id}`} className="min-w-0 flex-1 hover:opacity-80">
                    <span className="block truncate text-[15px] text-ink">{fullName(g)}</span>
                    <span className="mt-0.5 block text-xs text-stone">
                      Not heard: {pending.map((r) => eventName(r.event_id)).join(", ")}
                    </span>
                  </Link>
                  {g.phone && (
                    <>
                      <a href={`sms:${g.phone.replace(/\s+/g, "")}?&body=${encodeURIComponent(nudge(g))}`} aria-label={`Text ${g.first_name}`} className={circle}>
                        <MessageSquare className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                      </a>
                      <a href={`tel:${g.phone.replace(/\s+/g, "")}`} aria-label={`Call ${g.first_name}`} className={circle}>
                        <Phone className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                      </a>
                    </>
                  )}
                  {g.email && (
                    <a
                      href={`mailto:${g.email}?subject=${encodeURIComponent(`${coupleName}'s wedding`)}&body=${encodeURIComponent(nudge(g))}`}
                      aria-label={`Email ${g.first_name}`}
                      className={circle}
                    >
                      <Mail className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {sent.length > 0 && (
          <section>
            <div className={section}>
              <h2 className="text-xl text-ink">Sent</h2>
              <span className="text-xs uppercase tracking-[0.14em] text-stone">{sent.length}</span>
            </div>
            <ul>
              {sent.map((h) => (
                <li key={h.id} className="flex items-center gap-3 border-b border-linen py-3 last:border-b-0">
                  <Link href={`/people/household/${h.id}`} className="min-w-0 flex-1 hover:opacity-80">
                    <span className="block text-[15px] text-ink">{h.name}</span>
                    <span className="mt-0.5 block text-xs text-stone">
                      Sent {formatDayMonth(invitationFor.get(h.id)!.sent_at!.slice(0, 10))} · {answered(h)}
                    </span>
                  </Link>
                  <form action={markSentAction.bind(null, [invitationFor.get(h.id)!.id], false)}>
                    <button type="submit" className="py-2 text-sm text-stone underline underline-offset-4 hover:text-ink">
                      Not sent
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        {notInvited.length > 0 && invitations.length > 0 && (
          <section>
            <div className={section}>
              <h2 className="text-xl text-ink">Not invited to anything yet</h2>
              <span className="text-xs uppercase tracking-[0.14em] text-stone">{notInvited.length}</span>
            </div>
            <p className="py-3 text-sm text-stone">
              {notInvited.map((h) => h.name).join(", ")}.{" "}
              {events[0] && (
                <Link href={`/people?event=${events[0].id}`} className="text-ink underline underline-offset-4">
                  Invite them
                </Link>
              )}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
