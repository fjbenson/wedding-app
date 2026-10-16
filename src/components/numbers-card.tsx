import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Row = { value: number | string; label: string; href?: string; onClick?: () => void };

/**
 * A tab's headline numbers, shaped like the guest list's and Suppliers' count
 * cards (canvas 3 "The Day · Round 1", A, owner's pick 17 Oct 2026): one big
 * white tile with the number that matters most, and up to three smaller
 * figures beside it. A figure with somewhere to go is a link (or a button).
 */
export default function NumbersCard({ big, rows }: { big: { label: string; value: number | string; sub?: string }; rows: Row[] }) {
  const size = typeof big.value === "number" && big.value >= 100 ? "text-[50px] sm:text-[56px]" : "text-[60px] sm:text-[68px]";
  return (
    <section
      aria-label={big.label}
      className="mt-6 grid grid-cols-[6.75rem_minmax(0,1fr)] gap-2.5 rounded-[22px] border-[0.5px] border-white/70 bg-white/50 p-3 pb-2 shadow-[0_0_0_0.5px_rgb(60_50_40/0.06),0_18px_40px_-24px_rgb(60_50_40/0.32)] sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-3 sm:p-3.5 sm:pb-2.5"
    >
      <div className="glass-tile-on mb-1 flex flex-col justify-between rounded-2xl p-3">
        <span className="type-meta text-champagne-600">{big.label}</span>
        <span>
          <span className={`type-figure block leading-none text-champagne-600 ${size}`}>{big.value}</span>
          {big.sub && <span className="mt-1.5 block text-xs text-stone">{big.sub}</span>}
        </span>
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        {rows.map((row, i) => {
          const inner = (
            <>
              {i > 0 && <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-linen" />}
              <span className="type-figure min-w-[2.25rem] text-[26px] leading-none tabular-nums text-champagne-600">{row.value}</span>
              <span className="type-meta min-w-0 flex-1 leading-tight tracking-[0.12em]">{row.label}</span>
              {(row.href || row.onClick) && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone" strokeWidth={2} aria-hidden />}
            </>
          );
          const cls = "relative flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-left sm:gap-2.5 sm:px-2.5";
          return row.href ? (
            <Link key={row.label} href={row.href} scroll={false} className={`${cls} hover:bg-white/60`}>
              {inner}
            </Link>
          ) : row.onClick ? (
            <button key={row.label} type="button" onClick={row.onClick} className={`${cls} hover:bg-white/60`}>
              {inner}
            </button>
          ) : (
            <div key={row.label} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
