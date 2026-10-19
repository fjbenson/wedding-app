"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DIETARY_NEEDS, joinNeeds } from "@/lib/dietary";
import { splitName } from "@/lib/names";
import type { GuestStepsBlock, Proposal } from "@/lib/assistant/blocks";
import { FIELD, PILL, PILL_OFF, PILL_ON, type Flow, type StepBodyProps, type StepsState } from "./steps-flow";

/**
 * Adding a guest, a step at a time (see steps-flow.tsx). Steps: day or
 * evening (only if the wedding has both), household, dietary needs, contact
 * details, and anything else (groups, where they're staying — only if the
 * wedding has any). Whatever the couple already said is answered for them;
 * when day or evening, household and diet are all known it goes straight to
 * the check card, since contact details and groups are only ever optional.
 */

interface Values {
  eventId: string | null;
  /** "" nothing chosen yet · "none" not in a household · "new" make one · otherwise a household's id */
  household: string;
  newHousehold: string;
  diet: string[];
  phone: string;
  email: string;
  groupIds: string[];
  stayId: string | null;
  answer: GuestStepsBlock["prefill"]["answer"];
}

type Key = "event" | "household" | "diet" | "contact" | "more";

const cap = (word: string) => word.replace(/^\w/, (c) => c.toUpperCase());
const firstName = (b: GuestStepsBlock) => splitName(b.prefill.fullName).first;

const ANSWER_WORDS: [Values["answer"], string][] = [
  ["to_invite", "To invite"],
  ["pending", "Yet to respond"],
  ["attending", "Coming"],
  ["declined", "Can’t come"],
];

function keys(block: GuestStepsBlock): Key[] {
  const { events, groups, stays } = block.options;
  const all: Key[] = [];
  if (events.length > 1) all.push("event");
  all.push("household", "diet", "contact");
  if (groups.length > 0 || stays.length > 0) all.push("more");
  return all;
}

function initial(block: GuestStepsBlock): StepsState<Values> {
  const { prefill: p, options: o } = block;
  const values: Values = {
    eventId: p.eventId ?? (o.events.length === 1 ? o.events[0].id : null),
    household: p.householdId ?? (p.newHousehold ? "new" : p.noHousehold ? "none" : ""),
    newHousehold: p.newHousehold ?? "",
    diet: p.diet,
    phone: p.phone ?? "",
    email: p.email ?? "",
    groupIds: [],
    stayId: null,
    answer: p.answer,
  };
  // What the AI was told is already answered.
  const marks: StepsState["marks"] = {};
  if (p.eventId) marks.event = "answered";
  if (p.householdId || p.newHousehold || p.noHousehold) marks.household = "answered";
  if (p.dietKnown) marks.diet = "answered";
  if (p.phone || p.email) marks.contact = "answered";
  const all = keys(block);
  // Day or evening, household and diet are the ones that matter. With those
  // known there's nothing to ask: contact details and groups are optional.
  if (all.filter((k) => k !== "contact" && k !== "more").every((k) => marks[k])) {
    for (const k of all) marks[k] ??= "skipped";
    return { phase: "review", index: all.length - 1, marks, editing: false, values };
  }
  const first = all.findIndex((k) => !marks[k]);
  return { phase: "asking", index: first === -1 ? all.length - 1 : first, marks, editing: false, values };
}

function answer(block: GuestStepsBlock, v: Values, key: string): string | null {
  const o = block.options;
  switch (key as Key) {
    case "event": {
      const e = o.events.find((x) => x.id === v.eventId);
      return e ? cap(e.word) : null;
    }
    case "household": {
      if (v.household === "none") return "Not in a household";
      if (v.household === "new") return v.newHousehold.trim() ? `${v.newHousehold.trim()} (new)` : null;
      return o.households.find((h) => h.id === v.household)?.name ?? null;
    }
    case "diet":
      return v.diet.length > 0 ? v.diet.join(" · ") : null;
    case "contact": {
      const parts = [v.phone.trim(), v.email.trim()].filter(Boolean);
      return parts.length > 0 ? parts.join(" · ") : null;
    }
    case "more": {
      const parts = [
        ...v.groupIds.map((id) => o.groups.find((g) => g.id === id)?.name),
        v.stayId ? `Staying at ${o.stays.find((s) => s.id === v.stayId)?.name}` : undefined,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" · ") : null;
    }
  }
  return null;
}

function clear(v: Values, key: string): Values {
  switch (key as Key) {
    case "event":
      return { ...v, eventId: null };
    case "household":
      return { ...v, household: "", newHousehold: "" };
    case "diet":
      return { ...v, diet: [] };
    case "contact":
      return { ...v, phone: "", email: "" };
    case "more":
      return { ...v, groupIds: [], stayId: null };
  }
  return v;
}

function proposal(block: GuestStepsBlock, v: Values): Proposal {
  const p = block.prefill;
  const isNew = v.household === "new" && v.newHousehold.trim();
  const existing = block.options.households.some((h) => h.id === v.household) ? v.household : null;
  return {
    kind: "add_guest",
    input: {
      fullName: p.fullName,
      householdId: isNew ? null : existing,
      newHousehold: isNew ? v.newHousehold.trim() : null,
      eventId: v.eventId,
      roles: p.roles,
      email: v.email.trim() || null,
      phone: v.phone.trim() || null,
      isChild: p.isChild,
      meal: p.meal,
      diet: joinNeeds(v.diet),
      notes: p.notes,
      groupIds: v.groupIds,
      stayId: v.stayId,
      answer: v.eventId ? v.answer : undefined,
    },
  };
}

export const guestFlow: Flow<GuestStepsBlock, Values> = {
  keys,
  initial,
  answer,
  clear,
  proposal,
  subject: (b) => b.prefill.fullName,
  intro: (b) => `A few quick questions about ${firstName(b)}. Skip any you like.`,
  question(b, key) {
    switch (key as Key) {
      case "event":
        return b.options.events.map((e) => cap(e.word)).join(" or ") + "?";
      case "household":
        return `Which household is ${firstName(b)} in?`;
      case "diet":
        return "Any dietary needs?";
      case "contact":
        return `Any contact details for ${firstName(b)}?`;
      default:
        return "Anything else?";
    }
  },
  heading(b, key) {
    switch (key as Key) {
      case "event":
        return b.options.events.map((e) => cap(e.word)).join(" or ") + "?";
      case "household":
        return "Household";
      case "diet":
        return "Dietary needs";
      case "contact":
        return "Contact details";
      default:
        return "Anything else?";
    }
  },
  label: (key) => ({ event: "Guest of", household: "Household", diet: "Dietary", contact: "Contact", more: "More" })[key as Key] ?? key,
  action: "Add to the guest list",
  closing: (b) => `That’s everything. Shall I add ${firstName(b)}?`,
  yes: (b) => `Add ${firstName(b)}`,
  seeIt: "See them ›",
  cancelled: "Cancelled. Nobody was added.",
  fixed(b) {
    const rows: [string, string][] = [];
    if (b.prefill.roles.length > 0) rows.push(["Role", b.prefill.roles.join(" · ")]);
    if (b.prefill.meal) rows.push(["Meal", b.prefill.meal]);
    if (b.prefill.isChild) rows.push(["Child", "Yes"]);
    if (b.prefill.notes) rows.push(["Notes", b.prefill.notes]);
    return rows;
  },
  Body,
  Extra: Invitation,
};

/** Yet to invite unless the couple said otherwise; changed in place on the check card. */
function Invitation({
  block,
  state,
  setValues,
  editable,
}: {
  block: GuestStepsBlock;
  state: StepsState<Values>;
  setValues: (change: Partial<Values>) => void;
  editable: boolean;
}) {
  if (!state.values.eventId || block.options.events.length === 0) return null;
  const current = ANSWER_WORDS.find(([a]) => a === state.values.answer)?.[1] ?? "To invite";
  return (
    <div className="flex items-center justify-between gap-4 border-t border-linen px-4 py-2 text-sm">
      <span className="shrink-0 text-stone">Invitation</span>
      {editable ? (
        <label className="relative">
          <span className="sr-only">Invitation</span>
          <select
            value={state.values.answer}
            onChange={(e) => setValues({ answer: e.target.value as Values["answer"] })}
            className="appearance-none rounded-full bg-transparent py-1.5 pl-3 pr-7 text-right text-sm text-ink"
          >
            {ANSWER_WORDS.map(([a, word]) => (
              <option key={a} value={a}>
                {word}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone" strokeWidth={1.8} aria-hidden />
        </label>
      ) : (
        <span className="py-1.5 text-ink">{current}</span>
      )}
    </div>
  );
}

// ── The steps' answers ──────────────────────────────────────────────────

function Body({ block, state, setValues, stepKey }: StepBodyProps<GuestStepsBlock, Values>) {
  switch (stepKey as Key) {
    case "event":
      return <EventStep block={block} state={state} setValues={setValues} />;
    case "household":
      return <HouseholdStep block={block} state={state} setValues={setValues} />;
    case "diet":
      return <DietStep state={state} setValues={setValues} />;
    case "contact":
      return <ContactStep state={state} setValues={setValues} />;
    default:
      return <MoreStep block={block} state={state} setValues={setValues} />;
  }
}

type Set = (change: Partial<Values>) => void;

function EventStep({ block, state, setValues }: { block: GuestStepsBlock; state: StepsState<Values>; setValues: Set }) {
  return (
    <div className="flex gap-2">
      {block.options.events.map((e) => {
        const on = state.values.eventId === e.id;
        return (
          <button
            key={e.id}
            type="button"
            aria-pressed={on}
            onClick={() => setValues({ eventId: on ? null : e.id })}
            className={`h-16 flex-1 rounded-2xl border text-[17px] transition ${on ? "border-champagne-400 bg-champagne-100" : "border-linen bg-white hover:border-champagne-400"}`}
          >
            {cap(e.word)}
          </button>
        );
      })}
    </div>
  );
}

function HouseholdStep({ block, state, setValues }: { block: GuestStepsBlock; state: StepsState<Values>; setValues: Set }) {
  const households = [...block.options.households].sort((a, b) => a.name.localeCompare(b.name));
  const v = state.values;
  return (
    <div className="space-y-2.5">
      <label className="relative block">
        <span className="sr-only">Household</span>
        <select value={v.household} onChange={(e) => setValues({ household: e.target.value })} className={`${FIELD} appearance-none pr-11`}>
          <option value="">Choose a household</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
          <option value="new">New household…</option>
          <option value="none">Not in a household</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" strokeWidth={1.8} aria-hidden />
      </label>
      {v.household === "new" && (
        <label className="block">
          <span className="sr-only">New household’s name</span>
          <input
            value={v.newHousehold}
            onChange={(e) => setValues({ newHousehold: e.target.value })}
            placeholder="Its name, e.g. The Lathams"
            autoComplete="off"
            className={FIELD}
          />
        </label>
      )}
    </div>
  );
}

function DietStep({ state, setValues }: { state: StepsState<Values>; setValues: Set }) {
  const [typed, setTyped] = useState("");
  const chosen = state.values.diet;
  const standard = DIETARY_NEEDS.map((n) => n.name);
  const own = chosen.filter((n) => !standard.some((s) => s.toLowerCase() === n.toLowerCase()));
  const toggle = (need: string) =>
    setValues({
      diet: chosen.some((c) => c.toLowerCase() === need.toLowerCase())
        ? chosen.filter((c) => c.toLowerCase() !== need.toLowerCase())
        : [...chosen, need],
    });
  function add() {
    const need = typed.replace(/·/g, " ").replace(/\s+/g, " ").trim();
    if (!need) return;
    if (!chosen.some((c) => c.toLowerCase() === need.toLowerCase())) setValues({ diet: [...chosen, need] });
    setTyped("");
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {[...standard, ...own].map((need) => {
          const on = chosen.some((c) => c.toLowerCase() === need.toLowerCase());
          return (
            <button key={need} type="button" aria-pressed={on} onClick={() => toggle(need)} className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}>
              {need}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Something else</span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Something else…"
            autoComplete="off"
            className="block h-11 w-full rounded-full border border-linen bg-white px-4 text-[16px] text-ink placeholder:text-stone/70 focus:border-champagne-400 focus:outline-none"
          />
        </label>
        {typed.trim() && (
          <button type="button" onClick={add} className="h-11 rounded-full border border-linen bg-white px-4 text-sm text-ink">
            Add
          </button>
        )}
      </div>
    </div>
  );
}

function ContactStep({ state, setValues }: { state: StepsState<Values>; setValues: Set }) {
  return (
    <div className="space-y-2.5">
      <label className="block">
        <span className="sr-only">Phone</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={state.values.phone}
          onChange={(e) => setValues({ phone: e.target.value })}
          placeholder="Phone"
          className={FIELD}
        />
      </label>
      <label className="block">
        <span className="sr-only">Email</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          value={state.values.email}
          onChange={(e) => setValues({ email: e.target.value })}
          placeholder="Email"
          className={FIELD}
        />
      </label>
    </div>
  );
}

function MoreStep({ block, state, setValues }: { block: GuestStepsBlock; state: StepsState<Values>; setValues: Set }) {
  const { groups, stays } = block.options;
  const v = state.values;
  return (
    <div className="space-y-4">
      {groups.length > 0 && (
        <div>
          <p className="section-label">Groups</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.map((g) => {
              const on = v.groupIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setValues({ groupIds: on ? v.groupIds.filter((id) => id !== g.id) : [...v.groupIds, g.id] })}
                  className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {stays.length > 0 && (
        <div>
          <p className="section-label">Staying</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stays.map((s) => {
              const on = v.stayId === s.id;
              return (
                <button key={s.id} type="button" aria-pressed={on} onClick={() => setValues({ stayId: on ? null : s.id })} className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
