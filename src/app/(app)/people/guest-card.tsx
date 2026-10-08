"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { ChevronRight, Mail, MessageSquare, Phone, Plus, X } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { GUEST_ROLES, rolesOf } from "@/lib/guest-roles";
import type { Contact, Rsvp, WeddingEvent } from "@/types/db";
import { setRolesAction } from "./actions";
import { inviteAction } from "./rsvp-actions";
import { fullName } from "./guest-table";
import StatusButtons from "./status-buttons";

/**
 * One guest, over the list: a sheet that slides up on a phone, a panel on
 * the right on a laptop. Answers and roles change with a tap; everything
 * else is one link away (Edit, or an event's meal and dietary notes).
 */
export default function GuestCard({
  guest,
  household,
  events,
  rsvps,
  onClose,
}: {
  guest: Contact;
  household: { id: string; name: string } | null;
  events: WeddingEvent[];
  /** This guest's answers. */
  rsvps: Rsvp[];
  onClose: () => void;
}) {
  const name = fullName(guest);

  // Escape closes it, and the list behind doesn't scroll while it's open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const meal = rsvps.find((r) => r.meal_choice)?.meal_choice;
  const diet = rsvps.find((r) => r.dietary_notes)?.dietary_notes;
  const facts = [
    ["Meal", meal],
    ["Dietary", diet],
    ["Phone", guest.phone],
    ["Email", guest.email],
    ["Notes", guest.notes],
  ].filter(([, value]) => value) as [string, string][];
  const phone = guest.phone?.replace(/\s+/g, "");

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={name}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-ink/30" />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px]">
        <span aria-hidden className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-linen lg:hidden" />

        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 lg:pt-8">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {household && (
                <Link href={`/people/household/${household.id}`} className="label hover:text-ink">
                  {household.name} ›
                </Link>
              )}
              <h2 className="type-display mt-1.5 text-[34px] leading-[1.05]">{name}</h2>
              {guest.is_child && <p className="type-meta mt-2">Child</p>}
            </div>
            <Link
              href={`/people/${guest.id}`}
              className="flex h-11 shrink-0 items-center rounded-full border border-linen bg-white px-4 text-sm text-ink hover:border-champagne-400"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          </div>

          {(phone || guest.email) && (
            <div className="mt-5 flex gap-2.5">
              {phone && (
                <a href={`sms:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm text-ivory hover:bg-ink/90">
                  <MessageSquare className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                  Text
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-linen bg-white text-sm text-ink hover:border-champagne-400">
                  <Phone className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                  Call
                </a>
              )}
              {guest.email && (
                <a href={`mailto:${guest.email}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-linen bg-white text-sm text-ink hover:border-champagne-400">
                  <Mail className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                  Email
                </a>
              )}
            </div>
          )}

          <Roles guest={guest} />

          {events.length > 0 && (
            <section className="mt-6">
              <h3 className="section-label">Answers</h3>
              <ul className="mt-2 rounded-[22px] border border-white bg-white/70 px-4 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4)]">
                {events.map((event) => {
                  const rsvp = rsvps.find((r) => r.event_id === event.id);
                  return (
                    <li key={event.id} className="flex min-h-[60px] items-center gap-2 border-b border-linen py-2 last:border-b-0">
                      {rsvp ? (
                        <>
                          <Link href={`/people/rsvp/${rsvp.id}`} className="min-w-0 flex-1 hover:text-champagne-600">
                            <span className="type-item block truncate">{event.name}</span>
                            <span className="type-meta mt-0.5 flex items-center gap-1">
                              Meal &amp; diet <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden />
                            </span>
                          </Link>
                          <StatusButtons rsvpId={rsvp.id} status={rsvp.status} name={`${name}, ${event.name}`} />
                        </>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1">
                            <span className="type-item block truncate text-stone">{event.name}</span>
                            <span className="type-meta mt-0.5 block">Not invited</span>
                          </span>
                          <form action={inviteAction.bind(null, event.id, [guest.id])}>
                            <InlineSubmit label="Invite" pendingLabel="Inviting…" />
                          </form>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {facts.length > 0 && (
            <dl className="mt-5 grid grid-cols-[6rem_1fr] text-[15px]">
              {facts.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="type-meta border-b border-linen py-3">{label}</dt>
                  <dd className="min-w-0 break-words border-b border-linen py-2.5 text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Role on the day: the usual roles as pills, tap on or off, plus their own.
 * Shows the change at once and saves behind it.
 */
function Roles({ guest }: { guest: Contact }) {
  const saved = rolesOf(guest);
  const [roles, setRoles] = useOptimistic(saved);
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState("");

  const choices = [...GUEST_ROLES, ...roles.filter((r) => !GUEST_ROLES.includes(r))];

  function save(next: string[]) {
    startTransition(async () => {
      setRoles(next);
      await setRolesAction(guest.id, next);
    });
  }

  return (
    <section className="mt-6">
      <h3 className="section-label">Role on the day</h3>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {choices.map((role) => {
          const on = roles.includes(role);
          return (
            <button
              key={role}
              type="button"
              aria-pressed={on}
              onClick={() => save(on ? roles.filter((r) => r !== role) : [...roles, role])}
              className={`h-9 rounded-full border px-3.5 text-[13px] transition ${
                on
                  ? "border-champagne-600 bg-champagne-100 font-medium text-champagne-600"
                  : "border-linen bg-white text-ink hover:border-champagne-400"
              }`}
            >
              {on && "✓ "}
              {role}
            </button>
          );
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-9 items-center gap-1 rounded-full border border-dashed border-champagne-400 px-3.5 text-[13px] text-champagne-600 hover:bg-champagne-100"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
            Your own
          </button>
        )}
      </div>
      {adding && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (custom.trim()) save([...roles, custom.trim()]);
            setCustom("");
            setAdding(false);
          }}
        >
          <input
            autoFocus
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="e.g. Chief dog handler"
            aria-label="Their role"
            className="h-11 min-w-0 flex-1 rounded-full border border-linen bg-white px-4 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none"
          />
          <button type="submit" className="h-11 rounded-full bg-ink px-5 text-sm text-ivory hover:bg-ink/90">
            Add
          </button>
        </form>
      )}
    </section>
  );
}
