"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { roleRank, rolesOf } from "@/lib/guest-roles";
import type { Contact, Rsvp, WeddingEvent } from "@/types/db";
import { inviteAction } from "./rsvp-actions";
import GuestCard from "./guest-card";
import { Answer, AnswerDot, DotKey, RolePill, answerWord, fullName, initials, shortEvent } from "./guest-table";

export type GuestFilter = "all" | "party" | "waiting" | "declined" | "dietary" | "children" | "noaddress";
export type GuestView = "az" | "households";

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

/**
 * The guest list (People › Guests), designed on the canvas as "Guest list ·
 * Round 2". The answers card (one event at a time), search, filters, then
 * everyone A–Z with a letter index — or grouped by household, so a couple
 * with different surnames sit together. Phones get compact rows; laptops a
 * full table. Tapping anyone opens their card (guest-card.tsx).
 *
 * Search, filters and the view are kept here rather than in the address, so
 * they answer instantly and survive the card opening and closing.
 */
export default function GuestBrowser({
  guests,
  households,
  events,
  rsvps,
  initialEventId,
  initialGuestId,
  initialFilter = "all",
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
  const [filter, setFilter] = useState<GuestFilter>(initialFilter);
  const [view, setView] = useState<GuestView>(initialView);
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
  const dietOf = (g: Contact) => data.answers.get(g.id)?.find((r) => r.dietary_notes)?.dietary_notes ?? null;

  const tests: Record<GuestFilter, (g: Contact) => boolean> = {
    all: () => true,
    party: (g) => rolesOf(g).length > 0,
    waiting: (g) => statusFor(g, event) === "pending",
    declined: (g) => statusFor(g, event) === "declined",
    dietary: (g) => Boolean(dietOf(g)),
    children: (g) => g.is_child,
    noaddress: (g) => !g.household_id || !data.household.get(g.household_id)?.hasAddress,
  };
  const filters: { key: GuestFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "party", label: "Bridal party" },
    { key: "waiting", label: "Waiting" },
    { key: "declined", label: "Can't come" },
    { key: "dietary", label: "Dietary" },
    { key: "children", label: "Children" },
    { key: "noaddress", label: "No address" },
  ];
  const counted = filters
    .map((f) => ({ ...f, count: guests.filter(tests[f.key]).length }))
    .filter((f) => f.key === "all" || f.key === filter || f.count > 0);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = guests
    .filter(tests[filter])
    .filter((g) => {
      if (words.length === 0) return true;
      const hay = [fullName(g), g.household_id && data.household.get(g.household_id)?.name, ...rolesOf(g)]
        .join(" ")
        .toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .sort(byName);

  // How the list is grouped: by role for the bridal party, by household if
  // asked, otherwise one A–Z run.
  let groups: Group[];
  if (filter === "party") {
    const roles = [...new Set(shown.flatMap(rolesOf))].sort((a, b) => roleRank(a) - roleRank(b) || a.localeCompare(b));
    groups = roles.map((role) => ({ key: role, title: role, guests: shown.filter((g) => rolesOf(g).includes(role)) }));
  } else if (view === "households") {
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

  /** "With Sam Patel" for a couple, "The Daniels" for a bigger household. */
  const metaOf = (g: Contact) => {
    const housemates = g.household_id ? (data.members.get(g.household_id) ?? []) : [];
    const home =
      view === "households" || filter === "party" || housemates.length < 2
        ? null
        : housemates.length === 2
          ? `With ${fullName(housemates.find((m) => m.id !== g.id)!)}`
          : data.household.get(g.household_id!)?.name;
    return [g.is_child && "Child", home, dietOf(g)].filter(Boolean).join(" · ");
  };

  const open = openId ? guests.find((g) => g.id === openId) : undefined;
  const az = groups.length === 1 && groups[0].key === "az";
  const letters = az ? new Set(shown.map((g) => g.first_name.charAt(0).toUpperCase())) : new Set<string>();
  const indexed = az && shown.length > 12;
  const firstOfLetter = new Set(
    az ? [...letters].map((l) => shown.find((g) => g.first_name.charAt(0).toUpperCase() === l)!.id) : [],
  );

  return (
    <>
      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-8">
        {event && <AnswersCard guests={guests} households={households.length} events={events} event={event} statusFor={statusFor} onPick={setEventId} />}

        <div className="mt-5 lg:mt-0">
          <label className="flex h-12 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
            <Search className="h-[17px] w-[17px] shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
            <span className="sr-only">Find a guest</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a guest, household or role"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
            />
          </label>

          {/* Scrolls sideways within itself on a phone, never the page. */}
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
            {counted.map((f) => {
              const on = f.key === filter;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f.key)}
                  className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition ${
                    on ? "border-ink bg-ink text-ivory" : "border-linen bg-white text-ink hover:border-champagne-400"
                  }`}
                >
                  {f.label} <span className={on ? "text-ivory/70" : "text-stone"}>{f.count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 px-1">
            {filter === "party" ? (
              <span className="type-meta">By role</span>
            ) : (
              <span role="group" aria-label="Order" className="flex gap-4">
                {(["az", "households"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`type-meta py-2 ${
                      view === v ? "text-ink underline decoration-champagne-400 underline-offset-[6px]" : "hover:text-ink"
                    }`}
                  >
                    {v === "az" ? "A–Z" : "Households"}
                  </button>
                ))}
              </span>
            )}
            {/* Over the dots on a phone: which event each one is. */}
            {events.length > 0 && (
              <span className={`flex gap-3.5 text-xs text-stone lg:hidden ${indexed ? "pr-12" : "pr-7"}`} aria-hidden>
                {events.map((e) => (
                  <span key={e.id} className="w-3.5 text-center">
                    {shortEvent(e.name).charAt(0)}
                  </span>
                ))}
              </span>
            )}
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
                      <li key={g.id} id={firstOfLetter.has(g.id) ? `az-${g.first_name.charAt(0).toUpperCase()}` : undefined} className="scroll-mt-4 border-b border-linen">
                        <button type="button" onClick={() => setOpenId(g.id)} className="flex min-h-[58px] w-full items-center gap-3 py-2 text-left">
                          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream font-display text-sm text-champagne-600">
                            {initials(g)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="type-item block truncate text-lg">{fullName(g)}</span>
                            {(rolesOf(g).length > 0 || metaOf(g)) && (
                              <span className="mt-1 flex min-w-0 items-center gap-1.5">
                                {rolesOf(g).map((role) => <RolePill key={role} role={role} />)}
                                {metaOf(g) && <span className="type-meta truncate tracking-[0.14em]">{metaOf(g)}</span>}
                              </span>
                            )}
                          </span>
                          {events.length > 0 && (
                            <span className="flex shrink-0 gap-3.5">
                              {events.map((e) => <AnswerDot key={e.id} status={statusFor(g, e)} />)}
                              <span className="sr-only">
                                {events.map((e) => `${e.name}: ${answerWord(statusFor(g, e))}`).join(", ")}
                              </span>
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {events.length > 0 && <div className="mt-5"><DotKey /></div>}
            </div>
            {indexed && <LetterIndex letters={letters} />}
          </div>

          {/* Laptops: every detail at once. */}
          <GuestTable
            groups={groups}
            events={events}
            answers={data.answers}
            onOpen={setOpenId}
          />
        </>
      )}

      {open && (
        <GuestCard
          guest={open}
          household={open.household_id ? (data.household.get(open.household_id) ?? null) : null}
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

/** One event's totals, a switch between events, and inviting whoever's left. */
function AnswersCard({
  guests,
  households,
  events,
  event,
  statusFor,
  onPick,
}: {
  guests: Contact[];
  households: number;
  events: WeddingEvent[];
  event: WeddingEvent;
  statusFor: (g: Contact, e: WeddingEvent) => Rsvp["status"] | undefined;
  onPick: (id: string) => void;
}) {
  const count = (status: Rsvp["status"]) => guests.filter((g) => statusFor(g, event) === status).length;
  const uninvited = guests.filter((g) => !statusFor(g, event));
  const figures = [
    { n: count("attending"), label: "Coming", tone: "text-ink" },
    { n: count("pending"), label: "Waiting", tone: "text-champagne-600" },
    { n: count("declined"), label: "Can't come", tone: "text-stone" },
  ];

  return (
    <section className="rounded-[22px] border border-white/85 bg-white/45 px-[18px] pb-4 pt-3.5 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-meta">
          {guests.length} {guests.length === 1 ? "guest" : "guests"} · {households} {households === 1 ? "home" : "homes"}
        </h2>
        <span className="flex items-center gap-1">
          <span role="group" aria-label="Which event" className="flex rounded-full bg-cream p-[3px]">
            {events.map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={e.id === event.id}
                onClick={() => onPick(e.id)}
                className={`h-8 max-w-[7.5rem] truncate rounded-full px-3.5 text-[13px] transition ${
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-champagne-600 hover:bg-champagne-100"
          >
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </Link>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {figures.map((f) => (
          <div key={f.label}>
            <p className={`type-figure text-[38px] leading-none ${f.tone}`}>{f.n}</p>
            <p className="type-meta mt-1.5">{f.label}</p>
          </div>
        ))}
      </div>

      {uninvited.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-champagne-400 px-3.5 py-2.5">
          <p className="min-w-0 flex-1 text-sm text-ink">
            {uninvited.length === guests.length
              ? `No one's invited to ${event.name.toLowerCase()} yet.`
              : `${uninvited.length} not invited to ${event.name.toLowerCase()}.`}
          </p>
          <form action={inviteAction.bind(null, event.id, uninvited.map((g) => g.id))}>
            <InlineSubmit label={uninvited.length === guests.length ? "Invite all" : "Invite them"} pendingLabel="Inviting…" />
          </form>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-linen pt-3">
        <Link href="/invitations" className="label hover:text-ink">
          Invitations ›
        </Link>
        <Link href={`/people/events/${event.id}`} className="text-xs text-stone underline underline-offset-4 hover:text-ink">
          Rename
        </Link>
      </div>
    </section>
  );
}

/** Desktop: the same people as a table — roles, every answer, meal, diet, contact. */
function GuestTable({
  groups,
  events,
  answers,
  onOpen,
}: {
  groups: Group[];
  events: WeddingEvent[];
  answers: Map<string, Rsvp[]>;
  onOpen: (id: string) => void;
}) {
  const head = "whitespace-nowrap pb-3 pr-4 pt-1 text-xs font-medium uppercase tracking-[0.16em] text-stone";
  const columns = events.length + 6;

  return (
    <div className="mt-6 hidden rounded-[22px] border border-white bg-white/60 px-5 pb-3 pt-3 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4)] lg:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-champagne-400">
            <th scope="col" className={head}>Guest</th>
            <th scope="col" className={head}>Role</th>
            {events.map((e) => (
              <th key={e.id} scope="col" className={head}>{e.name}</th>
            ))}
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
                <th colSpan={columns} scope="colgroup" className="pb-1.5 pt-5 text-left font-normal">
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
              const theirs = answers.get(g.id) ?? [];
              const meal = theirs.find((r) => r.meal_choice)?.meal_choice;
              const diet = theirs.find((r) => r.dietary_notes)?.dietary_notes;
              return (
                <tr key={g.id} onClick={() => onOpen(g.id)} className="cursor-pointer border-t border-linen align-middle hover:bg-champagne-100/50">
                  <td className="py-2.5 pr-4">
                    <button type="button" onClick={() => onOpen(g.id)} className="whitespace-nowrap text-left text-[15px] text-ink hover:underline">
                      {fullName(g)}
                    </button>
                    {g.is_child && <span className="type-meta ml-2">Child</span>}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="flex flex-wrap gap-1">
                      {rolesOf(g).map((role) => <RolePill key={role} role={role} />)}
                    </span>
                  </td>
                  {events.map((e) => (
                    <td key={e.id} className="py-2.5 pr-4">
                      <Answer rsvp={theirs.find((r) => r.event_id === e.id)} />
                    </td>
                  ))}
                  <td className="py-2.5 pr-4 text-ink">{meal}</td>
                  <td className="py-2.5 pr-4 text-stone">{diet}</td>
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
