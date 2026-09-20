import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type {
  ContactType,
  MilestoneStatus,
  RsvpStatus,
  SupplierStatus,
} from "@/types/db";

export type BadgeTone = "neutral" | "rose" | "sage" | "gold" | "clay" | "plum";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sand-100 text-sand-700 ring-sand-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  sage: "bg-sage-50 text-sage-700 ring-sage-200",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  clay: "bg-clay-50 text-clay-700 ring-clay-200",
  plum: "bg-plum-50 text-plum-700 ring-plum-200",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * The status words the database uses, turned into something readable and
 * consistently coloured.
 *
 * Keeping these maps here means "attending" is the same green everywhere it
 * appears, and renaming a label is a one-line change.
 */
const rsvpLabels: Record<RsvpStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Awaiting reply", tone: "gold" },
  attending: { label: "Attending", tone: "sage" },
  declined: { label: "Can't make it", tone: "clay" },
};

const milestoneLabels: Record<
  MilestoneStatus,
  { label: string; tone: BadgeTone }
> = {
  todo: { label: "To do", tone: "neutral" },
  in_progress: { label: "In progress", tone: "gold" },
  done: { label: "Done", tone: "sage" },
  skipped: { label: "Skipped", tone: "neutral" },
};

const supplierLabels: Record<
  SupplierStatus,
  { label: string; tone: BadgeTone }
> = {
  researching: { label: "Researching", tone: "neutral" },
  enquired: { label: "Enquired", tone: "gold" },
  booked: { label: "Booked", tone: "sage" },
  cancelled: { label: "Cancelled", tone: "clay" },
};

const contactTypeLabels: Record<
  ContactType,
  { label: string; tone: BadgeTone }
> = {
  guest: { label: "Guest", tone: "rose" },
  supplier: { label: "Supplier", tone: "plum" },
  bridal_party: { label: "Bridal party", tone: "gold" },
  venue: { label: "Venue", tone: "sage" },
};

export function RsvpBadge({ status }: { status: RsvpStatus }) {
  const { label, tone } = rsvpLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  const { label, tone } = milestoneLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function SupplierBadge({ status }: { status: SupplierStatus }) {
  const { label, tone } = supplierLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ContactTypeBadge({ type }: { type: ContactType }) {
  const { label, tone } = contactTypeLabels[type];
  return <Badge tone={tone}>{label}</Badge>;
}
