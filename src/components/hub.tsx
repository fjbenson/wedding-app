import Link from "next/link";
import { Plus } from "lucide-react";
import { AREAS } from "@/lib/areas";
import { daysUntil, formatDotDate } from "@/lib/dates";

/** How far the nodes sit from the middle, as a share of the box's width. */
const RING_RADIUS = 0.43;

function nodePosition(index: number, total: number) {
  // Start at the top and go clockwise.
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    left: `${50 + RING_RADIUS * 100 * Math.cos(angle)}%`,
    top: `${50 + RING_RADIUS * 100 * Math.sin(angle)}%`,
  };
}

/** White text on the photo needs a soft shadow to stay readable. */
const ON_PHOTO = "text-white [text-shadow:0_2px_16px_rgb(30_20_10/0.45)]";

function Countdown({ weddingDate }: { weddingDate: string | null }) {
  if (!weddingDate) {
    return <p className={`font-display text-2xl ${ON_PHOTO}`}>No date yet</p>;
  }

  const days = daysUntil(weddingDate);
  const big = days > 1 ? String(days) : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Married";

  return (
    <div className={ON_PHOTO}>
      <p
        className={`font-display font-light leading-[0.85] tracking-[-0.05em] ${
          days > 1 ? "text-7xl" : "text-4xl"
        }`}
      >
        {big}
      </p>
      {days > 1 && (
        <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.3em]">
          Days until {formatDotDate(weddingDate)}
        </p>
      )}
    </div>
  );
}

/**
 * The hub ring: the countdown in the middle, the wedding's areas as glass
 * buttons around it, and a dashed + to add another area.
 *
 * No disc behind it — the ring floats straight on the cover. Its line has a
 * light edge and a dark edge so one always shows.
 */
export default function Hub({ weddingDate }: { weddingDate: string | null }) {
  const total = AREAS.length + 1; // + the "add an area" node

  return (
    <div className="relative aspect-square w-full">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-white/85 shadow-[0_0_0_1px_rgb(30_27_24/0.14),inset_0_0_0_1px_rgb(30_27_24/0.14)]"
      />

      <div className="absolute left-1/2 top-1/2 w-[60%] -translate-x-1/2 -translate-y-1/2 text-center">
        <Countdown weddingDate={weddingDate} />
      </div>

      {AREAS.map((area, index) => {
        const Icon = area.icon;
        // Icons are ink: on the sample golden cover, ink reads at ~7.6:1
        // against the glass and white at ~2.2:1. Once couples add their own
        // photo this should be chosen from the photo's brightness.
        const node = (
          <span
            className={`glass flex h-11 w-11 items-center justify-center rounded-full text-ink transition ${
              area.href ? "active:scale-95" : ""
            }`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </span>
        );

        return (
          <div
            key={area.id}
            style={nodePosition(index, total)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            {area.href ? (
              <Link href={area.href} aria-label={area.label}>
                {node}
              </Link>
            ) : (
              <span title={`${area.label} — coming soon`} aria-label={`${area.label}, coming soon`}>
                {node}
              </span>
            )}
          </div>
        );
      })}

      <div
        style={nodePosition(AREAS.length, total)}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <span
          title="Add an area — coming soon"
          aria-label="Add an area, coming soon"
          className="glass flex h-11 w-11 items-center justify-center rounded-full border-dashed text-ink"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </span>
      </div>
    </div>
  );
}
