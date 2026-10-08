import { Check, Minus, X } from "lucide-react";
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
  pending: {
    label: "Waiting",
    className: "border border-dashed border-champagne-400 text-champagne-600",
    icon: Minus,
  },
};

/** An answer as a small pill. `short` swaps the word for the event's name. */
export function Answer({ rsvp, event, short = false }: { rsvp?: Rsvp; event?: string; short?: boolean }) {
  if (!rsvp) {
    return <span className="text-xs text-stone">{short ? `${event} —` : "Not invited"}</span>;
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

const DOT: Record<RsvpStatus | "none", { className: string; word: string }> = {
  attending: { className: "bg-ink", word: "coming" },
  pending: { className: "border-[1.5px] border-dashed border-champagne-400", word: "waiting" },
  declined: { className: "bg-[#D8D0C4]", word: "can't come" },
  none: { className: "border border-linen", word: "not invited" },
};

/** One event's answer as a dot: filled = coming, dashed = waiting, grey = can't. */
export function AnswerDot({ status }: { status?: RsvpStatus }) {
  return <span aria-hidden className={`block h-3.5 w-3.5 shrink-0 rounded-full ${DOT[status ?? "none"].className}`} />;
}

export function answerWord(status?: RsvpStatus) {
  return DOT[status ?? "none"].word;
}

/** The key under the list, so the dots explain themselves. */
export function DotKey() {
  return (
    <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-stone">
      <span className="flex items-center gap-1.5"><AnswerDot status="attending" />Coming</span>
      <span className="flex items-center gap-1.5"><AnswerDot status="pending" />Waiting</span>
      <span className="flex items-center gap-1.5"><AnswerDot status="declined" />Can&apos;t come</span>
      <span className="flex items-center gap-1.5"><AnswerDot />Not invited</span>
    </p>
  );
}

/** A role as a champagne pill: "Bridesmaid". */
export function RolePill({ role }: { role: string }) {
  return (
    <span className="inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-full bg-champagne-100 px-2.5 text-xs font-medium text-champagne-600">
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
