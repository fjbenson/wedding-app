import { formatDayMonth, todayISO } from "@/lib/dates";
import type { Contact, Household, TimelineEntry } from "@/types/db";

/*
 * Stationery as its own special area (canvas 3 "Comms · Stationery" and
 * "Sent · Round 1", B — agreed with the owner 19 Oct 2026). Like Decor, its
 * page has its own middle in place of the five stages: the three things a
 * couple sends — save the date, invitation, thank-you — each with how many
 * households have had it. Who's had what is a timeline entry per household
 * (0032_timeline.sql already has the kinds), so nothing new is stored.
 * Plain values, so server and client screens can both use them.
 */

export type SendingKind = "save_the_date" | "invitation" | "thank_you";
export type SendHow = "email" | "post" | "hand" | "text";

export const SENDINGS: { kind: SendingKind; label: string; lower: string }[] = [
  { kind: "save_the_date", label: "Save the date", lower: "the save the date" },
  { kind: "invitation", label: "Invitation", lower: "the invitation" },
  { kind: "thank_you", label: "Thank-you", lower: "a thank-you" },
];

export const isSendingKind = (k: string): k is SendingKind => SENDINGS.some((s) => s.kind === k);
export const sendingLabel = (k: SendingKind) => SENDINGS.find((s) => s.kind === k)!.label;

export const HOWS: { value: SendHow; label: string; done: string }[] = [
  { value: "email", label: "Email", done: "Emailed" },
  { value: "post", label: "Post", done: "Posted" },
  { value: "hand", label: "By hand", done: "Given by hand" },
  { value: "text", label: "Text", done: "Texted" },
];
export const howDone = (how: SendHow | null) => HOWS.find((h) => h.value === how)?.done ?? "Sent";

/** The area keys that get Stationery's page. */
export const isStationeryArea = (key: string) => key === "stationery" || key === "invitations";

/** One sending, as the screens need it. */
export type SentRecord = Pick<TimelineEntry, "id" | "household_id" | "contact_id" | "happened_on" | "how"> & { kind: SendingKind };

/**
 * Who things are sent to: each household with anyone in it, and anyone not
 * in a household on their own. "h:<id>" or "c:<id>".
 */
export interface SendUnit {
  key: string;
  name: string;
  householdId: string | null;
  contactId: string | null;
  members: Contact[];
  hasAddress: boolean;
  emails: string[];
  phones: string[];
}

export const unitKeyOf = (g: Pick<Contact, "id" | "household_id">) => (g.household_id ? `h:${g.household_id}` : `c:${g.id}`);

const fullName = (g: Contact) => [g.first_name, g.last_name].filter(Boolean).join(" ");

export function sendUnits(guests: Contact[], households: Pick<Household, "id" | "name" | "address_line1" | "postcode">[]): SendUnit[] {
  const units: SendUnit[] = [];
  const reach = (people: Contact[]) => ({
    emails: [...new Set(people.map((p) => p.email?.trim()).filter((e): e is string => !!e))],
    phones: [...new Set(people.map((p) => p.phone?.replace(/\s+/g, "")).filter((p): p is string => !!p))],
  });
  for (const h of households) {
    const members = guests.filter((g) => g.household_id === h.id);
    if (members.length === 0) continue;
    units.push({ key: `h:${h.id}`, name: h.name, householdId: h.id, contactId: null, members, hasAddress: Boolean(h.address_line1 || h.postcode), ...reach(members) });
  }
  for (const g of guests.filter((x) => !x.household_id)) {
    units.push({ key: `c:${g.id}`, name: fullName(g), householdId: null, contactId: g.id, members: [g], hasAddress: false, ...reach([g]) });
  }
  return units.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

/** For each sending, unit key → the first time it went (a household's own, or one of its people's). */
export function sentMap(units: SendUnit[], records: SentRecord[]): Record<SendingKind, Map<string, SentRecord>> {
  const out = { save_the_date: new Map(), invitation: new Map(), thank_you: new Map() } as Record<SendingKind, Map<string, SentRecord>>;
  const unitOf = new Map<string, string>();
  for (const u of units) {
    if (u.householdId) unitOf.set(`h:${u.householdId}`, u.key);
    for (const m of u.members) unitOf.set(`c:${m.id}`, u.key);
  }
  const sorted = [...records].sort((a, b) => a.happened_on.localeCompare(b.happened_on));
  for (const r of sorted) {
    const key = unitOf.get(r.household_id ? `h:${r.household_id}` : `c:${r.contact_id}`);
    if (key && !out[r.kind].has(key)) out[r.kind].set(key, r);
  }
  return out;
}

/** "Emailed 12 Jan". */
export const sentLine = (r: Pick<SentRecord, "how" | "happened_on">) => `${howDone(r.how)} ${formatDayMonth(r.happened_on)}`;

/** The three sendings with how many households have had each. */
export function sendingCounts(units: SendUnit[], records: SentRecord[]) {
  const sent = sentMap(units, records);
  return SENDINGS.map((s) => {
    const had = units.filter((u) => sent[s.kind].has(u.key));
    const hows = [...new Set([...sent[s.kind].values()].map((r) => r.how).filter(Boolean))] as SendHow[];
    const last = [...sent[s.kind].values()].map((r) => r.happened_on).sort().pop() ?? null;
    return { ...s, total: units.length, sent: had.length, toSend: units.length - had.length, hows, last };
  });
}

/** "Posted and emailed". */
export function howsLine(hows: SendHow[]): string {
  const words = hows.map((h) => howDone(h).toLowerCase());
  if (words.length === 0) return "";
  const line = words.length === 1 ? words[0] : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** Thank-yous wait for the day itself. */
export const afterTheDay = (weddingDate: string | null) => !weddingDate || todayISO() > weddingDate;

/** What the Stationery page's Next up says. */
export function stationeryNextUp(counts: ReturnType<typeof sendingCounts>, weddingDate: string | null): { title: string; line?: string; href?: string } {
  const by = (k: SendingKind) => counts.find((c) => c.kind === k)!;
  const total = counts[0]?.total ?? 0;
  if (total === 0) return { title: "Add your guests first", line: "Then you can keep track of who's been sent what.", href: "/people/new" };
  const households = (n: number) => `${n} ${n === 1 ? "household" : "households"}`;
  const std = by("save_the_date");
  const inv = by("invitation");
  const thanks = by("thank_you");
  // A save the date only matters until the invitations start going out.
  if (inv.sent === 0 && std.toSend > 0)
    return { title: `Send the save the date to ${households(std.toSend)}`, line: std.sent > 0 ? `${std.sent} sent so far` : undefined, href: "/people?view=save_the_date" };
  if (inv.toSend > 0)
    return { title: `Send the invitation to ${households(inv.toSend)}`, line: inv.sent > 0 ? `${inv.sent} sent so far` : undefined, href: "/people?view=invitation" };
  if (!afterTheDay(weddingDate)) return { title: "Invitations all sent.", line: "Thank-yous come after the day." };
  if (thanks.toSend > 0) return { title: `Thank ${households(thanks.toSend)}`, line: thanks.sent > 0 ? `${thanks.sent} thanked so far` : undefined, href: "/people?view=thank_you" };
  return { title: "Every thank-you sent. Lovely." };
}
