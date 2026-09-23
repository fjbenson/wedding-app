import Link from "next/link";
import { AREAS } from "@/lib/areas";
import { daysUntil, formatLongDate } from "@/lib/dates";

/**
 * How far the dots sit from the middle, as a share of the ring's width.
 *
 * Capped so a dot and its label stay inside the box: the label is 4rem wide,
 * so anything past ~0.40 clips the ones at three and nine o'clock.
 */
const DOT_RADIUS = 0.38;

function dotPosition(index: number, total: number) {
  // Start at the top and go clockwise.
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    left: `${50 + DOT_RADIUS * 100 * Math.cos(angle)}%`,
    top: `${50 + DOT_RADIUS * 100 * Math.sin(angle)}%`,
  };
}

function Countdown({ weddingDate }: { weddingDate: string | null }) {
  if (!weddingDate) {
    return <p className="text-sm text-muted">No date set yet</p>;
  }

  const days = daysUntil(weddingDate);

  if (days > 1) {
    return (
      <>
        <p className="font-display text-5xl leading-none text-rose-500">{days}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
          days to go
        </p>
      </>
    );
  }

  return (
    <p className="font-display text-3xl leading-tight text-rose-500">
      {days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Married"}
    </p>
  );
}

/**
 * The hub: the wedding in the middle, its areas as dots around the outside.
 *
 * Dots are icons, not progress rings — an icon is honest before there's any
 * data to measure.
 */
export default function Hub({
  name,
  weddingDate,
}: {
  name: string;
  weddingDate: string | null;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative mx-auto aspect-square w-full">
        {/* The orb */}
        <div className="absolute left-1/2 top-1/2 flex aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-rose-100 text-center shadow-[0_0_60px_-15px_rgba(203,112,90,0.45)] ring-1 ring-rose-200/60">
          <Countdown weddingDate={weddingDate} />
        </div>

        {/* The ring the dots sit on */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 aspect-square w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-rose-200"
        />

        {/* The dots */}
        {AREAS.map((area, index) => {
          const Icon = area.icon;
          const position = dotPosition(index, AREAS.length);

          const content = (
            <>
              <span
                className={`flex aspect-square w-12 items-center justify-center rounded-full border transition ${
                  area.href
                    ? "border-rose-200 bg-card text-rose-500 shadow-sm hover:border-rose-300 hover:bg-rose-50"
                    : "border-rose-100 bg-card/70 text-muted/70"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="mt-1.5 block text-[11px] text-muted">
                {area.label}
              </span>
            </>
          );

          return (
            <div
              key={area.id}
              style={position}
              className="absolute w-16 -translate-x-1/2 -translate-y-1/2 text-center"
            >
              {area.href ? (
                <Link href={area.href} className="block">
                  {content}
                </Link>
              ) : (
                <span
                  className="block cursor-default"
                  title={`${area.label} — not built yet`}
                >
                  {content}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-center">
        <h1 className="text-3xl text-ink">{name}</h1>
        {weddingDate && (
          <p className="mt-1 text-sm text-muted">{formatLongDate(weddingDate)}</p>
        )}
      </div>
    </div>
  );
}
