import PaymentRow from "@/components/payment-row";
import AddMenu from "@/components/add-menu";
import { moneyChoices } from "@/components/add-choices";
import Link from "next/link";
import { Check, ChevronRight, Plus, X } from "lucide-react";
import BudgetBar, { AGREED_BAR, PAID_BAR } from "@/components/budget-bar";
import CornerSwitch from "@/components/corner-switch";
import FilterMenu from "@/components/filter-menu";
import PageTitle from "@/components/page-title";
import { areaFilterRows, areaName, type AreaOption } from "@/lib/areas";
import AreaCards, { type AreaCard } from "./area-cards";
import MoneyFigures from "./money-figures";
import type { Money } from "@/lib/budget";
import { formatDayMonth, formatMonthYear, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Payment } from "@/types/db";
import { markPaidAction } from "./actions";

/*
 * Money (screens 22–24), as settled on canvas 2 ("Money · Round 4", owner's
 * pick 12 Oct 2026): money moves Budget → Agreed → Paid, and the rest has a
 * schedule. Two views, by the two questions a couple brings here:
 *
 * - By area (the default): where is the money going? The whole wedding on a
 *   glass card, then each area menu-card style with one slim bar (Round 5).
 * - By month: when do we pay? A column per month to the wedding on a glass
 *   card, then a glass card per month listing its payments (Round 6, D).
 *
 * No sentences — figures and bars. "Agreed" is what src/lib/budget.ts calls
 * committed. Going over budget is never shown by colour alone: the bar runs
 * on in stripes and the row says "Over by £…".
 */

const BUDGET_BAR = "bg-stone/25";

export default function MoneyView({
  view,
  total,
  byArea,
  payments,
  suppliers,
  balances,
  weddingDate,
  ready,
  error,
  detail,
  areas,
  area,
  scope,
  open,
  month,
}: {
  view: "area" | "month";
  /** By month: the bar tapped (`?month=2026-10`, or `paid`), narrowing the list to it. */
  month: string | null;
  /** The wedding's areas, for the filter. */
  areas: AreaOption[];
  /** The area filter (`?area=`): an area's key, `none` for Other, or null for everything. */
  area: string | null;
  /** The filtered area's name, or null when showing everything. */
  scope: string | null;
  total: Money;
  byArea: AreaCard[];
  /** The area whose money card is open (`?open=`). */
  open: string | null;
  payments: Payment[];
  suppliers: { id: string; name: string; area?: string | null }[];
  balances: { supplierId: string; name: string; balance: number }[];
  weddingDate: string | null;
  /** False until 0006_money.sql has been run. */
  ready: boolean;
  error?: string;
  detail?: string;
}) {
  // The area filter goes under the heading with the round black +, drawn like
  // the guest list's Filter (owner, 13 Oct 2026, for harmony).
  const filter = (
    <FilterMenu
      base={view === "month" ? "/money?view=month" : "/money"}
      groups={[{ param: "area", current: area, rows: areaFilterRows(areas) }]}
      // No heading, the + sits on the Filter's row (owner, 13 Oct 2026, as on
      // The Day) — in both views since 17 Oct 2026, so the row sits in the
      // same place under the top card whichever view you're in.
      end={<AddMenu label="Add to Money" title="Add to Money" choices={moneyChoices()} />}
    />
  );
  return (
    <main className="page pb-40 lg:pb-16">
      <CornerSwitch
        label="Show the money"
        tabs={[
          { label: "By area", href: area ? `/money?area=${encodeURIComponent(area)}` : "/money", active: view === "area" },
          { label: "By month", href: area ? `/money?view=month&area=${encodeURIComponent(area)}` : "/money?view=month", active: view === "month" },
        ]}
      />
      <PageTitle drawing="money" className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">
        {view === "area" ? "The budget" : "Payments"}
      </PageTitle>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}
      {!ready && (
        <p className="mt-5 rounded-xl border border-dashed border-champagne-400 px-4 py-3 text-sm text-ink">
          Budgets and payments need one more database step: run{" "}
          <span className="font-mono text-xs">supabase/migrations/0006_money.sql</span> in Supabase. Supplier
          costs below already count.
        </p>
      )}

      {view === "area" ? (
        <ByArea total={total} byArea={byArea} scope={scope} open={open} filter={filter} />
      ) : (
        <ByMonth
          total={total}
          payments={payments}
          suppliers={suppliers}
          // Each row names its area unless the list is already one area.
          areaOf={area ? undefined : (p) => areaName(p.area_key ?? suppliers.find((s) => s.id === p.contact_id)?.area ?? null, areas)}
          balances={balances}
          weddingDate={weddingDate}
          picked={month}
          filter={filter}
          base={area ? `/money?view=month&area=${encodeURIComponent(area)}` : "/money?view=month"}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------- By area */

/*
 * Canvas 2 "Money · Round 5" (owner's pick 12 Oct 2026): the top of option 3
 * (a glass card — agreed of budget, one thick bar, Paid · To pay · Still
 * free). The areas were option 4's menu-card rows until 12 Oct 2026; now
 * they're little glass cards, two to a row (owner's call).
 */

function ByArea({
  total,
  byArea,
  scope,
  open,
  filter,
}: {
  total: Money;
  byArea: AreaCard[];
  scope: string | null;
  open: string | null;
  filter: React.ReactNode;
}) {
  return (
    <>
      <Link
        href="/money/budget"
        aria-label={`${scope ?? "The whole wedding"} — change the budget`}
        className="glass-card row-press mt-6 block overflow-hidden rounded-[26px] p-5 [--row-bleed:20px]"
      >
        <p className="flex items-baseline justify-between gap-3">
          <span className="type-meta">{scope ?? "The whole wedding"}</span>
          <span className="type-meta flex items-center !text-champagne-600">
            {total.budget === null ? "Set budget" : "Change"}
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
          </span>
        </p>
        <MoneyFigures money={total} />
      </Link>

      {/* Straight from the totals into the areas (owner, 12 Oct 2026: the
          "Next to pay" banner went — By month has the schedule). No heading
          since 13 Oct 2026: Filter on the left, the round black + on the right. */}
      <section className="mt-5">
        {filter}
        <AreaCards areas={byArea} open={open} />
        {/* Owner, 13 Oct 2026: no "Change budgets ›" link (the top card already
            opens the budget page) and the explanation folded away (say less). */}
        <details className="group mt-6 text-xs leading-relaxed text-stone">
          <summary className="type-meta inline-flex cursor-pointer list-none items-center gap-1 !text-champagne-600 [&::-webkit-details-marker]:hidden">
            What do these mean?
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" strokeWidth={1.8} aria-hidden />
          </summary>
          <p className="mt-2">
            Agreed is what you&apos;ve signed up to: booked suppliers&apos; quotes, plus payments that aren&apos;t for a
            supplier. Paid counts deposits recorded on a supplier and payments marked paid — so record a deposit in one
            place, not both.
          </p>
        </details>
      </section>
    </>
  );
}

/* ------------------------------------------------------------ By month */

const monthKey = (date: string) => date.slice(0, 7);
const shiftMonth = (key: string, by: number) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
};
const shortMonth = (key: string) => formatMonthYear(`${key}-01`).split(" ")[0].slice(0, 3);
const shortMoney = (n: number) =>
  n >= 1000 ? `£${(Math.round(n / 100) / 10).toString().replace(/\.0$/, "")}k` : `£${Math.round(n)}`;

function ByMonth({
  total,
  payments,
  suppliers,
  areaOf,
  balances,
  weddingDate,
  picked,
  base,
  filter,
}: {
  total: Money;
  payments: Payment[];
  suppliers: { id: string; name: string; area?: string | null }[];
  areaOf?: (p: Payment) => string | null;
  balances: { supplierId: string; name: string; balance: number }[];
  weddingDate: string | null;
  picked: string | null;
  /** This view's address without a month, keeping the area filter. */
  base: string;
  filter: React.ReactNode;
}) {
  const today = todayISO();
  const thisMonth = monthKey(today);
  const due = payments.filter((p) => !p.paid_on);
  const paid = payments.filter((p) => p.paid_on).sort((a, b) => b.paid_on!.localeCompare(a.paid_on!));
  const dated = due.filter((p) => p.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!));
  const undated = due.filter((p) => !p.due_date);
  const stillToPay = Math.max(total.committed - total.paid, 0);

  // Anything overdue counts in this month: it needs paying now.
  const bucket = (p: Payment) => (monthKey(p.due_date!) < thisMonth ? thisMonth : monthKey(p.due_date!));
  const byMonth = new Map<string, Payment[]>();
  for (const p of dated) byMonth.set(bucket(p), [...(byMonth.get(bucket(p)) ?? []), p]);
  const sum = (list: Payment[]) => list.reduce((s, p) => s + p.amount, 0);

  // A column per month from now to the wedding (or the last payment due).
  const last = [weddingDate && monthKey(weddingDate), ...byMonth.keys()].filter((k): k is string => !!k && k >= thisMonth).sort().pop() ?? thisMonth;
  const months: string[] = [];
  for (let k = thisMonth; k <= last && months.length < 24; k = shiftMonth(k, 1)) months.push(k);
  const peak = Math.max(total.paid, ...months.map((k) => sum(byMonth.get(k) ?? [])), 1);
  const columns = [
    { key: "paid", label: "Paid", amount: total.paid, paid: true, title: `Paid so far: ${formatMoney(total.paid)}` },
    ...months.map((k) => {
      const amount = sum(byMonth.get(k) ?? []);
      return { key: k, label: shortMonth(k), amount, paid: false, title: `${formatMonthYear(`${k}-01`)}: ${amount ? `${formatMoney(amount)} due` : "nothing due"}` };
    }),
  ];
  const weddingMonth = weddingDate && monthKey(weddingDate);
  // Tapping a column narrows the list to it; tapping it again shows everything.
  const chosen = picked && columns.some((c) => c.key === picked) ? picked : null;
  const columnHref = (key: string) => (key === chosen ? base : `${base}&month=${key}`);
  const shownMonths = [...byMonth.entries()].filter(([key]) => !chosen || key === chosen);

  // The same row as Plan's and the Hub's This week (owner, 16 Oct 2026).
  const row = (p: Payment) => (
    <PaymentRow key={p.id} payment={p} today={today} who={suppliers.find((s) => s.id === p.contact_id)?.name} area={areaOf?.(p)} />
  );

  const count = (n: number) => (n === 1 ? "1 payment" : `${n} payments`);
  const cardTitle = (key: string) => {
    const [month, year] = formatMonthYear(`${key}-01`).split(" ");
    return (
      <>
        {month} <span className="italic text-champagne-600">{year}</span>
      </>
    );
  };
  const noDateTotal = sum(undated) + balances.reduce((s, b) => s + b.balance, 0);

  return (
    <>
      {/* Canvas 2 "Money · Round 6", option D (owner's pick 12 Oct 2026): the
          chart on a glass card, then a glass card per month listing its payments. */}
      <section className="glass-card mt-6 rounded-[26px] px-4 pb-4 pt-5" aria-label="Month by month">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="type-meta">Still to pay</p>
            <p className="type-figure mt-1.5 text-[40px] leading-none !font-light">{formatMoney(stillToPay)}</p>
          </div>
          <div className="text-right">
            <p className="type-meta !text-champagne-600">Paid so far</p>
            <p className="type-figure mt-1.5 text-[22px] !font-light !text-champagne-600">{formatMoney(total.paid)}</p>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex h-[140px] min-w-full items-end gap-1 border-b border-stone/30" style={{ width: `max(100%, ${columns.length * 30}px)` }}>
            {columns.map((c) => (
              <Link
                key={c.key}
                href={columnHref(c.key)}
                replace
                scroll={false}
                title={c.title}
                aria-label={c.key === chosen ? `${c.title} — show every month` : `${c.title} — show just this`}
                aria-current={c.key === chosen ? "true" : undefined}
                className={`flex h-full min-w-[26px] flex-1 flex-col items-center justify-end transition-opacity ${
                  chosen && c.key !== chosen ? "opacity-35" : ""
                }`}
              >
                {c.amount > 0 && <span className="mb-1 whitespace-nowrap text-[11px] tabular-nums text-ink/80">{shortMoney(c.amount)}</span>}
                <span
                  className={`w-full max-w-[20px] rounded-t ${c.paid ? PAID_BAR : AGREED_BAR}`}
                  style={{ height: c.amount ? `${Math.max(4, Math.round((c.amount / peak) * 108))}px` : 0 }}
                />
              </Link>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1" style={{ width: `max(100%, ${columns.length * 30}px)` }}>
            {columns.map((c) => (
              <span
                key={c.key}
                className={`min-w-[26px] flex-1 text-center text-[11px] ${
                  c.key === chosen ? "font-semibold text-ink underline decoration-champagne-400 decoration-2 underline-offset-4"
                  : c.paid || c.key === weddingMonth ? "font-semibold text-champagne-600" : "text-stone"
                } ${chosen && c.key !== chosen ? "opacity-50" : ""}`}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 flex items-center gap-4 text-xs text-stone">
          <span className="flex items-center gap-1.5" aria-hidden><span className={`h-2.5 w-2.5 rounded-sm ${PAID_BAR}`} />Paid</span>
          <span className="flex items-center gap-1.5" aria-hidden><span className={`h-2.5 w-2.5 rounded-sm ${AGREED_BAR}`} />Due</span>
          {weddingMonth && <span className="ml-auto text-champagne-600">Wedding · {shortMonth(weddingMonth)}</span>}
        </p>
      </section>

      {/* Filter and + straight under the card, as on By area (owner, 17 Oct
          2026: the "What's due" heading pushed them onto a row of their own). */}
      <div className="mt-5">{filter}</div>
      {chosen && (
        <Link
          href={base}
          replace
          scroll={false}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-champagne-100 py-1.5 pl-3.5 pr-2.5 text-sm text-ink"
        >
          {chosen === "paid" ? "Just what's paid" : `Just ${formatMonthYear(`${chosen}-01`)}`}
          <X className="h-3.5 w-3.5 text-stone" strokeWidth={2} aria-label="Show every month" />
        </Link>
      )}

      {chosen === "paid" &&
        (paid.length > 0 ? (
          <ul className="glass-card mt-3 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">{paid.map(row)}</ul>
        ) : (
          <p className="mt-4 text-[15px] text-stone">Nothing paid yet.</p>
        ))}
      {chosen && chosen !== "paid" && shownMonths.length === 0 && (
        <p className="mt-4 text-[15px] text-stone">Nothing due in {formatMonthYear(`${chosen}-01`)}.</p>
      )}

      {shownMonths.map(([key, list]) => (
        <section key={key} className="glass-card mt-3 overflow-hidden rounded-[22px] px-4 pb-1 pt-3.5 [--row-bleed:16px]">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[22px] font-light leading-tight text-ink">{cardTitle(key)}</h3>
            <span className="type-figure shrink-0 text-xl !font-light">{formatMoney(sum(list))}</span>
          </div>
          <p className="type-meta mt-0.5">{count(list.length)}</p>
          <ul className="mt-1 border-t border-linen/80">{list.map(row)}</ul>
        </section>
      ))}

      {!chosen && (undated.length > 0 || balances.length > 0) && (
        <section className="mt-3 overflow-hidden rounded-[22px] border-[1.5px] border-dashed border-stone/30 px-4 pb-1 pt-3.5 [--row-bleed:16px]">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[22px] font-light italic leading-tight text-ink/80">No date yet</h3>
            <span className="type-figure shrink-0 text-xl !font-light">{formatMoney(noDateTotal)}</span>
          </div>
          <p className="type-meta mt-0.5">Tap one to pick a date</p>
          <ul className="mt-1 border-t border-linen/80">
            {undated.map(row)}
            {balances.map((b) => (
              <li key={b.supplierId} className="row-press border-b border-linen last:border-b-0">
                <Link
                  href={`/money/payments/new?supplier=${b.supplierId}&amount=${b.balance}`}
                  className="flex items-center gap-3.5 py-3"
                >
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-dashed border-champagne-400 text-champagne-600">
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="type-item block truncate italic !text-stone">{b.name}</span>
                    <span className="type-meta mt-1 block">Balance · pick a date</span>
                  </span>
                  <span className="type-figure shrink-0 text-lg !font-light !text-stone">{formatMoney(b.balance)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!chosen && due.length === 0 && balances.length === 0 && (
        <p className="mt-4 text-[15px] text-stone">Nothing to pay right now. Balances, the rings, the licence — anything with a due date shows here.</p>
      )}

      {!chosen && paid.length > 0 && (
        <details className="mt-7 px-1">
          <summary className="flex cursor-pointer list-none items-baseline gap-2 py-1">
            <span className="section-label !text-stone">Paid · {paid.length}</span>
            <span aria-hidden className="min-w-4 flex-1 -translate-y-[4px] border-b-[1.5px] border-dotted border-stone/35" />
            <span className="type-figure text-base !font-light !text-stone">{formatMoney(sum(paid))}</span>
          </summary>
          <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">{paid.map(row)}</ul>
        </details>
      )}
    </>
  );
}
