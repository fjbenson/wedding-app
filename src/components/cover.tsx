import Link from "next/link";
import { Inbox, PenLine, Settings } from "lucide-react";
import Hub, { type HubArea } from "@/components/hub";
import { formatFullDotDate } from "@/lib/dates";

/**
 * The top of the home screen: the couple's names set like Editorial's
 * byline, and the hub ring sitting straight on the ivory page.
 *
 * On a desktop it fills the left of the screen, beside the "coming up" list.
 */
export default function Cover({
  name,
  weddingDate,
  areas,
}: {
  name: string;
  weddingDate: string | null;
  areas: HubArea[];
}) {
  return (
    <section className="relative px-5 pt-[max(0.5rem,env(safe-area-inset-top))] lg:flex lg:flex-col lg:justify-center lg:px-0 lg:pt-0">
      <div className="flex justify-end text-ink lg:absolute lg:right-0 lg:top-0">
        <Link href="/capture?from=/" aria-label="Capture something" className="flex h-11 w-11 items-center justify-center">
          <PenLine className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />
        </Link>
        <Link href="/inbox" aria-label="Inbox" className="flex h-11 w-11 items-center justify-center">
          <Inbox className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />
        </Link>
        <Link href="/settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center">
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />
        </Link>
      </div>

      <header className="text-center">
        <p className="label tracking-[0.3em]">The wedding of</p>
        <h1 className="mt-1.5 font-display text-[40px] font-light italic leading-[1.1] tracking-[-0.01em] text-ink md:text-5xl">
          {name}
        </h1>
        {weddingDate && (
          <p className="mt-2 flex items-center justify-center gap-3 text-xs font-medium tracking-[0.3em] text-stone">
            <span aria-hidden className="h-px w-8 bg-champagne-400" />
            {formatFullDotDate(weddingDate)}
            <span aria-hidden className="h-px w-8 bg-champagne-400" />
          </p>
        )}
      </header>

      <div className="mx-auto mb-8 mt-4 w-[min(100%,350px)] md:mt-6 md:w-[440px] lg:w-[min(85%,500px)]">
        <Hub weddingDate={weddingDate} areas={areas} />
      </div>
    </section>
  );
}
