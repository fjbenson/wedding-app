import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import type { Contact, Household } from "@/types/db";

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** The guest list, grouped by household — the people who share an invitation. */
export default function GuestList({
  guests,
  households,
}: {
  guests: Contact[];
  households: Household[];
}) {
  const groups = households
    .map((h) => ({ id: h.id, name: h.name, guests: guests.filter((g) => g.household_id === h.id) }))
    .filter((group) => group.guests.length > 0);
  const loose = guests.filter((g) => !g.household_id);
  if (loose.length > 0) groups.push({ id: "none", name: "Not in a household yet", guests: loose });

  const children = guests.filter((g) => g.is_child).length;

  return (
    <main className="page pb-28 lg:pb-16">
      <p className="label">Guests</p>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {guests.length === 0 ? "No one on the list yet." : "The guest list"}
      </h1>
      <p className="mt-2 text-sm text-stone">
        {guests.length === 0
          ? "Start with the people you can't imagine the day without."
          : [
              plural(guests.length, "guest"),
              plural(groups.filter((g) => g.id !== "none").length, "household"),
              children > 0 && plural(children, "child", "children"),
            ]
              .filter(Boolean)
              .join(" · ")}
      </p>

      <Link
        href="/guests/new"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Add a guest
      </Link>

      <div className="mt-10 space-y-8">
        {groups.map((group, index) => (
          <section key={group.id}>
            <div className="flex items-baseline gap-3 border-b border-champagne-400 pb-2">
              <span className="font-display text-sm text-champagne-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="flex-1 text-xl text-ink">{group.name}</h2>
              <span className="text-xs uppercase tracking-[0.14em] text-stone">
                {plural(group.guests.length, "guest")}
              </span>
            </div>
            <ul>
              {group.guests.map((guest) => (
                <GuestRow key={guest.id} guest={guest} />
              ))}
            </ul>
          </section>
        ))}
      </div>

    </main>
  );
}

function GuestRow({ guest }: { guest: Contact }) {
  const tags = [
    guest.contact_type === "bridal_party" && "Wedding party",
    guest.is_child && "Child",
  ].filter(Boolean);

  return (
    <li className="border-b border-linen last:border-b-0">
      <Link href={`/guests/${guest.id}`} className="flex items-center gap-3 py-3 hover:bg-cream/60">
        <span className="flex-1">
          <span className="block text-[15px] text-ink">
            {guest.first_name} {guest.last_name}
          </span>
          {tags.length > 0 && (
            <span className="mt-0.5 block text-xs text-stone">{tags.join(" · ")}</span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
      </Link>
    </li>
  );
}
