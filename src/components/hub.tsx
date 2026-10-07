import Link from "next/link";
import { Plus } from "lucide-react";
import { areaIcon } from "@/lib/areas";

export interface HubArea {
  key: string;
  label: string;
}
import { daysUntil } from "@/lib/dates";

/** How far the nodes sit from the middle, as a share of the box's width. */
const RING_RADIUS = 0.39;

function nodePosition(index: number, total: number) {
  // Start at the top and go clockwise.
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    left: `${50 + RING_RADIUS * 100 * Math.cos(angle)}%`,
    top: `${50 + RING_RADIUS * 100 * Math.sin(angle)}%`,
  };
}

/** The countdown, set like Editorial's cover number. */
function Countdown({ weddingDate }: { weddingDate: string | null }) {
  if (!weddingDate) {
    return <p className="font-display text-xl font-light text-ink">No date yet</p>;
  }

  const days = daysUntil(weddingDate);
  const big = days > 1 ? String(days) : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Married";

  return (
    <div>
      <p
        className={`font-display font-light leading-[0.8] tracking-[-0.05em] text-ink ${
          days > 1 ? "text-[min(68px,18vw)] md:text-[84px]" : "text-2xl tracking-[-0.02em] md:text-3xl"
        }`}
      >
        {big}
      </p>
      {days > 1 && (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.24em] text-stone">Days to go</p>
      )}
    </div>
  );
}

/**
 * The hub ring: the countdown on a white disc in the middle, the wedding's
 * areas as white buttons around it with their names beneath, and a dashed +
 * to add another area.
 *
 * A solid pale circle sits behind the buttons (Round 15 on the design
 * canvas): it grounds the ring without a card around it.
 */
export default function Hub({
  weddingDate,
  areas,
}: {
  weddingDate: string | null;
  areas: HubArea[];
}) {
  const total = areas.length + 1; // + the "add an area" node
  // Past nine buttons, the buttons shrink and their names tighten up on a
  // phone so they still fit. On the narrowest phones (under 360px) there's
  // no room for names at all; the buttons keep them for screen readers.
  const crowded = total > 9;
  const button = crowded ? "h-10 w-10 md:h-[46px] md:w-[46px]" : "h-[46px] w-[46px]";
  const icon = crowded ? "h-[17px] w-[17px] md:h-[19px] md:w-[19px]" : "h-[19px] w-[19px]";

  return (
    <div className="relative aspect-square w-full">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linen/70"
      />

      <div className="absolute left-1/2 top-1/2 flex aspect-square w-[44%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-center shadow-[0_16px_40px_-18px_rgb(60_50_40/0.5)]">
        <Countdown weddingDate={weddingDate} />
      </div>

      {/* Each button opens its area's page (screen 5). */}
      {areas.map((area, index) => {
        const Icon = areaIcon(area.key);
        return (
          <Node key={area.key} position={nodePosition(index, total)} href={`/area/${encodeURIComponent(area.key)}`} label={area.label} crowded={crowded}>
            <span className={`flex ${button} items-center justify-center rounded-full bg-white text-ink shadow-[0_2px_8px_rgb(60_50_40/0.1)]`}>
              <Icon className={icon} strokeWidth={1.5} aria-hidden />
            </span>
          </Node>
        );
      })}

      <Node position={nodePosition(areas.length, total)} href="/area/new" label="Add" ariaLabel="Add an area" crowded={crowded}>
        <span className={`flex ${button} items-center justify-center rounded-full border border-dashed border-champagne-400 bg-white/60 text-champagne-600`}>
          <Plus className={icon} strokeWidth={1.5} aria-hidden />
        </span>
      </Node>
    </div>
  );
}

/** A button on the ring, centred on its spot, with its name in small capitals below. */
function Node({
  position,
  href,
  label,
  ariaLabel = label,
  crowded,
  children,
}: {
  position: { left: string; top: string };
  href: string;
  label: string;
  ariaLabel?: string;
  crowded: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={position}
      aria-label={ariaLabel}
      className={`absolute flex -translate-x-1/2 flex-col items-center transition active:scale-95 ${
        crowded ? "w-[72px] -translate-y-5 gap-1 md:w-[84px] md:-translate-y-[23px] md:gap-1.5" : "w-[84px] -translate-y-[23px] gap-1.5"
      }`}
    >
      {children}
      <span aria-hidden className={`text-center text-xs font-medium uppercase leading-tight text-stone max-[359px]:hidden ${
          crowded ? "tracking-[0.04em] md:tracking-[0.12em]" : "tracking-[0.12em]"
        }`}>
        {label}
      </span>
    </Link>
  );
}
