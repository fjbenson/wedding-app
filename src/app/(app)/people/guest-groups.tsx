"use client";

import type { Cycle } from "@/lib/card-cycle";
import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Mail, MessageSquare, PenLine, Plus, Search, Users, X } from "lucide-react";
import { draftGroupMessageAction } from "../assistant/actions";
import type { Contact, Rsvp } from "@/types/db";
import {
  addToGroupAction,
  createGroupAction,
  deleteGroupAction,
  logGroupMessageAction,
  removeFromGroupAction,
  renameGroupAction,
} from "./group-actions";
import Timeline from "@/components/timeline";
import CardSheet from "@/components/card-sheet";
import { RoundAction, RoundActions } from "@/components/round-actions";
import { AnswerIcon } from "./guest-browser";
import { Avatar, fullName, initials } from "./guest-table";

/**
 * Groups of guests (canvas 3 "Groups · Round 1", owner's pick 14 Oct 2026):
 * people who belong together — "The football lot", "Staying at the pub".
 * A guest is in one household (where the post goes) and any number of groups.
 * Here: the group's card at the top of the guest list, the sheet that emails
 * or texts a group from the couple's own phone, and the guest card's Groups.
 */
export interface GroupSummary {
  id: string;
  name: string;
  members: string[];
}

const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

/** Runs a group save, holding on to any problem to show it in place. */
function useGroupSave() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const run = (save: () => Promise<{ error?: string }>, after?: () => void) =>
    startTransition(async () => {
      try {
        const result = await save();
        setError(result.error);
        if (!result.error) after?.();
      } catch {
        setError(UNSAVED);
      }
    });
  return { pending, error, setError, run };
}

const IDEAS = ["Mum's side", "Plus-ones", "Need a lift", "Kids' table"];

/** "Groups" on a guest's card: theirs as pills (✕ takes them out), then "+ Add to a group". */
export function GuestGroupsSection({
  guestId,
  firstName,
  groups,
  onShowGroup,
  bare = false,
}: {
  guestId: string;
  firstName: string;
  groups: GroupSummary[];
  /** Inside one of the guest card's folds: no hairline above, a little less room. */
  bare?: boolean;
  /** Tapping a pill shows that group on the guest list (on the list itself). */
  onShowGroup?: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const { pending, error, run } = useGroupSave();
  const theirs = groups.filter((g) => g.members.includes(guestId));
  const others = groups.filter((g) => !g.members.includes(guestId));

  return (
    <section className={bare ? "mt-5" : "mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6"}>
      <h3 className="section-label">Groups</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {theirs.map((g) => (
          <span key={g.id} className="inline-flex h-9 items-center gap-1 rounded-full bg-champagne-100 pl-3.5 pr-1 text-sm text-[#5C4520]">
            {onShowGroup ? (
              <button type="button" onClick={() => onShowGroup(g.id)} className="hover:underline hover:underline-offset-4">
                {g.name}
              </button>
            ) : (
              g.name
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => removeFromGroupAction(g.id, guestId))}
              aria-label={`Take ${firstName} out of ${g.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-champagne-600 hover:bg-white/60 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            </button>
          </span>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-champagne-400 px-3.5 text-sm text-champagne-600 hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Add to a group
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3 rounded-[20px] border border-linen bg-white px-4 py-3 shadow-[0_24px_50px_-24px_rgb(30_27_24/0.45)]">
          <div className="flex items-baseline justify-between">
            <span className="section-label">Add {firstName} to</span>
            <button type="button" onClick={() => setAdding(false)} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
              Done
            </button>
          </div>
          {others.length > 0 && (
            <ul className="mt-1">
              {others.map((g) => (
                <li key={g.id} className="border-b border-linen last:border-b-0">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => addToGroupAction(g.id, guestId))}
                    className="flex min-h-11 w-full items-center gap-3 text-left text-[15px] text-ink hover:text-champagne-600 disabled:opacity-60"
                  >
                    <span className="flex-1">{g.name}</span>
                    <span className="text-xs text-stone">{g.members.length}</span>
                    <Plus className="h-4 w-4 text-champagne-600" strokeWidth={1.8} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => createGroupAction(name, guestId), () => setName(""));
            }}
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">A new group</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="A new group, e.g. Plus-ones"
                className="h-11 w-full rounded-xl border border-linen bg-white px-3.5 text-base text-ink placeholder:italic placeholder:text-stone/70 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
              />
            </label>
            <button type="submit" disabled={pending || !name.trim()} className="h-11 shrink-0 rounded-full bg-ink px-4 text-sm text-ivory disabled:opacity-40">
              Add
            </button>
          </form>
          {groups.length < 3 && (
            <p className="mt-2 flex flex-wrap gap-x-2 text-xs text-stone">
              Ideas:
              {IDEAS.filter((idea) => !groups.some((g) => g.name.toLowerCase() === idea.toLowerCase())).map((idea) => (
                <button key={idea} type="button" onClick={() => setName(idea)} className="underline underline-offset-2 hover:text-ink">
                  {idea}
                </button>
              ))}
            </p>
          )}
          {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
        </div>
      )}
      {!adding && error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
    </section>
  );
}

/**
 * One group, as a card that comes up over the guest list like a household's
 * (owner, 17 Oct 2026: tapping a group's heading should pop up from the
 * bottom, not filter the page): its name, how many and how they've answered,
 * Email them (the main thing) · Text · Edit, then who's in it — each opens
 * their guest card on top.
 */
export function GroupSheet({
  cycle,
  group,
  people,
  answerOf,
  weddingName,
  others,
  onClose,
  onOpenGuest,
}: {
  /** Stepping through the groups (owner, 23 Oct 2026). */
  cycle?: Cycle | null;
  group: GroupSummary;
  /** Everyone in the group. */
  people: Contact[];
  /** Guests not in it yet, for "Add someone to this group". */
  others: Contact[];
  answerOf: (g: Contact) => Rsvp["status"] | undefined;
  weddingName: string;
  onClose: () => void;
  onOpenGuest: (id: string) => void;
}) {
  const [sheet, setSheet] = useState<"email" | "text" | null>(null);
  const [editing, setEditing] = useState(false);
  // Bumped when an email or text is noted, so History reloads and shows it.
  const [logged, setLogged] = useState(0);
  // The subtitle's figures in champagne, and any that is 0 left off (owner, 21 Oct 2026).
  const tally = (status: Rsvp["status"]) => people.filter((p) => answerOf(p) === status).length;
  const facts: [number, string][] = [
    [people.length, people.length === 1 ? "person" : "people"],
    [tally("attending"), "coming"],
    [tally("pending"), "yet to respond"],
    [tally("declined"), "can’t come"],
  ];

  return (
    <CardSheet beside cycle={cycle} label={group.name} onClose={onClose} top={<span className="label">Group</span>}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
          <Users className="h-5 w-5" strokeWidth={1.7} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[26px] italic leading-tight text-ink">{group.name}</p>
          <p className="mt-0.5 text-[13px] text-stone">
            {facts
              .filter(([n]) => n > 0)
              .map(([n, word], i) => (
                <span key={word}>
                  {i > 0 && " · "}
                  <span className="font-medium text-champagne-600">{n}</span> {word}
                </span>
              ))}
          </p>
        </div>
      </div>

      {editing ? (
        <EditGroup group={group} onDone={() => setEditing(false)} />
      ) : (
        <RoundActions>
          <RoundAction label="Email" icon={Mail} dark disabled={people.length === 0} onClick={() => setSheet("email")} />
          <RoundAction label="Text" icon={MessageSquare} disabled={people.length === 0} onClick={() => setSheet("text")} />
          <RoundAction label="Edit" icon={PenLine} onClick={() => setEditing(true)} />
        </RoundActions>
      )}

      <section className="mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="label">Guests</h2>
          <span className="label">RSVP</span>
        </div>
        {people.length === 0 ? (
          <p className="py-3 text-sm text-stone">No one in this group yet.</p>
        ) : (
          <ul className="mt-1">
            {people.map((g) => (
              <li key={g.id} className="border-b border-linen last:border-b-0">
                <button
                  type="button"
                  onClick={() => onOpenGuest(g.id)}
                  className="flex min-h-[52px] w-full items-center gap-3 text-left text-[15px] text-ink hover:text-champagne-600"
                >
                  <Avatar guest={g} />
                  <span className="min-w-0 flex-1 truncate">{fullName(g)}</span>
                  <span className="flex shrink-0 items-center gap-2 text-[13px] text-stone">
                    {GROUP_RSVP_WORD[answerOf(g) ?? "unset"]}
                    <AnswerIcon status={answerOf(g)} small />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <AddToGroup group={group} others={others} />

      {/* What's been sent to them and said: emails and texts noted from here, calls and notes added to it. */}
      <section className="mt-6 -mx-[22px] border-y border-linen px-[22px]">
        <Timeline key={logged} scope={`group:${group.id}`} folded />
      </section>

      <RemoveGroup group={group} onRemoved={onClose} />

      {sheet && (
        <MessageSheet
          onLogged={() => setLogged((n) => n + 1)}
          kind={sheet}
          group={group}
          people={people}
          weddingName={weddingName}
          onClose={() => setSheet(null)}
          onOpenGuest={(id) => {
            setSheet(null);
            onOpenGuest(id);
          }}
        />
      )}
    </CardSheet>
  );
}

const GROUP_RSVP_WORD: Record<Rsvp["status"] | "unset", string> = {
  attending: "Coming",
  pending: "Yet to respond",
  to_invite: "To invite",
  declined: "Can’t come",
  unset: "Day or evening?",
};

/** "Add someone to this group": a quick search of the guest list; tap them and they're in. Like the household card's. */
function AddToGroup({ group, others }: { group: GroupSummary; others: Contact[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { pending, error, run } = useGroupSave();
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = others
    .filter((g) => words.every((w) => fullName(g).toLowerCase().includes(w)))
    .sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }));

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 flex min-h-12 items-center gap-3 font-display text-[15px] italic text-stone hover:text-ink">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 text-champagne-600">
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </span>
        Add someone to this group
      </button>
    );
  }
  const close = () => {
    setOpen(false);
    setQuery("");
  };
  return (
    <div className="mt-4 rounded-2xl border border-linen bg-white p-3">
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
        {matches.map((g) => (
          <li key={g.id} className="border-b border-linen last:border-b-0">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => addToGroupAction(group.id, g.id), close)}
              className="flex min-h-11 w-full items-center gap-3 px-1 py-2 text-left hover:text-champagne-600 disabled:opacity-60"
            >
              <span className="type-item min-w-0 flex-1 truncate text-[17px]">{fullName(g)}</span>
              <Plus className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className="px-1 py-3 text-sm text-stone">No one matches that.</li>}
      </ul>
      {error && <p role="alert" className="mt-2 px-1 text-sm text-ink">{error}</p>}
      <button type="button" onClick={close} className="mt-2 w-full py-1.5 text-sm text-stone underline underline-offset-4 hover:text-ink">
        Cancel
      </button>
    </div>
  );
}

/** Rename the group. */
function EditGroup({ group, onDone }: { group: GroupSummary; onDone: () => void }) {
  const [name, setName] = useState(group.name);
  const { pending, error, run } = useGroupSave();
  return (
    <form
      className="mt-3.5 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => renameGroupAction(group.id, name), onDone);
      }}
    >
      <label className="block">
        <span className="sr-only">Group name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-xl border border-linen bg-white px-3.5 text-base text-ink focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
        />
      </label>
      {error && <p role="alert" className="text-sm text-ink">{error}</p>}
      <span className="flex items-center justify-end gap-2 pt-1">
        <span className="flex gap-2">
          <button type="button" onClick={onDone} className="h-9 rounded-full border border-linen bg-white px-4 text-[13px] text-ink">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="h-9 rounded-full bg-ink px-4 text-[13px] text-ivory disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </span>
      </span>
    </form>
  );
}

/** Taking the group off: at the foot of the card like every card's Remove; its people stay on the guest list (owner, 23 Oct 2026). */
function RemoveGroup({ group, onRemoved }: { group: GroupSummary; onRemoved: () => void }) {
  const { pending, error, run } = useGroupSave();
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`Remove the group "${group.name}"? The people in it stay on the guest list.`)) run(() => deleteGroupAction(group.id), onRemoved);
        }}
        className="min-h-11 py-3 text-sm text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
      >
        Remove this group
      </button>
      {error && <p role="alert" className="text-sm text-ink">{error}</p>}
    </div>
  );
}

/**
 * Email or text a group, from the couple's own phone: the app never sends or
 * stores the message. Email puts everyone in Bcc so no one sees the others'
 * addresses; texts can't hide numbers, so the sheet says so. Anyone with no
 * email or number is listed, with a way to add it.
 */
function MessageSheet({
  kind,
  group,
  people,
  weddingName,
  onClose,
  onOpenGuest,
  onLogged,
}: {
  kind: "email" | "text";
  group: GroupSummary;
  people: Contact[];
  weddingName: string;
  onClose: () => void;
  onOpenGuest: (id: string) => void;
  /** Called once the couple say it went, so the group's card lists it. */
  onLogged: () => void;
}) {
  const email = kind === "email";
  const valueOf = (p: Contact) => (email ? p.email : p.phone?.replace(/\s+/g, ""))?.trim() || null;
  const reachable = people.filter((p) => valueOf(p));
  const missing = people.filter((p) => !valueOf(p));
  const [subject, setSubject] = useState(`${weddingName}${/s$/i.test(weddingName) ? "'" : "'s"} wedding · ${group.name}`);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  // "Did it go?": after the phone's own app opens, the couple say so and it's noted (the subject, never the message).
  const [opened, setOpened] = useState(false);
  const [noted, setNoted] = useState<"yes" | "no" | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  // Your assistant writing it: what it's about, then a draft in the message box to change.
  const [asking, setAsking] = useState(false);
  const [about, setAbout] = useState("");
  const [writing, setWriting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const draft = async () => {
    setWriting(true);
    setDraftError(null);
    try {
      const result = await draftGroupMessageAction({ groupName: group.name, kind, about });
      if (result.ok) {
        setMessage(result.text);
        setAsking(false);
      } else setDraftError(result.error);
    } catch {
      setDraftError("That didn't work — the app may have just been updated. Pull down to refresh, then try again.");
    }
    setWriting(false);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const list = reachable.map(valueOf) as string[];
  const enc = encodeURIComponent;
  const href = email
    ? `mailto:?bcc=${list.map(enc).join(",")}&subject=${enc(subject)}${message ? `&body=${enc(message)}` : ""}`
    : /iPhone|iPad|Mac/i.test(typeof navigator === "undefined" ? "" : navigator.userAgent)
      ? `sms:/open?addresses=${list.join(",")}${message ? `&body=${enc(message)}` : ""}`
      : `sms:${list.join(",")}${message ? `?body=${enc(message)}` : ""}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(list.join(email ? ", " : "\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Some browsers won't let a page copy.
    }
  };

  const who = `${reachable.length} ${reachable.length === 1 ? "person" : "people"}`;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${email ? "Email" : "Text"} ${group.name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-ink/30" />
      <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-[28px] bg-ivory px-[22px] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] lg:pt-8">
        <span aria-hidden className="mx-auto block h-[5px] w-10 rounded-full bg-linen lg:hidden" />
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label truncate">{group.name}</p>
            <p className="type-figure mt-1 text-[30px] leading-tight">
              {email ? "Email" : "Text"} {who}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink">
            <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden>
          {reachable.slice(0, 8).map((p) => (
            <span key={p.id} className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne-100 text-xs font-semibold text-champagne-600">
              {initials(p)}
            </span>
          ))}
          {reachable.length > 8 && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne-100 text-xs font-semibold text-champagne-600">+{reachable.length - 8}</span>
          )}
        </div>

        {missing.map((p) => (
          <div key={p.id} className="mt-3 flex items-center gap-3 rounded-[14px] border border-dashed border-champagne-400 px-3.5 py-2.5 text-[13px] text-[#3A342E]">
            <span className="flex-1">
              {fullName(p)} has no {email ? "email" : "mobile number"} yet
            </span>
            <button type="button" onClick={() => onOpenGuest(p.id)} className="text-[13px] text-champagne-600 underline underline-offset-4 hover:text-ink">
              Add it
            </button>
          </div>
        ))}

        {email && (
          <label className="mt-5 block">
            <span className="section-label">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-[14px] border border-linen bg-white px-3.5 text-base text-ink focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
            />
          </label>
        )}
        <label className="mt-4 block">
          <span className="section-label">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={`Optional — write it here, or in your ${email ? "email" : "messages"} app.`}
            className="mt-1.5 w-full rounded-[14px] border border-linen bg-white px-3.5 py-3 text-base text-ink placeholder:italic placeholder:text-stone/70 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
          />
        </label>
        {asking ? (
          <div className="mt-2.5 rounded-[14px] border border-champagne-400/70 bg-cream/60 p-3">
            <label className="block">
              <span className="flex items-center gap-1.5 text-[13px] text-ink">
                <PenLine className="h-4 w-4 text-champagne-600" strokeWidth={1.4} aria-hidden />
                What&apos;s it about?
              </span>
              <input
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && about.trim() && !writing && (e.preventDefault(), draft())}
                autoFocus
                placeholder="e.g. The coach leaves the pub at 1pm"
                className="mt-1.5 h-11 w-full rounded-[12px] border border-linen bg-white px-3 text-base text-ink placeholder:italic placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none"
              />
            </label>
            {draftError && (
              <p role="alert" className="mt-2 text-[13px] text-ink">
                {draftError}
              </p>
            )}
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-xs leading-snug text-stone">Only this, the group&apos;s name and your names go to Juno.</span>
              <span className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setAsking(false)} className="h-9 rounded-full border border-linen bg-white px-3.5 text-[13px] text-ink">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={draft}
                  disabled={!about.trim() || writing}
                  className="h-9 rounded-full bg-ink px-3.5 text-[13px] text-ivory disabled:opacity-50"
                >
                  {writing ? "Writing…" : message ? "Write it again" : "Write it"}
                </button>
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="mt-2 inline-flex h-10 items-center gap-1.5 text-[13px] italic text-champagne-600 hover:text-ink"
          >
            <PenLine className="h-4 w-4" strokeWidth={1.4} aria-hidden />
            Ask Juno to write it
          </button>
        )}

        {reachable.length > 0 ? (
          <>
            <a href={href} onClick={() => { setOpened(true); if (noted === "no") setNoted(null); }} className="mt-5 flex h-[52px] items-center justify-center gap-2 rounded-full bg-ink text-base text-ivory">
              {email ? <Mail className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden /> : <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />}
              {email ? "Open in my email" : "Open in Messages"}
            </a>
            {opened && noted === null && (
              <div className="mt-4 rounded-[14px] border border-champagne-400/70 bg-cream/60 p-3">
                <p className="text-[14px] text-ink">Did it go?</p>
                {noteError && (
                  <p role="alert" className="mt-1.5 text-[13px] text-ink">
                    {noteError}
                  </p>
                )}
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setNoteError(null);
                      try {
                        const r = await logGroupMessageAction(group.id, kind, subject, reachable.length);
                        if (r.error) setNoteError(r.error);
                        else {
                          setNoted("yes");
                          onLogged();
                        }
                      } catch {
                        setNoteError("That didn't work — the app may have just been updated. Pull down to refresh, then try again.");
                      }
                    }}
                    className="h-10 flex-1 rounded-full bg-ink px-3.5 text-[13px] text-ivory"
                  >
                    Yes, note it
                  </button>
                  <button type="button" onClick={() => setNoted("no")} className="h-10 rounded-full border border-linen bg-white px-3.5 text-[13px] text-ink">
                    Not yet
                  </button>
                </div>
                <p className="mt-2 text-xs leading-snug text-stone">Only the {email ? "subject, " : ""}day and how many people are kept; never the message.</p>
              </div>
            )}
            {noted === "yes" && <p className="mt-4 text-center text-[13px] text-champagne-600">Noted on {group.name}&apos;s card.</p>}
            <p className="mt-2.5 text-center text-xs leading-relaxed text-stone">
              {email
                ? "Everyone goes in Bcc, so no one sees the others' addresses. It sends from your own email; replies come to you."
                : "A group text shows everyone's number to everyone in it. It sends from your own phone."}
            </p>
            <p className="mt-2 text-center">
              <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 text-[13px] text-champagne-600 underline underline-offset-4 hover:text-ink">
                {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />}
                {copied ? "Copied" : `Copy the ${list.length} ${email ? (list.length === 1 ? "address" : "addresses") : list.length === 1 ? "number" : "numbers"} instead`}
              </button>
            </p>
          </>
        ) : (
          <p className="mt-5 text-center text-sm text-stone">No one in this group has {email ? "an email" : "a number"} yet.</p>
        )}
      </div>
    </div>
  );
}
