"use client";

import type { GuestSeating } from "@/lib/db/day";
import Link from "next/link";
import AddMenu from "@/components/add-menu";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarHeart, Check, ChevronDown, ChevronRight, House, LayoutList, Mail, Search, SlidersHorizontal, Star, UserRound, Users, X } from "lucide-react";
import { roleRank, rolesOf } from "@/lib/guest-roles";
import { replaceQuery } from "@/lib/url-state";
import { usePullToClose } from "@/components/use-pull-to-close";
import type { Contact, Household, Rsvp, WeddingEvent } from "@/types/db";
import GuestCard from "./guest-card";
import EditEvents from "./edit-events";
import HouseholdSheet from "./household-view";
import { RolePill, fullName, initials } from "./guest-table";
import { GroupSheet, type GroupSummary } from "./guest-groups";
import { needRank, needsOf, ownNeeds } from "@/lib/dietary";
import { mealKindOf, mealWord, noAlcoholOf } from "@/lib/meals";
import { CopyButton, type Split, type SplitKind, type TallyLine } from "./guest-summary";
import type { TravelInfo } from "./guest-travel";
import SendSheet from "@/components/send-sheet";
import { howsLine, isSendingKind, SENDINGS, sendUnits, sentMap, unitKeyOf, type SendHow, type SendingKind, type SentRecord } from "@/lib/stationery";

/** The filters in the Filter menu. More than one can be on: they narrow together. */
export type GuestFilter = "party" | "dietary" | "children" | "noaddress" | "childmeal" | "nomeal" | "soft";
export type GuestView = "az" | "households" | "diet" | SendingKind;
/** How the list is ordered (the Sort button). */
type SortBy = "first" | "last" | "household" | "group" | "type" | "diet" | "meal" | "role" | "rsvp" | "age" | "table" | "staying" | SendingKind;
/** Which answer the numbers card is showing (each guest's answer for their own event). */
type Showing = "all" | Rsvp["status"];

/** Where the guest list keeps its sort, on this phone, until it's changed. */
const SORT_KEY = "guest-list-sort";

export interface HouseholdSummary {
  id: string;
  name: string;
  hasAddress: boolean;
}

interface Group {
  key: string;
  title: string;
  /** Household groups open the household's card. */
  onOpen?: () => void;
  /** An allergy: what the kitchen must avoid. */
  rose?: boolean;
  guests: Contact[];
  /** In place of "12 guests": "12 households" for what's been sent. */
  count?: string;
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
  { key: "childmeal", label: "Child's meal" },
  { key: "nomeal", label: "No meal" },
  { key: "soft", label: "Soft drinks only" },
  { key: "noaddress", label: "No address yet" },
];

/**
 * The View button (owner, 17 Oct 2026; was Sort): one pick says how the rows
 * are grouped and, for two of them, who is shown — Bridal party switches the
 * Bridal party filter on, Dietary needs the Dietary needs one. The filter
 * shows as a pill and can be taken off or joined by others.
 */
const SORTS: { key: SortBy; label: string; short: string; section: string }[] = [
  { key: "first", label: "First name, A–Z", short: "by first name", section: "Order" },
  { key: "last", label: "Surname, A–Z", short: "by surname", section: "Order" },
  { key: "household", label: "Household", short: "by household", section: "Group by" },
  { key: "group", label: "Group", short: "by group", section: "Group by" },
  { key: "type", label: "Event", short: "by event", section: "Group by" },
  { key: "rsvp", label: "RSVP", short: "by RSVP", section: "Group by" },
  { key: "age", label: "Age group", short: "by age group", section: "Group by" },
  { key: "table", label: "Table", short: "by table", section: "Group by" },
  { key: "staying", label: "Staying", short: "by where they're staying", section: "Group by" },
  { key: "meal", label: "Meal", short: "by meal", section: "Group by" },
  { key: "role", label: "Bridal party", short: "by bridal party", section: "Show only" },
  { key: "diet", label: "Dietary needs", short: "by dietary needs", section: "Show only" },
  // Who's been sent what (canvas 3 "Sent · Round 1", B): households not sent it yet, then sent.
  ...SENDINGS.map((s) => ({ key: s.kind, label: s.label, short: `by ${s.label.toLowerCase()}`, section: "Sent" })),
];

/** The filter a view switches on with it. */
const VIEW_FILTER: Partial<Record<SortBy, GuestFilter>> = { role: "party", diet: "dietary" };

/** How each answer reads at the end of a row. */
const ANSWER_WORD: Record<Rsvp["status"], { word: string; className: string }> = {
  attending: { word: "Coming", className: "text-ink" },
  to_invite: { word: "To invite", className: "text-stone" },
  pending: { word: "Yet to respond", className: "italic text-champagne-600" },
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
  tables = {},
  seating,
  travel,
  groups: guestGroups = [],
  weddingName = "",
  initialGuestId,
  initialHouseholdId,
  householdRows = [],
  initialFilter,
  initialView = "az",
  sendings = [],
}: {
  guests: Contact[];
  households: HouseholdSummary[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  tables?: Record<string, string>;
  /** The tables and who sits where, so the guest card can change a table. */
  seating?: GuestSeating;
  travel?: TravelInfo;
  /** Groups of guests (0019): any number per guest; one can be shown at a time. */
  groups?: GroupSummary[];
  weddingName?: string;
  initialGuestId?: string;
  /** A household whose card opens on arrival (?household=). */
  initialHouseholdId?: string;
  /** Every household in full (address too), for the household card. */
  householdRows?: Household[];
  initialFilter?: GuestFilter;
  initialView?: GuestView;
  /** Save the dates, invitations and thank-yous sent (timeline entries). */
  sendings?: SentRecord[];
}) {
  // Search, filters and the numbers card are the task in hand, so they live
  // in the address (?q=, ?f=, ?show=, ?of=; src/lib/url-state.ts): going
  // into a household and back keeps them, tapping People starts fresh.
  const params = useSearchParams();
  const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [showing, setShowing] = useState<Showing>((params.get("show") as Showing | null) ?? "all");
  const [filters, setFilters] = useState<GuestFilter[]>(() => {
    const asked = list("f").filter((f): f is GuestFilter => FILTERS.some((o) => o.key === f));
    return asked.length ? asked : initialFilter ? [initialFilter] : [];
  });
  /** "Day guests" / "Evening guests" in the Filter menu: event ids, any of. */
  const [guestOf, setGuestOf] = useState<string[]>(() => list("of").filter((id) => events.some((e) => e.id === id)));
  /** One group at a time (?group=): its card takes the numbers card's place. */
  const [groupId, setGroupId] = useState<string | undefined>(() => {
    const asked = params.get("group");
    return asked && guestGroups.some((g) => g.id === asked) ? asked : undefined;
  });
  const group = guestGroups.find((g) => g.id === groupId);
  /** Specific kinds picked in Filter (?s=, e.g. "diet:Vegetarian|role:Bridesmaid"): any within one kind, all kinds together. */
  const [picks, setPicks] = useState<string[]>(() => (params.get("s") ?? "").split("|").filter(Boolean));
  const togglePick = (id: string) => setPicks((on) => (on.includes(id) ? on.filter((p) => p !== id) : [...on, id]));
  useEffect(() => {
    replaceQuery({
      q: query.trim() || null,
      show: showing === "all" ? null : showing,
      f: filters.length ? filters.join(",") : null,
      of: guestOf.length ? guestOf.join(",") : null,
      group: group?.id ?? null,
      by: null,
      pick: null,
      s: picks.length ? picks.join("|") : null,
      tab: null,
    });
  }, [query, showing, filters, guestOf, group, picks]);
  const [sort, setSort] = useState<SortBy>(
    initialView === "households" ? "household" : initialView === "diet" ? "diet" : isSendingKind(initialView) ? initialView : initialFilter === "party" ? "role" : "first",
  );
  /** Picks a view, and switches on (or off) the filter that goes with it. */
  const chooseView = (next: SortBy) => {
    setFilters((on) => {
      const before = VIEW_FILTER[sort];
      const add = VIEW_FILTER[next];
      let now = before && before !== add ? on.filter((f) => f !== before) : on;
      if (add && !now.includes(add)) now = [...now, add];
      return now;
    });
    setSort(next);
  };
  const [openId, setOpenId] = useState(initialGuestId);
  /** Headings folded away (owner, 17 Oct 2026): tap a heading's chevron to fold or open its guests. */
  const [folded, setFolded] = useState<Set<string>>(new Set(["declined"]));
  const toggleFold = (key: string) =>
    setFolded((all) => {
      const next = new Set(all);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const close = useCallback(() => setOpenId(undefined), []);
  // An open card too, so coming back reopens it — and closing it clears it.
  useEffect(() => {
    replaceQuery({ guest: openId ?? null });
  }, [openId]);
  // A household opens as a card over the list too (?household=), like a guest.
  const [householdId, setHouseholdId] = useState(initialHouseholdId);
  const closeHousehold = useCallback(() => setHouseholdId(undefined), []);
  useEffect(() => {
    replaceQuery({ household: householdId ?? null });
  }, [householdId]);
  const openHousehold = householdId ? householdRows.find((h) => h.id === householdId) : undefined;
  /** A group's card, up from the bottom like a household's (?groupcard=). Separate from filtering to a group. */
  const [groupCardId, setGroupCardId] = useState<string | undefined>(() => {
    const asked = params.get("groupcard");
    return asked && guestGroups.some((g) => g.id === asked) ? asked : undefined;
  });
  const closeGroupCard = useCallback(() => setGroupCardId(undefined), []);
  useEffect(() => {
    replaceQuery({ groupcard: groupCardId ?? null });
  }, [groupCardId]);
  const openGroupCard = guestGroups.find((g) => g.id === groupCardId);

  // The sort is a preference (owner's call, 11 Oct 2026): kept on this phone
  // until it's changed. Read after the first draw so the server's page and
  // the phone's agree; a link asking for households wins.
  const [remembered, setRemembered] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SORT_KEY) as SortBy | null;
      if (saved && SORTS.some((o) => o.key === saved) && !VIEW_FILTER[saved] && initialView === "az" && !initialFilter) setSort(saved);
    } catch {
      // Private browsing or blocked storage: start from the default.
    }
    setRemembered(true);
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!remembered) return;
    try {
      // Views that filter (bridal party, dietary needs) aren't kept: the filter wouldn't be.
      if (!VIEW_FILTER[sort]) window.localStorage.setItem(SORT_KEY, sort);
    } catch {
      // Not remembered, but still works.
    }
  }, [remembered, sort]);

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

  // Who things are sent to: households, and anyone not in one (src/lib/stationery.ts).
  const units = useMemo(() => sendUnits(guests, householdRows), [guests, householdRows]);
  const sent = useMemo(() => sentMap(units, sendings), [units, sendings]);
  const [sendOpen, setSendOpen] = useState(false);

  const statusFor = (g: Contact, e: WeddingEvent | undefined) =>
    e ? data.answers.get(g.id)?.find((r) => r.event_id === e.id)?.status : undefined;
  /**
   * Each guest is a day guest or an evening guest: the first event they're
   * invited to (events come in date order). The day includes the evening,
   * so one word and one answer say it all.
   */
  const ownEvent = (g: Contact) => events.find((e) => statusFor(g, e));
  const dietOf = (g: Contact) => data.answers.get(g.id)?.find((r) => r.dietary_notes)?.dietary_notes ?? null;
  const ownRsvp = (g: Contact) => data.answers.get(g.id)?.find((r) => r.event_id === ownEvent(g)?.id);
  // A guest's meal is the Adult / Child's / No meal tile (owner, 20 Oct 2026: the typed dish went).
  const mealOf = (g: Contact) => mealWord(g);
  const look = { dietOf, mealOf, ownEvent };

  const tests: Record<GuestFilter, (g: Contact) => boolean> = {
    party: (g) => rolesOf(g).length > 0,
    dietary: (g) => Boolean(dietOf(g)),
    children: (g) => g.is_child,
    childmeal: (g) => mealKindOf(g) === "child",
    nomeal: (g) => mealKindOf(g) === "none",
    // A baby with no meal isn't on a drinks package either way (as the caterer's counts have it).
    soft: (g) => mealKindOf(g) !== "none" && noAlcoholOf(g),
    noaddress: (g) => !g.household_id || !data.household.get(g.household_id)?.hasAddress,
  };
  const counted = FILTERS.map((f) => ({ ...f, count: guests.filter(tests[f.key]).length }));
  const toggle = (key: GuestFilter) =>
    setFilters((on) => (on.includes(key) ? on.filter((k) => k !== key) : [...on, key]));
  const ofLabel = (e: WeddingEvent) => `${eventWord(e).replace(/^\w/, (c) => c.toUpperCase())} guests`;
  const ofCounted = events.map((e) => ({ id: e.id, label: ofLabel(e), count: guests.filter((g) => ownEvent(g)?.id === e.id).length }));
  /** What Filter can narrow to inside a breakdown, with how many guests have each. */
  const kindOptions = (kind: "diet" | "role" | "meal") => {
    const tally = new Map<string, number>();
    for (const g of guests) for (const l of partOf(kind, g, look)) if (l !== NOT_PICKED) tally.set(l, (tally.get(l) ?? 0) + 1);
    const labels = [...tally.keys()];
    const ordered =
      kind === "diet"
        ? labels.sort((a, b) => needRank(a) - needRank(b) || a.localeCompare(b))
        : kind === "role"
          ? labels.sort((a, b) => roleRank(a) - roleRank(b) || a.localeCompare(b))
          : labels.sort((a, b) => tally.get(b)! - tally.get(a)! || a.localeCompare(b));
    return ordered.map((label) => ({ label, count: tally.get(label)! }));
  };
  const kinds = (
    [
      { kind: "diet" as const, title: "Dietary needs" },
      { kind: "role" as const, title: "Bridal party roles" },
    ] as const
  )
    .map((k) => ({ ...k, options: kindOptions(k.kind) }))
    .filter((k) => k.options.length > 0);
  const toggleOf = (id: string) => setGuestOf((on) => (on.includes(id) ? on.filter((k) => k !== id) : [...on, id]));
  const clearAll = () => {
    setFilters([]);
    setGuestOf([]);
    setGroupId(undefined);
    setPicks([]);
  };
  const pickGroup = (id: string) => {
    setGroupId((on) => (on === id ? undefined : id));
    setShowing("all");
  };

  // What the filters leave, before search and the numbers card: the card
  // counts these, so every filter narrows its numbers too.
  const filtered = guests
    .filter((g) => !group || group.members.includes(g.id))
    .filter((g) => guestOf.length === 0 || guestOf.includes(ownEvent(g)?.id ?? ""))
    .filter((g) => filters.every((f) => tests[f](g)))
    // Specific kinds from Filter: any of the ticked ones within a kind, every kind that has some.
    .filter((g) =>
      (["diet", "role", "meal"] as const).every((kind) => {
        const want = picks.filter((p) => p.startsWith(`${kind}:`)).map((p) => p.slice(kind.length + 1));
        return want.length === 0 || partOf(kind, g, look).some((l) => want.includes(l));
      }),
    );
  const answerOf = (g: Contact) => statusFor(g, ownEvent(g));

  const coming = filtered.filter((g) => answerOf(g) === "attending");
  /** "Copy the list for the caterer", under the card when the list is about dietary needs. */
  const caterer = filters.includes("dietary") || sort === "diet" ? splitOf("diet", coming, look).copy : undefined;

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
  if ((sort === "diet" || sort === "meal" || sort === "role")) {
    // A breakdown (owner, 17 Oct 2026): the headings are the kinds, each with its count.
    const kind = sort;
    const tally = new Map<string, Contact[]>();
    for (const g of shown) for (const part of partOf(kind, g, look)) tally.set(part, [...(tally.get(part) ?? []), g]);
    const labels = [...tally.keys()];
    const most = (a: string, b: string) => tally.get(b)!.length - tally.get(a)!.length || a.localeCompare(b);
    const ordered =
      kind === "diet"
        ? [
            ...labels.filter((l) => !isAllergy(l)).sort((a, b) => needRank(a) - needRank(b) || a.localeCompare(b)),
            ...labels.filter(isAllergy).sort((a, b) => needRank(a) - needRank(b) || a.localeCompare(b)),
          ]
        : kind === "role"
          ? labels.sort((a, b) => roleRank(a) - roleRank(b) || a.localeCompare(b))
          : [...labels.filter((l) => l !== NOT_PICKED).sort(most), ...labels.filter((l) => l === NOT_PICKED)];
    groups = ordered.map((label) => ({ key: label, title: isAllergy(label) && kind === "diet" ? `${label} · must avoid` : label, rose: kind === "diet" && isAllergy(label), guests: tally.get(label)! }));
    const none = kind === "diet" ? "No dietary needs" : kind === "role" ? "No role" : null;
    const loose = none ? shown.filter((g) => partOf(kind, g, look).length === 0) : [];
    if (loose.length > 0) groups.push({ key: "none", title: none!, guests: loose });
  } else if (isSendingKind(sort)) {
    // Not sent yet, then sent, counted in households (canvas 3 "Sent · Round 1", B).
    const had = sent[sort];
    const homes = (list: Contact[]) => {
      const n = new Set(list.map(unitKeyOf)).size;
      return `${n} ${n === 1 ? "household" : "households"}`;
    };
    const notYet = shown.filter((g) => !had.has(unitKeyOf(g)));
    const gone = shown.filter((g) => had.has(unitKeyOf(g)));
    groups = [
      { key: "notsent", title: "Not sent yet", guests: notYet, count: homes(notYet) },
      { key: "sent", title: "Sent", guests: gone, count: homes(gone) },
    ].filter((group) => group.guests.length > 0);
  } else if (sort === "rsvp") {
    const words: [Rsvp["status"] | undefined, string][] = [
      ["attending", "Coming"],
      ["pending", "Yet to respond"],
      ["to_invite", "To invite"],
      ["declined", "Can't come"],
      [undefined, "Day or evening?"],
    ];
    groups = words
      .map(([status, title]) => ({ key: status ?? "none", title, guests: shown.filter((g) => answerOf(g) === status) }))
      .filter((group) => group.guests.length > 0);
  } else if (sort === "age") {
    groups = [
      { key: "adults", title: "Adults", guests: shown.filter((g) => !g.is_child) },
      { key: "children", title: "Children", guests: shown.filter((g) => g.is_child) },
    ].filter((group) => group.guests.length > 0);
  } else if (sort === "table") {
    const names = [...new Set(shown.map((g) => tables[g.id]).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    groups = names.map((name) => ({ key: `table-${name}`, title: name, guests: shown.filter((g) => tables[g.id] === name) }));
    const loose = shown.filter((g) => !tables[g.id]);
    if (loose.length > 0) groups.push({ key: "none", title: "No table yet", guests: loose });
  } else if (sort === "staying") {
    const stays = travel?.stays ?? [];
    groups = stays
      .map((stay) => ({ key: `stay-${stay.id}`, title: stay.name, guests: shown.filter((g) => g.staying === "yes" && g.stay_id === stay.id) }))
      .filter((group) => group.guests.length > 0);
    const placed = new Set(stays.map((st) => st.id));
    const rest: [string, string, (g: Contact) => boolean][] = [
      ["unsure", "Staying, place not sure", (g) => g.staying === "yes" && !(g.stay_id && placed.has(g.stay_id))],
      ["no", "Not staying over", (g) => g.staying === "no"],
      ["unasked", "Not asked yet", (g) => !g.staying],
    ];
    for (const [key, title, test] of rest) {
      const these = shown.filter(test);
      if (these.length > 0) groups.push({ key, title, guests: these });
    }
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
  } else if (sort === "group") {
    // By group (owner, 16 Oct 2026): someone in two groups shows under both;
    // a group's heading opens it (its card, Email them · Text).
    const members = (g: GroupSummary) => new Set(g.members);
    groups = [...guestGroups]
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
      .map((group) => ({
        key: group.id,
        title: group.name,
        onOpen: () => setGroupCardId(group.id),
        guests: shown.filter((g) => members(group).has(g.id)),
      }))
      .filter((group) => group.guests.length > 0);
    const grouped = new Set(guestGroups.flatMap((g) => g.members));
    const loose = shown.filter((g) => !grouped.has(g.id));
    if (loose.length > 0) groups.push({ key: "none", title: "Not in a group", guests: loose });
  } else if (sort === "household") {
    groups = households
      .map((h) => ({
        key: h.id,
        title: h.name,
        onOpen: () => setHouseholdId(h.id),
        guests: shown.filter((g) => g.household_id === h.id),
      }))
      .filter((group) => group.guests.length > 0);
    const loose = shown.filter((g) => !g.household_id);
    if (loose.length > 0) groups.push({ key: "none", title: "Not in a household yet", guests: loose });
  } else {
    groups = [{ key: "az", title: "", guests: shown }];
  }



  // People who can't come sit at the foot in a folded "Can't come" group (owner, 17 Oct 2026):
  // the list then agrees with the Guests number, and a search or View › RSVP still finds them.
  if (sort !== "rsvp" && !isSendingKind(sort) && showing === "all" && words.length === 0) {
    const gone = shown.filter((g) => answerOf(g) === "declined");
    if (gone.length > 0) {
      groups = groups
        .map((gp) => ({ ...gp, guests: gp.guests.filter((g) => answerOf(g) !== "declined") }))
        .filter((gp) => gp.guests.length > 0 || gp.key === "az");
      groups.push({ key: "declined", title: "Can't come", guests: gone });
    }
  }

  const open = openId ? guests.find((g) => g.id === openId) : undefined;
  const az = groups[0]?.key === "az";
  const lettered = az ? groups[0].guests : [];
  const letterOf = (g: Contact) => ((sort === "last" && g.last_name) || g.first_name).charAt(0).toUpperCase();
  const letters = az ? new Set(lettered.map(letterOf)) : new Set<string>();
  const indexed = az && lettered.length > 12;
  const firstOfLetter = new Set(az ? [...letters].map((l) => lettered.find((g) => letterOf(g) === l)!.id) : []);

  return (
    <>
      {/* Laptops (canvas 3 "Laptop · Round 4", owner's go 18 Oct 2026): the numbers
          card and "Who's coming" side by side, then search, View and Filter on
          one row, then the table across the width. */}
      <div className="mt-6 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-x-4">
        {/* The same card whatever's on (owner, 17 Oct 2026): filters only change its numbers. */}
        {events.length > 0 && (
          <div>
            <AnswersCard
              total={filtered.filter((g) => answerOf(g) !== "declined").length}
              homes={new Set(filtered.filter((g) => answerOf(g) !== "declined").map((g) => g.household_id).filter(Boolean)).size}
              counts={{
                to_invite: filtered.filter((g) => answerOf(g) === "to_invite").length,
                attending: filtered.filter((g) => answerOf(g) === "attending").length,
                pending: filtered.filter((g) => answerOf(g) === "pending").length,
                declined: filtered.filter((g) => answerOf(g) === "declined").length,
              }}
              showing={showing}
              onShow={setShowing}
            />
            {/* Laptops have it on "Who's coming". */}
            {caterer && <div className="lg:hidden"><CopyButton text={caterer} label="Copy the list for the caterer" /></div>}
          </div>
        )}
        {events.length > 0 && (
          <WhoComing
            guests={filtered.filter((g) => answerOf(g) !== "declined")}
            dayId={events[0]?.id}
            ownEvent={ownEvent}
            dietOf={dietOf}
            caterer={splitOf("diet", coming, look).copy}
          />
        )}

        <div className="mt-5 lg:col-span-2 lg:mt-6 lg:flex lg:flex-wrap lg:items-center lg:gap-x-6">
          <div className="flex items-center gap-2 lg:w-[520px]">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
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
            {/* Pick what to add first, then its own full screen (owner, 16 Oct 2026). */}
            <AddMenu
              label="Add to the guest list"
              title="Add to the guest list"
              choices={[
                { icon: <UserRound />, title: "A guest", line: "Someone on the list", href: "/people/new" },
                { icon: <House />, title: "A household", line: "People at one address", href: "/people/households/new" },
                { icon: <Users />, title: "A group", line: "Like the football lot", href: "/people/groups/new" },
                { icon: <CalendarHeart />, title: "A part of the day", line: "Like the evening do", href: "/people/events/new" },
              ]}
            />
          </div>

          {/* Find or add on the row above; how the list is shown here: View left, Filter right (owner, 17 Oct 2026: View is the bigger choice; was Filter left, Sort right). */}
          <div className="mt-3 flex min-h-9 items-center justify-between gap-3 px-1 lg:mt-0 lg:flex-1">
            <SortMenu sort={sort} onSort={chooseView} />
            <FilterMenu
              guestOf={ofCounted}
              ofOn={guestOf}
              onToggleOf={toggleOf}
              groups={guestGroups.map((g) => ({ id: g.id, label: g.name, count: g.members.length }))}
              groupOn={group?.id}
              onPickGroup={pickGroup}
              filters={counted}
              on={filters}
              onToggle={toggle}
              onClear={clearAll}
              // Everyone still expected, like the numbers card (owner, 20 Oct 2026).
              results={filtered.filter((g) => answerOf(g) !== "declined").length}
              kinds={kinds}
              picked={picks}
              onPick={togglePick}
            />
          </div>
          {filters.length + guestOf.length + picks.length + (group ? 1 : 0) > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 px-1 lg:mt-3 lg:w-full">
              {group && (
                <button
                  type="button"
                  onClick={() => setGroupId(undefined)}
                  aria-label={`Take off ${group.name}`}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 text-[13px] font-medium text-champagne-600"
                >
                  {group.name}
                  <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                </button>
              )}
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
              {picks.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => togglePick(id)}
                  aria-label={`Take off ${id.slice(id.indexOf(":") + 1)}`}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 text-[13px] font-medium text-champagne-600"
                >
                  {id.slice(id.indexOf(":") + 1)}
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

      {isSendingKind(sort) && (
        <SentCard
          kind={sort}
          units={units.filter((u) => u.members.some((m) => filtered.includes(m)))}
          sent={sent[sort]}
          onSend={() => setSendOpen(true)}
        />
      )}

      {shown.length === 0 ? (
        <p className="mt-6 px-1 text-sm text-stone">No one matches that.</p>
      ) : (
        <>
          {/* Phones and tablets: compact rows, tap for the card. */}
          <div className="flex lg:hidden">
            <div className="min-w-0 flex-1">
              {groups.map((group) => (
                <section key={group.key}>
                  {group.title && <GroupTitle group={group} folded={folded.has(group.key)} onFold={() => toggleFold(group.key)} />}
                  <ul>
                    {(folded.has(group.key) ? [] : group.guests).map((g) => (
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
            folded={folded}
            onFold={toggleFold}
            answers={data.answers}
            events={events}
            tables={tables}
            dietOf={dietOf}
            openId={openId}
            onOpen={setOpenId}
          />
        </>
      )}

      {/* The events themselves, at the foot of the list: one "Edit events" card (owner, 16 Oct 2026). */}
      <EditEvents events={events} />

      {sendOpen && isSendingKind(sort) && (
        <SendSheet
          kind={sort}
          units={units.filter((u) => u.members.some((m) => filtered.includes(m)) && !sent[sort].has(u.key))}
          weddingName={weddingName}
          onClose={() => setSendOpen(false)}
          onOpenUnit={(u) => {
            setSendOpen(false);
            if (u.householdId) setHouseholdId(u.householdId);
            else if (u.contactId) setOpenId(u.contactId);
          }}
        />
      )}

      {openGroupCard && (
        <GroupSheet
          group={openGroupCard}
          people={guests.filter((g) => openGroupCard.members.includes(g.id)).sort((a, b) => fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" }))}
          answerOf={answerOf}
          weddingName={weddingName}
          onClose={closeGroupCard}
          onOpenGuest={setOpenId}
        />
      )}

      {open && (
        <GuestCard
          guest={open}
          household={open.household_id ? (data.household.get(open.household_id) ?? null) : null}
          households={households}
          events={events}
          rsvps={data.answers.get(open.id) ?? []}
          table={tables[open.id] ?? null}
          seating={seating}
          travel={travel}
          groups={guestGroups}
          ownNeeds={ownNeeds(rsvps.map((r) => r.dietary_notes))}
          onShowGroup={(id) => {
            setOpenId(undefined);
            setGroupCardId(id);
          }}
          onOpenHousehold={(id) => {
            setOpenId(undefined);
            setHouseholdId(id);
          }}
          onClose={close}
        />
      )}

      {openHousehold && (
        <HouseholdSheet
          household={openHousehold}
          households={households}
          guests={guests}
          events={events}
          rsvps={rsvps}
          tables={tables}
          seating={seating}
          travel={travel}
          groups={guestGroups}
          onClose={closeHousehold}
        />
      )}
    </>
  );
}

/**
 * Laptops only, beside the numbers card: who's coming — day, evening and
 * children as bars — and the dietary needs, with the caterer's copy. Counts
 * whatever the filters leave, like the numbers card, leaving out "can't come".
 */
function WhoComing({
  guests,
  dayId,
  ownEvent,
  dietOf,
  caterer,
}: {
  guests: Contact[];
  dayId: string | undefined;
  ownEvent: (g: Contact) => WeddingEvent | undefined;
  dietOf: (g: Contact) => string | null;
  caterer?: string;
}) {
  const total = guests.length;
  const day = guests.filter((g) => ownEvent(g)?.id === dayId).length;
  const tally = new Map<string, number>();
  for (const g of guests) for (const need of needsOf(dietOf(g))) tally.set(need, (tally.get(need) ?? 0) + 1);
  const needs = [...tally.entries()].sort((a, b) => b[1] - a[1] || needRank(a[0]) - needRank(b[0])).slice(0, 4);
  const most = Math.max(1, ...needs.map(([, n]) => n));
  const bar = (label: string, n: number, of: number) => (
    <div key={label} className="grid grid-cols-[110px_1fr_36px] items-center gap-3 py-1.5">
      <span className="truncate text-sm text-ink">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-[#E9E1D3]">
        <span className="block h-full rounded-full bg-champagne-400" style={{ width: `${of ? Math.round((n / of) * 100) : 0}%` }} />
      </span>
      <span className="type-figure text-right text-[17px]">{n}</span>
    </div>
  );
  return (
    <section aria-label="Who's coming" className="glass-card hidden rounded-[22px] px-5 py-4 lg:grid lg:grid-cols-2 lg:gap-7">
      <div>
        <h2 className="section-label">Who&apos;s coming</h2>
        <div className="mt-2">
          {bar("Day", day, total)}
          {bar("Evening", total - day, total)}
          {bar("Children", guests.filter((g) => g.is_child).length, total)}
        </div>
      </div>
      <div>
        <h2 className="section-label">Dietary needs</h2>
        <div className="mt-2">
          {needs.length > 0 ? needs.map(([need, n]) => bar(need, n, most)) : <p className="py-1.5 text-sm italic text-stone">None yet</p>}
        </div>
        {needs.length > 0 && caterer && <CopyButton text={caterer} label="Copy the list for the caterer" />}
      </div>
    </section>
  );
}

function GroupTitle({ group, folded, onFold }: { group: Group; folded: boolean; onFold: () => void }) {
  const inner = (
    <>
      <span className={`label ${group.rose ? "!text-[#9A3F2B]" : ""}`}>{group.title}</span>
      <span className="text-xs text-stone">
        {group.count ?? guestCount(group.guests.length)}
        {group.onOpen && " ›"}
      </span>
    </>
  );
  const className = "flex min-w-0 flex-1 items-baseline justify-between gap-3 text-left";
  return (
    <div className="mt-5 flex items-center gap-1 border-b border-champagne-400 pb-1.5 pt-1">
      {group.onOpen ? (
        <button type="button" onClick={group.onOpen} className={`${className} hover:[&>span]:text-ink`}>
          {inner}
        </button>
      ) : (
        <button type="button" onClick={onFold} aria-expanded={!folded} className={className}>
          {inner}
        </button>
      )}
      <button
        type="button"
        onClick={onFold}
        aria-expanded={!folded}
        aria-label={`${folded ? "Show" : "Hide"} ${group.title}`}
        className="-my-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
      >
        <ChevronDown className={`h-4 w-4 transition ${folded ? "-rotate-90" : ""}`} strokeWidth={1.8} aria-hidden />
      </button>
    </div>
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
    // Three small numbers, the furthest step first like Suppliers (Booked first); the big
    // number is everyone still expected, so Can't come isn't in it, just a quiet line under
    // (owner, 17 Oct 2026). The big tile is champagne too: ink is kept for the Add button.
    { status: "attending", label: "Coming", tone: "text-champagne-600" },
    { status: "pending", label: "Yet to respond", tone: "text-champagne-600" },
    { status: "to_invite", label: "To invite", tone: "text-champagne-600" },
  ];

  return (
    <section
      aria-label="RSVPs"
      className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-2.5 rounded-[22px] border-[0.5px] border-white/70 bg-white/50 p-3 pb-2 shadow-[0_0_0_0.5px_rgb(60_50_40/0.06),0_18px_40px_-24px_rgb(60_50_40/0.32)] sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3 sm:p-3.5 sm:pb-2.5"
    >
      <button
        type="button"
        aria-pressed={all}
        onClick={() => onShow("all")}
        className={`mb-1 flex flex-col justify-between rounded-2xl p-3 text-left transition ${
          all ? "glass-tile-on text-ink" : "glass-tile text-ink hover:bg-champagne-100/60"
        }`}
      >
        <span className="type-meta text-champagne-600">Guests</span>
        <span>
          <span
            className={`type-figure block leading-none ${total >= 100 ? "text-[50px] sm:text-[56px]" : "text-[64px] sm:text-[72px]"} ${all ? "text-champagne-600" : "text-ink"}`}
          >
            {total}
          </span>
          <span className="mt-1.5 block text-xs text-stone">
            {homes} {homes === 1 ? "household" : "households"}
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
              className={`relative flex min-h-10 min-w-0 items-center gap-2 rounded-xl px-2 text-left sm:gap-2.5 sm:px-2.5 transition ${
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
  // Gold, not ink, and a little smaller (owner, 13 Oct 2026): black is kept
  // for the main action, the round +. Still darker than Invited's pale fill.
  attending: { ring: "bg-champagne-600 text-white", icon: <Check className="h-[55%] w-[55%]" strokeWidth={2.4} /> },
  // Every answer has a ring as strong as Coming's fill, so none fade into the
  // page (owner, 16 Oct 2026: Invited and Can't come were hard to see).
  pending: { ring: "border border-champagne-600 bg-white text-champagne-600", icon: <Mail className="h-1/2 w-1/2" strokeWidth={1.8} /> },
  to_invite: { ring: "border-[1.5px] border-dashed border-champagne-600 text-champagne-600", icon: <Mail className="h-1/2 w-1/2" strokeWidth={2} /> },
  declined: { ring: "bg-[#D6D0C7] text-[#4F4A45]", icon: <X className="h-1/2 w-1/2" strokeWidth={2.4} /> },
  unset: { ring: "border-[1.5px] border-dashed border-champagne-600 text-champagne-600", icon: <span className="font-display text-[0.8em] leading-none">?</span> },
};

export function AnswerIcon({ status, small = false }: { status?: Rsvp["status"]; small?: boolean }) {
  const look = ICON[status ?? "unset"];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full ${look.ring} ${small ? "h-5 w-5 text-[13px]" : "h-[22px] w-[22px] text-[13px]"}`}
    >
      {look.icon}
    </span>
  );
}

/** The key under the list, so the icons explain themselves. */
function AnswerKey({ unset }: { unset: boolean }) {
  const items: [Rsvp["status"] | undefined, string][] = [
    ["attending", "Coming"],
    ["pending", "Yet to respond"],
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
  /** A line under the name: what the summary card is adding up (their diet, role…). */
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
  groups,
  groupOn,
  onPickGroup,
  filters,
  on,
  onToggle,
  onClear,
  results,
  kinds,
  picked,
  onPick,
}: {
  /** The breakdowns Filter can narrow to one kind of, each with its options and counts. */
  kinds: { kind: "diet" | "role" | "meal"; title: string; options: { label: string; count: number }[] }[];
  /** Ticked ones, as "diet:Vegetarian". */
  picked: string[];
  onPick: (id: string) => void;
  /** How many guests the filters leave, for the sheet's "Show …" button. */
  results: number;
  /** Day guests, evening guests: one per event. */
  guestOf: { id: string; label: string; count: number }[];
  ofOn: string[];
  onToggleOf: (id: string) => void;
  /** Groups of guests: pick one (picking it again takes it off). */
  groups: { id: string; label: string; count: number }[];
  groupOn?: string;
  onPickGroup: (id: string) => void;
  filters: { key: GuestFilter; label: string; count: number }[];
  on: GuestFilter[];
  onToggle: (key: GuestFilter) => void;
  onClear: () => void;
}) {
  const { open, setOpen, box } = useDropdown();
  const close = useCallback(() => setOpen(false), [setOpen]);
  const drag = usePullToClose(close);
  const active = on.length + ofOn.length + picked.length + (groupOn ? 1 : 0);
  const [openKind, setOpenKind] = useState<string | null>(null);
  // On a phone it's a sheet from the bottom: the list behind stays still while it's open.
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 1023px)").matches) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);
  // One list of things to filter by (owner, 17 Oct 2026, canvas 3 "Filter reimagined", A):
  // each row opens its own values, any of the ticked ones within a row, every row together.
  type Opt = { id: string; label: string; count: number; ticked: boolean; flip: () => void; radio?: boolean };
  type Row = { key: string; title: string; options: Opt[]; any?: Opt };
  const pickedOf = (kind: string) => picked.filter((p) => p.startsWith(`${kind}:`));
  const filterCount = (key: GuestFilter) => filters.find((f) => f.key === key)?.count ?? 0;
  /** A row with an "Any" line for a whole-filter (Bridal party, Dietary needs) plus its specific values. */
  const kindRow = (kind: "diet" | "role" | "meal", title: string, fk: GuestFilter | null, anyLabel: string): Row | null => {
    const k = kinds.find((x) => x.kind === kind);
    if (!k && !fk) return null;
    const anyOn = fk ? on.includes(fk) : false;
    return {
      key: kind,
      title,
      any: fk
        ? {
            id: `any-${kind}`,
            label: anyLabel,
            count: filterCount(fk),
            ticked: anyOn,
            flip: () => {
              if (!anyOn) pickedOf(kind).forEach(onPick);
              onToggle(fk);
            },
          }
        : undefined,
      options: (k?.options ?? []).map((o) => {
        const id = `${kind}:${o.label}`;
        return {
          id,
          label: o.label,
          count: o.count,
          ticked: picked.includes(id),
          flip: () => {
            if (fk && anyOn) onToggle(fk);
            onPick(id);
          },
        };
      }),
    };
  };
  const rowsAll: (Row | null)[] = [
    guestOf.length > 0
      ? { key: "event", title: "Event", options: guestOf.map((o) => ({ id: o.id, label: o.label, count: o.count, ticked: ofOn.includes(o.id), flip: () => onToggleOf(o.id) })) }
      : null,
    groups.length > 0
      ? {
          key: "group",
          title: "Group",
          options: groups.map((g) => ({
            id: g.id,
            label: g.label,
            count: g.count,
            ticked: groupOn === g.id,
            radio: true,
            flip: () => {
              onPickGroup(g.id);
              setOpen(false);
            },
          })),
        }
      : null,
    kindRow("role", "Role on the day", "party", "Anyone in the bridal party"),
    kindRow("diet", "Dietary needs", "dietary", "Any dietary need"),
    // One row for age, meal and drinks (owner, 20 Oct 2026: three rows about meals was too many).
    {
      key: "meal-drinks",
      title: "Children, meals and drinks",
      options: (["children", "childmeal", "nomeal", "soft"] as const).map((k) => ({
        id: k,
        label: FILTERS.find((f) => f.key === k)!.label,
        count: filterCount(k),
        ticked: on.includes(k),
        flip: () => onToggle(k),
      })),
    },
    {
      key: "address",
      title: "Address",
      options: [{ id: "noaddress", label: "No address yet", count: filterCount("noaddress"), ticked: on.includes("noaddress"), flip: () => onToggle("noaddress") }],
    },
  ];
  const rows = rowsAll.filter((r): r is Row => r !== null);
  const pickedIn = (r: Row) => r.options.filter((o) => o.ticked).length + (r.any?.ticked ? 1 : 0);

  const optionButton = (o: Opt) => (
    <li key={o.id} className="border-t border-linen first:border-t-0">
      <button
        type="button"
        role={o.radio ? "menuitemradio" : "menuitemcheckbox"}
        aria-checked={o.ticked}
        onClick={o.flip}
        className="flex min-h-11 w-full items-center gap-3 text-left text-sm text-ink"
      >
        <span
          aria-hidden
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
            o.ticked ? "bg-ink text-ivory" : "border-[1.5px] border-[#D8D0C4]"
          }`}
        >
          {o.ticked && <Check className="h-3 w-3" strokeWidth={2.6} />}
        </span>
        <span className="flex-1">{o.label}</span>
        <span className="text-[13px] text-stone">{o.count}</span>
      </button>
    </li>
  );

  const content = (
    <>
      <div className="flex items-baseline justify-between py-1">
        <span className="section-label">Filter by</span>
        {active > 0 && (
          <button type="button" onClick={onClear} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
            Clear
          </button>
        )}
      </div>
      {rows.map((r) => {
        const isOpen = openKind === r.key;
        const n = pickedIn(r);
        return (
          <div key={r.key} className="border-t border-linen first:border-t-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenKind(isOpen ? null : r.key)}
              className="flex min-h-12 w-full items-center gap-3 text-left text-[15px] text-ink"
            >
              <span className="flex-1">{r.title}</span>
              {n > 0 && <span className="text-[13px] font-medium text-champagne-600">{n} picked</span>}
              <ChevronRight className={`h-4 w-4 shrink-0 text-stone transition ${isOpen ? "rotate-90" : ""}`} strokeWidth={1.8} aria-hidden />
            </button>
            {isOpen && (
              <ul className="pb-1 pl-2">
                {r.any && optionButton(r.any)}
                {r.options.map(optionButton)}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={active > 0 ? `Filter, ${active} on` : "Filter"}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-1.5 rounded-full transition ${
          active > 0
            ? "border border-champagne-600 bg-champagne-100 pl-2.5 pr-3 text-[13px] font-medium text-champagne-600"
            : "type-meta hover:text-ink"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
        {active > 0 ? `Filter · ${active}` : "Filter"}
      </button>

      {open && (
        <>
          {/* Laptops: a small menu under the button. */}
          <div className={`${MENU} hidden max-h-[70dvh] w-[17rem] overflow-y-auto pb-2 pt-2.5 lg:block`}>{content}</div>

          {/* Phones: a sheet from the bottom (owner, 14 Oct 2026). The card above the
              list grows as filters go on; a menu hanging off the button moved with it. */}
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter">
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
              className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
            />
            <div
              style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
              className={`absolute inset-x-0 bottom-0 flex h-[80dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] ${
                drag.dragging ? "" : "transition-transform duration-200 ease-out"
              }`}
            >
              <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center">
                <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
              </div>
              {/* A set height, so opening a row scrolls inside rather than pushing the sheet up (owner, 17 Oct 2026). */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[22px] pb-3">{content}</div>
              <div className="shrink-0 border-t border-linen px-[22px] pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <button type="button" onClick={close} className="h-12 w-full rounded-full bg-ink text-[15px] text-ivory">
                  Show {results} {results === 1 ? "guest" : "guests"}
                </button>
              </div>
            </div>
          </div>
        </>
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
        aria-label={`View: ${SORTS.find((o) => o.key === sort)!.label}`}
        onClick={() => setOpen((o) => !o)}
        className="type-meta flex h-9 min-w-0 items-center gap-1.5 hover:text-ink max-[359px]:tracking-[0.12em]"
      >
        <LayoutList className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
        <span className="truncate">{SORTS.find((o) => o.key === sort)!.label.replace(", A–Z", "")}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
      </button>

      {open && (
        <div className={`${MENU} !left-0 !right-auto w-[16rem] pb-1.5 pt-2.5`}>
          <ul>
            {SORTS.map((o, i) => (
              <li key={o.key} className={i > 0 && SORTS[i - 1].section === o.section ? "border-t border-linen" : ""}>
                {(i === 0 || SORTS[i - 1].section !== o.section) && <span className={`section-label block pb-0.5 ${i === 0 ? "pt-1" : "pt-3"}`}>{o.section}</span>}
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
  folded,
  onFold,
  answers,
  events,
  tables,
  dietOf,
  openId,
  onOpen,
}: {
  groups: Group[];
  folded: Set<string>;
  onFold: (key: string) => void;
  answers: Map<string, Rsvp[]>;
  /** One answer column per event (the day, the evening). */
  events: WeddingEvent[];
  tables: Record<string, string>;
  dietOf: (g: Contact) => string | null;
  /** The guest whose card is open beside the list, marked in it. */
  openId?: string;
  onOpen: (id: string) => void;
}) {
  const head = "whitespace-nowrap pb-3 pr-4 pt-1 text-xs font-medium uppercase tracking-[0.16em] text-champagne-600";
  const word = (e: WeddingEvent) => e.name.replace(/^the\s+/i, "").replace(/^\w/, (c) => c.toUpperCase());
  const columns = 4 + events.length;

  return (
    <div className="mt-6 hidden rounded-[22px] border-[0.5px] border-white/70 bg-white/55 px-5 pb-3 pt-3 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4)] lg:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-champagne-400">
            <th scope="col" className={head}>Guest</th>
            {events.map((e) => (
              <th key={e.id} scope="col" className={head}>{word(e)}</th>
            ))}
            <th scope="col" className={head}>Meal</th>
            <th scope="col" className={head}>Needs</th>
            <th scope="col" className={head}>Table</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            {group.title && (
              <tr>
                <th colSpan={columns} scope="colgroup" className="pb-1.5 pt-5 text-left font-normal">
                  {group.onOpen ? (
                    <button type="button" onClick={group.onOpen} className="font-display text-lg text-ink hover:underline hover:decoration-champagne-400 hover:underline-offset-4">
                      {group.title}
                    </button>
                  ) : (
                    <span className={`font-display text-lg ${group.rose ? "text-[#9A3F2B]" : "text-ink"}`}>{group.title}</span>
                  )}
                  <span className="type-meta ml-3">{group.count ?? guestCount(group.guests.length)}</span>
                  <button
                    type="button"
                    onClick={() => onFold(group.key)}
                    aria-expanded={!folded.has(group.key)}
                    aria-label={`${folded.has(group.key) ? "Show" : "Hide"} ${group.title}`}
                    className="-my-2 ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full align-middle text-stone hover:text-ink"
                  >
                    <ChevronDown className={`h-4 w-4 transition ${folded.has(group.key) ? "-rotate-90" : ""}`} strokeWidth={1.8} aria-hidden />
                  </button>
                </th>
              </tr>
            )}
            {(folded.has(group.key) ? [] : group.guests).map((g) => {
              const roles = rolesOf(g);
              const needs = needsOf(dietOf(g));
              const table = tables[g.id];
              const isOpen = openId === g.id;
              return (
                <tr
                  key={g.id}
                  onClick={() => onOpen(g.id)}
                  className={`cursor-pointer border-t-[0.5px] border-champagne-400 align-middle ${isOpen ? "bg-white shadow-[inset_3px_0_0_#B8914F]" : "hover:bg-champagne-100/50"}`}
                >
                  <td className="py-2 pl-2 pr-4">
                    <span className="flex items-center gap-3">
                      <span aria-hidden className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-linen bg-white font-display text-sm text-champagne-600">
                        {initials(g)}
                        {roles.length > 0 && (
                          <span className="absolute -bottom-1 -right-1.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-ivory bg-champagne-400">
                            <Star className="h-2.5 w-2.5 fill-white text-white" strokeWidth={1.4} />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <button type="button" onClick={() => onOpen(g.id)} className="block whitespace-nowrap text-left font-display text-[17px] text-ink hover:underline">
                          {fullName(g)}
                        </button>
                        {roles.length > 0 && <span className="block text-xs text-champagne-600">{roles.join(" · ")}</span>}
                      </span>
                    </span>
                  </td>
                  {events.map((e) => (
                    <td key={e.id} className="whitespace-nowrap py-2 pr-4">
                      <AnswerPill status={answers.get(g.id)?.find((r) => r.event_id === e.id)?.status} />
                    </td>
                  ))}
                  <td className="whitespace-nowrap py-2 pr-4 text-ink">{mealWord(g)}</td>
                  <td className="py-2 pr-4">
                    <span className="flex flex-wrap gap-1.5">
                      {needs.map((need) => (
                        <span key={need} className="whitespace-nowrap rounded-full bg-cream px-2.5 py-0.5 text-xs text-stone shadow-[inset_0_0_0_1px_#E3D3B3]">
                          {need}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    {table ? (
                      <span className="inline-flex h-8 min-w-8 items-center justify-center whitespace-nowrap rounded-full bg-white px-2.5 font-display text-[15px] text-ink shadow-[inset_0_0_0_1px_#CDB78E]">
                        {table.replace(/^table\s+/i, "")}
                      </span>
                    ) : (
                      <span className="text-stone/60">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/**
 * A guest's answer for one event as a small pill (canvas 4 "Laptop · Round
 * 9", 1b, owner's pick 21 Oct 2026): always the word, never colour alone.
 * Not invited to that event: a quiet dash.
 */
function AnswerPill({ status }: { status?: Rsvp["status"] }) {
  if (!status) return <span className="text-stone/60">–</span>;
  const look: Record<Rsvp["status"], string> = {
    attending: "bg-champagne-100 text-champagne-600",
    pending: "border border-dashed border-champagne-400 text-stone",
    to_invite: "border border-dashed border-linen text-stone",
    declined: "bg-[#EFECE8] text-stone line-through",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] leading-none ${look[status]}`}>
      {status === "attending" && <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden />}
      {ANSWER_WORD[status].word}
    </span>
  );
}

const NOT_PICKED = "Not picked yet";
const isAllergy = (need: string) => /allerg/i.test(need);

interface Lookups {
  dietOf: (g: Contact) => string | null;
  mealOf: (g: Contact) => string | null;
  ownEvent: (g: Contact) => WeddingEvent | undefined;
}

/** Which kinds a guest counts under, for one way of adding up. */
function partOf(kind: SplitKind, g: Contact, look: Lookups): string[] {
  switch (kind) {
    case "diet":
      return needsOf(look.dietOf(g));
    case "role":
      return rolesOf(g);
    case "meal":
      return [look.mealOf(g) ?? NOT_PICKED];
    case "age":
      return [g.is_child ? "Children" : "Adults"];
    case "when": {
      const e = look.ownEvent(g);
      return e ? [eventWord(e).replace(/^\w/, (c) => c.toUpperCase())] : [];
    }
  }
}

/** The card's tally for one way of adding up, over the guests coming. */
function splitOf(kind: SplitKind, coming: Contact[], look: Lookups): Split {
  const tally = new Map<string, Contact[]>();
  for (const g of coming) for (const part of partOf(kind, g, look)) tally.set(part, [...(tally.get(part) ?? []), g]);
  const line = (label: string): TallyLine => ({
    id: `${kind}:${label}`,
    label,
    count: tally.get(label)!.length,
    rose: kind === "diet" && isAllergy(label),
    faded: label === NOT_PICKED,
  });
  const most = (a: string, b: string) => tally.get(b)!.length - tally.get(a)!.length || a.localeCompare(b);
  const labels = [...tally.keys()];

  switch (kind) {
    case "diet": {
      const order = (a: string, b: string) => needRank(a) - needRank(b) || a.localeCompare(b);
      const diets = labels.filter((l) => !isAllergy(l)).sort(order);
      const allergies = labels.filter(isAllergy).sort(order);
      const names = (l: string) => tally.get(l)!.map(fullName).join(", ");
      const copy = [
        `Dietary needs — ${coming.length} coming`,
        "",
        ...diets.map((l) => `${l} (${tally.get(l)!.length}): ${names(l)}`),
        ...(allergies.length ? ["", "Allergies — must avoid", ...allergies.map((l) => `${l} (${tally.get(l)!.length}): ${names(l)}`)] : []),
      ].join("\n");
      return {
        kind,
        word: "Diet",
        sections: [
          { title: "Diets", lines: diets.map(line) },
          { title: "Allergies · must avoid", rose: true, lines: allergies.map(line) },
        ],
        copy,
      };
    }
    case "role":
      return { kind, word: "Role", sections: [{ lines: labels.sort((a, b) => roleRank(a) - roleRank(b) || a.localeCompare(b)).map(line) }] };
    case "meal": {
      const meals = labels.filter((l) => l !== NOT_PICKED).sort(most);
      return { kind, word: "Meal", sections: [{ title: "Meals", lines: [...meals, ...labels.filter((l) => l === NOT_PICKED)].map(line) }] };
    }
    case "age":
      return { kind, word: "Age", sections: [{ lines: ["Adults", "Children"].filter((l) => tally.has(l)).map(line) }] };
    case "when":
      return { kind, word: "Day or evening", sections: [{ lines: labels.map(line) }] };
  }
}

/**
 * Above the list in View › Save the date / Invitation / Thank-you: how many
 * households have had it, a bar, and "Send to the 12" (canvas 3 "Sent ·
 * Round 1", B). Counts whoever the filters leave, so it can be just the
 * evening guests.
 */
function SentCard({
  kind,
  units,
  sent,
  onSend,
}: {
  kind: SendingKind;
  units: { key: string }[];
  sent: Map<string, SentRecord>;
  onSend: () => void;
}) {
  const label = SENDINGS.find((x) => x.kind === kind)!;
  const had = units.filter((u) => sent.has(u.key));
  const toSend = units.length - had.length;
  const hows = howsLine([...new Set(had.map((u) => sent.get(u.key)!.how).filter(Boolean))] as SendHow[]);
  return (
    <section aria-label={label.label} className="glass-card mt-4 rounded-[22px] px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-[19px] text-ink">{label.label}</span>
        {hows && <span className="truncate text-[12.5px] text-stone">{hows}</span>}
      </div>
      <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-linen">
        <span className="block h-full rounded-full bg-champagne-600" style={{ width: `${units.length ? (had.length / units.length) * 100 : 0}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[13px]">
        <span className="text-stone">
          {had.length} of {units.length} {units.length === 1 ? "household" : "households"}
        </span>
        {toSend === 0 ? (
          <span className="text-champagne-600">✓ All sent</span>
        ) : (
          <button type="button" onClick={onSend} className="h-9 rounded-full bg-ink px-4 text-[13px] text-ivory">
            Send to the {toSend}
          </button>
        )}
      </div>
    </section>
  );
}
