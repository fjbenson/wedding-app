import Link from "next/link";
import { CalendarDays, ChevronRight, Mail, Users, type LucideIcon } from "lucide-react";
import type { Milestone } from "@/types/db";

interface Section {
  label: string;
  detail: string;
  icon: LucideIcon;
  href: string | null; // null until that screen exists
}

/** The main parts of the app as big, plain buttons. */
export default function SectionLinks({
  guestCount,
  milestones,
}: {
  guestCount: number;
  milestones: Milestone[];
}) {
  const done = milestones.filter((m) => m.status === "done").length;

  const sections: Section[] = [
    {
      label: "Guests",
      detail: guestCount === 1 ? "1 guest" : `${guestCount} guests`,
      icon: Users,
      href: "/guests",
    },
    {
      label: "Timeline",
      detail: milestones.length === 0 ? "Nothing planned yet" : `${done} of ${milestones.length} done`,
      icon: CalendarDays,
      href: "/timeline",
    },
    { label: "RSVPs", detail: "Coming soon", icon: Mail, href: null },
  ];

  return (
    <nav aria-label="Sections" className="mt-8 grid gap-3 sm:grid-cols-3">
      {sections.map((section) => {
        const Icon = section.icon;
        const body = (
          <>
            <Icon className="h-5 w-5 shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
            <span className="flex-1">
              <span className="block text-lg text-ink">{section.label}</span>
              <span className="block text-sm text-stone">{section.detail}</span>
            </span>
            {section.href && (
              <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
            )}
          </>
        );
        const className =
          "flex min-h-16 items-center gap-4 rounded-2xl border border-linen bg-white px-5 py-4";

        return section.href ? (
          <Link key={section.label} href={section.href} className={`${className} hover:border-champagne-400`}>
            {body}
          </Link>
        ) : (
          <div key={section.label} className={`${className} opacity-50`}>
            {body}
          </div>
        );
      })}
    </nav>
  );
}
