"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import { GUEST_ROLES } from "@/lib/guest-roles";
import type { Household, WeddingEvent } from "@/types/db";

/** The handful of roles shown straight away; the rest wait behind "More" (as on the guest card). */
const COMMON_ROLES = ["Maid of honour", "Bridesmaid", "Best man", "Groomsman"];

/** A small down-arrow for the household picker, as on the guest card. */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B655E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const FIELD =
  "w-full rounded-xl border border-linen bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30";

/**
 * Adding a guest, laid out like their card once they're on the list
 * (guest-card.tsx): their name, Guest of, Role on the day, then Details
 * under a line. Editing happens on the card, so this form only adds.
 */
export default function GuestForm({
  action,
  households,
  events = [],
  defaultHousehold,
}: {
  action: (formData: FormData) => void | Promise<void>;
  households: Household[];
  /** Which event they're a guest of. The day includes the evening. */
  events?: Pick<WeddingEvent, "id" | "name">[];
  /** Adding from a household's page: start in that household, and go back there. */
  defaultHousehold?: string;
}) {
  // Not in a household unless they're being added to one (owner's call, 9 Oct 2026).
  const [household, setHousehold] = useState(defaultHousehold ?? "none");
  const [moreRoles, setMoreRoles] = useState(false);
  const [child, setChild] = useState(false);

  const word = (name: string) => name.replace(/^the\s+/i, "").replace(/^\w/, (c) => c.toUpperCase());
  const rest = GUEST_ROLES.filter((r) => !COMMON_ROLES.includes(r));

  const rolePill = (role: string, hidden = false) => (
    <label key={role} className={`cursor-pointer ${hidden ? "hidden" : ""}`}>
      <input type="checkbox" name="roles" value={role} className="peer sr-only" />
      <span className="flex h-9 items-center rounded-full border border-linen bg-white px-3.5 text-[13px] text-ink transition peer-checked:border-champagne-600 peer-checked:bg-champagne-100 peer-checked:font-medium peer-checked:text-champagne-600 peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400">
        {role}
      </span>
    </label>
  );

  return (
    <form action={action}>
      {defaultHousehold && <input type="hidden" name="return_to" value={`/people/household/${defaultHousehold}`} />}

      <div className="grid grid-cols-2 gap-2">
        <input name="first_name" required autoFocus aria-label="First name" placeholder="First name" className={FIELD} />
        <input name="last_name" aria-label="Last name" placeholder="Last name" className={FIELD} />
      </div>

      {events.length > 0 && (
        <fieldset className="mt-6">
          <legend className="section-label">Guest of</legend>
          <div className="mt-2.5 grid auto-cols-fr grid-flow-col gap-0.5 rounded-2xl bg-cream p-[3px]">
            {events.map((e, i) => (
              <label key={e.id} className="cursor-pointer">
                <input type="radio" name="event_id" value={e.id} defaultChecked={i === 0} className="peer sr-only" />
                <span className="flex h-10 items-center justify-center rounded-xl px-1 text-[13px] text-stone transition hover:text-ink peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-[0_1px_4px_rgb(60_50_40/0.14)] peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400">
                  {word(e.name)}
                </span>
              </label>
            ))}
          </div>
          {events.length > 1 && (
            <p className="mt-2 text-xs text-stone">{word(events[0].name)} guests come to the {events.slice(1).map((e) => word(e.name).toLowerCase()).join(" and ")} too.</p>
          )}
        </fieldset>
      )}

      <fieldset className="mt-6 -mx-5 border-t border-linen px-5 pt-6">
        <legend className="sr-only">Role on the day</legend>
        <p aria-hidden className="section-label">Role on the day</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {COMMON_ROLES.map((r) => rolePill(r))}
          {/* The rest stay in the form when folded away, so ticks aren't lost. */}
          {rest.map((r) => rolePill(r, !moreRoles))}
          <button
            type="button"
            aria-expanded={moreRoles}
            onClick={() => setMoreRoles((m) => !m)}
            className="flex h-9 items-center gap-1 rounded-full border border-dashed border-champagne-400 px-3.5 text-[13px] text-champagne-600 hover:bg-champagne-100"
          >
            {moreRoles ? "Less" : "More"}
            <ChevronDown className={`h-3.5 w-3.5 transition ${moreRoles ? "rotate-180" : ""}`} strokeWidth={1.8} aria-hidden />
          </button>
        </div>
        <input
          name="custom_role"
          placeholder="Your own, e.g. Chief dog handler"
          aria-label="Their own role"
          className={`${FIELD} mt-3 ${moreRoles ? "" : "hidden"}`}
        />
      </fieldset>

      <section className="mt-6 -mx-5 border-t border-linen px-5 pt-6">
        <h2 className="section-label">Details</h2>
        <div className="mt-1">
          <Row label="Household">
            <select
              name="household"
              aria-label="Household"
              value={household}
              onChange={(event) => setHousehold(event.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent bg-[length:14px] bg-[right_2px_center] bg-no-repeat py-1.5 pr-6 text-[15px] text-ink focus:outline-none"
              style={{ backgroundImage: CHEVRON }}
            >
              <option value="none">Not in a household</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
              {/* Last, so it's the odd one out. (Phones draw this list themselves and won't colour it.) */}
              <option value="new">+ New household…</option>
            </select>
            {household === "new" && (
              <input name="new_household" autoFocus placeholder="Its name, e.g. The Bensons" aria-label="New household's name" className={`${FIELD} mt-2`} />
            )}
          </Row>
          <Row label="Phone">
            <input name="phone" type="tel" aria-label="Phone" placeholder="Add phone" className="w-full bg-transparent py-1.5 text-[15px] text-ink placeholder:text-stone/70 focus:outline-none" />
          </Row>
          <Row label="Email">
            <input name="email" type="email" autoComplete="off" aria-label="Email" placeholder="Add email" className="w-full bg-transparent py-1.5 text-[15px] text-ink placeholder:text-stone/70 focus:outline-none" />
          </Row>
          <Row label="Notes">
            <textarea name="notes" rows={2} aria-label="Notes" placeholder="Add notes, e.g. Sam's university friend" className="w-full resize-none bg-transparent py-1.5 text-[15px] text-ink placeholder:text-stone/70 focus:outline-none" />
          </Row>
          <Row label="Child">
            <label className="flex cursor-pointer items-center py-1">
              <input type="checkbox" name="is_child" checked={child} onChange={(e) => setChild(e.target.checked)} className="peer sr-only" />
              <span aria-hidden className={`relative h-7 w-12 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400 ${child ? "bg-ink" : "bg-linen"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${child ? "left-6" : "left-1"}`} />
              </span>
              <span className="ml-3 text-sm text-stone">{child ? "Yes" : "No"}</span>
              <span className="sr-only">This guest is a child</span>
            </label>
          </Row>
        </div>
      </section>

      <div className="mt-8">
        <SubmitButton label="Add to the list" />
      </div>
    </form>
  );
}

/** A label and its field, ruled off like the details on the guest card. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-start gap-x-3 border-b border-linen py-2">
      <span className="type-meta pt-2.5">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
