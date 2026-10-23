"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { ChevronDown, Mail, MessageSquare, Pencil, Phone, Star, X } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { GUEST_ROLES, rolesOf } from "@/lib/guest-roles";
import { joinNeeds, needsOf } from "@/lib/dietary";
import DietaryPicker from "@/components/dietary-picker";
import type { Contact, Rsvp, WeddingEvent } from "@/types/db";
import { deleteGuestAction, setRolesAction, updateGuestAction, type GuestEdit } from "./actions";
import { saveMealAction, setGuestAnswerAction, setGuestOfAction } from "./rsvp-actions";
import { DetailLabel, fullName, initials } from "./guest-table";
import { splitName } from "@/lib/names";
import CardSheet from "@/components/card-sheet";
import { RoundAction, RoundActions } from "@/components/round-actions";
import { GuestGroupsSection, type GroupSummary } from "./guest-groups";
import { GuestTravelSection, type TravelInfo } from "./guest-travel";
import { GuestPlanSection } from "./guest-plan";
import Timeline from "@/components/timeline";
import MealPicker from "@/components/meal-picker";
import { MEAL_KINDS, mealKindOf, noAlcoholOf } from "@/lib/meals";
import SentToThem from "@/components/sent-to-them";
import { setGuestTableAction } from "../day/actions";
import type { GuestSeating } from "@/lib/db/day";
import { jumpTo } from "@/lib/jump-to";

type Saver = () => Promise<{ error?: string } | void>;

/**
 * What to say when a save didn't reach the server at all. The usual cause is
 * the app being updated while this page was open: the page still asks for
 * the old version's save, which is no longer there. Without this, the whole
 * screen gave way to "Application error" (9 Oct 2026).
 */
const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

/** Runs a save, turning any failure into a message rather than a crash. */
export async function safely(saver: Saver): Promise<{ error?: string }> {
  try {
    return (await saver()) ?? {};
  } catch (error) {
    console.error("save failed", error);
    return { error: UNSAVED };
  }
}

/** A small down-arrow for the household picker, drawn in stone. */
export const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B655E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export const FIELD =
  "w-full rounded-xl border border-linen bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30";

/**
 * One guest, over the list: a sheet that slides up on a phone, a panel on
 * the right on a laptop. Everything about them is changed right here — tap
 * a detail to edit it, tap an answer or a role to change it — so there's no
 * separate edit page once someone is on the list (owner's call, 9 Oct 2026).
 */
export default function GuestCard({
  guest,
  household,
  households,
  events,
  rsvps,
  table = null,
  seating,
  travel,
  groups,
  onShowGroup,
  onOpenHousehold,
  ownNeeds = [],
  onClose,
}: {
  guest: Contact;
  household: { id: string; name: string } | null;
  /** Every household, to move them between. */
  households: { id: string; name: string }[];
  events: WeddingEvent[];
  /** This guest's answers. */
  rsvps: Rsvp[];
  /** The table they sit at, if they've been seated. */
  table?: string | null;
  /** The wedding's tables and who sits where; given, Details has a Table row to change it. */
  seating?: GuestSeating;
  /** Places to stay and their journeys (0020_travel.sql). Left out, no Travel part. */
  travel?: TravelInfo;
  /** The wedding's groups of guests; the card shows theirs and adds to others. Left out, no Groups part. */
  groups?: GroupSummary[];
  onShowGroup?: (id: string) => void;
  /** Tapping the household name opens it in place; left out, it goes to the guest list with it open. */
  onOpenHousehold?: (id: string) => void;
  /** Dietary needs other guests have that aren't on the standard list — offered here too. */
  ownNeeds?: string[];
  onClose: () => void;
}) {
  const name = fullName(guest);

  const save = (edit: GuestEdit) => updateGuestAction(guest.id, edit);
  // Their answer for their own event — the first they're on (day before evening).
  const own = events.map((e) => rsvps.find((r) => r.event_id === e.id)).find(Boolean);
  const phone = guest.phone?.replace(/\s+/g, "");
  // A dashed Text, Call or Email goes to the box to type it in (`n` changes on every tap).
  const [adding, setAdding] = useState<{ field: "phone" | "email"; n: number }>();
  const add = (field: "phone" | "email") => {
    // Contact is a fold: it opens first, then the box takes the cursor.
    jumpTo(field === "phone" ? "guest-phone" : "guest-email");
    window.setTimeout(() => setAdding((a) => ({ field, n: (a?.n ?? 0) + 1 })), 80);
  };

  // One line for each fold, saying what's set without opening it.
  const eventName = (e?: WeddingEvent) => (e ? e.name.replace(/^the\s+/i, "").replace(/^\w/, (c) => c.toUpperCase()) : "");
  const needs = needsOf(own?.dietary_notes);
  const food = [
    MEAL_KINDS.find((k) => k.value === mealKindOf(guest))?.label,
    noAlcoholOf(guest) ? "Soft drinks only" : "Alcohol",
    own ? (needs.length > 0 ? needs.join(", ") : "No dietary needs") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const hasTables = Boolean(seating && seating.tables.length > 0);
  // Only what's been set: no table, no place to stay and no journey say nothing (owner, 21 Oct 2026).
  const place = travel?.stays.find((s) => s.id === guest.stay_id);
  const stayingLine = guest.staying === "no" ? "Not staying over" : guest.staying === "yes" ? (place?.name ?? "Staying, not sure where") : null;
  const journeys = travel?.journeys[guest.id] ?? [];
  const transportLine = journeys.length > 0 ? journeys.join(" · ") : guest.own_way ? "Own way" : null;
  const seatingLine = [hasTables && table ? `Table ${table}` : null, stayingLine, transportLine].filter(Boolean).join(" · ") || "Nothing yet";
  const theirGroups = (groups ?? []).filter((g) => g.members.includes(guest.id)).map((g) => g.name);
  const roleLine = [rolesOf(guest).join(" · ") || "No role", groups ? (theirGroups.length > 0 ? theirGroups.join(", ") : "No groups") : null].filter(Boolean).join(" · ");
  const ownEventName = eventName(events.find((e) => e.id === own?.event_id));
  const detailsLine = [ownEventName && `${ownEventName} guest`, household?.name, guest.phone].filter(Boolean).join(" · ") || "Add a number or email";

  return (
    <CardSheet
      beside
      label={name}
      onClose={onClose}
      top={
        household &&
        (onOpenHousehold ? (
          <button type="button" onClick={() => onOpenHousehold(household.id)} className="label hover:text-ink">
            {household.name} ›
          </button>
        ) : (
          <Link href={`/people?household=${household.id}`} className="label hover:text-ink">
            {household.name} ›
          </Link>
        ))
      }
    >
      <Profile
        guest={guest}
        table={table}
        canSeat={Boolean(seating && seating.tables.length > 0)}
        own={own}
        ownEvent={events.find((e) => e.id === own?.event_id)}
        onSave={save}
      />

      {/* Always all three, like the household's; a missing one is dashed and goes to its box. */}
      <RoundActions>
        <RoundAction href={phone ? `sms:${phone}` : undefined} missing={!phone} onClick={() => add("phone")} label="Text" icon={MessageSquare} dark />
        <RoundAction href={phone ? `tel:${phone}` : undefined} missing={!phone} onClick={() => add("phone")} label="Call" icon={Phone} />
        <RoundAction
          href={guest.email ? `mailto:${guest.email}` : undefined}
          missing={!guest.email}
          onClick={() => add("email")}
          label="Email"
          icon={Mail}
          dark={!phone}
        />
      </RoundActions>

      {/*
        The top is the picture; this is where you change it (owner, 21 Oct 2026,
        canvas 4 "Guest card · Round 1", A): one folded row for each job, a
        line of what's set, and a tap on a figure above opens its row.
      */}
      {/* The answer is what changes most, so it stays on view; day or evening hardly ever changes, so it's in Details (owner, 21 Oct 2026). Until they have one, it's the thing to set. */}
      {events.length > 0 && (
        <div className="mt-6">
          <GuestOfAndAnswer guest={guest} events={events} own={own} only={own ? "answer" : "of"} />
        </div>
      )}

      <div className="-mx-[22px] mt-6 border-t border-linen border-b">
        <Fold title="Food & drink" summary={food}>
          <MealRow guest={guest} onSave={save} />
          {own && (
            <dl className="mt-3">
              <DietaryRow rsvp={own} own={ownNeeds} />
            </dl>
          )}
        </Fold>

        {(hasTables || travel) && (
          <Fold title="Seating & travel" summary={seatingLine}>
            {hasTables && (
              <dl>
                <TableRow guest={guest} seating={seating!} />
              </dl>
            )}
            {travel && <GuestTravelSection guest={guest} travel={travel} bare />}
          </Fold>
        )}

        <Fold title={groups ? "Role & groups" : "Role"} summary={roleLine}>
          <h3 className="section-label">Role on the day</h3>
          <Roles guest={guest} bare />
          {groups && <GuestGroupsSection guestId={guest.id} firstName={guest.first_name} groups={groups} onShowGroup={onShowGroup} bare />}
        </Fold>

        {/* What's been said and sent (canvas 3 "Timeline · Round 3"). Someone not in a household is sent things on their own: those sit at the top of their History, as on a household's. */}
        <section className="border-t border-linen px-[22px]">
          <Timeline
            scope={`guest:${guest.id}`}
            folded
            caps
            skipSent={!guest.household_id}
            lead={!guest.household_id ? <SentToThem unit={`c:${guest.id}`} bare /> : undefined}
          />
        </section>

        <Fold title="Details" summary={detailsLine}>
          {own && <GuestOfAndAnswer guest={guest} events={events} own={own} only="of" />}
          <dl className={own ? "mt-4" : ""}>
            <HouseholdRow guest={guest} households={households} onSave={save} />
            <TextRow id="guest-phone" label="Phone" value={guest.phone} type="tel" editSignal={adding?.field === "phone" ? adding.n : 0} onSave={(v) => save({ phone: v })} />
            <TextRow id="guest-email" label="Email" value={guest.email} type="email" editSignal={adding?.field === "email" ? adding.n : 0} onSave={(v) => save({ email: v })} />
            <TextRow label="Notes" value={guest.notes} multiline onSave={(v) => save({ notes: v })} />
          </dl>
        </Fold>
      </div>

      <GuestPlanSection guestId={guest.id} />

      <RemoveGuest guest={guest} name={name} />
    </CardSheet>
  );
}

/**
 * One folded row of the guest card: its name in small capitals, a line of
 * what's set under it, opening in place (tapping a figure at the top opens
 * the right one — `jumpTo`). The body stays in the page when shut, so what
 * was half typed isn't lost.
 */
export function Fold({ title, summary, children }: { title: string; summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group border-t border-linen px-[22px]">
      <summary className="flex min-h-[64px] cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="section-label block">{title}</span>
          <span className="mt-1 block truncate text-[14px] text-ink">{summary}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-stone transition group-open:rotate-180" strokeWidth={1.8} aria-hidden />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

/**
 * The top of the card, as a social profile (canvas 3 "Guest card · Round 2 ·
 * A profile", A, 14 Oct 2026 — households have the envelope; a person gets a
 * profile, replacing the place card of 13 Oct): their initials large on the
 * left, the name in italics on the right (tap to rename), role and day or
 * evening under it, then three figures across — their answer, their table,
 * their meal — and any allergies. Photos would go in the circle later
 * (optional, never for children, on the privacy list).
 */
function Profile({
  guest,
  table,
  canSeat,
  own,
  ownEvent,
  onSave,
}: {
  guest: Contact;
  table: string | null;
  /** There are tables to pick from, so Table goes to the row that changes it. */
  canSeat: boolean;
  own?: Rsvp;
  ownEvent?: WeddingEvent;
  onSave: (edit: GuestEdit) => Promise<{ error?: string }>;
}) {
  // Each figure goes to where it's changed, further down the card (owner, 19 Oct 2026).
  const figure = "block w-full rounded-lg py-1 hover:bg-cream/70";
  const roles = rolesOf(guest);
  const kind = ownEvent ? `${ownEvent.name.replace(/^the\s+/i, "").toLowerCase()} guest` : null;
  const answer: Record<Rsvp["status"], string> = {
    attending: "Coming",
    pending: "Yet to respond",
    to_invite: "To invite",
    declined: "Can't come",
  };
  return (
    <div className="mt-1">
      <div className="flex items-center gap-[18px]">
        <span
          aria-hidden
          className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-champagne-100 font-display text-[30px] text-champagne-600 shadow-[0_0_0_3px_#FFFFFF,0_0_0_4px_#D8C7A4]"
        >
          {initials(guest)}
        </span>
        <div className="min-w-0 flex-1">
          <NameEditor guest={guest} onSave={onSave} left />
          {(roles.length > 0 || kind) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-champagne-600">
              {roles.length > 0 && <Star className="h-3.5 w-3.5 fill-champagne-400 text-champagne-400" strokeWidth={1.4} aria-hidden />}
              {roles.join(" · ")}
              {roles.length > 0 && kind && " · "}
              {kind && <em className="font-display">{kind}</em>}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 border-y border-linen py-2 text-center">
        <div>
          <button type="button" onClick={() => jumpTo(own ? "guest-rsvp" : "guest-of")} className={figure}>
            <span className={`block font-display text-lg ${own?.status === "attending" ? "text-champagne-600" : "text-ink"}`}>
              {own ? answer[own.status] : "Day or evening?"}
            </span>
            <span className="mt-0.5 block text-xs text-stone">RSVP</span>
          </button>
        </div>
        <div className="border-x border-linen px-1">
          {canSeat ? (
            <button type="button" onClick={() => jumpTo("guest-table")} className={figure}>
              <span className={`block truncate font-display text-lg ${table ? "text-ink" : "text-stone"}`}>{table ?? "None yet"}</span>
              <span className="mt-0.5 block text-xs text-stone">Table</span>
            </button>
          ) : (
            <Link href="/day?tab=seating" className={figure}>
              <span className={`block truncate font-display text-lg ${table ? "text-ink" : "text-stone"}`}>{table ?? "None yet"}</span>
              <span className="mt-0.5 block text-xs text-stone">Table</span>
            </Link>
          )}
        </div>
        <div className="px-1">
          {/* The meal tile's choice (owner, 20 Oct 2026: the typed dish went — one menu for everyone). */}
          <button type="button" onClick={() => jumpTo("guest-mealkind")} className={figure}>
            <span className="block truncate font-display text-lg text-ink">{MEAL_KINDS.find((k) => k.value === mealKindOf(guest))?.label}</span>
            <span className="mt-0.5 block text-xs text-stone">Meal</span>
          </button>
        </div>
      </div>
      {needsOf(own?.dietary_notes).length > 0 && (
        <button type="button" onClick={() => jumpTo("guest-dietary")} className="mx-auto mt-1.5 block rounded-lg px-2 py-1 text-center text-[13px] text-[#9A3F2B] hover:bg-cream/70">
          {needsOf(own?.dietary_notes).join(" · ")}
        </button>
      )}
    </div>
  );
}

/** Text · Call · Email under the profile, as three flat buttons across the card. */
/** Runs a save, holding on to any problem so it can be shown in place. */
export function useSaver() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const run = (saver: Saver, after?: () => void) =>
    startTransition(async () => {
      const result = await safely(saver);
      setError(result.error);
      if (!result.error) after?.();
    });
  return { pending, error, setError, run };
}

/** Keys inside an editor: Enter saves (not in a note), Escape backs out without closing the card. */
export function editorKeys(onSave: () => void, onCancel: () => void, multiline = false) {
  return (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      onCancel();
    } else if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      onSave();
    }
  };
}

export function SaveCancel({ pending, onCancel }: { pending: boolean; onCancel: () => void }) {
  return (
    <span className="mt-2 flex items-center gap-2">
      <button type="submit" disabled={pending} className="h-9 rounded-full bg-ink px-4 text-sm text-ivory hover:bg-ink/90 disabled:opacity-60">
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={onCancel} className="h-9 px-2 text-sm text-stone underline underline-offset-4 hover:text-ink">
        Cancel
      </button>
    </span>
  );
}

/** Their name, large; tap it to change it. */
function NameEditor({
  guest,
  onSave,
  left = false,
}: {
  guest: Contact;
  onSave: (edit: GuestEdit) => Promise<{ error?: string }>;
  /** Beside the profile picture: left-aligned and a little smaller. */
  left?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [full, setFull] = useState(fullName(guest));
  const { pending, error, setError, run } = useSaver();

  const start = () => {
    setFull(fullName(guest));
    setError(undefined);
    setEditing(true);
  };
  // One box, split as when adding: the last word is the surname.
  const submit = () => {
    const { first, last } = splitName(full);
    run(() => onSave({ first_name: first, last_name: last }), () => setEditing(false));
  };
  const keys = editorKeys(submit, () => setEditing(false));

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        className={`group block w-full ${left ? "text-left" : "mt-1.5 text-center"}`}
        aria-label={`${fullName(guest)} — change name`}
      >
        <span className={`font-display font-light italic leading-[1.05] text-ink ${left ? "text-[28px]" : "text-[38px]"}`}>{fullName(guest)}</span>
        <Pencil className="ml-2 inline h-4 w-4 align-baseline text-stone/60 group-hover:text-ink" strokeWidth={1.6} aria-hidden />
      </button>
    );
  }
  return (
    <form
      className="mt-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input autoFocus value={full} onChange={(e) => setFull(e.target.value)} onKeyDown={keys} aria-label="Full name" placeholder="Full name" className={FIELD} />
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
    </form>
  );
}

/** A label and its value; tap to change it there and then. */
export function TextRow({
  id,
  label,
  value,
  type = "text",
  multiline = false,
  startEditing = false,
  editSignal = 0,
  onSave,
}: {
  /** For a tap at the top of the card to scroll here. */
  id?: string;
  label: string;
  value: string | null;
  type?: string;
  multiline?: boolean;
  /** Open with the box ready to type in (e.g. a list's greyed-out phone button). */
  startEditing?: boolean;
  /** Opens the box each time it changes (above 0) — e.g. a dashed Call button was tapped. */
  editSignal?: number;
  onSave: (value: string) => Promise<{ error?: string }>;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(value ?? "");
  const { pending, error, setError, run } = useSaver();
  useEffect(() => {
    if (editSignal > 0) setEditing(true);
  }, [editSignal]);

  const start = () => {
    setDraft(value ?? "");
    setError(undefined);
    setEditing(true);
  };
  const submit = () => run(() => onSave(draft), () => setEditing(false));
  const keys = editorKeys(submit, () => setEditing(false), multiline);

  return (
    <div id={id} className="grid scroll-mt-24 grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5"><DetailLabel label={label} /></dt>
      <dd className="min-w-0">
        {editing ? (
          <form
            className="py-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {multiline ? (
              <textarea autoFocus rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keys} aria-label={label} className={FIELD} />
            ) : (
              <input autoFocus type={type} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keys} aria-label={label} className={FIELD} />
            )}
            {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
            <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
          </form>
        ) : (
          <button type="button" onClick={start} className="block min-h-11 w-full whitespace-pre-line break-words py-3 text-left text-[15px] text-ink hover:text-champagne-600">
            {value || <span className="text-stone/70">Add {label.toLowerCase()}</span>}
          </button>
        )}
      </dd>
    </div>
  );
}

/** Dietary needs, picked from the standard list or their own; each change saves at once. */
function DietaryRow({ rsvp, own }: { rsvp: Rsvp; own: string[] }) {
  const [needs, setNeeds] = useOptimistic(needsOf(rsvp.dietary_notes));
  const [, startTransition] = useTransition();
  const [failed, setFailed] = useState<string>();
  const change = (next: string[]) =>
    startTransition(async () => {
      setNeeds(next);
      setFailed((await safely(() => saveMealAction(rsvp.id, rsvp.meal_choice ?? "", joinNeeds(next) ?? ""))).error);
    });

  return (
    <div id="guest-dietary" className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5"><DetailLabel label="Dietary" /></dt>
      <dd className="min-w-0">
        <DietaryPicker value={needs} onChange={change} own={own} />
        {failed && <p role="alert" className="mb-2 text-sm text-ink">{failed}</p>}
      </dd>
    </div>
  );
}

/** Which table they sit at: pick one, or take them off. Saves on the pick. */
function TableRow({ guest, seating }: { guest: Contact; seating: GuestSeating }) {
  const [tableId, setTableId] = useOptimistic(seating.tableOf[guest.id] ?? "");
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState<string>();

  return (
    <div id="guest-table" className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5"><DetailLabel label="Table" /></dt>
      <dd className="min-w-0 py-2">
        <select
          aria-label="Table"
          value={tableId}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value;
            startTransition(async () => {
              setTableId(next);
              setFailed((await safely(() => setGuestTableAction(guest.id, next || null))).error);
            });
          }}
          className="h-9 w-full cursor-pointer appearance-none bg-transparent bg-[length:14px] bg-[right_2px_center] bg-no-repeat py-0 pr-6 leading-9 text-[15px] text-ink hover:text-champagne-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne-400/40"
          style={{ backgroundImage: CHEVRON }}
        >
          <option value="">Not seated yet</option>
          {seating.tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {failed && <p role="alert" className="mt-2 text-sm text-ink">{failed}</p>}
      </dd>
    </div>
  );
}

/** Which household they're in: pick another, none, or start a new one. */
function HouseholdRow({
  guest,
  households,
  onSave,
}: {
  guest: Contact;
  households: { id: string; name: string }[];
  onSave: (edit: GuestEdit) => Promise<{ error?: string }>;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const { pending, error, run } = useSaver();

  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5"><DetailLabel label="Household" /></dt>
      <dd className="min-w-0 py-2">
        <select
          aria-label="Household"
          value={adding ? "new" : (guest.household_id ?? "none")}
          disabled={pending}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "new") return setAdding(true);
            setAdding(false);
            run(() => onSave({ household_id: value === "none" ? null : value }));
          }}
          className="h-9 w-full cursor-pointer appearance-none bg-transparent bg-[length:14px] bg-[right_2px_center] bg-no-repeat py-0 pr-6 leading-9 text-[15px] text-ink hover:text-champagne-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne-400/40"
          style={{ backgroundImage: CHEVRON }}
        >
          <option value="none">Not in a household</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
          <option value="new">+ New household…</option>
        </select>
        {adding && (
          <form
            className="mt-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => onSave({ household_id: "new", new_household: newName }), () => {
                setAdding(false);
                setNewName("");
              });
            }}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={editorKeys(() => undefined, () => setAdding(false), true)}
              placeholder="e.g. The Bensons"
              aria-label="New household's name"
              className={FIELD}
            />
            <SaveCancel pending={pending} onCancel={() => setAdding(false)} />
          </form>
        )}
        {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      </dd>
    </div>
  );
}

/** Meal and drinks as tiles, saved as they're tapped (canvas 3 "Children · Round 1", C). A child or baby starts on soft drinks only; change it after if they're not. */
function MealRow({ guest, onSave }: { guest: Contact; onSave: (edit: GuestEdit) => Promise<{ error?: string }> }) {
  const [kind, setKind] = useOptimistic(mealKindOf(guest));
  const [soft, setSoft] = useOptimistic(noAlcoholOf(guest));
  const [, startTransition] = useTransition();
  const [failed, setFailed] = useState<string>();

  return (
    <section id="guest-mealkind" className="rounded-xl">
      <MealPicker
        kind={kind}
        noAlcohol={soft}
        onKind={(next) =>
          startTransition(async () => {
            setKind(next);
            setSoft(next !== "adult");
            const { error } = await safely(() => onSave({ meal_kind: next }));
            setFailed(error);
          })
        }
        onNoAlcohol={(no) =>
          startTransition(async () => {
            setSoft(no);
            const { error } = await safely(() => onSave({ no_alcohol: no }));
            setFailed(error);
          })
        }
      />
      {failed && <p role="alert" className="mt-2 text-xs text-ink">{failed}</p>}
    </section>
  );
}

const ANSWERS: { status: Rsvp["status"]; label: string; on: string }[] = [
  // All picked the same way, like "Guest of" above (owner's call).
  { status: "to_invite", label: "To invite", on: "bg-white text-ink" },
  { status: "pending", label: "Yet to respond", on: "bg-white text-ink" },
  { status: "attending", label: "Coming", on: "bg-white text-ink" },
  { status: "declined", label: "Can't come", on: "bg-white text-ink" },
];

/**
 * Day or evening guest, and their one answer — the same two things their
 * row in the list shows. A day guest's evening follows along, so there's
 * no answer per event. Both change with a tap and save behind it.
 */
function GuestOfAndAnswer({ guest, events, own, only }: { guest: Contact; events: WeddingEvent[]; own?: Rsvp; only?: "of" | "answer" }) {
  const [of, setOf] = useOptimistic(own?.event_id);
  const [answer, setAnswer] = useOptimistic(own?.status);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const word = (e: WeddingEvent) => e.name.replace(/^the\s+/i, "").replace(/^\w/, (c) => c.toUpperCase());
  // One-line sliders, like the switches elsewhere: a cream track, the picked one lifted out.
  const track = "mt-2.5 grid auto-cols-fr grid-flow-col gap-0.5 rounded-2xl bg-cream p-[3px]";
  const cell = "min-h-10 min-w-0 rounded-xl px-1 py-1 text-[13px] leading-tight transition";
  const lifted = "shadow-[0_1px_4px_rgb(60_50_40/0.14)]";
  const off = "text-stone hover:text-ink";

  return (
    <section className="space-y-5">
      {only !== "answer" && (
      <div id="guest-of" className="rounded-xl">
        <h3 className="section-label">Guest of</h3>
        <div role="group" aria-label="Guest of" className={track}>
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              aria-pressed={of === e.id}
              onClick={() =>
                startTransition(async () => {
                  setOf(e.id);
                  setError((await safely(() => setGuestOfAction(guest.id, e.id))).error);
                })
              }
              className={`${cell} ${of === e.id ? `bg-white text-ink ${lifted}` : off}`}
            >
              {word(e)}
            </button>
          ))}
        </div>
        {!own && <p className="mt-2 text-sm text-champagne-600">Are they a day or an evening guest?</p>}
      </div>
      )}

      {own && only !== "of" && (
        <div id="guest-rsvp" className="rounded-xl">
          <h3 className="section-label">RSVP</h3>
          <div role="group" aria-label="RSVP" className={track}>
            {ANSWERS.map((a) => (
              <button
                key={a.status}
                type="button"
                aria-pressed={answer === a.status}
                onClick={() =>
                  startTransition(async () => {
                    setAnswer(a.status);
                    setError((await safely(() => setGuestAnswerAction(guest.id, a.status))).error);
                  })
                }
                className={`${cell} ${answer === a.status ? `${a.on} ${lifted}` : off}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-ink">{error}</p>}
    </section>
  );
}

/** Taking someone off the list altogether — asks first, on the card itself. */
function RemoveGuest({ guest, name }: { guest: Contact; name: string }) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="mt-6 w-full py-3 text-sm text-stone underline underline-offset-4 hover:text-ink">
        Remove from the guest list
      </button>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-linen bg-white p-4 text-center">
      <p className="text-sm text-ink">Take {name} off the guest list, with all their answers?</p>
      <div className="mt-3 flex justify-center gap-2">
        <form action={deleteGuestAction.bind(null, guest.id)}>
          <InlineSubmit label="Yes, remove" pendingLabel="Removing…" />
        </form>
        <button type="button" onClick={() => setAsking(false)} className="rounded-full px-3 py-1.5 text-sm text-stone hover:text-ink">
          Keep them
        </button>
      </div>
    </div>
  );
}

/** The handful of roles shown straight away; the rest wait behind "More". */
const COMMON_ROLES = ["Maid of honour", "Bridesmaid", "Best man", "Groomsman"];

/**
 * Role on the day: their roles (ticked), the common ones to tap on, and
 * "More" to open the rest of the usual list and "Your own" — "Less" folds it
 * away again. Tap any role to put it on or take it off. Shows the change at
 * once and saves behind it.
 */
function Roles({ guest, bare = false }: { guest: Contact; bare?: boolean }) {
  const saved = rolesOf(guest);
  const [roles, setRoles] = useOptimistic(saved);
  const [, startTransition] = useTransition();
  const [more, setMore] = useState(false);
  const [custom, setCustom] = useState("");
  const [failed, setFailed] = useState<string>();

  // Theirs first (including any of their own), then the suggestions.
  const theirs = roles;
  const common = COMMON_ROLES.filter((r) => !roles.includes(r));
  const rest = GUEST_ROLES.filter((r) => !roles.includes(r) && !COMMON_ROLES.includes(r));

  function save(next: string[]) {
    startTransition(async () => {
      setRoles(next);
      setFailed((await safely(() => setRolesAction(guest.id, next))).error);
    });
  }
  const toggle = (role: string) => save(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]);

  const pill = "h-9 rounded-full border px-3.5 text-[13px] transition";
  const offPill = `${pill} border-linen bg-white text-ink hover:border-champagne-400`;

  return (
    <section className={bare ? "" : "mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6"}>
      {!bare && (
        <h3 className="section-label flex items-center gap-2">
          {/* The same gold star that marks anyone with a role in the list. */}
          <span aria-hidden className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-champagne-400">
            <Star className="h-2.5 w-2.5 fill-white text-white" strokeWidth={1.4} />
          </span>
          Role on the day
        </h3>
      )}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {theirs.map((role) => (
          <button
            key={role}
            type="button"
            aria-pressed="true"
            onClick={() => toggle(role)}
            className={`${pill} border-champagne-600 bg-champagne-100 font-medium text-champagne-600`}
          >
            ✓ {role}
          </button>
        ))}
        {common.map((role) => (
          <button key={role} type="button" aria-pressed="false" onClick={() => toggle(role)} className={offPill}>
            {role}
          </button>
        ))}
        {more &&
          rest.map((role) => (
            <button key={role} type="button" aria-pressed="false" onClick={() => toggle(role)} className={offPill}>
              {role}
            </button>
          ))}
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
          className={`${pill} flex items-center gap-1 border-dashed border-champagne-400 text-champagne-600 hover:bg-champagne-100`}
        >
          {more ? "Less" : "More"}
          <ChevronDown className={`h-3.5 w-3.5 transition ${more ? "rotate-180" : ""}`} strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      {failed && <p role="alert" className="mt-2 text-sm text-ink">{failed}</p>}

      {more && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (custom.trim()) save([...roles, custom.trim()]);
            setCustom("");
          }}
        >
          <input
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="Your own, e.g. Chief dog handler"
            aria-label="Their own role"
            className="h-11 min-w-0 flex-1 rounded-full border border-linen bg-white px-4 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none"
          />
          <button type="submit" className="h-11 rounded-full bg-ink px-5 text-sm text-ivory hover:bg-ink/90">
            Add
          </button>
        </form>
      )}
    </section>
  );
}
