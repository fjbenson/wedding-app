"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Mail, Plus, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { roleRank, rolesOf } from "@/lib/guest-roles";
import type { Contact, Rsvp, WeddingEvent } from "@/types/db";
import GuestCard from "./guest-card";
import { RolePill, fullName, initials } from "./guest-table";

/** The filters in the Filter menu. More than one can be on: they narrow together. */
export type GuestFilter = "party" | "dietary" | "children" | "noaddress";
export type GuestView = "az" | "households";
/** How the list is ordered (the Sort button). */
type SortBy = "first" | "last" | "household" | "type";
/** Which answer the numbers card is showing (each guest's answer for their own event). */
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
  guests: Contact[];
}

const guestCount = (n: number) => `${n} ${n === 1 ? "guest" : "guests"}`;

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
  to_invite: { word: "To invite", className: "text-stone" },
  pending: { word: "Invited", className: "italic text-champagne-600" },
  declined: { word: "Can't come", className: "text-stone" },
};

/** "The evening" → "evening": the word after a guest's name. */
export const eventWord = (e: WeddingEvent) => e.name.replace(/^the\s+/i, "").toLowerCase();

/**
 * The guest list (People › Guests), as settled on the design canvas in
 * "Guest list · Rounds 4–12" (9 Oct 2026). The numbers card — a big "All"
 * and the breakdown beside it, each one tappable to show just those people,
 * and counting whoever the filters leave — then search with Filter (day or
 * evening guests, bridal party, …) and Sort menus, then
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
  initialGuestId,
  initialFilter,
  initialView = "az",
}: {
  guests: Contact[];
  households: HouseholdSummary[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  initialGuestId?: string;
  initialFilter?: GuestFilter;
  initialView?: GuestView;
}) {
  const [query, setQuery] = useState("");
  const [showing, setShowing] = useState<Showing>("all");
  const [filters, setFilters] = useState<GuestFilter[]>(initialFilter ? [initialFilter] : []);
  /** "Day guests" / "Evening guests" in the Filter menu: event ids, any of. */
  const [guestOf, setGuestOf] = useState<string[]>([]);
  const [sort, setSort] = useState<SortBy>(initialView === "households" ? "household" : "first");
  const [openId, setOpenId] = useState(initialGuestId);
  const close = useCallback(() => setOpenId(undefined), []);

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
  const ofLabel = (e: WeddingEvent) => `${eventWord(e).replace(/^\w/, (c) => c.toUpperCase())} guests`;
  const ofCounted = events.map((e) => ({ id: e.id, label: ofLabel(e), count: guests.filter((g) => ownEvent(g)?.id === e.id).length }));
  const toggleOf = (id: string) => setGuestOf((on) => (on.includes(id) ? on.filter((k) => k !== id) : [...on, id]));
  const clearAll = () => {
    setFilters([]);
    setGuestOf([]);
  };

  // What the filters leave, before search and the numbers card: the card
  // counts these, so every filter narrows its numbers too.
  const filtered = guests
    .filter((g) => guestOf.length === 0 || guestOf.includes(ownEvent(g)?.id ?? ""))
    .filter((g) => filters.every((f) => tests[f](g)));
  const answerOf = (g: Contact) => statusFor(g, ownEvent(g));

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = filtered
    .filter((g) => showing === "all" || answerOf(g) === showing)
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
    if (loose.length > 0) groups.push({ key: "none", title: "Day or evening?", guests: loose });
  } else if (sort === "household") {
    groups = households
      .map((h) => ({
        key: h.id,
        title: h.name,
        href: `/people/household/${h.id}`,
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

  return (
    <>
      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-8">
        {events.length > 0 && (
          <div>
            <AnswersCard
              total={filtered.length}
              homes={new Set(filtered.map((g) => g.household_id).filter(Boolean)).size}
              counts={{
                to_invite: filtered.filter((g) => answerOf(g) === "to_invite").length,
                attending: filtered.filter((g) => answerOf(g) === "attending").length,
                pending: filtered.filter((g) => answerOf(g) === "pending").length,
                declined: filtered.filter((g) => answerOf(g) === "declined").length,
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
            <FilterMenu
              guestOf={ofCounted}
              ofOn={guestOf}
              onToggleOf={toggleOf}
              filters={counted}
              on={filters}
              onToggle={toggle}
              onClear={clearAll}
            />
          </div>

          {/* Add on the left; the order on the right, which opens Sort (owner's call, 9 Oct 2026). */}
          <div className="mt-4 flex min-h-9 items-center justify-between gap-3 px-1">
            <Link
              href="/people/new"
              className="flex h-9 shrink-0 items-center gap-1 whitespace-nowrap text-sm text-champagne-600 hover:text-ink"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Add<span className="max-[359px]:sr-only"> a guest</span>
            </Link>
            <SortMenu sort={sort} onSort={setSort} />
          </div>
          {filters.length + guestOf.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
              {ofCounted
                .filter((o) => guestOf.includes(o.id))
                .map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggleOf(o.id)}
                    aria-label={`Take off ${o.label}`}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 text-[13px] font-medium text-champagne-600"
                  >
                    {o.label}
                    <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                  </button>
                ))}
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
              <button type="button" onClick={clearAll} className="h-8 px-1 text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                Clear
              </button>
            </div>
          )}
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
                      <li key={g.id} id={firstOfLetter.has(g.id) ? `az-${letterOf(g)}` : undefined} className="scroll-mt-4 border-b-[0.5px] border-champagne-400">
                        <GuestRow guest={g} event={ownEvent(g)} status={statusFor(g, ownEvent(g))} showEvent={sort !== "type"} onOpen={() => setOpenId(g.id)} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <AnswerKey unset={shown.some((g) => !ownEvent(g))} />
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

      {/* The events themselves — renaming them, or adding another — at the foot of the list. */}
      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {events.map((e) => (
          <Link key={e.id} href={`/people/events/${e.id}`} className="text-xs text-stone underline underline-offset-4 hover:text-ink">
            Rename {e.name.toLowerCase()}
          </Link>
        ))}
        <Link href="/people/events/new" className="text-xs text-stone underline underline-offset-4 hover:text-ink">
          Add an event
        </Link>
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
        {guestCount(group.guests.length)}
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

/**
 * The numbers for whoever the filters leave: all of them on the left, big, and the
 * breakdown beside it. Each one is a button — tap Invited to see just who
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
    // All three in champagne (owner's call); only the big All is ink.
    { status: "attending", label: "Coming", tone: "text-champagne-600" },
    { status: "pending", label: "Invited", tone: "text-champagne-600" },
    { status: "declined", label: "Can't come", tone: "text-champagne-600" },
    // "To invite" isn't listed (owner's call): those guests count in All.
  ];

  return (
    <section
      aria-label="Answers"
      className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-2.5 rounded-[22px] border border-white/85 bg-white/45 p-3 pb-2 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-xl sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3 sm:p-3.5 sm:pb-2.5"
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
              className={`relative flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-left sm:gap-2.5 sm:px-2.5 transition ${
                on ? "bg-white shadow-[0_1px_4px_rgb(60_50_40/0.14)]" : "hover:bg-white/60"
              }`}
            >
              {/* A straight line between rows (a border would follow the rounded corners). */}
              {i > 0 && !on && showing !== rows[i - 1].status && <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-linen" />}
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
 * A guest's answer as one small round icon (canvas "Guest list · Round 14",
 * option A): ✓ coming, an envelope once invited, a dashed envelope still to
 * invite, ✕ can't come, and a dashed ? for someone not yet day or evening.
 */
const ICON: Record<Rsvp["status"] | "unset", { ring: string; icon: React.ReactNode }> = {
  attending: { ring: "bg-ink text-ivory", icon: <Check className="h-[55%] w-[55%]" strokeWidth={2.4} /> },
  pending: { ring: "bg-champagne-100 text-champagne-600", icon: <Mail className="h-1/2 w-1/2" strokeWidth={2} /> },
  to_invite: { ring: "border-[1.5px] border-dashed border-champagne-400 text-champagne-400", icon: <Mail className="h-1/2 w-1/2" strokeWidth={2} /> },
  declined: { ring: "bg-[#EEE9E1] text-[#8A837B]", icon: <X className="h-1/2 w-1/2" strokeWidth={2.4} /> },
  unset: { ring: "border-[1.5px] border-dashed border-champagne-400 text-champagne-600", icon: <span className="font-display text-[0.8em] leading-none">?</span> },
};

function AnswerIcon({ status, small = false }: { status?: Rsvp["status"]; small?: boolean }) {
  const look = ICON[status ?? "unset"];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full ${look.ring} ${small ? "h-5 w-5 text-[13px]" : "h-[30px] w-[30px] text-[17px]"}`}
    >
      {look.icon}
    </span>
  );
}

/** The key under the list, so the icons explain themselves. */
function AnswerKey({ unset }: { unset: boolean }) {
  const items: [Rsvp["status"] | undefined, string][] = [
    ["attending", "Coming"],
    ["pending", "Invited"],
    ["to_invite", "To invite"],
    ["declined", "Can't come"],
    ...(unset ? ([[undefined, "Day or evening?"]] as [undefined, string][]) : []),
  ];
  return (
    <p className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-stone">
      {items.map(([status, word]) => (
        <span key={word} className="flex items-center gap-1.5">
          <AnswerIcon status={status} small />
          {word}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-champagne-400">
          <Star className="h-2.5 w-2.5 fill-white text-white" strokeWidth={1.4} />
        </span>
        Has a role
      </span>
    </p>
  );
}

/**
 * One guest in the phone list: initials, their name with "day" or "evening"
 * after it, any roles as pills underneath, and their answer in a word.
 */
export function GuestRow({
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
  // Guests from before "Guest of" existed aren't on any event yet.
  const answer = status ? ANSWER_WORD[status] : { word: "Day or evening?", className: "text-champagne-600" };

  return (
    <button type="button" onClick={onOpen} className="flex min-h-[54px] w-full items-center gap-3 py-1.5 text-left">
      {/* Below 360px wide the name needs the room more than the initials do. */}
      {/* White with a fine edge: the page's satin sheen runs light to dark down
          the list, and a cream circle came and went against it. */}
      <span aria-hidden className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-linen bg-white font-display text-sm text-champagne-600 max-[359px]:hidden">
        {initials(guest)}
        {/* A gold star for anyone with a role (canvas Round 15, option 1). */}
        {roles.length > 0 && (
          <span className="absolute -bottom-1 -right-1.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-ivory bg-champagne-400">
            <Star className="h-2.5 w-2.5 fill-white text-white" strokeWidth={1.4} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        {/* Inline, so a long name wraps rather than being cut short. */}
        <span className="block break-words">
          <span className="type-item text-lg">{fullName(guest)}</span>
          {event && showEvent && (
            <span className="ml-2 whitespace-nowrap font-display text-sm italic text-champagne-600">{eventWord(event)}</span>
          )}
          {/* Where the initials are hidden, the star sits after the name instead. */}
          {roles.length > 0 && (
            <Star aria-hidden className="ml-1.5 inline h-3 w-3 fill-champagne-400 align-baseline text-champagne-400 min-[360px]:hidden" strokeWidth={1.4} />
          )}
        </span>
        {roles.length > 0 && <span className="sr-only">Role: {roles.join(", ")}</span>}
      </span>
      <AnswerIcon status={status} />
      <span className="sr-only">{answer.word}</span>
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
  guestOf,
  ofOn,
  onToggleOf,
  filters,
  on,
  onToggle,
  onClear,
}: {
  /** Day guests, evening guests: one per event. */
  guestOf: { id: string; label: string; count: number }[];
  ofOn: string[];
  onToggleOf: (id: string) => void;
  filters: { key: GuestFilter; label: string; count: number }[];
  on: GuestFilter[];
  onToggle: (key: GuestFilter) => void;
  onClear: () => void;
}) {
  const { open, setOpen, box } = useDropdown();
  const active = on.length + ofOn.length;
  const rows = [
    ...guestOf.map((o) => ({ key: o.id, label: o.label, count: o.count, ticked: ofOn.includes(o.id), flip: () => onToggleOf(o.id) })),
    ...filters.map((f) => ({ key: f.key, label: f.label, count: f.count, ticked: on.includes(f.key), flip: () => onToggle(f.key) })),
  ];

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={active > 0 ? `Filter, ${active} on` : "Filter"}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border transition ${
          active > 0 ? "border-ink bg-ink text-ivory" : "border-linen bg-white text-ink hover:border-champagne-400"
        }`}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        {active > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-ivory bg-champagne-400 px-1 text-[11px] font-semibold text-white"
          >
            {active}
          </span>
        )}
      </button>

      {open && (
        <div className={`${MENU} w-[17rem] pb-2 pt-2.5`}>
          <div className="flex items-baseline justify-between py-1">
            <span className="section-label">Show only</span>
            {active > 0 && (
              <button type="button" onClick={onClear} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                Clear
              </button>
            )}
          </div>
          <ul>
            {rows.map((f, i) => {
              const ticked = f.ticked;
              return (
                // A firmer line between "day / evening" and the rest.
                <li key={f.key} className={`border-t first:border-t-0 ${i === guestOf.length && i > 0 ? "border-champagne-400" : "border-linen"}`}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={ticked}
                    onClick={f.flip}
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
    <div ref={box} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Sort: ${SORTS.find((o) => o.key === sort)!.label}`}
        onClick={() => setOpen((o) => !o)}
        className="type-meta flex h-9 min-w-0 items-center gap-1 hover:text-ink max-[359px]:tracking-[0.12em]"
      >
        <span className="truncate">{SORTS.find((o) => o.key === sort)!.short}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
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
                  <span className="type-meta ml-3">{guestCount(group.guests.length)}</span>
                </th>
              </tr>
            )}
            {group.guests.map((g) => {
              const event = ownEvent(g);
              // Meal and diet are recorded per event: show the ones for their own.
              const rsvp = event ? answers.get(g.id)?.find((r) => r.event_id === event.id) : undefined;
              const answer = rsvp ? ANSWER_WORD[rsvp.status] : { word: "Day or evening?", className: "text-champagne-600" };
              return (
                <tr key={g.id} onClick={() => onOpen(g.id)} className="cursor-pointer border-t-[0.5px] border-champagne-400 align-middle hover:bg-champagne-100/50">
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
                  <td className={`whitespace-nowrap py-2.5 pr-4 ${answer.className}`}>
                    <span className="flex items-center gap-2">
                      <AnswerIcon status={rsvp?.status} small />
                      {answer.word}
                    </span>
                  </td>
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
