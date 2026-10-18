import Link from "next/link";
import { Settings } from "lucide-react";
import Hub, { type HubArea } from "@/components/hub";
import { coupleName } from "@/lib/couple-name";
import { formatFullDotDate } from "@/lib/dates";

/**
 * The top of the home screen: the couple's names set like Editorial's
 * byline, and the hub ring sitting straight on the ivory page.
 *
 * On a laptop (canvas 3 "Laptop · Round 2", 3 with the names on the left,
 * owner's pick 18 Oct 2026) the names are set large on the left with the date
 * and `aside` (the assistant's pill) under them, and the ring is the star on
 * the right. Settings is in the top bar there.
 */
export default function Cover({
  name,
  weddingDate,
  areas,
  aside,
}: {
  name: string;
  weddingDate: string | null;
  areas: HubArea[];
  aside?: React.ReactNode;
}) {
  const [first, ...rest] = coupleName(name).split(" & ");
  return (
    <section className="relative px-5 pt-[max(0.5rem,env(safe-area-inset-top))] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(440px,580px)] lg:items-center lg:gap-12 lg:px-0 lg:pt-0">
      <div className="flex justify-end text-ink lg:hidden">
        <Link href="/settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center">
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />
        </Link>
      </div>

      <header className="text-center lg:text-left">
        <p className="label">The wedding of</p>
        <h1 className="type-display mt-1.5 text-[40px] md:text-5xl lg:mt-4 lg:text-[clamp(72px,7.2vw,112px)] lg:leading-[0.92] lg:tracking-[-0.035em]">
          {/* Phones: one line. Laptops: each name on its own line, the & in gold. */}
          <span className="lg:hidden">{coupleName(name)}</span>
          <span className="hidden lg:inline">
            {first}
            {rest.length > 0 && (
              <>
                <br />
                <span className="text-champagne-600">&amp;</span> {rest.join(" & ")}
              </>
            )}
          </span>
        </h1>
        {weddingDate && (
          <p className="mt-2 flex items-center justify-center gap-3 text-xs font-medium tracking-[0.3em] text-stone lg:mt-6 lg:justify-start">
            <span aria-hidden className="h-px w-8 bg-champagne-400 lg:hidden" />
            {formatFullDotDate(weddingDate)}
            <span aria-hidden className="h-px w-8 bg-champagne-400" />
          </p>
        )}
        {aside && <div className="mt-8 hidden lg:block">{aside}</div>}
      </header>

      <div className="mx-auto mb-8 mt-4 w-[min(100%,350px)] md:mt-6 md:w-[440px] lg:m-0 lg:w-full">
        <Hub weddingDate={weddingDate} areas={areas} />
      </div>
    </section>
  );
}
