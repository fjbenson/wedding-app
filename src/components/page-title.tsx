import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Each tab's line drawing, in the app's gold (canvas 2, "Tab titles · The
 * set", 11 Oct 2026). No longer on the tab titles (owner, 16 Oct 2026: out
 * of place in a modern app); kept for `TabDrawing` where a heading still
 * uses one.
 */
const DRAWINGS = {
  guests: { src: "/illustrations/quill-and-scroll.png", width: 622, height: 512 },
  suppliers: { src: "/illustrations/cards-and-bow.png", width: 707, height: 352 },
  plan: { src: "/illustrations/diary-and-ribbon.png", width: 690, height: 490 },
  money: { src: "/illustrations/coin-purse.png", width: 673, height: 476 },
  day: { src: "/illustrations/pocket-watch.png", width: 658, height: 433 },
} as const;

export type Drawing = keyof typeof DRAWINGS;

/** Just the drawing. Decoration only. */
export function TabDrawing({ drawing, className }: { drawing: Drawing; className: string }) {
  const { src, width, height } = DRAWINGS[drawing];
  return <Image src={src} alt="" aria-hidden width={width} height={height} className={className} />;
}

/**
 * A tab's title (canvas 3 "Tab tops · Round 1", option A, owner's pick 16
 * Oct 2026): one row with the view switch (`CornerSwitch`, which floats
 * right just before it), no drawing, no back arrow. It makes its own block
 * beside the switch, so a long title wraps beside it rather than under it,
 * and drops below it only when there's no room at all. `drawing` is no
 * longer drawn; `className` styles the heading.
 */
export default function PageTitle({
  className,
  spacing = "",
  children,
}: {
  drawing?: Drawing;
  className: string;
  spacing?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-h-10 items-center ${spacing}`}>
      <h1 className={`min-w-0 ${className}`}>{children}</h1>
    </div>
  );
}
