"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { Contact, Household, WeddingEvent } from "@/types/db";
import { eventWord } from "./guest-browser";
import { formatLongDate } from "@/lib/dates";
import { renameHouseholdAction, saveAddressAction } from "./household-actions";
import { editorKeys, FIELD, safely, SaveCancel, TextRow, useSaver } from "./guest-card";
import { DetailLabel } from "./guest-table";

/**
 * A household as an envelope (canvas 3 "Household · Round 3 · Turn it over",
 * owner's pick 14 Oct 2026; households get an envelope as suppliers get a
 * business card and guests a place card). The front is only the address: the
 * name in calligraphy, the address in plain italic, a fine gold border, on
 * crisp white card with a few flecks. Tap it and it turns over, the flap
 * opens and the invitation slides out: the household's name and who's in it
 * (owner, 16 Oct 2026: just the list — the name had been on it three times).
 * Tapping the envelope again slides it in, closes the flap and turns it to
 * the front (no "Put it back" button). The name and address are changed in
 * `HouseholdDetails`, the card's Details rows.
 *
 * How it moves: the turn is a 3D flip of two faces. Once it's over, the flip
 * is swapped for a flat back (body, flap, invitation) that looks the same, so
 * the invitation can sit between the envelope's pocket and its flap — which
 * a 3D flip can't layer. "Reduce motion" skips the movement.
 */
export default function HouseholdEnvelope({
  household,
  people,
  events,
  ownEvent,
  onOpenGuest,
}: {
  household: Household;
  people: Contact[];
  events: WeddingEvent[];
  ownEvent: (g: Contact) => WeddingEvent | undefined;
  onOpenGuest: (id: string) => void;
}) {
  // turned: the faces are rotated; flat: the flat back is showing; open: flap up, invitation out.
  const [turned, setTurned] = useState(false);
  const [flat, setFlat] = useState(false);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const card = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(300);
  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const measure = () => setCardHeight(el.offsetHeight);
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, [flat]);

  const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const openIt = () => {
    if (busy.current || turned) return;
    busy.current = true;
    const quick = calm();
    setTurned(true);
    later(quick ? 0 : 640, () => setFlat(true));
    later(quick ? 20 : 700, () => {
      setOpen(true);
      busy.current = false;
    });
  };
  const closeIt = () => {
    if (busy.current) return;
    busy.current = true;
    const quick = calm();
    setOpen(false);
    later(quick ? 0 : 500, () => setFlat(false));
    later(quick ? 20 : 560, () => {
      setTurned(false);
      busy.current = false;
    });
  };

  const lines = [household.address_line1, household.address_line2, household.city, household.postcode].filter(Boolean) as string[];
  const ENVELOPE = 236;
  const TUCKED = 28; // how much of the invitation stays in the pocket when it's out (only its bottom margin)

  return (
    <div
      className="relative mx-auto mt-4 w-full max-w-[400px] transition-[height] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
      style={{ height: open ? cardHeight + ENVELOPE - TUCKED : ENVELOPE }}
    >
      {!flat && (
        <div className="absolute inset-x-0 bottom-0 z-[2] [perspective:1400px]" style={{ height: ENVELOPE }}>
          <button
            type="button"
            onClick={openIt}
            aria-label={`${household.name}${lines.length ? `, ${lines.join(", ")}` : ""}. Open the envelope`}
            className="absolute inset-0 block rounded-md text-left transition-transform duration-[620ms] ease-[cubic-bezier(.45,.05,.25,1)] [transform-style:preserve-3d] motion-reduce:transition-none"
            style={{ transform: `rotateY(${turned ? 180 : 0}deg)` }}
          >
            <Front name={household.name} lines={lines} />
            <span className="absolute inset-0 block rounded-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <Paper />
              <Seams />
              <Flap seal={household.name} />
            </span>
          </button>
        </div>
      )}

      {flat && (
        <>
          <div
            ref={card}
            className="absolute inset-x-3.5 z-[1] transition-[bottom,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
            style={{ bottom: open ? ENVELOPE - TUCKED : 8, opacity: open ? 1 : 0 }}
          >
            <Invitation household={household} people={people} events={events} ownEvent={ownEvent} onOpenGuest={onOpenGuest} />
          </div>
          <button
            type="button"
            onClick={closeIt}
            aria-label="Put the invitation back and turn the envelope over"
            className="absolute inset-x-0 bottom-0 z-[2] block rounded-md"
            style={{ height: ENVELOPE }}
          >
            <Paper />
            <Seams />
          </button>
          <div
            className="pointer-events-none absolute inset-x-0 transition-[transform,z-index] duration-[360ms] ease-[cubic-bezier(.3,.7,.3,1)] [transform-origin:50%_0] motion-reduce:transition-none"
            style={{ bottom: ENVELOPE - 104, height: 104, zIndex: open ? 0 : 3, transform: `rotateX(${open ? 180 : 0}deg)`, transitionDelay: "0ms, 180ms" }}
          >
            <Flap />
          </div>
        </>
      )}
    </div>
  );
}

/** Crisp white card with a fine shadow and the odd fleck, like good cotton card. */
function Paper() {
  const id = `fleck${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <span aria-hidden className="absolute inset-0 block overflow-hidden rounded-md bg-white shadow-[0_30px_40px_-26px_rgb(60_45_20/0.6),0_2px_4px_-2px_rgb(60_45_20/0.18),0_0_0_1px_#E9DFCC]">
      <svg className="absolute inset-0 h-full w-full mix-blend-multiply">
        <filter id={id} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={2} seed={4} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.47  0 0 0 0 0.42  0 0 0 11 -8.4" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </span>
  );
}

/** The front: the name in calligraphy, the address in plain italic, a gold double border. */
function Front({ name, lines }: { name: string; lines: string[] }) {
  return (
    <span className="absolute inset-0 block rounded-md [backface-visibility:hidden]">
      <Paper />
      <span aria-hidden className="absolute inset-[9px] rounded-[3px] border border-[#C9B07E]" />
      <span aria-hidden className="absolute inset-[13px] rounded-[2px] border-[0.5px] border-[#E2D3B4]" />
      <span className="absolute inset-x-6 top-1/2 block -translate-y-1/2 text-center">
        <span className={`block font-script leading-none text-ink ${name.length > 18 ? "text-[32px]" : "text-[42px]"}`}>{name}</span>
        <span aria-hidden className="mx-auto my-2 block h-px w-12 bg-[#C9B07E]" />
        {lines.length > 0 ? (
          <span className="block font-display text-base italic leading-[1.4] text-[#2E2924]">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        ) : (
          <span className="block font-display text-[15px] italic text-stone">No address yet</span>
        )}
      </span>
    </span>
  );
}

/** The back's fold: a line from each bottom corner up to the flap's tip, so with the flap's own edges they make one cross. */
function Seams() {
  return (
    <svg aria-hidden viewBox="0 0 342 236" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      <path d="M1 235 L171 103 L341 235" fill="none" stroke="#E2D5BC" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** The flap; with `seal`, the wax seal at its tip carries the name's first letter. */
function Flap({ seal }: { seal?: string }) {
  const letter = seal?.replace(/^the\s+/i, "").trim().charAt(0).toUpperCase();
  return (
    <span aria-hidden className="absolute inset-x-0 top-0 block h-[104px]">
      <svg viewBox="0 0 342 104" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M0.5 0.5 L171 103 L341.5 0.5 Z" fill="#FFFFFF" stroke="#E2D5BC" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {seal && (
        <span className="absolute left-1/2 top-[83px] flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center rounded-full bg-champagne-400 shadow-[inset_0_0_0_4px_#B8914F,inset_0_0_0_5px_#E9D9B4]">
          <span className="font-display text-base italic text-[#FFFDF8]">{letter}</span>
        </span>
      )}
    </span>
  );
}

/** The card inside: the household's name, then who's in it — tap a name for their card. */
function Invitation({
  household,
  people,
  events,
  ownEvent,
  onOpenGuest,
}: {
  household: Household;
  people: Contact[];
  events: WeddingEvent[];
  ownEvent: (g: Contact) => WeddingEvent | undefined;
  onOpenGuest: (id: string) => void;
}) {
  const theirs = events.filter((e) => people.some((p) => ownEvent(p)?.id === e.id));
  // Everyone invited to the same part: say it once. Mixed: each evening guest says so.
  const one = theirs.length === 1 ? theirs[0] : undefined;
  const mixed = theirs.length > 1;
  return (
    <div className="relative rounded px-[22px] pb-10 pt-6 text-center shadow-[0_0_0_1px_#E6DCC8,0_-10px_24px_-18px_rgb(60_45_20/0.5)]">
      <Paper />
      <span aria-hidden className="pointer-events-none absolute inset-[7px] rounded-sm border border-[#D8C7A4]" />
      <div className="relative">
        <p className={`font-script leading-none text-ink ${household.name.length > 18 ? "text-[28px]" : "text-[34px]"}`}>{household.name}</p>
        <span aria-hidden className="mx-auto mb-2 mt-3 block h-px w-10 bg-[#D8C7A4]" />
        {people.length === 0 ? (
          <p className="font-display text-[15px] italic text-stone">No one in it yet</p>
        ) : (
          <ul>
            {people.map((p) => {
              const own = ownEvent(p);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onOpenGuest(p.id)}
                    className="min-h-9 w-full font-display text-[19px] italic leading-tight text-ink hover:text-champagne-600"
                  >
                    {p.first_name} {p.last_name}
                    {mixed && own && own.id !== theirs[0].id && (
                      <span className="ml-1.5 text-[14px] text-champagne-600">{eventWord(own)}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {one && (
          <p className="mt-2 text-[13px] text-stone">
            to <em className="font-display text-champagne-600">{one.name.replace(/^\w/, (c) => c.toLowerCase())}</em>
            {one.starts_at && ` · ${formatLongDate(one.starts_at.slice(0, 10))}`}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The household's name and address as Details rows, laid out like the guest
 * card's: the small icon and label on the left, the value on the right, tap
 * to change it.
 */
export function HouseholdDetails({ household }: { household: Household }) {
  return (
    <section className="mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6">
      <h3 className="label">Details</h3>
      <dl className="mt-1">
        <TextRow label="Name" value={household.name} onSave={(v) => safely(() => renameHouseholdAction(household.id, v))} />
        <AddressRow household={household} />
      </dl>
    </section>
  );
}

/** Where the envelope goes: tap to change it; Copy for writing it out. */
function AddressRow({ household }: { household: Household }) {
  const lines = [household.address_line1, household.address_line2, household.city, household.postcode].filter(Boolean) as string[];
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { pending, error, setError, run } = useSaver();
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
  const submit = () => run(() => saveAddressAction(household.id, draft), () => setEditing(false));
  const keys = editorKeys(submit, () => setEditing(false));

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
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5">
        <DetailLabel label="Address" />
      </dt>
      <dd className="min-w-0">
        {editing ? (
          <form
            className="space-y-2 py-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <input autoFocus value={draft.address_line1} onChange={(e) => setDraft({ ...draft, address_line1: e.target.value })} onKeyDown={keys} placeholder="House and street" aria-label="House and street" className={FIELD} />
            <input value={draft.address_line2} onChange={(e) => setDraft({ ...draft, address_line2: e.target.value })} onKeyDown={keys} placeholder="Second line (optional)" aria-label="Second line" className={FIELD} />
            <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} onKeyDown={keys} placeholder="Town" aria-label="Town" className={FIELD} />
            <input value={draft.postcode} onChange={(e) => setDraft({ ...draft, postcode: e.target.value.toUpperCase() })} onKeyDown={keys} placeholder="Postcode" aria-label="Postcode" className={FIELD} />
            {error && <p role="alert" className="text-sm text-ink">{error}</p>}
            <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
          </form>
        ) : (
          <div className="flex items-start gap-3">
            <button type="button" onClick={start} className="block min-h-11 min-w-0 flex-1 py-3 text-left text-[15px] leading-snug text-ink hover:text-champagne-600">
              {lines.length ? (
                lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))
              ) : (
                <span className="text-stone/70">Add address</span>
              )}
            </button>
            {lines.length > 0 && (
              <button type="button" onClick={copy} className="mt-2.5 h-8 shrink-0 text-xs text-champagne-600 underline underline-offset-[3px] hover:text-ink">
                {copied ? "Copied ✓" : "Copy"}
              </button>
            )}
          </div>
        )}
      </dd>
    </div>
  );
}
