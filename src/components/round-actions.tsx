import type { LucideIcon } from "lucide-react";

/**
 * Text · Call · Email as round buttons with their word underneath: the
 * household card's version, which the owner picked as the best (17 Oct 2026)
 * and wanted on every card — a guest's, a group's, a supplier's. The first
 * (main) one is filled with ink, the others outlined. A missing one (no
 * phone, no email) is a faded dashed circle that goes to where it's typed in
 * (owner, 19 Oct 2026: on every card, like the supplier's).
 */
export function RoundActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 flex justify-center gap-8">{children}</div>;
}

export function RoundAction({
  label,
  icon: Icon,
  href,
  onClick,
  dark = false,
  disabled = false,
  missing = false,
}: {
  label: string;
  icon: LucideIcon;
  /** A link (call, text, email), or leave it out and pass `onClick`. */
  href?: string;
  onClick?: () => void;
  /** The main one: filled with ink. */
  dark?: boolean;
  disabled?: boolean;
  /** Nothing to call or write to yet: faded and dashed; `onClick` goes to the box to add it. */
  missing?: boolean;
}) {
  const circle = `flex h-[52px] w-[52px] items-center justify-center rounded-full ${
    missing
      ? "border border-dashed border-stone/30 text-stone/40"
      : dark
        ? "bg-ink text-ivory"
        : "border border-linen bg-white text-ink hover:border-champagne-400"
  }`;
  const face = (
    <>
      <span className={circle}>
        <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
      </span>
      {label}
    </>
  );
  const look = `flex flex-col items-center gap-1.5 text-[13px] ${missing ? "text-stone/60" : "text-ink"}`;
  if (href && !disabled && !missing) {
    return (
      <a href={href} className={look}>
        {face}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${look} disabled:opacity-40`}>
      {face}
    </button>
  );
}
