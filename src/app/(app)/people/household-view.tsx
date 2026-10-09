"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, Copy, Mail, MapPin, Pencil, Phone, Plus, Search } from "lucide-react";
import type { Contact, Household, Rsvp, WeddingEvent } from "@/types/db";
import GuestCard from "./guest-card";
import { GuestRow, eventWord } from "./guest-browser";
import { fullName } from "./guest-table";
import { renameHouseholdAction, saveAddressAction } from "./household-actions";
import { updateGuestAction } from "./actions";

/**
 * One household (screen 9), settled on the canvas as "Household · Round 1",
 * option A with phone and email in the top corner (9 Oct 2026): where the
 * envelope goes, and who's in it — the guest list's own rows, opening each
 * person's card right here.
 */
export default function HouseholdView({
  household,
  households,
  guests,
  events,
  rsvps,
}: {
  household: Household;
  /** Every household, for moving someone on their card. */
  households: { id: string; name: string }[];
  guests: Contact[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
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
        <span className="flex gap-2">
          <ContactMenu
            kind="phone"
            people={people.filter((p) => p.phone).map((p) => ({ id: p.id, name: fullName(p), value: p.phone! }))}
          />
          <ContactMenu
            kind="email"
            people={people.filter((p) => p.email).map((p) => ({ id: p.id, name: fullName(p), value: p.email! }))}
          />
        </span>
      </div>

      <HouseholdName household={household} />
      <p className="type-meta mt-2">{summary}</p>

      <AddressCard household={household} />

      <div className="mt-8 flex items-baseline justify-between border-b border-champagne-400 px-1 pb-1.5">
        <h2 className="label">Who&apos;s in it</h2>
        <span className="text-xs text-stone">{people.length}</span>
      </div>
      {people.length === 0 ? (
        <p className="mt-4 px-1 text-sm text-stone">No one in this household yet.</p>
      ) : (
        <ul>
          {people.map((g) => (
            <li key={g.id} className="border-b-[0.5px] border-champagne-400">
              <GuestRow guest={g} event={ownEvent(g)} status={statusOf(g)} showEvent onOpen={() => setOpenId(g.id)} />
            </li>
          ))}
        </ul>
      )}
      <AddSomeone
        household={household}
        others={guests.filter((g) => g.household_id !== household.id)}
        householdName={(id) => households.find((h) => h.id === id)?.name}
      />

      <p className="mt-10 text-center">
        <Link href={`/people/household/${household.id}/edit`} className="text-xs text-stone underline underline-offset-4 hover:text-ink">
          Remove this household
        </Link>
      </p>

      {open && (
        <GuestCard
          guest={open}
          household={{ id: household.id, name: household.name }}
          households={households}
          events={events}
          rsvps={answersOf(open)}
          onClose={close}
        />
      )}
    </main>
  );
}

/**
 * Phone or email for the household. A household has no number of its own, so
 * this reaches its people: one with a number and the button goes straight to
 * them; several and it asks who. Hidden when no one has one.
 */
function ContactMenu({ kind, people }: { kind: "phone" | "email"; people: { id: string; name: string; value: string }[] }) {
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
  const Icon = kind === "phone" ? Phone : Mail;
  const label = kind === "phone" ? "Call or text" : "Email";
  const href = (value: string) => (kind === "phone" ? `tel:${value.replace(/\s+/g, "")}` : `mailto:${value}`);
  const button = "flex h-11 w-11 items-center justify-center rounded-full border border-linen bg-white text-ink hover:border-champagne-400";

  if (people.length === 1) {
    return (
      <a href={href(people[0].value)} aria-label={`${label} ${people[0].name}`} className={button}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />
      </a>
    );
  }
  return (
    <span ref={box} className="relative">
      <button type="button" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)} className={button}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />
      </button>
      {open && (
        <span className="absolute right-0 top-[calc(100%+8px)] z-30 block w-64 rounded-[20px] border border-linen bg-white px-4 py-2 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]">
          <span className="section-label block py-1">{kind === "phone" ? "Call" : "Email"}</span>
          {people.map((p) => (
            <span key={p.id} className="flex min-h-11 items-center gap-2 border-t border-linen first:border-t-0">
              <a href={href(p.value)} className="min-w-0 flex-1 py-2 hover:text-champagne-600">
                <span className="block truncate text-sm text-ink">{p.name}</span>
                <span className="block truncate text-xs text-stone">{p.value}</span>
              </a>
              {kind === "phone" && (
                <a href={`sms:${p.value.replace(/\s+/g, "")}`} className="text-xs text-stone underline underline-offset-4 hover:text-ink">
                  Text
                </a>
              )}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

const FIELD =
  "w-full rounded-xl border border-linen bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30";

/** Where the envelope goes: Copy for writing it out, tap the address to change it. */
function AddressCard({ household }: { household: Household }) {
  const lines = [household.address_line1, household.address_line2, household.city, household.postcode].filter(Boolean) as string[];
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState({ address_line1: "", address_line2: "", city: "", postcode: "" });

  const start = () => {
    setDraft({
      address_line1: household.address_line1 ?? "",
      address_line2: household.address_line2 ?? "",
      city: household.city ?? "",
      postcode: household.postcode ?? "",
    });
    setError(undefined);
    setEditing(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText([household.name, ...lines].join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Some browsers won't let a page copy; the address is there to select by hand.
    }
  };

  return (
    <section className="mt-6 rounded-[22px] border border-white/85 bg-white/45 px-[18px] py-4 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-label flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-champagne-600" strokeWidth={1.8} aria-hidden />
          Address
        </h2>
        {lines.length > 0 && !editing && (
          <button type="button" onClick={copy} className="flex h-8 items-center gap-1.5 rounded-full border border-linen bg-white px-3 text-[13px] text-ink hover:border-champagne-400">
            {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {editing ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              try {
                const result = await saveAddressAction(household.id, draft);
                setError(result.error);
                if (!result.error) setEditing(false);
              } catch {
                setError("That didn't save — the app may have just been updated. Pull down to refresh, then try again.");
              }
            });
          }}
        >
          <input autoFocus value={draft.address_line1} onChange={(e) => setDraft({ ...draft, address_line1: e.target.value })} placeholder="House and street" aria-label="House and street" className={FIELD} />
          <input value={draft.address_line2} onChange={(e) => setDraft({ ...draft, address_line2: e.target.value })} placeholder="Second line (optional)" aria-label="Second line" className={FIELD} />
          <div className="grid grid-cols-[1fr_8rem] gap-2">
            <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="Town" aria-label="Town" className={FIELD} />
            <input value={draft.postcode} onChange={(e) => setDraft({ ...draft, postcode: e.target.value.toUpperCase() })} placeholder="Postcode" aria-label="Postcode" className={FIELD} />
          </div>
          {error && <p role="alert" className="text-sm text-ink">{error}</p>}
          <span className="flex items-center gap-2 pt-1">
            <button type="submit" disabled={pending} className="h-9 rounded-full bg-ink px-4 text-sm text-ivory hover:bg-ink/90 disabled:opacity-60">
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="h-9 px-2 text-sm text-stone underline underline-offset-4 hover:text-ink">
              Cancel
            </button>
          </span>
        </form>
      ) : (
        <button type="button" onClick={start} className="mt-2.5 block w-full text-left">
          {lines.length > 0 ? (
            <address className="text-base not-italic leading-relaxed text-ink">
              {lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            <span className="block text-[15px] text-champagne-600">Add their address — you&apos;ll need it for the invitation.</span>
          )}
          {lines.length > 0 && <span className="mt-1.5 block text-xs text-stone">Tap to change</span>}
        </button>
      )}
    </section>
  );
}

/** What a failed save says, rather than taking the page down (see guest-card.tsx). */
const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

/** The household's name, large; tap it to change it in place. */
function HouseholdName({ household }: { household: Household }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(household.name);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setName(household.name);
          setError(undefined);
          setEditing(true);
        }}
        aria-label={`${household.name} — change name`}
        className="group mt-3 block text-left"
      >
        <span className="type-display text-[40px] leading-[1.05] tracking-[-0.02em]">{household.name}</span>
        <Pencil className="ml-2 inline h-4 w-4 align-baseline text-stone/60 group-hover:text-ink" strokeWidth={1.6} aria-hidden />
      </button>
    );
  }
  return (
    <form
      className="mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            const result = await renameHouseholdAction(household.id, name);
            setError(result.error);
            if (!result.error) setEditing(false);
          } catch {
            setError(UNSAVED);
          }
        });
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        aria-label="Household name"
        placeholder="e.g. The Bensons"
        className={FIELD}
      />
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      <span className="mt-2 flex items-center gap-2">
        <button type="submit" disabled={pending} className="h-9 rounded-full bg-ink px-4 text-sm text-ivory hover:bg-ink/90 disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="h-9 px-2 text-sm text-stone underline underline-offset-4 hover:text-ink">
          Cancel
        </button>
      </span>
    </form>
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
        className="mt-4 inline-flex items-center gap-1.5 px-1 text-sm text-champagne-600 hover:text-ink"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
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
