"use client";

import { useId, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Household, Rsvp } from "@/types/db";
import { renameHouseholdAction, saveAddressAction } from "./household-actions";
import { editorKeys, FIELD, safely, SaveCancel, TextRow, useSaver } from "./guest-card";
import { DetailLabel } from "./guest-table";

/**
 * A household as an envelope: the top of the household card, as a guest has
 * a profile and a supplier a business card. Only the front — the name in
 * calligraphy, the address in plain italic, a fine gold border, on crisp
 * white card. How the replies stand is the line under it (`RepliesLine`); the
 * gold postmark in the corner went on 21 Oct 2026 (owner: a different vibe;
 * canvas 4 "Household · Round 1", A), and the name and address moved up.
 *
 * It used to turn over and open, with an invitation inside (14–16 Oct 2026);
 * the owner took that out on 16 Oct: the invitation is for the guest, not the
 * couple, and it only repeated the Guests list under it, a tap away.
 */
export default function HouseholdEnvelope({
  household,
  answers,
}: {
  household: Household;
  /** Each person's answer for their own event (undefined: not day or evening yet). */
  answers: (Rsvp["status"] | undefined)[];
}) {
  const lines = [household.address_line1, household.address_line2, household.city, household.postcode].filter(Boolean) as string[];
  return (
    <div
      role="img"
      aria-label={`${household.name}${lines.length ? `, ${lines.join(", ")}` : ", no address yet"}`}
      className="relative mx-auto mt-2 h-[190px] w-full max-w-[400px] rounded-md"
    >
      <Front name={household.name} lines={lines} />
    </div>
  );
}

/** How the replies stand, as the line under the envelope: "2 of 3 responded", the figures in champagne. Nothing until there's someone in it. */
export function RepliesLine({ answers }: { answers: (Rsvp["status"] | undefined)[] }) {
  const n = answers.length;
  if (n === 0) return null;
  const sent = answers.filter((a) => a === "pending" || a === "attending" || a === "declined").length;
  const replied = answers.filter((a) => a === "attending" || a === "declined").length;
  if (sent === 0) return <>Invitation not sent yet</>;
  const gold = (v: number | string) => <span className="font-medium text-champagne-600">{v}</span>;
  return replied === n ? <>All {gold(n)} responded</> : <>{gold(replied)} of {gold(n)} responded</>;
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
        <span className={`block font-script leading-none text-ink ${name.length > 16 ? "text-[28px]" : "text-[36px]"}`}>{name}</span>
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

/**
 * The household's name and address as Details rows, laid out like the guest
 * card's: the small icon and label on the left, the value on the right, tap
 * to change it.
 */
export function HouseholdDetails({ household }: { household: Household }) {
  // Inside the Details fold (owner, 23 Oct 2026); the envelope's tap jumps to `household-details`, opening it first.
  return (
    <dl id="household-details">
      <TextRow label="Name" value={household.name} onSave={(v) => safely(() => renameHouseholdAction(household.id, v))} />
      <AddressRow household={household} />
    </dl>
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
              <button
                type="button"
                onClick={copy}
                aria-label={copied ? "Address copied" : "Copy address"}
                title="Copy address"
                className="mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-champagne-600 hover:bg-white/70 hover:text-ink"
              >
                {copied ? <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> : <Copy className="h-4 w-4" strokeWidth={1.7} aria-hidden />}
              </button>
            )}
          </div>
        )}
      </dd>
    </div>
  );
}
