"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, ChevronLeft, X } from "lucide-react";
import { DIETARY_NEEDS, joinNeeds } from "@/lib/dietary";
import { splitName } from "@/lib/names";
import type { GuestStepsBlock, Proposal } from "@/lib/assistant/blocks";

/**
 * Adding a guest through Your assistant, a step at a time (canvas 3 "Your
 * assistant · Steps in the chat", owner's picks 17 Oct 2026): the chat
 * stays on screen; a small card rises from the bottom where the message box
 * is, with the step marker, one question and Back · Skip · Next. Each
 * answer becomes a message in the conversation, a skipped step a faded
 * "Skipped". Steps the AI already knows (a household, a phone number) are
 * answered for you; dietary needs is always asked, with what was said
 * already ticked. At the end a card lists every line (tap one to change it)
 * and only Yes saves.
 *
 * Everything here runs on the phone: no further calls to the AI, and what
 * is typed or picked in the steps is never sent to it.
 */

export type StepKey = "event" | "household" | "diet" | "contact" | "more";
type Mark = "answered" | "skipped";

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
}

export interface StepsState {
  phase: "asking" | "review" | "saving" | "saved" | "error" | "cancelled";
  /** Which step the tray is on. */
  index: number;
  marks: Partial<Record<StepKey, Mark>>;
  /** Changing one line from the check card: Next goes straight back to it. */
  editing: boolean;
  values: Values;
  link?: string;
  note?: string;
  error?: string;
}

const cap = (word: string) => word.replace(/^\w/, (c) => c.toUpperCase());

export function stepKeys(block: GuestStepsBlock): StepKey[] {
  const { events, groups, stays } = block.options;
  const keys: StepKey[] = [];
  if (events.length > 1) keys.push("event");
  keys.push("household", "diet", "contact");
  if (groups.length > 0 || stays.length > 0) keys.push("more");
  return keys;
}

export function initialSteps(block: GuestStepsBlock): StepsState {
  const { prefill: p, options: o } = block;
  const values: Values = {
    eventId: p.eventId ?? (o.events.length === 1 ? o.events[0].id : null),
    household: p.householdId ?? (p.newHousehold ? "new" : ""),
    newHousehold: p.newHousehold ?? "",
    diet: p.diet,
    phone: p.phone ?? "",
    email: p.email ?? "",
    groupIds: [],
    stayId: null,
  };
  // What the AI was told is already answered; dietary needs is always asked.
  const marks: StepsState["marks"] = {};
  if (p.eventId) marks.event = "answered";
  if (p.householdId || p.newHousehold) marks.household = "answered";
  if (p.phone || p.email) marks.contact = "answered";
  const keys = stepKeys(block);
  const first = keys.findIndex((k) => !marks[k]);
  return { phase: "asking", index: first === -1 ? keys.length - 1 : first, marks, editing: false, values };
}

/** What the guest's answer to a step reads as in the chat; null when there is none. */
function answerText(block: GuestStepsBlock, v: Values, key: StepKey): string | null {
  const o = block.options;
  switch (key) {
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
}

function cleared(v: Values, key: StepKey): Values {
  switch (key) {
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
}

/** What Yes saves: exactly what the check card shows. */
export function buildProposal(block: GuestStepsBlock, v: Values): Proposal {
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
    },
  };
}

const LABEL: Record<StepKey, string> = {
  event: "Guest of",
  household: "Household",
  diet: "Dietary",
  contact: "Contact",
  more: "More",
};

function question(block: GuestStepsBlock, key: StepKey): string {
  const first = splitName(block.prefill.fullName).first;
  switch (key) {
    case "event":
      return block.options.events.map((e) => cap(e.word)).join(" or ") + "?";
    case "household":
      return `Which household is ${first} in?`;
    case "diet":
      return `Any dietary needs?`;
    case "contact":
      return `Any contact details for ${first}?`;
    case "more":
      return "Anything else?";
  }
}

const HEADING: Record<StepKey, string> = {
  event: "",
  household: "Household",
  diet: "Dietary needs",
  contact: "Contact details",
  more: "Anything else?",
};

// ── In the conversation ─────────────────────────────────────────────────

/** The steps' trail in the chat: questions and answers, then the check card. */
export function GuestStepsChat({
  block,
  state,
  onYes,
  onCancel,
  onEdit,
  onGo,
}: {
  block: GuestStepsBlock;
  state: StepsState;
  onYes: () => void;
  onCancel: () => void;
  onEdit: (key: StepKey) => void;
  onGo: () => void;
}) {
  const keys = stepKeys(block);
  const first = splitName(block.prefill.fullName).first;
  const current = state.phase === "asking" ? keys[state.index] : null;
  const reviewing = state.phase === "review" || state.phase === "saving" || state.phase === "error" || state.phase === "saved";

  return (
    <div className="mt-3.5">
      <p className="max-w-[92%] text-[16px] leading-relaxed text-ink">A few quick questions about {first}. Skip any you like.</p>

      {keys.map((key) => {
        const mark = state.marks[key];
        if (!mark && key !== current) return null;
        const text = mark === "answered" ? answerText(block, state.values, key) : null;
        return (
          <div key={key}>
            <p className="mt-4 font-display text-[19px] font-light leading-snug text-ink">{question(block, key)}</p>
            {mark && (
              <div className="mt-2 flex justify-end">
                {text ? (
                  <p className="max-w-[78%] rounded-[20px_20px_6px_20px] bg-champagne-100 px-4 py-2 text-[15px] leading-snug text-ink">{text}</p>
                ) : (
                  <p className="rounded-2xl border border-dashed border-stone/50 px-3.5 py-1.5 text-sm italic text-stone">Skipped</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {reviewing && (
        <>
          <p className="mt-4 font-display text-[19px] font-light leading-snug text-ink">That’s everything. Shall I add {first}?</p>
          <div className="mt-3 overflow-hidden rounded-[18px] border border-linen bg-white">
            <div className="px-4 py-3.5">
              <span className="block font-display text-[18px] leading-tight text-ink">{block.prefill.fullName}</span>
              <span className="type-meta mt-1 block">Add to the guest list</span>
            </div>
            {keys.map((key) => {
              const text = answerText(block, state.values, key);
              const editable = state.phase === "review";
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!editable}
                  onClick={() => onEdit(key)}
                  className="flex w-full justify-between gap-4 border-t border-linen px-4 py-2.5 text-left text-sm disabled:cursor-default"
                >
                  <span className="shrink-0 text-stone">{LABEL[key]}</span>
                  <span className={`text-right ${text ? "text-ink" : "italic text-stone/70"}`}>{text ?? "Skipped"}</span>
                </button>
              );
            })}
            {block.prefill.roles.length > 0 && <Fixed label="Role" value={block.prefill.roles.join(" · ")} />}
            {block.prefill.meal && <Fixed label="Meal" value={block.prefill.meal} />}
            {block.prefill.isChild && <Fixed label="Child" value="Yes" />}
            {block.prefill.notes && <Fixed label="Notes" value={block.prefill.notes} />}
            {state.phase !== "saved" && (
              <div className="flex gap-2 border-t border-linen px-4 py-3">
                <button
                  type="button"
                  onClick={onYes}
                  disabled={state.phase === "saving"}
                  className="h-[46px] flex-1 rounded-full bg-ink text-[15px] text-ivory disabled:opacity-60"
                >
                  {state.phase === "saving" ? "Saving…" : `Add ${first}`}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={state.phase === "saving"}
                  className="h-[46px] w-24 rounded-full border border-linen bg-white text-[15px] text-ink"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {state.phase === "review" && <p className="mt-2 text-xs text-stone">Tap any line to change it.</p>}
          {state.phase === "saved" && (
            <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-champagne-600">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-champagne-600 text-white">
                <Check className="h-3 w-3" strokeWidth={2.6} aria-hidden />
              </span>
              Done
              {state.link && (
                <>
                  {" · "}
                  <Link href={state.link} onClick={onGo} className="underline underline-offset-4 hover:text-ink">
                    See them ›
                  </Link>
                </>
              )}
            </p>
          )}
          {state.phase === "saved" && state.note && <p className="mt-1.5 text-sm text-stone">{state.note}</p>}
          {state.phase === "error" && <p className="mt-2 text-sm text-[#9A3F2B]">{state.error}</p>}
        </>
      )}

      {state.phase === "cancelled" && <p className="mt-3 text-sm italic text-stone">Cancelled. Nobody was added.</p>}
    </div>
  );
}

function Fixed({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-linen px-4 py-2.5 text-sm">
      <span className="shrink-0 text-stone">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}

// ── The tray ────────────────────────────────────────────────────────────

const PILL = "h-10 rounded-full border px-4 text-sm transition";
const PILL_ON = "border-champagne-400 bg-champagne-100 text-ink";
const PILL_OFF = "border-linen bg-white text-ink hover:border-champagne-400";
const FIELD =
  "block h-[52px] w-full rounded-2xl border border-linen bg-white px-4 text-[17px] text-ink placeholder:text-stone/70 focus:border-champagne-400 focus:outline-none";

/** The card that rises where the message box is: marker, one question, Back · Skip · Next. */
export function GuestStepsTray({
  block,
  state,
  update,
  onCancel,
}: {
  block: GuestStepsBlock;
  state: StepsState;
  update: (change: (state: StepsState) => StepsState) => void;
  onCancel: () => void;
}) {
  const keys = stepKeys(block);
  const key = keys[state.index];
  const last = state.index === keys.length - 1;

  const setValues = (change: Partial<Values>) => update((s) => ({ ...s, values: { ...s.values, ...change } }));

  /** Marks this step and moves on: to the next, or back to the check card if changing one line. */
  function finish(skip: boolean) {
    update((s) => {
      const has = answerText(block, s.values, key) !== null;
      const answered = !skip && has;
      const marks = { ...s.marks, [key]: answered ? ("answered" as const) : ("skipped" as const) };
      const values = answered ? s.values : cleared(s.values, key);
      if (s.editing || last) return { ...s, marks, values, editing: false, phase: "review" };
      return { ...s, marks, values, index: s.index + 1 };
    });
  }

  function skipRest() {
    update((s) => {
      const marks = { ...s.marks };
      let values = s.values;
      keys.forEach((k, i) => {
        if (i < s.index || (marks[k] && i !== s.index)) return;
        const has = answerText(block, values, k) !== null;
        marks[k] = i === s.index && has ? "answered" : "skipped";
        if (!(i === s.index && has)) values = cleared(values, k);
      });
      return { ...s, marks, values, editing: false, phase: "review" };
    });
  }

  const heading = key === "event" ? question(block, "event") : HEADING[key];

  return (
    <div className="shrink-0 rounded-t-[28px] bg-white pt-3 shadow-[0_-16px_40px_-18px_rgb(60_45_20/0.35)] lg:rounded-bl-[28px]">
      <div className="mx-auto mb-2.5 h-[5px] w-10 rounded-full bg-linen" aria-hidden />
      <div className="flex items-center gap-1.5 px-5">
        {keys.map((k, i) => {
          const mark = state.marks[k];
          const here = i === state.index;
          return (
            <div key={k} className="flex flex-1 items-center gap-1.5 last:flex-none">
              <span
                className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-xs ${
                  here
                    ? "bg-ink font-semibold text-ivory"
                    : mark === "answered"
                      ? "bg-champagne-400 text-white"
                      : mark === "skipped"
                        ? "border-[1.5px] border-dashed border-stone/50 text-stone"
                        : "border-[1.5px] border-linen bg-white text-stone"
                }`}
              >
                {here ? i + 1 : mark === "answered" ? <Check className="h-3 w-3" strokeWidth={2.6} aria-hidden /> : mark === "skipped" ? "–" : i + 1}
              </span>
              {i < keys.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${mark === "answered" ? "bg-champagne-400" : "bg-linen"}`} />}
            </div>
          );
        })}
        <span className="ml-1.5 whitespace-nowrap text-xs text-stone">
          {state.index + 1} of {keys.length}
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <div className="max-h-[44dvh] overflow-y-auto overscroll-contain px-5 pt-4">
        <p className="font-display text-[26px] font-light leading-[1.1] tracking-[-0.02em] text-ink">{heading}</p>
        <div className="mt-3.5">
          {key === "event" && <EventStep block={block} state={state} setValues={setValues} />}
          {key === "household" && <HouseholdStep block={block} state={state} setValues={setValues} />}
          {key === "diet" && <DietStep state={state} setValues={setValues} />}
          {key === "contact" && <ContactStep state={state} setValues={setValues} />}
          {key === "more" && <MoreStep block={block} state={state} setValues={setValues} />}
        </div>
      </div>

      <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex gap-2">
          {state.index > 0 && (
            <button
              type="button"
              onClick={() => update((s) => ({ ...s, index: s.index - 1, editing: false }))}
              aria-label="Back"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-linen bg-white text-stone hover:text-ink"
            >
              <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
            </button>
          )}
          <button type="button" onClick={() => finish(true)} className="h-12 w-[88px] shrink-0 rounded-full border border-linen bg-white text-[15px] text-ink">
            Skip
          </button>
          <button type="button" onClick={() => finish(false)} className="h-12 flex-1 rounded-full bg-ink text-base text-ivory">
            {last || state.editing ? "Review" : "Next"}
          </button>
        </div>
        {!last && !state.editing && (
          <p className="mt-2.5 text-center">
            <button type="button" onClick={skipRest} className="text-[13px] text-champagne-600 underline underline-offset-4 hover:text-ink">
              Skip the rest and review
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

type StepProps = { block: GuestStepsBlock; state: StepsState; setValues: (change: Partial<Values>) => void };

function EventStep({ block, state, setValues }: StepProps) {
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

function HouseholdStep({ block, state, setValues }: StepProps) {
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

function DietStep({ state, setValues }: Omit<StepProps, "block">) {
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

function ContactStep({ state, setValues }: Omit<StepProps, "block">) {
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

function MoreStep({ block, state, setValues }: StepProps) {
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
