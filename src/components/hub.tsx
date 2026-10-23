import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import { areaIcon } from "@/lib/areas";

import { daysUntil } from "@/lib/dates";
import { STAGES } from "@/lib/area-stage";

export interface HubArea {
  key: string;
  label: string;
  icon?: string | null;
  /**
   * How many of the five stages are done (0–5), for how the laptop's button
   * looks; undefined for areas without stages (Decor, Stationery).
   */
  stage?: number;
}

/** How far the nodes sit from the middle, as a share of the box's width. */
const RING_RADIUS = 0.39;

/**
 * What's been reached, in the past tense (owner, 21 Oct 2026: nouns suit the
 * area page, where you're inside a stage; here it's what's done). Said on
 * hover and to screen readers; the button's look shows it. By stages done.
 */
const DONE_WORDS = ["Not started", "Ideas", "Quoted", "Booked", "Paid", "Ready"] as const;

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
          days > 1 ? "text-[min(68px,18vw)] md:text-[84px] lg:text-[clamp(84px,17cqw,132px)]" : "text-2xl tracking-[-0.02em] md:text-3xl"
        }`}
      >
        {big}
      </p>
      {/* "Days to go ›" — the › says the disc opens Where things stand (owner,
          16 Oct 2026, in place of a "How it's going ›" line under it). */}
      <p className="mt-3 flex items-center justify-center gap-0.5 text-xs font-medium uppercase tracking-[0.24em] text-stone">
        {days > 1 && "Days to go"}
        <ChevronRight className="h-3.5 w-3.5 text-champagne-600" strokeWidth={2} aria-hidden />
      </p>
    </div>
  );
}

/**
 * The hub ring: the countdown on a white disc in the middle, the wedding's
 * areas as white buttons around it, and a dashed + to add another area.
 * From tablet width up each button has its name beneath; on phones there
 * isn't room, so it's icons only (the owner's call, 7 Oct 2026).
 *
 * A champagne circle sits behind the buttons (Round 15 on the design
 * canvas): it grounds the ring without a card around it. The circle, the
 * middle disc and the buttons are all frosted glass over the satin page.
 */
export default function Hub({
  weddingDate,
  areas,
}: {
  weddingDate: string | null;
  areas: HubArea[];
}) {
  const total = areas.length + 1; // + the "add an area" node

  return (
    // On a laptop the ring grows with the screen (owner, 21 Oct 2026: it
    // looked small on a big monitor), and its buttons, names and countdown
    // grow with it: sizes there are shares of the ring's width (cqw).
    <div className="relative aspect-square w-full [--disc:46px] lg:[--disc:clamp(46px,8.5cqw,66px)] lg:[container-type:inline-size]">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E6D5BA]/75 shadow-[inset_0_0_28px_rgb(255_255_255/0.3),0_20px_50px_-28px_rgb(90_65_35/0.45)] backdrop-blur-md lg:w-[78%] lg:border lg:border-champagne-400/40 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none"
      />

      {/* The heart of the ring opens Where things stand (owner, 13 Oct 2026). */}
      <Link
        href="/standing"
        className="absolute left-1/2 top-1/2 flex aspect-square w-[44%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/90 bg-white/70 text-center shadow-[inset_0_2px_0_rgb(255_255_255/0.9),0_16px_40px_-18px_rgb(60_50_40/0.5)] backdrop-blur-xl transition active:scale-[0.98]"
      >
        <Countdown weddingDate={weddingDate} />
        <span className="sr-only">How it&apos;s going</span>
      </Link>

      {/* Each button opens its area's page (screen 5). */}
      {areas.map((area, index) => {
        const Icon = areaIcon(area.key, area.icon);
        return (
          <Node key={area.key} position={nodePosition(index, total)} href={`/area/${encodeURIComponent(area.key)}`} label={area.label} stage={area.stage}>
            <span className={`relative flex h-[var(--disc)] w-[var(--disc)] items-center justify-center rounded-full border border-white/90 bg-white/65 text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_4px_12px_-4px_rgb(60_50_40/0.2)] backdrop-blur-md lg:shadow-none lg:backdrop-blur-none ${laptopDisc(area.stage)}`}>
              <Icon className="h-[calc(var(--disc)*0.41)] w-[calc(var(--disc)*0.41)] lg:stroke-[1.25]" strokeWidth={1.5} aria-hidden />
              {area.stage === STAGES.length && <ReadyTick />}
            </span>
          </Node>
        );
      })}

      <Node position={nodePosition(areas.length, total)} href="/area/new" label="Add" ariaLabel="Add an area">
        <span className="flex h-[var(--disc)] w-[var(--disc)] items-center justify-center rounded-full border border-dashed border-champagne-400 bg-white/45 text-champagne-600 backdrop-blur-md">
          <Plus className="h-[calc(var(--disc)*0.41)] w-[calc(var(--disc)*0.41)]" strokeWidth={1.5} aria-hidden />
        </span>
      </Node>
    </div>
  );
}

/** A button on the ring, centred on its spot, with its name below from tablet width up. */
function Node({
  position,
  href,
  label,
  ariaLabel = label,
  stage,
  children,
}: {
  position: { left: string; top: string };
  href: string;
  label: string;
  ariaLabel?: string;
  stage?: number;
  children: React.ReactNode;
}) {
  const stageName = stage === undefined ? null : DONE_WORDS[Math.min(stage, STAGES.length)];
  return (
    <Link
      href={href}
      style={position}
      title={stageName ? `${label} · ${stageName}` : label}
      aria-label={stageName ? `${ariaLabel}: ${stageName}` : ariaLabel}
      className="absolute flex w-[84px] -translate-x-1/2 -translate-y-[calc(var(--disc)/2)] flex-col items-center gap-1.5 transition active:scale-95 lg:w-[clamp(120px,21cqw,160px)] lg:gap-0"
    >
      <span className="relative lg:mb-2.5">{children}</span>
      {/* Small grey capitals (21 Oct 2026: big black names made the ring heavy). */}
      <span aria-hidden className={`hidden text-center text-xs font-medium uppercase leading-tight tracking-[0.12em] text-stone md:block lg:text-[clamp(12px,1.8cqw,14px)] lg:tracking-[0.16em] ${stage === 0 ? "lg:text-stone/75" : ""}`}>
        {label}
      </span>
    </Link>
  );
}

/**
 * On a laptop the button itself says where its area stands, in three soft
 * steps (canvas 4 "Laptop · Round 15", E1, owner's pick 23 Oct 2026, in place
 * of the five dots): not started a faint dashed circle, under way plain
 * ivory, ready pale champagne with a small gold tick. The area page keeps
 * all five stages; hover says which.
 */
function laptopDisc(stage: number | undefined) {
  if (stage === 0) return "lg:border-dashed lg:border-champagne-400/55 lg:bg-[#FBF6EE]/60 lg:text-stone/80";
  if (stage === STAGES.length) return "lg:border-champagne-400/35 lg:bg-[#F3E8D4] lg:text-champagne-600";
  return "lg:border-[#CDB78E]/55 lg:bg-[#FFFDF8]";
}

/** The ready mark, on the button's top right corner (laptop only). */
function ReadyTick() {
  return (
    <span aria-hidden className="absolute -right-0.5 -top-0.5 hidden h-[17px] w-[17px] items-center justify-center rounded-full bg-champagne-400 shadow-[0_0_0_2px_#FBF6EE] lg:flex">
      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
    </span>
  );
}
