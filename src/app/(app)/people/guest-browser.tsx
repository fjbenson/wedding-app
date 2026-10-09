"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronRight, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { roleRank, rolesOf } from "@/lib/guest-roles";
import type { Contact, Rsvp, WeddingEvent } from "@/types/db";
import { inviteAction } from "./rsvp-actions";
import GuestCard from "./guest-card";
import { RolePill, fullName, initials } from "./guest-table";

/** The filters in the Filter menu. More than one can be on: they narrow together. */
export type GuestFilter = "party" | "dietary" | "children" | "noaddress";
export type GuestView = "az" | "households";
/** How the list is ordered (the Sort button). */
type SortBy = "first" | "last" | "household" | "type";
/** Which answer the numbers card is showing, for the picked event. */
type Showing = "all" | Rsvp["status"];

export interface HouseholdSummary {
  id: string;
  name: string;
  hasAddress: boolean;
}

interface Group {
  key: string;
  title: string;
  /** Household groups link to the household's page. */
  href?: string;
  note?: string;
  guests: Contact[];
}

const byName = (a: Contact, b: Contact) =>
  fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" });
const bySurname = (a: Contact, b: Contact) =>
  (a.last_name ?? "").localeCompare(b.last_name ?? "", undefined, { sensitivity: "base" }) || byName(a, b);

const FILTERS: { key: GuestFilter; label: string }[] = [
  { key: "party", label: "Bridal party" },
  { key: "dietary", label: "Dietary needs" },
  { key: "children", label: "Children" },
  { key: "noaddress", label: "No address yet" },
];

const SORTS: { key: SortBy; label: string; short: string }[] = [
  { key: "first", label: "First name, A–Z", short: "by first name" },
  { key: "last", label: "Surname, A–Z", short: "by surname" },
  { key: "household", label: "Household", short: "by household" },
  { key: "type", label: "Day guests, then evening", short: "day, then evening" },
];

/** How each answer reads at the end of a row. */
const ANSWER_WORD: Record<Rsvp["status"], { word: string; className: string }> = {
  attending: { word: "Coming", className: "text-ink" },
  pending: { word: "Waiting", className: "italic text-champagne-600" },
  declined: { word: "Can't come", className: "text-stone" },
};

/** "The evening" → "evening": the word after a guest's name. */
const eventWord = (e: WeddingEvent) => e.name.replace(/^the\s+/i, "").toLowerCase();

const SHOWING_WORD: Record<Showing, string> = {
  all: "Everyone",
  attending: "Coming",
  pending: "Waiting",
  declined: "Can't come",
};

/**
 * The guest list (People › Guests), as settled on the design canvas in
 * "Guest list · Rounds 4–12" (9 Oct 2026). The event switch, then the
 * numbers card — a big "All" and the breakdown beside it, each one tappable
 * to show just those people — then search with Filter and Sort menus, then
 * the guests: each row is a name with "day" or "evening" after it, any roles
 * as pills, and their answer in a word. A–Z by first name (with a letter
 * index) unless sorted otherwise. Phones get these rows; laptops a full
 * table. Tapping anyone opens their card (guest-card.tsx).
 *
 * Search, filters and sort are kept here rather than in the address, so
 * they answer instantly and survive the card opening and closing.
 */
export default function GuestBrowser({
  guests,
  households,
  events,
  rsvps,
  initialEventId,
  initialGuestId,
  initialFilter,
  initialView = "az",
}: {
  guests: Contact[];
  households: HouseholdSummary[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  initialEventId?: string;
  initialGuestId?: string;
  initialFilter?: GuestFilter;
  initialView?: GuestView;
}) {
  const [eventId, setEventId] = useState(initialEventId);
  const [query, setQuery] = useState("");
  const [showing, setShowing] = useState<Showing>("all");
  const [filters, setFilters] = useState<GuestFilter[]>(initialFilter ? [initialFilter] : []);
  const [sort, setSort] = useState<SortBy>(initialView === "households" ? "household" : "first");
  const [openId, setOpenId] = useState(initialGuestId);
  const close = useCallback(() => setOpenId(undefined), []);

  const event = events.find((e) => e.id === eventId) ?? events[0];

  const data = useMemo(() => {
    const answers = new Map<string, Rsvp[]>();
    for (const r of rsvps) answers.set(r.contact_id, [...(answers.get(r.contact_id) ?? []), r]);
    const household = new Map(households.map((h) => [h.id, h]));
    const members = new Map<string, Contact[]>();
    for (const g of guests) {
      if (g.household_id) members.set(g.household_id, [...(members.get(g.household_id) ?? []), g]);
    }
    return { answers, household, members };
  }, [guests, households, rsvps]);

  const statusFor = (g: Contact, e: WeddingEvent | undefined) =>
    e ? data.answers.get(g.id)?.find((r) => r.event_id === e.id)?.status : undefined;
  /**
   * Each guest is a day guest or an evening guest: the first event they're
   * invited to (events come in date order). The day includes the evening,
   * so one word and one answer say it all.
   */
  const ownEvent = (g: Contact) => events.find((e) => statusFor(g, e));
  const dietOf = (g: Contact) => data.answers.get(g.id)?.find((r) => r.dietary_notes)?.dietary_notes ?? null;

  const tests: Record<GuestFilter, (g: Contact) => boolean> = {
    party: (g) => rolesOf(g).length > 0,
    dietary: (g) => Boolean(dietOf(g)),
    children: (g) => g.is_child,
    noaddress: (g) => !g.household_id || !data.household.get(g.household_id)?.hasAddress,
  };
  const counted = FILTERS.map((f) => ({ ...f, count: guests.filter(tests[f.key]).length }));
  const toggle = (key: GuestFilter) =>
    setFilters((on) => (on.includes(key) ? on.filter((k) => k !== key) : [...on, key]));

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = guests
    .filter((g) => showing === "all" || statusFor(g, event) === showing)
    .filter((g) => filters.every((f) => tests[f](g)))
    .filter((g) => {
      if (words.length === 0) return true;
      const hay = [fullName(g), g.household_id && data.household.get(g.household_id)?.name, ...rolesOf(g)]
        .join(" ")
        .toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .sort(sort === "last" ? bySurname : byName);

  // How the list is grouped: by role for the bridal party, by household or
  // by day/evening if sorted that way, otherwise one A–Z run.
  let groups: Group[];
  if (filters.includes("party")) {
    const roles = [...new Set(shown.flatMap(rolesOf))].sort((a, b) => roleRank(a) - roleRank(b) || a.localeCompare(b));
    groups = roles.map((role) => ({ key: role, title: role, guests: shown.filter((g) => rolesOf(g).includes(role)) }));
  } else if (sort === "type") {
    groups = events
      .map((e) => ({
        key: e.id,
        title: `${eventWord(e).replace(/^\w/, (c) => c.toUpperCase())} guests`,
        guests: shown.filter((g) => ownEvent(g)?.id === e.id),
      }))
      .filter((group) => group.guests.length > 0);
    const loose = shown.filter((g) => !ownEvent(g));
    if (loose.length > 0) groups.push({ key: "none", title: "Not invited yet", guests: loose });
  } else if (sort === "household") {
    groups = households
      .map((h) => ({
        key: h.id,
        title: h.name,
        href: `/people/household/${h.id}`,
        note: h.hasAddress ? undefined : "No address",
        guests: shown.filter((g) => g.household_id === h.id),
      }))
      .filter((group) => group.guests.length > 0);
    const loose = shown.filter((g) => !g.household_id);
    if (loose.length > 0) groups.push({ key: "none", title: "Not in a household yet", guests: loose });
  } else {
    groups = [{ key: "az", title: "", guests: shown }];
  }


  const open = openId ? guests.find((g) => g.id === openId) : undefined;
  const az = groups.length === 1 && groups[0].key === "az";
  const letterOf = (g: Contact) => ((sort === "last" && g.last_name) || g.first_name).charAt(0).toUpperCase();
  const letters = az ? new Set(shown.map(letterOf)) : new Set<string>();
  const indexed = az && shown.length > 12;
  const firstOfLetter = new Set(az ? [...letters].map((l) => shown.find((g) => letterOf(g) === l)!.id) : []);
  const uninvited = event ? guests.filter((g) => !statusFor(g, event)) : [];

  return (
    <>
      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-8">
        {event && (
          <div>
            <EventSwitch events={events} event={event} onPick={setEventId} />
            {uninvited.length > 0 && <InviteStrip event={event} uninvited={uninvited} everyone={uninvited.length === guests.length} />}
            <AnswersCard
              total={guests.length}
              homes={households.length}
              counts={{
                attending: guests.filter((g) => statusFor(g, event) === "attending").length,
                pending: guests.filter((g) => statusFor(g, event) === "pending").length,
                declined: guests.filter((g) => statusFor(g, event) === "declined").length,
              }}
              showing={showing}
              onShow={setShowing}
            />
          </div>
        )}

        <div className="mt-5 lg:mt-0">
          <div className="flex items-center gap-2">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
              <Search className="h-[17px] w-[17px] shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
              <span className="sr-only">Find a guest</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a guest"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
              />
            </label>
            <FilterMenu filters={counted} on={filters} onToggle={toggle} onClear={() => setFilters([])} />
            <SortMenu sort={sort} onSort={setSort} />
          </div>

          <div className="mt-4 flex min-h-9 items-center justify-between gap-3 px-1">
            {filters.length > 0 ? (
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                {filters.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    aria-label={`Take off ${FILTERS.find((f) => f.key === key)!.label}`}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 text-[13px] font-medium text-champagne-600"
                  >
                    {FILTERS.find((f) => f.key === key)!.label}
                    <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                  </button>
                ))}
                <button type="button" onClick={() => setFilters([])} className="h-8 px-1 text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                  Clear
                </button>
              </span>
            ) : (
              <span className="type-meta min-w-0 truncate max-[359px]:tracking-[0.12em]">
                {SHOWING_WORD[showing]} · {SORTS.find((o) => o.key === sort)!.short}
              </span>
            )}
            <Link
              href="/people/new"
              className="flex h-9 shrink-0 items-center gap-1 whitespace-nowrap text-sm text-champagne-600 hover:text-ink"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Add<span className="max-[359px]:sr-only"> a guest</span>
            </Link>
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 px-1 text-sm text-stone">No one matches that.</p>
      ) : (
        <>
          {/* Phones and tablets: compact rows, tap for the card. */}
          <div className="flex lg:hidden">
            <div className="min-w-0 flex-1">
              {groups.map((group) => (
                <section key={group.key}>
                  {group.title && <GroupTitle group={group} />}
                  <ul>
                    {group.guests.map((g) => (
                      <li key={g.id} id={firstOfLetter.has(g.id) ? `az-${letterOf(g)}` : undefined} className="scroll-mt-4 border-b border-linen">
                        <GuestRow guest={g} event={ownEvent(g)} status={statusFor(g, ownEvent(g))} showEvent={sort !== "type"} onOpen={() => setOpenId(g.id)} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            {indexed && <LetterIndex letters={letters} />}
          </div>

          {/* Laptops: every detail at once. */}
          <GuestTable
            groups={groups}
            answers={data.answers}
            ownEvent={ownEvent}
            showEvent={sort !== "type"}
            onOpen={setOpenId}
          />
        </>
      )}

      {/* The card no longer carries this, so it sits at the foot of the list. */}
      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {event && (
          <Link href={`/people/events/${event.id}`} className="text-xs text-stone underline underline-offset-4 hover:text-ink">
            Rename {event.name.toLowerCase()}
          </Link>
        )}
      </p>

      {open && (
        <GuestCard
          guest={open}
          household={open.household_id ? (data.household.get(open.household_id) ?? null) : null}
          households={households}
          events={events}
          rsvps={data.answers.get(open.id) ?? []}
          onClose={close}
        />
      )}
    </>
  );
}

function GroupTitle({ group }: { group: Group }) {
  const inner = (
    <>
      <span className="label">{group.title}</span>
      <span className="text-xs text-stone">
        {group.note ?? group.guests.length}
        {group.href && " ›"}
      </span>
    </>
  );
  const className = "mt-5 flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-1.5 pt-1";
  return group.href ? (
    <Link href={group.href} className={`${className} hover:[&>span]:text-ink`}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

/** The A–Z down the side, like a phone's contacts: tap a letter to jump. */
function LetterIndex({ letters }: { letters: Set<string> }) {
  return (
    <nav aria-label="Jump to a letter" className="sticky top-24 -mr-2 ml-1 flex h-fit w-6 flex-col items-center">
      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) =>
        letters.has(l) ? (
          <button
            key={l}
            type="button"
            onClick={() => document.getElementById(`az-${l}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="w-6 text-xs font-medium leading-5 text-champagne-600"
          >
            {l}
          </button>
        ) : (
          <span key={l} aria-hidden className="text-xs leading-5 text-linen">
            {l}
          </span>
        ),
      )}
    </nav>
  );
}

/** Day | Evening (or the couple's own events), and + to add one. */
function EventSwitch({
  events,
  event,
  onPick,
}: {
  events: WeddingEvent[];
  event: WeddingEvent;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span role="group" aria-label="Which event" className="flex min-w-0 rounded-full bg-cream p-[3px]">
        {events.map((e) => (
          <button
            key={e.id}
            type="button"
            aria-pressed={e.id === event.id}
            onClick={() => onPick(e.id)}
            className={`h-8 max-w-[8rem] truncate rounded-full px-4 text-[13px] transition ${
              e.id === event.id ? "bg-white text-ink shadow-[0_1px_4px_rgb(60_50_40/0.12)]" : "text-stone hover:text-ink"
            }`}
          >
            {events.length > 1 ? e.name.replace(/^the\s+/i, "").replace(/^\w/, (c) => c.toUpperCase()) : e.name}
          </button>
        ))}
      </span>
      <Link
        href="/people/events/new"
        aria-label="Add an event"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-champagne-600 hover:bg-champagne-100"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      </Link>
    </div>
  );
}

/** Only when someone isn't invited to the picked event: invite them all at once. */
function InviteStrip({ event, uninvited, everyone }: { event: WeddingEvent; uninvited: Contact[]; everyone: boolean }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-champagne-400 px-3.5 py-2.5">
      <p className="min-w-0 flex-1 text-sm text-ink">
        {everyone ? `No one's invited to ${event.name.toLowerCase()} yet.` : `${uninvited.length} not invited to ${event.name.toLowerCase()}.`}
      </p>
      <form action={inviteAction.bind(null, event.id, uninvited.map((g) => g.id))}>
        <InlineSubmit label={everyone ? "Invite all" : "Invite them"} pendingLabel="Inviting…" />
      </form>
    </div>
  );
}

/**
 * The numbers for the picked event: everyone on the left, big, and the
 * breakdown beside it. Each one is a button — tap Waiting to see just who
 * hasn't answered, tap it again (or All) to see everyone.
 */
function AnswersCard({
  total,
  homes,
  counts,
  showing,
  onShow,
}: {
  total: number;
  homes: number;
  counts: Record<Rsvp["status"], number>;
  showing: Showing;
  onShow: (s: Showing) => void;
}) {
  const all = showing === "all";
  const rows: { status: Rsvp["status"]; label: string; tone: string }[] = [
    { status: "attending", label: "Coming", tone: "text-ink" },
    { status: "pending", label: "Waiting", tone: "text-champagne-600" },
    { status: "declined", label: "Can't come", tone: "text-stone" },
  ];

  return (
    <section
      aria-label="Answers"
      className="mt-3 grid grid-cols-[6.25rem_minmax(0,1fr)] gap-2.5 rounded-[22px] border border-white/85 bg-white/45 p-3 pb-2 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-xl sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3 sm:p-3.5 sm:pb-2.5"
    >
      <button
        type="button"
        aria-pressed={all}
        onClick={() => onShow("all")}
        className={`mb-1 flex flex-col justify-between rounded-2xl p-3 text-left transition ${
          all ? "bg-ink text-ivory" : "bg-cream text-ink hover:bg-champagne-100"
        }`}
      >
        <span className={`type-meta ${all ? "text-ivory/75" : ""}`}>All</span>
        <span>
          <span className={`type-figure block text-[46px] leading-none sm:text-[52px] ${all ? "text-ivory" : ""}`}>{total}</span>
          <span className={`mt-1.5 block text-xs ${all ? "text-ivory/75" : "text-stone"}`}>
            {total === 1 ? "guest" : "guests"} · {homes} {homes === 1 ? "home" : "homes"}
          </span>
        </span>
      </button>

      <div className="flex min-w-0 flex-col justify-center">
        {rows.map((row, i) => {
          const on = showing === row.status;
          return (
            <button
              key={row.status}
              type="button"
              aria-pressed={on}
              onClick={() => onShow(on ? "all" : row.status)}
              className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-left sm:gap-2.5 sm:px-2.5 transition ${
                on ? "bg-white shadow-[0_1px_4px_rgb(60_50_40/0.14)]" : "hover:bg-white/60"
              } ${i > 0 && !on && showing !== rows[i - 1].status ? "border-t border-linen" : "border-t border-transparent"}`}
            >
              <span className={`type-figure min-w-[2.25rem] text-[26px] leading-none tabular-nums ${row.tone}`}>{counts[row.status]}</span>
              <span className={`type-meta min-w-0 flex-1 leading-tight tracking-[0.12em] ${on ? "text-ink" : ""}`}>{row.label}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone" strokeWidth={2} aria-hidden />
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * One guest in the phone list: initials, their name with "day" or "evening"
 * after it, any roles as pills underneath, and their answer in a word.
 */
function GuestRow({
  guest,
  event,
  status,
  showEvent,
  onOpen,
}: {
  guest: Contact;
  /** Off when the list is already grouped into day and evening guests. */
  showEvent: boolean;
  /** The event they're a guest of — their first invitation. */
  event?: WeddingEvent;
  status?: Rsvp["status"];
  onOpen: () => void;
}) {
  const roles = rolesOf(guest);
  const answer = status ? ANSWER_WORD[status] : { word: "Not invited", className: "text-stone/70" };

  return (
    <button type="button" onClick={onOpen} className="flex min-h-[54px] w-full items-center gap-3 py-1.5 text-left">
      {/* Below 360px wide the name needs the room more than the initials do. */}
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream font-display text-sm text-champagne-600 max-[359px]:hidden">
        {initials(guest)}
      </span>
      <span className="min-w-0 flex-1">
        {/* Inline, so a long name wraps rather than being cut short. */}
        <span className="block break-words">
          <span className="type-item text-lg">{fullName(guest)}</span>
          {event && showEvent && (
            <span className="ml-2 whitespace-nowrap font-display text-sm italic text-champagne-600">{eventWord(event)}</span>
          )}
        </span>
        {roles.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1.5">
            {roles.map((role) => <RolePill key={role} role={role} />)}
          </span>
        )}
      </span>
      <span className={`shrink-0 text-[13px] ${answer.className}`}>{answer.word}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
    </button>
  );
}

/** A round button beside the search that drops a small menu below it. Tapping elsewhere, or Escape, closes it. */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, box };
}

const MENU =
  "absolute right-0 top-[calc(100%+8px)] z-30 rounded-[20px] border border-linen bg-white px-4 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]";

/**
 * The Filter button and its menu: what to show (any mix of these). The list
 * changes as you tick, so there's no "apply" step.
 */
function FilterMenu({
  filters,
  on,
  onToggle,
  onClear,
}: {
  filters: { key: GuestFilter; label: string; count: number }[];
  on: GuestFilter[];
  onToggle: (key: GuestFilter) => void;
  onClear: () => void;
}) {
  const { open, setOpen, box } = useDropdown();

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={on.length > 0 ? `Filter, ${on.length} on` : "Filter"}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border transition ${
          on.length > 0 ? "border-ink bg-ink text-ivory" : "border-linen bg-white text-ink hover:border-champagne-400"
        }`}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        {on.length > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-ivory bg-champagne-400 px-1 text-[11px] font-semibold text-white"
          >
            {on.length}
          </span>
        )}
      </button>

      {open && (
        <div className={`${MENU} w-[17rem] pb-2 pt-2.5`}>
          <div className="flex items-baseline justify-between py-1">
            <span className="section-label">Show only</span>
            {on.length > 0 && (
              <button type="button" onClick={onClear} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                Clear
              </button>
            )}
          </div>
          <ul>
            {filters.map((f) => {
              const ticked = on.includes(f.key);
              return (
                <li key={f.key} className="border-t border-linen first:border-t-0">
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={ticked}
                    onClick={() => onToggle(f.key)}
                    className="flex min-h-11 w-full items-center gap-3 text-left text-sm text-ink"
                  >
                    <span
                      aria-hidden
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
                        ticked ? "bg-ink text-ivory" : "border-[1.5px] border-[#D8D0C4]"
                      }`}
                    >
                      {ticked && <Check className="h-3 w-3" strokeWidth={2.6} />}
                    </span>
                    <span className="flex-1">{f.label}</span>
                    <span className="text-[13px] text-stone">{f.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** The Sort button and its menu: pick one; the menu closes as you do. */
function SortMenu({ sort, onSort }: { sort: SortBy; onSort: (s: SortBy) => void }) {
  const { open, setOpen, box } = useDropdown();

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Sort: ${SORTS.find((o) => o.key === sort)!.label}`}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 w-12 items-center justify-center rounded-full border bg-white text-ink transition ${
          open ? "border-champagne-400" : "border-linen hover:border-champagne-400"
        }`}
      >
        <ArrowUpDown className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
      </button>

      {open && (
        <div className={`${MENU} w-[16rem] pb-1.5 pt-2.5`}>
          <span className="section-label block py-1">Sort by</span>
          <ul>
            {SORTS.map((o) => (
              <li key={o.key} className="border-t border-linen first:border-t-0">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={sort === o.key}
                  onClick={() => {
                    onSort(o.key);
                    setOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center gap-3 text-left text-sm text-ink"
                >
                  <span className="flex-1">{o.label}</span>
                  {sort === o.key && <Check className="h-4 w-4 text-ink" strokeWidth={2.4} aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Laptops: the same rows as the phone list, with room for everything — the
 * name with "day" or "evening", roles, their answer in a word, then meal,
 * diet and how to reach them.
 */
function GuestTable({
  groups,
  answers,
  ownEvent,
  showEvent,
  onOpen,
}: {
  groups: Group[];
  answers: Map<string, Rsvp[]>;
  ownEvent: (g: Contact) => WeddingEvent | undefined;
  showEvent: boolean;
  onOpen: (id: string) => void;
}) {
  const head = "whitespace-nowrap pb-3 pr-4 pt-1 text-xs font-medium uppercase tracking-[0.16em] text-stone";

  return (
    <div className="mt-6 hidden rounded-[22px] border border-white bg-white/60 px-5 pb-3 pt-3 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4)] lg:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-champagne-400">
            <th scope="col" className={head}>Guest</th>
            <th scope="col" className={head}>Role</th>
            <th scope="col" className={head}>Answer</th>
            <th scope="col" className={head}>Meal</th>
            <th scope="col" className={head}>Dietary</th>
            <th scope="col" className={head}>Phone</th>
            <th scope="col" className={head}>Email</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            {group.title && (
              <tr>
                <th colSpan={7} scope="colgroup" className="pb-1.5 pt-5 text-left font-normal">
                  {group.href ? (
                    <Link href={group.href} className="font-display text-lg text-ink hover:underline hover:decoration-champagne-400 hover:underline-offset-4">
                      {group.title}
                    </Link>
                  ) : (
                    <span className="font-display text-lg text-ink">{group.title}</span>
                  )}
                  {group.note && <span className="type-meta ml-3">{group.note}</span>}
                </th>
              </tr>
            )}
            {group.guests.map((g) => {
              const event = ownEvent(g);
              // Meal and diet are recorded per event: show the ones for their own.
              const rsvp = event ? answers.get(g.id)?.find((r) => r.event_id === event.id) : undefined;
              const answer = rsvp ? ANSWER_WORD[rsvp.status] : { word: "Not invited", className: "text-stone/70" };
              return (
                <tr key={g.id} onClick={() => onOpen(g.id)} className="cursor-pointer border-t border-linen align-middle hover:bg-champagne-100/50">
                  <td className="py-2.5 pr-4">
                    <button type="button" onClick={() => onOpen(g.id)} className="whitespace-nowrap text-left font-display text-[17px] text-ink hover:underline">
                      {fullName(g)}
                    </button>
                    {event && showEvent && (
                      <span className="ml-2 whitespace-nowrap font-display text-sm italic text-champagne-600">{eventWord(event)}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="flex flex-wrap gap-1">
                      {rolesOf(g).map((role) => <RolePill key={role} role={role} />)}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap py-2.5 pr-4 ${answer.className}`}>{answer.word}</td>
                  <td className="py-2.5 pr-4 text-ink">{rsvp?.meal_choice}</td>
                  <td className="py-2.5 pr-4 text-stone">{rsvp?.dietary_notes}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-stone">{g.phone}</td>
                  <td className="max-w-56 truncate py-2.5 pr-4 text-stone">{g.email}</td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
