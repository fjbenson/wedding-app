"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { ChevronDown, Mail, MessageSquare, Pencil, Phone, X } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { GUEST_ROLES, rolesOf } from "@/lib/guest-roles";
import type { Contact, Rsvp, WeddingEvent } from "@/types/db";
import { deleteGuestAction, setRolesAction, updateGuestAction, type GuestEdit } from "./actions";
import { saveMealAction, setGuestAnswerAction, setGuestOfAction } from "./rsvp-actions";
import { fullName } from "./guest-table";

type Saver = () => Promise<{ error?: string } | void>;

/**
 * What to say when a save didn't reach the server at all. The usual cause is
 * the app being updated while this page was open: the page still asks for
 * the old version's save, which is no longer there. Without this, the whole
 * screen gave way to "Application error" (9 Oct 2026).
 */
const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

/** Runs a save, turning any failure into a message rather than a crash. */
async function safely(saver: Saver): Promise<{ error?: string }> {
  try {
    return (await saver()) ?? {};
  } catch (error) {
    console.error("save failed", error);
    return { error: UNSAVED };
  }
}

/** A small down-arrow for the household picker, drawn in stone. */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B655E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const FIELD =
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
  onClose,
}: {
  guest: Contact;
  household: { id: string; name: string } | null;
  /** Every household, to move them between. */
  households: { id: string; name: string }[];
  events: WeddingEvent[];
  /** This guest's answers. */
  rsvps: Rsvp[];
  onClose: () => void;
}) {
  const name = fullName(guest);

  // Escape closes it, and the list behind doesn't scroll while it's open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const save = (edit: GuestEdit) => updateGuestAction(guest.id, edit);
  // Their answer for their own event — the first they're on (day before evening).
  const own = events.map((e) => rsvps.find((r) => r.event_id === e.id)).find(Boolean);
  const phone = guest.phone?.replace(/\s+/g, "");

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={name}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-ink/30" />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px]">
        <span aria-hidden className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-linen lg:hidden" />

        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 lg:pt-8">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {household && (
                <Link href={`/people/household/${household.id}`} className="label hover:text-ink">
                  {household.name} ›
                </Link>
              )}
              <NameEditor guest={guest} onSave={save} />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          </div>

          {(phone || guest.email) && (
            <div className="mt-5 flex gap-2.5">
              {phone && (
                <a href={`sms:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm text-ivory hover:bg-ink/90">
                  <MessageSquare className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                  Text
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-linen bg-white text-sm text-ink hover:border-champagne-400">
                  <Phone className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                  Call
                </a>
              )}
              {guest.email && (
                <a href={`mailto:${guest.email}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-linen bg-white text-sm text-ink hover:border-champagne-400">
                  <Mail className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                  Email
                </a>
              )}
            </div>
          )}

          {/* The answer first — it's what changes most — then day or evening, then roles. */}
          {events.length > 0 && <GuestOfAndAnswer guest={guest} events={events} own={own} />}

          <Roles guest={guest} />

          {/* A hairline right across the card between sections. */}
          <section className="mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6">
            <h3 className="section-label">Details</h3>
            <dl className="mt-1">
              <HouseholdRow guest={guest} households={households} onSave={save} />
              <TextRow label="Phone" value={guest.phone} type="tel" onSave={(v) => save({ phone: v })} />
              <TextRow label="Email" value={guest.email} type="email" onSave={(v) => save({ email: v })} />
              {own && (
                <>
                  <TextRow label="Meal choice" value={own.meal_choice} onSave={(v) => saveMealAction(own.id, v, own.dietary_notes ?? "")} />
                  <TextRow label="Allergies & diet" value={own.dietary_notes} onSave={(v) => saveMealAction(own.id, own.meal_choice ?? "", v)} />
                </>
              )}
              <TextRow label="Notes" value={guest.notes} multiline onSave={(v) => save({ notes: v })} />
              <ChildRow guest={guest} onSave={save} />
            </dl>
          </section>

          <RemoveGuest guest={guest} name={name} />
        </div>
      </div>
    </div>
  );
}

/** Runs a save, holding on to any problem so it can be shown in place. */
function useSaver() {
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
function editorKeys(onSave: () => void, onCancel: () => void, multiline = false) {
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

function SaveCancel({ pending, onCancel }: { pending: boolean; onCancel: () => void }) {
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
function NameEditor({ guest, onSave }: { guest: Contact; onSave: (edit: GuestEdit) => Promise<{ error?: string }> }) {
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState(guest.first_name);
  const [last, setLast] = useState(guest.last_name ?? "");
  const { pending, error, setError, run } = useSaver();

  const start = () => {
    setFirst(guest.first_name);
    setLast(guest.last_name ?? "");
    setError(undefined);
    setEditing(true);
  };
  const submit = () => run(() => onSave({ first_name: first, last_name: last }), () => setEditing(false));
  const keys = editorKeys(submit, () => setEditing(false));

  if (!editing) {
    return (
      <button type="button" onClick={start} className="group mt-1.5 block text-left" aria-label={`${fullName(guest)} — change name`}>
        <span className="type-display text-[34px] leading-[1.05]">{fullName(guest)}</span>
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
      <div className="grid grid-cols-2 gap-2">
        <input autoFocus value={first} onChange={(e) => setFirst(e.target.value)} onKeyDown={keys} aria-label="First name" placeholder="First name" className={FIELD} />
        <input value={last} onChange={(e) => setLast(e.target.value)} onKeyDown={keys} aria-label="Last name" placeholder="Last name" className={FIELD} />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
    </form>
  );
}

/** A label and its value; tap to change it there and then. */
function TextRow({
  label,
  value,
  type = "text",
  multiline = false,
  onSave,
}: {
  label: string;
  value: string | null;
  type?: string;
  multiline?: boolean;
  onSave: (value: string) => Promise<{ error?: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const { pending, error, setError, run } = useSaver();

  const start = () => {
    setDraft(value ?? "");
    setError(undefined);
    setEditing(true);
  };
  const submit = () => run(() => onSave(draft), () => setEditing(false));
  const keys = editorKeys(submit, () => setEditing(false), multiline);

  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5">{label}</dt>
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
      <dt className="type-meta py-3.5">Household</dt>
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
          className="w-full cursor-pointer appearance-none bg-transparent bg-[length:14px] bg-[right_2px_center] bg-no-repeat py-1.5 pr-6 text-[15px] text-ink hover:text-champagne-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne-400/40"
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

/** Child or adult — a switch, saved as it's flipped. */
function ChildRow({ guest, onSave }: { guest: Contact; onSave: (edit: GuestEdit) => Promise<{ error?: string }> }) {
  const [child, setChild] = useOptimistic(guest.is_child);
  const [, startTransition] = useTransition();
  const [failed, setFailed] = useState<string>();

  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5">Child</dt>
      <dd className="flex items-center py-2">
        <button
          type="button"
          role="switch"
          aria-checked={child}
          aria-label="This guest is a child"
          onClick={() =>
            startTransition(async () => {
              setChild(!child);
              const { error } = await safely(() => onSave({ is_child: !child }));
              if (error) setFailed(error);
            })
          }
          className={`relative h-7 w-12 rounded-full transition ${child ? "bg-ink" : "bg-linen"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${child ? "left-6" : "left-1"}`} />
        </button>
        <span className="ml-3 text-sm text-stone">{child ? "Yes" : "No"}</span>
        {failed && <span role="alert" className="ml-3 text-xs text-ink">{failed}</span>}
      </dd>
    </div>
  );
}

const ANSWERS: { status: Rsvp["status"]; label: string; on: string }[] = [
  // All picked the same way, like "Guest of" above (owner's call).
  { status: "to_invite", label: "To invite", on: "bg-white text-ink" },
  { status: "pending", label: "Invited", on: "bg-white text-ink" },
  { status: "attending", label: "Coming", on: "bg-white text-ink" },
  { status: "declined", label: "Can't come", on: "bg-white text-ink" },
];

/**
 * Day or evening guest, and their one answer — the same two things their
 * row in the list shows. A day guest's evening follows along, so there's
 * no answer per event. Both change with a tap and save behind it.
 */
function GuestOfAndAnswer({ guest, events, own }: { guest: Contact; events: WeddingEvent[]; own?: Rsvp }) {
  const [of, setOf] = useOptimistic(own?.event_id);
  const [answer, setAnswer] = useOptimistic(own?.status);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const word = (e: WeddingEvent) => e.name.replace(/^the\s+/i, "").replace(/^\w/, (c) => c.toUpperCase());
  // One-line sliders, like the switches elsewhere: a cream track, the picked one lifted out.
  const track = "mt-2.5 grid auto-cols-fr grid-flow-col gap-0.5 rounded-2xl bg-cream p-[3px]";
  const cell = "h-10 min-w-0 rounded-xl px-1 text-[13px] transition";
  const lifted = "shadow-[0_1px_4px_rgb(60_50_40/0.14)]";
  const off = "text-stone hover:text-ink";

  return (
    <section className="mt-6 space-y-5">
      {own && (
        <div>
          <h3 className="section-label">Answer</h3>
          <div role="group" aria-label="Answer" className={track}>
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
      <div>
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
function Roles({ guest }: { guest: Contact }) {
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
    <section className="mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6">
      <h3 className="section-label">Role on the day</h3>
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
