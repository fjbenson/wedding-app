"use client";

import { useState } from "react";
import { CircleCheck, Hourglass, NotebookPen, X } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { AreaTiles, BARE, CARD, DateCard, Folded, Line, Part, TITLE_INPUT, Tiles } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import { todayISO } from "@/lib/dates";
import { withCommas } from "@/lib/money";
import type { Contribution } from "@/types/db";

const ARRIVED_TILES = [
  { value: "no", label: "Promised", icon: Hourglass },
  { value: "yes", label: "Arrived", icon: CircleCheck },
];

/** One-tap names for the usual givers; anything can be typed instead. */
const IDEAS = ["Us", "Mum and Dad", "Grandparents"];

/**
 * Add or change one gift towards the wedding (who's paying for what, owner
 * 17 Oct 2026). Who it's from is typed — "Us", "Mum and Dad" — and as you
 * type, matching guests come up to tap, so it can be linked to someone on
 * the guest list (optional: a name is enough). Then the amount large,
 * Promised · Arrived, and what it's towards (an area, or the whole wedding).
 */
export default function ContributionForm({
  action,
  contribution,
  guests,
  areas,
}: {
  action: (formData: FormData) => void | Promise<void>;
  contribution?: Contribution;
  /** The guest list's names, for the suggestions. Never leaves the screen. */
  guests: { id: string; name: string }[];
  areas: AreaOption[];
}) {
  const [name, setName] = useState(contribution?.name ?? "");
  const [contact, setContact] = useState(contribution?.contact_id ?? "");
  const [amount, setAmount] = useState(contribution ? withCommas(String(contribution.amount)) : "");
  const [arrived, setArrived] = useState(contribution?.received_on ? "yes" : "no");
  const [receivedOn, setReceivedOn] = useState(contribution?.received_on ?? todayISO());
  const [area, setArea] = useState(contribution?.area_key ?? "");
  const linked = guests.find((g) => g.id === contact);

  // Guests whose name has every word typed, up to five; none once one's picked.
  const words = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches =
    linked || words.length === 0 ? [] : guests.filter((g) => words.every((w) => g.name.toLowerCase().includes(w))).slice(0, 5);

  const chip = (label: string, onClick: () => void, on = false) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] transition ${
        on ? "border-champagne-600 bg-champagne-100 text-champagne-600" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form action={action}>
      <input type="hidden" name="contact" value={contact} />
      <input
        name="name"
        required
        autoFocus={!contribution}
        autoComplete="off"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          // Changing the name lets go of the guest it was linked to.
          if (linked && e.target.value !== linked.name) setContact("");
        }}
        aria-label="Who's it from?"
        placeholder="Who's it from?"
        className={TITLE_INPUT}
      />
      {linked ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-stone">
          On the guest list
          <button
            type="button"
            onClick={() => setContact("")}
            aria-label={`Unlink ${linked.name} from the guest list`}
            className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 font-medium text-champagne-600"
          >
            {linked.name}
            <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
          </button>
        </p>
      ) : matches.length > 0 ? (
        <div className="mt-3">
          <p className="type-meta">From the guest list</p>
          <div className="-mx-[var(--gutter)] mt-1.5 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 [scrollbar-width:none]">
            {matches.map((g) =>
              chip(g.name, () => {
                setName(g.name);
                setContact(g.id);
              }),
            )}
          </div>
        </div>
      ) : (
        !contribution && (
          <div className="-mx-[var(--gutter)] mt-3 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 [scrollbar-width:none]">
            {IDEAS.map((i) => chip(i, () => setName(i), name === i))}
          </div>
        )
      )}

      <Part label="How much">
        <label className={`${CARD} flex items-baseline gap-1.5 px-5 py-3`}>
          <span className="font-display text-[32px] font-light text-stone">£</span>
          <input
            name="amount"
            required
            inputMode="decimal"
            autoComplete="off"
            aria-label="Amount"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(withCommas(e.target.value))}
            className="w-full min-w-0 bg-transparent font-display !text-[44px] font-light leading-tight tracking-[-0.02em] text-ink placeholder:text-stone/40 focus:outline-none"
          />
        </label>
      </Part>

      <Part label="Arrived yet?">
        <Tiles name="arrived" options={ARRIVED_TILES} value={arrived} onChange={setArrived} columns="grid-cols-2" />
        {arrived === "yes" && (
          <div className="mt-4">
            <p className="type-meta">The day it arrived</p>
            <DateCard name="received_on" value={receivedOn} onChange={setReceivedOn} quick={false} clearable={false} />
          </div>
        )}
      </Part>

      <Part label="Towards (optional)">
        {/* No area: towards the wedding as a whole. */}
        <AreaTiles name="area" areas={areas} otherValue="other" value={area} onChange={setArea} optional folded={!!contribution?.area_key} />
      </Part>

      <Folded label="Add notes" open={!!contribution?.notes}>
        <section className="mt-7">
          <h2 className="section-label font-body">Notes</h2>
          <div className={CARD}>
            <Line icon={NotebookPen} label="Notes" top>
              <textarea
                name="notes"
                rows={3}
                defaultValue={contribution?.notes ?? ""}
                placeholder="e.g. Paying the venue direct in March"
                className={`${BARE} w-full resize-none`}
              />
            </Line>
          </div>
        </section>
      </Folded>

      <SubmitBar label={contribution ? "Save changes" : "Add it"} whenChanged={!!contribution} />
    </form>
  );
}
