import { mealCounts, type MealCounts } from "@/lib/meals";
import type { Contact, Household, Rsvp, TransportPassenger, TransportRun, WeddingEvent } from "@/types/db";

/**
 * Facts from the guest list for the areas that need them (canvas 2 "Area
 * page · Facts from the guest list", option B, owner's pick 12 Oct 2026):
 * Food & drink gets who's eating and what, Stationery who's being sent to,
 * Transport who's travelling (from The Day). Nothing is stored twice — it's
 * worked out from the guest list each time. Other areas get none.
 */
export type AreaGuestFacts =
  | {
      kind: "food";
      day: number;
      evening: number;
      children: number;
      /** Meals and drinks among those coming (0033): adult · child's · none, drinking · soft. */
      counts: MealCounts;
      /** The same for day guests only (the evening do's food is for everyone, the wedding breakfast for the day). */
      countsDay: MealCounts;
      dayEventId: string | null;
      eveningEventId: string | null;
      /** Meal choices among those coming, most picked first. */
      meals: { name: string; count: number }[];
      notPicked: number;
      dietary: { name: string; note: string }[];
    }
  | {
      kind: "stationery";
      households: number;
      invited: number;
      toInvite: number;
      noAddress: string[];
      /** Every household with an address, ready to paste for envelopes. */
      addresses: string;
    }
  | {
      kind: "transport";
      runs: { id: string; time: string; vehicle: string; route: string; people: number }[];
      travelling: number;
      /** Day guests who are coming but aren't on any car or coach. */
      withoutLift: number;
    };

const AREA_KIND: Record<string, AreaGuestFacts["kind"]> = {
  food: "food",
  catering: "food",
  stationery: "stationery",
  transport: "transport",
};

/** Which kind of guest facts an area shows, if any. */
export function guestFactsKind(areaKey: string): AreaGuestFacts["kind"] | null {
  return AREA_KIND[areaKey] ?? null;
}

const fullName = (g: Contact) => [g.first_name, g.last_name].filter(Boolean).join(" ");

export function areaGuestFacts(
  kind: AreaGuestFacts["kind"],
  data: {
    guests: Contact[];
    households: Household[];
    events: WeddingEvent[];
    rsvps: Rsvp[];
    runs?: TransportRun[];
    passengers?: TransportPassenger[];
  },
): AreaGuestFacts {
  const { guests, households, events, rsvps } = data;
  const answers = new Map<string, Rsvp[]>();
  for (const r of rsvps) answers.set(r.contact_id, [...(answers.get(r.contact_id) ?? []), r]);
  // A guest's own event is the first they're invited to (events come in date
  // order), as on the guest list; their answer and meal are on that RSVP.
  const own = (g: Contact) => {
    const theirs = answers.get(g.id) ?? [];
    for (const e of events) {
      const r = theirs.find((x) => x.event_id === e.id);
      if (r) return { event: e, rsvp: r };
    }
    return null;
  };
  const dayEvent = events[0] ?? null;
  const eveningEvent = events.length > 1 ? events[events.length - 1] : null;
  const coming = guests.filter((g) => own(g)?.rsvp.status === "attending");

  if (kind === "food") {
    const tally = new Map<string, { name: string; count: number }>();
    let notPicked = 0;
    for (const g of coming) {
      const meal = own(g)?.rsvp.meal_choice?.trim();
      if (!meal) {
        notPicked++;
        continue;
      }
      const key = meal.toLowerCase();
      const entry = tally.get(key) ?? { name: meal.charAt(0).toUpperCase() + meal.slice(1), count: 0 };
      entry.count++;
      tally.set(key, entry);
    }
    // Anyone still coming or not yet answered: the kitchen needs to know either way.
    const dietary = guests
      .filter((g) => own(g)?.rsvp.status !== "declined")
      .map((g) => ({ name: fullName(g), note: (answers.get(g.id) ?? []).find((r) => r.dietary_notes?.trim())?.dietary_notes?.trim() ?? "" }))
      .filter((d) => d.note);
    return {
      kind,
      day: coming.filter((g) => own(g)?.event.id === dayEvent?.id).length,
      evening: eveningEvent ? coming.filter((g) => own(g)?.event.id === eveningEvent.id).length : 0,
      children: coming.filter((g) => g.is_child).length,
      counts: mealCounts(coming),
      countsDay: mealCounts(coming.filter((g) => own(g)?.event.id === dayEvent?.id)),
      dayEventId: dayEvent?.id ?? null,
      eveningEventId: eveningEvent?.id ?? null,
      meals: [...tally.values()].sort((a, b) => b.count - a.count),
      notPicked,
      dietary,
    };
  }

  if (kind === "stationery") {
    const members = (h: Household) => guests.filter((g) => g.household_id === h.id);
    const hasAddress = (h: Household) => Boolean(h.address_line1 || h.postcode);
    const sending = households.filter((h) => members(h).length > 0);
    const toInvite = sending.filter((h) => members(h).some((g) => !own(g) || own(g)!.rsvp.status === "to_invite"));
    return {
      kind,
      households: sending.length,
      invited: sending.length - toInvite.length,
      toInvite: toInvite.length,
      noAddress: sending.filter((h) => !hasAddress(h)).map((h) => h.name),
      addresses: sending
        .filter(hasAddress)
        .map((h) =>
          [h.name, h.address_line1, h.address_line2, [h.city, h.postcode].filter(Boolean).join(" "), h.country]
            .filter((line) => line && line.trim())
            .join("\n"),
        )
        .join("\n\n"),
    };
  }

  const runs = data.runs ?? [];
  const passengers = data.passengers ?? [];
  const riding = new Set(passengers.map((p) => p.contact_id));
  return {
    kind,
    runs: runs.map((r) => ({
      id: r.id,
      time: r.at_time.slice(0, 5),
      vehicle: r.vehicle,
      route: [r.from_place, r.to_place].filter(Boolean).join(" → "),
      people: passengers.filter((p) => p.run_id === r.id).length,
    })),
    travelling: riding.size,
    withoutLift: coming.filter((g) => own(g)?.event.id === dayEvent?.id && !riding.has(g.id)).length,
  };
}

/** The caterer's list: numbers, meals and dietary needs, ready to paste into an email. */
export function catererText(facts: Extract<AreaGuestFacts, { kind: "food" }>, couple: string): string {
  const lines = [`${couple}: numbers for the caterer`, "", `Day guests coming: ${facts.day}`];
  if (facts.eveningEventId) lines.push(`Evening guests coming: ${facts.evening}`);
  if (facts.children) lines.push(`Children (included above): ${facts.children}`);
  const c = facts.counts;
  lines.push("", `Adult meals: ${c.adult}`, `Children's meals: ${c.child}`);
  if (c.none) lines.push(`No meal (babies): ${c.none}`);
  lines.push(`Drinking alcohol: ${c.drinking}`, `Soft drinks only: ${c.soft}`);
  if (facts.dietary.length) {
    lines.push("", "Dietary needs:");
    for (const d of facts.dietary) lines.push(`- ${d.name}: ${d.note}`);
  }
  return lines.join("\n");
}

/**
 * Everyone still expected: invited to something and not "can't come" on their
 * own event (the first they're invited to) — the guest list's big number.
 * Money's cost per guest divides by it (owner, 17 Oct 2026).
 */
export function expectedGuests(guests: Contact[], events: WeddingEvent[], rsvps: Rsvp[]): number {
  const answers = new Map<string, Rsvp[]>();
  for (const r of rsvps) answers.set(r.contact_id, [...(answers.get(r.contact_id) ?? []), r]);
  return guests.filter((g) => {
    const theirs = answers.get(g.id) ?? [];
    const own = events.map((e) => theirs.find((x) => x.event_id === e.id)).find(Boolean);
    return !!own && own.status !== "declined";
  }).length;
}
