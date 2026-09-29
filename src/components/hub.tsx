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
    return <p className="text-sm text-stone">No date set yet</p>;
  }

  const days = daysUntil(weddingDate);

  if (days > 1) {
    return (
      <>
        <p className="font-display text-6xl font-light leading-none tracking-tight text-ink">
          {days}
        </p>
        <p className="label mt-2">days to go</p>
      </>
    );
  }

  return (
    <p className="font-display text-3xl font-light leading-tight text-ink">
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
        {/* The countdown — no disc behind it, it sits straight on the page */}
        <div className="absolute left-1/2 top-1/2 flex w-[46%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
          <Countdown weddingDate={weddingDate} />
        </div>

        {/* The ring the dots sit on: a light edge and a dark edge, so one
            always shows whether it's on ivory or a photo */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 aspect-square w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-white/85 shadow-[0_0_0_1px_rgb(30_27_24/0.14),inset_0_0_0_1px_rgb(30_27_24/0.14)]"
        />

        {/* The dots */}
        {AREAS.map((area, index) => {
          const Icon = area.icon;
          const position = dotPosition(index, AREAS.length);

          const content = (
            <>
              <span
                className={`glass flex aspect-square w-12 items-center justify-center rounded-full text-ink transition ${
                  area.href ? "hover:bg-cream" : "opacity-50"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="mt-1.5 block text-[11px] text-stone">
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
        <h1 className="text-3xl italic text-ink">{name}</h1>
        {weddingDate && (
          <p className="mt-1 text-sm text-stone">{formatLongDate(weddingDate)}</p>
        )}
      </div>
    </div>
  );
}
