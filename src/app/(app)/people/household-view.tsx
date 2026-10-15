"use client";

import { ownNeeds } from "@/lib/dietary";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Mail, MessageSquare, Phone, Plus, Search } from "lucide-react";
import type { Contact, Household, Rsvp, WeddingEvent } from "@/types/db";
import GuestCard from "./guest-card";
import { eventWord } from "./guest-browser";
import { fullName, initials } from "./guest-table";
import { removeHouseholdAction } from "./household-actions";
import HouseholdEnvelope from "./household-envelope";
import type { GroupSummary } from "./guest-groups";
import { updateGuestAction } from "./actions";
import type { TravelInfo } from "./guest-travel";

/**
 * One household (screen 9). Since 14 Oct 2026 topped by its envelope
 * (`household-envelope.tsx`, canvas 3 "Household · Round 3"): the address on
 * the front, the invitation and answers inside. Then Text · Call · Email, and
 * who's in it — the guest list's own rows, opening each person's card right
 * here.
 */
export default function HouseholdView({
  household,
  households,
  guests,
  events,
  rsvps,
  tables,
  travel,
  groups,
}: {
  household: Household;
  /** Every household, for moving someone on their card. */
  households: { id: string; name: string }[];
  guests: Contact[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  tables: Record<string, string>;
  travel?: TravelInfo;
  groups: GroupSummary[];
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
    <main className="page pb-28 lg:pb-16">
      <div className="flex items-center justify-between gap-3">
        <Link href="/people" aria-label="Back to the guest list" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-cream">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.6} aria-hidden />
        </Link>
        <span className="label">Household</span>
        <span className="w-11" aria-hidden />
      </div>

      <HouseholdEnvelope
        household={household}
        people={people}
        events={events}
        ownEvent={ownEvent}
        statusOf={statusOf}
        onOpenGuest={setOpenId}
      />
      <p className="mt-3.5 text-center text-[13px] text-stone">{summary}</p>

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

      {/* Who's in it, on a card of its own (canvas 3 "Household · Round 3"). */}
      <section className="mt-7 rounded-[22px] border border-white/85 bg-white/60 px-5 pb-1.5 pt-4 shadow-[0_18px_40px_-28px_rgb(60_45_20/0.4)] backdrop-blur-xl">
        <div className="flex items-baseline justify-between">
          <h2 className="label">Who&apos;s in it</h2>
          <span className="text-xs text-stone">{people.length}</span>
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
                  <ChevronRight className="h-4 w-4 shrink-0 text-champagne-400" strokeWidth={1.8} aria-hidden />
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

      <RemoveHousehold household={household} />

      {open && (
        <GuestCard
          guest={open}
          household={{ id: household.id, name: household.name }}
          households={households}
          events={events}
          rsvps={answersOf(open)}
          table={tables[open.id] ?? null}
          travel={travel}
          groups={groups}
          ownNeeds={ownNeeds(rsvps.map((r) => r.dietary_notes))}
          onClose={close}
        />
      )}
    </main>
  );
}

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

  if (people.length === 0) return null;
  const Icon = { text: MessageSquare, phone: Phone, email: Mail }[kind];
  const word = { text: "Text", phone: "Call", email: "Email" }[kind];
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
function RemoveHousehold({ household }: { household: Household }) {
  const router = useRouter();
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
              if (!result.error) router.push("/people");
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
        className="mt-3 flex min-h-12 items-center gap-3 px-5 font-display text-[15px] italic text-stone hover:text-ink"
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
