import { Baby, Check, House, Mail, Minus, PenLine, Phone, UtensilsCrossed, WheatOff, X, type LucideIcon } from "lucide-react";
import { rolesOf } from "@/lib/guest-roles";
import type { Contact, Rsvp, RsvpStatus } from "@/types/db";

/** Small pieces shared by the guest list, the guest card and household pages. */

export function fullName(guest: Pick<Contact, "first_name" | "last_name">) {
  return [guest.first_name, guest.last_name].filter(Boolean).join(" ");
}

/** "ED" for Ellen Daniels — the circle at the start of each row. */
export function initials(guest: Pick<Contact, "first_name" | "last_name">) {
  return (guest.first_name.charAt(0) + (guest.last_name?.charAt(0) ?? "")).toUpperCase();
}

/** "Day" for "The day", "Eve" for "The evening": the heading over each dot. */
export function shortEvent(name: string) {
  const bare = name.replace(/^the\s+/i, "");
  const word = bare.charAt(0).toUpperCase() + bare.slice(1);
  return word.length <= 5 ? word : word.slice(0, 3);
}

const ANSWER: Record<RsvpStatus, { label: string; className: string; icon: typeof Check }> = {
  attending: { label: "Coming", className: "bg-ink text-ivory", icon: Check },
  declined: { label: "Can't come", className: "bg-cream text-stone", icon: X },
  to_invite: { label: "To invite", className: "border border-linen text-stone", icon: Minus },
  pending: {
    label: "Invited",
    className: "border border-dashed border-champagne-400 text-champagne-600",
    icon: Minus,
  },
};

/** An answer as a small pill. `short` swaps the word for the event's name. */
export function Answer({ rsvp, event, short = false }: { rsvp?: Rsvp; event?: string; short?: boolean }) {
  if (!rsvp) {
    return <span className="text-xs text-stone">{short ? `${event} —` : "Not on the list"}</span>;
  }
  const a = ANSWER[rsvp.status];
  const Icon = a.icon;
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs ${a.className}`}
      title={event ? `${event}: ${a.label}` : a.label}
    >
      <Icon className="h-3 w-3" strokeWidth={2.4} aria-hidden />
      {short ? event : a.label}
    </span>
  );
}

/**
 * A role as a champagne pill: "Bridesmaid". White with a fine champagne edge:
 * a pale-gold fill came and went against the page's satin sheen, which runs
 * through almost the same shade.
 */
export function RolePill({ role }: { role: string }) {
  return (
    <span className="inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-full border border-champagne-400/50 bg-white px-2.5 text-xs font-medium text-champagne-600">
      {role}
    </span>
  );
}

/** A guest's roles as pills, plus "Child" — or nothing for a plain guest. */
export function RoleLabel({ guest, className = "" }: { guest: Contact; className?: string }) {
  const roles = rolesOf(guest);
  if (roles.length === 0 && !guest.is_child) return null;
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {roles.map((role) => (
        <RolePill key={role} role={role} />
      ))}
      {guest.is_child && <span className="type-meta">Child</span>}
    </span>
  );
}

const DETAIL_ICONS: Record<string, LucideIcon> = {
  Household: House,
  Phone,
  Email: Mail,
  "Meal choice": UtensilsCrossed,
  "Allergies & diet": WheatOff,
  Notes: PenLine,
  Child: Baby,
};

/** A detail's label with its small icon — phone for Phone, knife and fork for Meal choice. */
export function DetailLabel({ label }: { label: string }) {
  const Icon = DETAIL_ICONS[label];
  return (
    <span className="flex items-start gap-2">
      {Icon && <Icon aria-hidden className="mt-px h-3.5 w-3.5 shrink-0 text-stone/80" strokeWidth={1.7} />}
      <span>{label}</span>
    </span>
  );
}
