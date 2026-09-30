import { Plus } from "lucide-react";
import { areaIcon } from "@/lib/areas";

export interface HubArea {
  key: string;
  label: string;
}
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

/** White text on the cover needs a soft shadow to stay readable. */
const ON_PHOTO = "text-white [text-shadow:0_2px_16px_rgb(30_20_10/0.45)]";

/** The same for the white icons on the glass buttons. */
const ICON_SHADOW = "drop-shadow-[0_1px_2px_rgb(60_40_10/0.4)]";

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
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.3em]">
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
export default function Hub({
  weddingDate,
  areas,
}: {
  weddingDate: string | null;
  areas: HubArea[];
}) {
  const total = areas.length + 1; // + the "add an area" node

  return (
    <div className="relative aspect-square w-full">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-white/85 shadow-[0_0_0_1px_rgb(30_27_24/0.14),inset_0_0_0_1px_rgb(30_27_24/0.14)]"
      />

      <div className="absolute left-1/2 top-1/2 w-[60%] -translate-x-1/2 -translate-y-1/2 text-center">
        <Countdown weddingDate={weddingDate} />
      </div>

      {/* Each area's own page (the plan's screen 5) comes in the next release,
          so for now the dots show the shape of the wedding but don't open. */}
      {areas.map((area, index) => {
        const Icon = areaIcon(area.key);
        return (
          <div
            key={area.key}
            style={nodePosition(index, total)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <span
              title={`${area.label} — its page is coming soon`}
              aria-label={`${area.label}, coming soon`}
              className="glass flex h-11 w-11 items-center justify-center rounded-full text-white"
            >
              <Icon className={`h-[18px] w-[18px] ${ICON_SHADOW}`} strokeWidth={1.8} aria-hidden />
            </span>
          </div>
        );
      })}

      <div
        style={nodePosition(areas.length, total)}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <span
          title="Add an area — coming soon"
          aria-label="Add an area, coming soon"
          className="glass flex h-11 w-11 items-center justify-center rounded-full border-dashed text-white"
        >
          <Plus className={`h-[18px] w-[18px] ${ICON_SHADOW}`} strokeWidth={1.8} aria-hidden />
        </span>
      </div>
    </div>
  );
}
