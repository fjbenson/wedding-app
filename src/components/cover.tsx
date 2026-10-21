import Link from "next/link";
import { Settings } from "lucide-react";
import Hub, { type HubArea } from "@/components/hub";
import { coupleName } from "@/lib/couple-name";
import { formatFullDotDate, formatLongDate } from "@/lib/dates";

/**
 * The top of the home screen: the couple's names set like Editorial's
 * byline, and the hub ring sitting straight on the ivory page.
 *
 * On a laptop (canvas 4 "Laptop · Round 7", G, 20 Oct 2026; the ring made
 * bigger and its buttons showing each area's stage in Round 8, C, 21 Oct) it
 * is centred in the page beside the sidebar: the date as a small label, the
 * names on one line, then the ring large under them. Ask Juno and Settings
 * are in the sidebar there.
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
  const [first, ...rest] = coupleName(name).split(" & ");
  return (
    <section className="relative px-5 pt-[max(0.5rem,env(safe-area-inset-top))] lg:flex lg:flex-col lg:items-center lg:px-0 lg:pt-0">
      <div className="flex justify-end text-ink lg:hidden">
        <Link href="/settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center">
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />
        </Link>
      </div>

      <header className="text-center">
        <p className="label lg:hidden">The wedding of</p>
        {weddingDate && <p className="label hidden lg:block">{formatLongDate(weddingDate)}</p>}
        <h1 className="type-display mt-1.5 text-[40px] md:text-5xl lg:mt-2.5 lg:text-[60px] lg:leading-none lg:tracking-[-0.03em]">
          {/* One line on both; on a laptop the & in gold. */}
          <span className="lg:hidden">{coupleName(name)}</span>
          <span className="hidden lg:inline">
            {first}
            {rest.length > 0 && (
              <>
                {" "}
                <span className="text-champagne-600">&amp;</span> {rest.join(" & ")}
              </>
            )}
          </span>
        </h1>
        {weddingDate && (
          <p className="mt-2 flex items-center justify-center gap-3 text-xs font-medium tracking-[0.3em] text-stone lg:hidden">
            <span aria-hidden className="h-px w-8 bg-champagne-400" />
            {formatFullDotDate(weddingDate)}
            <span aria-hidden className="h-px w-8 bg-champagne-400" />
          </p>
        )}
      </header>

      <div className="mx-auto mb-8 mt-4 w-[min(100%,350px)] md:mt-6 md:w-[440px] lg:mb-0 lg:mt-2 lg:w-[min(100%,calc(100dvh-190px),900px)]">
        <Hub weddingDate={weddingDate} areas={areas} />
      </div>
    </section>
  );
}
