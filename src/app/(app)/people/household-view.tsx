"use client";

import { ownNeeds } from "@/lib/dietary";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Mail, MessageSquare, Phone, Plus, Search } from "lucide-react";
import type { Contact, Household, Rsvp, WeddingEvent } from "@/types/db";
import GuestCard from "./guest-card";
import CardSheet from "@/components/card-sheet";
import { AnswerIcon, eventWord } from "./guest-browser";
import { fullName, initials } from "./guest-table";
import { removeHouseholdAction } from "./household-actions";
import HouseholdEnvelope, { HouseholdDetails } from "./household-envelope";
import type { GroupSummary } from "./guest-groups";
import { updateGuestAction } from "./actions";
import type { TravelInfo } from "./guest-travel";
import type { GuestSeating } from "@/lib/db/day";
import { jumpTo } from "@/lib/jump-to";

/**
 * One household (screen 9), as a card over the guest list — since 16 Oct 2026
 * it opens like a guest's card (owner), from `?household=` on /people. Topped
 * by its envelope (`household-envelope.tsx`): the address, and a postmark
 * saying how the replies stand. Then
 * Text · Call · Email, the guests with their RSVP, and Details (name and
 * address) like the guest card's. Each guest's card opens on top of it.
 */
export default function HouseholdSheet({
  household,
  households,
  guests,
  events,
  rsvps,
  tables,
  seating,
  travel,
  groups,
  onClose,
}: {
  household: Household;
  /** Every household, for moving someone on their card. */
  households: { id: string; name: string }[];
  guests: Contact[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  tables: Record<string, string>;
  seating?: GuestSeating;
  travel?: TravelInfo;
  groups: GroupSummary[];
  onClose: () => void;
}) {
  const [openId, setOpenId] = useState<string>();
  const close = useCallback(() => setOpenId(undefined), []);

  const people = guests
    .filter((g) => g.household_id === household.id)
    .sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }));
  const answersOf = (g: Contact) => rsvps.filter((r) => r.contact_id === g.id);
  const ownEvent = (g: Contact) => events.find((e) => answersOf(g).some((r) => r.event_id === e.id));
  const statusOf = (g: Contact) => {
    const e = ownEvent(g);
    return e ? answersOf(g).find((r) => r.event_id === e.id)?.status : undefined;
  };

  // "3 people · 1 child · day guests"
  const children = people.filter((p) => p.is_child).length;
  const kinds = [...new Set(people.map(ownEvent).filter(Boolean).map((e) => eventWord(e!)))];
  const summary = [
    `${people.length} ${people.length === 1 ? "person" : "people"}`,
    children > 0 && `${children} ${children === 1 ? "child" : "children"}`,
    kinds.length === 1 && `${kinds[0]} ${people.length === 1 ? "guest" : "guests"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const open = openId ? people.find((p) => p.id === openId) : undefined;

  return (
    <CardSheet label={household.name} onClose={onClose} top={<span className="label">Household</span>}>
      {/* The envelope goes to the name and address to change them; the line under it to who's in it (owner, 19 Oct 2026). */}
      <button type="button" onClick={() => jumpTo("household-details")} className="block w-full text-left">
        <HouseholdEnvelope household={household} answers={people.map(statusOf)} />
      </button>
      <button type="button" onClick={() => jumpTo("household-guests")} className="mx-auto mt-2.5 block rounded-lg px-2 py-1 text-center text-[13px] text-stone hover:bg-cream/70 hover:text-ink">
        {summary}
      </button>

      <div className="mt-5 flex justify-center gap-8">
        {(["text", "phone", "email"] as const).map((kind) => (
          <ContactMenu
            key={kind}
            kind={kind}
            people={people
              .filter((p) => (kind === "email" ? p.email : p.phone))
              .map((p) => ({ id: p.id, name: fullName(p), value: (kind === "email" ? p.email : p.phone)! }))}
          />
        ))}
      </div>

      {/* Guests, on a card of its own (canvas 3 "Household · Round 3"). */}
      <section id="household-guests" className="mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="label">Guests</h2>
          <span className="label">RSVP</span>
        </div>
        {people.length === 0 ? (
          <p className="py-3 text-sm text-stone">No one in this household yet.</p>
        ) : (
          <ul className="mt-1">
            {people.map((g) => (
              <li key={g.id} className="border-b border-linen last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenId(g.id)}
                  className="flex min-h-[52px] w-full items-center gap-3 text-left text-[15px] text-ink hover:text-champagne-600"
                >
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-[13px] font-semibold text-champagne-600">
                    {initials(g)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {fullName(g)}
                    {g.is_child && <em className="ml-1.5 font-display text-stone">child</em>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-[13px] text-stone">
                    {RSVP_WORD[statusOf(g) ?? "unset"]}
                    <AnswerIcon status={statusOf(g)} small />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <AddSomeone
        household={household}
        others={guests.filter((g) => g.household_id !== household.id)}
        householdName={(id) => households.find((h) => h.id === id)?.name}
      />

      <div id="household-details">
        <HouseholdDetails household={household} />
      </div>

      <RemoveHousehold household={household} onRemoved={onClose} />

      {open && (
        <GuestCard
          guest={open}
          household={{ id: household.id, name: household.name }}
          households={households}
          events={events}
          rsvps={answersOf(open)}
          table={tables[open.id] ?? null}
          seating={seating}
          travel={travel}
          groups={groups}
          ownNeeds={ownNeeds(rsvps.map((r) => r.dietary_notes))}
          onOpenHousehold={close}
          onClose={close}
        />
      )}
    </CardSheet>
  );
}

/** Each guest's answer, worded for a household: the invitation's been sent, have they replied? */
const RSVP_WORD: Record<Rsvp["status"] | "unset", string> = {
  attending: "Coming",
  pending: "Yet to respond",
  to_invite: "Not invited yet",
  declined: "Can't come",
  unset: "Day or evening?",
};

/**
 * Text · Call · Email for the household, as round buttons with their word
 * (like the guest card's). A household has no number of its own, so these
 * reach its people: one with a number and the button goes straight to them;
 * several and it asks who. Hidden when no one has one.
 */
function ContactMenu({ kind, people }: { kind: "text" | "phone" | "email"; people: { id: string; name: string; value: string }[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const Icon = { text: MessageSquare, phone: Phone, email: Mail }[kind];
  const word = { text: "Text", phone: "Call", email: "Email" }[kind];
  // Nobody here has one: faded and dashed, like the guest and supplier cards'.
  // A household has no number of its own, so it goes to its people to add one.
  if (people.length === 0) {
    return (
      <button
        type="button"
        onClick={() => jumpTo("household-guests")}
        aria-label={kind === "email" ? "No one has an email yet: see who's in it" : "No one has a number yet: see who's in it"}
        className="flex flex-col items-center gap-1.5 text-[13px] text-stone/60"
      >
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed border-stone/30 text-stone/40">
          <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
        </span>
        {word}
      </button>
    );
  }
  const href = (value: string) =>
    kind === "email" ? `mailto:${value}` : `${kind === "text" ? "sms" : "tel"}:${value.replace(/\s+/g, "")}`;
  const circle = `flex h-[52px] w-[52px] items-center justify-center rounded-full ${
    kind === "text" ? "bg-ink text-ivory" : "border border-linen bg-white text-ink hover:border-champagne-400"
  }`;
  const face = (
    <>
      <span className={circle}>
        <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
      </span>
      {word}
    </>
  );
  const look = "flex flex-col items-center gap-1.5 text-[13px] text-ink";

  if (people.length === 1) {
    return (
      <a href={href(people[0].value)} aria-label={`${word} ${people[0].name}`} className={look}>
        {face}
      </a>
    );
  }
  return (
    <span ref={box} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={look}>
        {face}
      </button>
      {open && (
        <span className="absolute left-1/2 top-[calc(100%+8px)] z-30 block w-64 -translate-x-1/2 rounded-[20px] border border-linen bg-white px-4 py-2 text-left shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]">
          <span className="section-label block py-1">{word}</span>
          {people.map((p) => (
            <a key={p.id} href={href(p.value)} className="flex min-h-11 flex-col justify-center border-t border-linen py-2 first-of-type:border-t-0 hover:text-champagne-600">
              <span className="block truncate text-sm text-ink">{p.name}</span>
              <span className="block truncate text-xs text-stone">{p.value}</span>
            </a>
          ))}
        </span>
      )}
    </span>
  );
}

/** What a failed save says, rather than taking the page down (see guest-card.tsx). */
const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

/** "Remove this household", asking first. Its people stay on the guest list. */
function RemoveHousehold({ household, onRemoved }: { household: Household; onRemoved: () => void }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-10 text-center">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Remove ${household.name}? The people in it stay on the guest list.`)) return;
          startTransition(async () => {
            try {
              const result = await removeHouseholdAction(household.id);
              setError(result.error);
              if (!result.error) onRemoved();
            } catch {
              setError(UNSAVED);
            }
          });
        }}
        className="text-xs text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
      >
        {pending ? "Removing…" : "Remove this household"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
    </div>
  );
}

/**
 * "Add someone to this household": first, someone new (the add-a-guest form,
 * with this household picked) or someone already on the list (a quick search;
 * tap them and they move in — leaving any household they were in).
 */
function AddSomeone({
  household,
  others,
  householdName,
}: {
  household: Household;
  /** Guests not in this household. */
  others: Contact[];
  householdName: (id: string) => string | undefined;
}) {
  const [step, setStep] = useState<"closed" | "choose" | "existing">("closed");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = others
    .filter((g) => words.every((w) => fullName(g).toLowerCase().includes(w)))
    .sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }));

  const move = (guest: Contact) =>
    startTransition(async () => {
      try {
        const result = await updateGuestAction(guest.id, { household_id: household.id });
        setError(result.error);
        if (!result.error) {
          setStep("closed");
          setQuery("");
        }
      } catch {
        setError(UNSAVED);
      }
    });

  if (step === "closed") {
    return (
      <button
        type="button"
        onClick={() => setStep("choose")}
        className="mt-2 flex min-h-12 items-center gap-3 font-display text-[15px] italic text-stone hover:text-ink"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 text-champagne-600">
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </span>
        Add someone to this household
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-linen bg-white p-3">
      {step === "choose" ? (
        <>
          <p className="px-1 text-sm text-ink">Who are you adding?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={`/people/new?household=${household.id}`}
              className="flex h-12 items-center justify-center rounded-xl bg-ink px-2 text-center text-sm text-ivory hover:bg-ink/90"
            >
              Someone new
            </Link>
            <button
              type="button"
              onClick={() => setStep("existing")}
              disabled={others.length === 0}
              className="flex h-12 items-center justify-center rounded-xl border border-linen bg-white px-2 text-center text-sm text-ink hover:border-champagne-400 disabled:opacity-50"
            >
              Already on the list
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="flex h-11 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
            <Search className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a guest"
              aria-label="Find a guest"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
            />
          </label>
          <ul className="mt-2 max-h-64 overflow-y-auto">
            {matches.map((g) => {
              const from = g.household_id ? householdName(g.household_id) : undefined;
              return (
                <li key={g.id} className="border-b border-linen last:border-b-0">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => move(g)}
                    className="flex min-h-11 w-full items-center gap-3 px-1 py-2 text-left hover:text-champagne-600 disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="type-item block truncate text-[17px]">{fullName(g)}</span>
                      {from && <span className="block truncate text-xs text-stone">Now in {from} — moves here</span>}
                    </span>
                    <Plus className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
                  </button>
                </li>
              );
            })}
            {matches.length === 0 && <li className="px-1 py-3 text-sm text-stone">No one matches that.</li>}
          </ul>
        </>
      )}
      {error && <p role="alert" className="mt-2 px-1 text-sm text-ink">{error}</p>}
      <button
        type="button"
        onClick={() => {
          setStep("closed");
          setQuery("");
        }}
        className="mt-2 w-full py-1.5 text-sm text-stone underline underline-offset-4 hover:text-ink"
      >
        Cancel
      </button>
    </div>
  );
}
