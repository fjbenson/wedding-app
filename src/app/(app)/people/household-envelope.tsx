"use client";

import { useId, useState } from "react";
import type { Household, Rsvp } from "@/types/db";
import { renameHouseholdAction, saveAddressAction } from "./household-actions";
import { editorKeys, FIELD, safely, SaveCancel, TextRow, useSaver } from "./guest-card";
import { DetailLabel } from "./guest-table";

/**
 * A household as an envelope: the top of the household card, as a guest has
 * a profile and a supplier a business card. Only the front — the name in
 * calligraphy, the address in plain italic, a fine gold border, on crisp
 * white card — with a gold **postmark** saying how the replies stand.
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
  const mark = postmark(answers);
  return (
    <div
      role="img"
      aria-label={`${household.name}${lines.length ? `, ${lines.join(", ")}` : ", no address yet"}${mark ? `. ${mark.say}` : ""}`}
      className="relative mx-auto mt-2 h-[220px] w-full max-w-[400px] rounded-md"
    >
      <Front name={household.name} lines={lines} />
      {mark && <Postmark top={mark.top} main={mark.main} />}
    </div>
  );
}

/** How the replies stand, for the postmark: nothing until there's someone in it. */
function postmark(answers: (Rsvp["status"] | undefined)[]) {
  const n = answers.length;
  if (n === 0) return null;
  const sent = answers.filter((a) => a === "pending" || a === "attending" || a === "declined").length;
  const replied = answers.filter((a) => a === "attending" || a === "declined").length;
  const coming = answers.filter((a) => a === "attending").length;
  if (sent === 0) return { top: "Invite", main: "Not sent", say: "Invitation not sent yet" };
  if (coming === n) return { top: "All", main: "Coming", say: "Everyone's coming" };
  if (replied === n) return { top: "Replied", main: `All ${n}`, say: `All ${n} have replied` };
  return { top: "Replied", main: `${replied} of ${n}`, say: `${replied} of ${n} have replied` };
}

/** A round gold postmark in the corner, slightly askew, with its wavy lines. */
function Postmark({ top, main }: { top: string; main: string }) {
  return (
    <span aria-hidden className="absolute right-[18px] top-[18px] flex rotate-[-8deg] items-center">
      <svg viewBox="0 0 40 24" className="mr-[-5px] h-5 w-8 text-[#C9B07E]">
        <path d="M0 5 q5 -4 10 0 t10 0 t10 0 t10 0 M0 12 q5 -4 10 0 t10 0 t10 0 t10 0 M0 19 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full border-[1.5px] border-[#B8914F] text-champagne-600 shadow-[inset_0_0_0_3px_#FFFFFF,inset_0_0_0_4px_#D8C7A4]">
        <span className="font-body text-[7.5px] font-semibold uppercase tracking-[0.16em]">{top}</span>
        <span className="mt-0.5 whitespace-nowrap font-display text-[11px] italic leading-none">{main}</span>
      </span>
    </span>
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
      <span className="absolute inset-x-6 top-[63%] block -translate-y-1/2 text-center">
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
