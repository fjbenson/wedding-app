import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Each tab's line drawing, in the app's gold (canvas 2, "Tab titles · The
 * set", 11 Oct 2026). Made with Canva's image tool and cut out; sharp vector
 * versions are a to-do. Width and height are the files' own pixel sizes.
 */
const DRAWINGS = {
  guests: { src: "/illustrations/quill-and-scroll.png", width: 622, height: 512 },
  suppliers: { src: "/illustrations/cards-and-bow.png", width: 707, height: 352 },
  plan: { src: "/illustrations/diary-and-ribbon.png", width: 690, height: 490 },
  money: { src: "/illustrations/coin-purse.png", width: 673, height: 476 },
  day: { src: "/illustrations/pocket-watch.png", width: 658, height: 433 },
} as const;

export type Drawing = keyof typeof DRAWINGS;

/**
 * A tab's title with its drawing at the end of the same row. The drawing is
 * decoration only, so screen readers skip it, and it hides on the narrowest
 * phones (under 370px), where it would push the title onto more lines.
 * `className` styles the heading itself, so each screen keeps its own type;
 * `spacing` is the row's margin (the gap above it on that screen).
 */
export default function PageTitle({
  drawing,
  className,
  spacing = "",
  children,
}: {
  drawing: Drawing;
  className: string;
  spacing?: string;
  children: ReactNode;
}) {
  const { src, width, height } = DRAWINGS[drawing];
  return (
    <div className={`flex items-center justify-between gap-3 ${spacing}`}>
      <h1 className={`min-w-0 ${className}`}>{children}</h1>
      <Image
        src={src}
        alt=""
        aria-hidden
        width={width}
        height={height}
        priority
        className="-my-4 hidden h-auto max-h-[84px] w-[92px] shrink-0 object-contain min-[370px]:block sm:w-[120px]"
      />
    </div>
  );
}
