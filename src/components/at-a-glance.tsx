import Link from "next/link";
import { loadStanding } from "@/lib/standing-data";
import type { Section } from "@/lib/where-things-stand";
import type { Wedding } from "@/types/db";

const SHOWN: Section["key"][] = ["people", "plan", "money", "day"];

/**
 * The laptop Hub's "At a glance" row (canvas 3 "Laptop · Round 2", 3 with
 * the names on the left, owner's pick 18 Oct 2026): one glass card per tab
 * with its headline figure, a bar and the first thing that needs you. The
 * figures are Where things stand's, so the two always agree. Laptops only.
 */
export default async function AtAGlance({ wedding }: { wedding: Wedding }) {
  const { sections } = await loadStanding(wedding);
  const cards = SHOWN.map((key) => sections.find((s) => s.key === key)).filter((s): s is Section => !!s);

  return (
    <section aria-label="At a glance" className="mt-10">
      <p className="label border-b border-champagne-400 pb-2.5 !text-stone">At a glance</p>
      <div className="mt-5 grid grid-cols-4 gap-4">
        {cards.map((section) => {
          const need = section.needs[0];
          return (
            <Link
              key={section.key}
              href={section.link.href}
              className="glass-card row-press flex min-h-[210px] flex-col rounded-[22px] p-[18px] [--row-bleed:0px]"
            >
              <span className="section-label">{section.title}</span>
              <span className="type-figure mt-3 text-[44px] leading-none text-champagne-600">{section.progress.figure}</span>
              <span className="mt-1 text-[13px] text-stone">{section.progress.words}</span>
              {section.progress.share !== null && (
                <span
                  className="mt-3.5 block h-1.5 overflow-hidden rounded-full bg-[#E9E1D3]"
                  role="img"
                  aria-label={`${Math.round(section.progress.share * 100)}% done`}
                >
                  <span className="block h-full rounded-full bg-champagne-400" style={{ width: `${Math.round(section.progress.share * 100)}%` }} />
                </span>
              )}
              {need && (
                <span className={`mt-3 text-[13px] leading-snug ${need.over ? "text-[#9A3F2B]" : "text-ink"}`}>
                  {need.over && "▲ "}
                  {need.figure && <b className="font-semibold">{need.figure} </b>}
                  {need.text}
                </span>
              )}
              <span className="mt-auto pt-3 text-[13px] text-champagne-600">{section.link.label} ›</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
