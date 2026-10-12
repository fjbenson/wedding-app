import Link from "next/link";
import AddButton from "@/components/add-button";
import { Check, ChevronRight, Plus } from "lucide-react";
import BudgetBar, { AGREED_BAR, PAID_BAR } from "@/components/budget-bar";
import CornerSwitch from "@/components/corner-switch";
import AreaFilter from "../plan/area-filter";
import PageTitle from "@/components/page-title";
import type { AreaOption } from "@/lib/areas";
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
}: {
  view: "area" | "month";
  /** The wedding's areas, for the filter. */
  areas: AreaOption[];
  /** The area filter (`?area=`): an area's key, `none` for Other, or null for everything. */
  area: string | null;
  /** The filtered area's name, or null when showing everything. */
  scope: string | null;
  total: Money;
  byArea: (AreaOption & Money)[];
  payments: Payment[];
  suppliers: { id: string; name: string }[];
  balances: { supplierId: string; name: string; balance: number }[];
  weddingDate: string | null;
  /** False until 0006_money.sql has been run. */
  ready: boolean;
  error?: string;
  detail?: string;
}) {
  return (
    <main className="page pb-28 lg:pb-16">
      <CornerSwitch
        label="Show the money"
        tabs={[
          { label: "By area", href: area ? `/money?area=${encodeURIComponent(area)}` : "/money", active: view === "area" },
          { label: "By month", href: area ? `/money?view=month&area=${encodeURIComponent(area)}` : "/money?view=month", active: view === "month" },
        ]}
      />
      <PageTitle drawing="money" spacing="mt-3" className="type-display text-[40px] leading-[1.05] tracking-[-0.02em]">
        {view === "area" ? "The budget" : "Payments"}
      </PageTitle>
      <div className="mt-4 flex justify-end">
        <AreaFilter
          areas={areas}
          current={area}
          base={view === "month" ? "/money?view=month" : "/money"}
          label="Show the money for"
        />
      </div>

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
        <ByArea total={total} byArea={byArea} scope={scope} />
      ) : (
        <ByMonth total={total} payments={payments} suppliers={suppliers} balances={balances} weddingDate={weddingDate} />
      )}
    </main>
  );
}

/* ------------------------------------------------------------- By area */

/*
 * Canvas 2 "Money · Round 5" (owner's pick 12 Oct 2026): the top of option 3
 * (a glass card — agreed of budget, one thick bar, Paid · To pay · Still
 * free) and the list of option 4 (a menu card: name, dotted line, figure,
 * one slim bar underneath). No divider lines between areas (owner: they got
 * mixed up with the bars) — space separates the rows, so the only lines in
 * the list are the bars, and the dotted line joining name to figure.
 */

/** The short word under an area's bar. */
function flag(m: Money): { text: string; tone: string } {
  if (m.budget !== null && m.committed > m.budget) {
    return { text: `▲ Over by ${formatMoney(m.committed - m.budget)}`, tone: "text-[#9A3F2B]" };
  }
  if (m.committed > 0 && m.paid >= m.committed) return { text: "✓ All paid", tone: "text-ink" };
  if (m.committed > 0) {
    return { text: `${formatMoney(m.paid)} paid · ${formatMoney(m.committed - m.paid)} to go`, tone: "text-stone" };
  }
  if (m.budget !== null) return { text: "Not booked yet", tone: "text-stone" };
  return { text: "No budget yet", tone: "text-champagne-600" };
}

function ByArea({
  total,
  byArea,
  scope,
}: {
  total: Money;
  byArea: (AreaOption & Money)[];
  scope: string | null;
}) {
  const toPay = Math.max(total.committed - total.paid, 0);
  const free = total.budget !== null ? total.budget - total.committed : null;

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
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className="type-figure text-[44px] leading-none !font-light">{formatMoney(total.committed)}</span>
          <span className="text-sm text-stone">
            {total.budget !== null ? `of ${formatMoney(total.budget)} agreed` : "agreed"}
          </span>
        </p>
        <div className="mt-4">
          <BudgetBar money={total} thick />
        </div>
        <dl className="mt-3.5 grid grid-cols-3 gap-2">
          <div>
            <dt className="text-xs text-champagne-600">Paid</dt>
            <dd className="type-figure text-xl !font-light !text-champagne-600">{formatMoney(total.paid)}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone">To pay</dt>
            <dd className="type-figure text-xl !font-light">{formatMoney(toPay)}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone">{free !== null && free < 0 ? "Over" : "Still free"}</dt>
            <dd className={`type-figure text-xl !font-light ${free !== null && free < 0 ? "!text-[#9A3F2B]" : ""}`}>
              {free === null ? "—" : free < 0 ? `▲ ${formatMoney(-free)}` : formatMoney(free)}
            </dd>
          </div>
        </dl>
      </Link>

      {/* Straight from the totals into the areas (owner, 12 Oct 2026: the
          "Next to pay" banner went — By month has the schedule), headed like
          By month's "What's due", with the same round black + to add a payment. */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-label">By area</h2>
          <AddButton href="/money/payments/new" label="Add a payment" />
        </div>
        <ul className="mt-1">
          {byArea.map((a) => {
            const note = !a.key && a.committed === 0 && a.paid === 0 ? { text: "Nothing yet", tone: "text-stone" } : flag(a);
            const figure = a.committed > 0 ? formatMoney(a.committed) : a.budget !== null ? formatMoney(a.budget) : "—";
            const ofBudget = a.committed > 0 ? (a.budget !== null ? `of ${formatMoney(a.budget)}` : "") : a.budget !== null ? "budget" : "";
            const body = (
              <>
                <span className="flex items-baseline">
                  <span className="type-item min-w-0 truncate">{a.label}</span>
                  <span aria-hidden className="mx-2 min-w-4 flex-1 -translate-y-[5px] border-b-[1.5px] border-dotted border-stone/35" />
                  <span className="type-figure shrink-0 text-lg !font-light">{figure}</span>
                  {ofBudget && <span className="ml-1.5 shrink-0 text-xs text-stone">{ofBudget}</span>}
                </span>
                {/* No budget and nothing agreed: no bar at all, just the word under the name. */}
                {(a.budget !== null || a.committed > 0) && (
                  <span className="mt-3 block">
                    <BudgetBar money={a} />
                  </span>
                )}
                <span className={`mt-2 block text-xs font-semibold uppercase tracking-[0.1em] ${note.tone}`}>{note.text}</span>
              </>
            );
            return (
              <li key={a.key || "none"} className={a.key ? "row-press" : undefined}>
                {a.key ? (
                  <Link href={`/area/${encodeURIComponent(a.key)}`} className="block py-[18px]">
                    {body}
                  </Link>
                ) : (
                  <div className="py-[18px]">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-center">
          <Link href="/money/budget" className="type-meta !text-champagne-600 hover:!text-ink">
            {total.budget === null ? "Set budgets ›" : "Change budgets ›"}
          </Link>
        </p>
        <p className="mt-6 text-xs leading-relaxed text-stone">
          Agreed is what you&apos;ve signed up to: booked suppliers&apos; quotes, plus payments that aren&apos;t for a
          supplier. Paid counts deposits recorded on a supplier and payments marked paid — so record a deposit in one
          place, not both.
        </p>
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
  balances,
  weddingDate,
}: {
  total: Money;
  payments: Payment[];
  suppliers: { id: string; name: string }[];
  balances: { supplierId: string; name: string; balance: number }[];
  weddingDate: string | null;
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

  const row = (p: Payment) => {
    const who = suppliers.find((s) => s.id === p.contact_id)?.name;
    const late = !p.paid_on && p.due_date && p.due_date < today;
    const when = p.paid_on ? `Paid ${formatDayMonth(p.paid_on)}` : p.due_date ? formatWeekdayDayMonth(p.due_date) : "No date";
    return (
      <li key={p.id} className="row-press flex items-center gap-3.5 border-b border-linen last:border-b-0">
        <form action={markPaidAction.bind(null, p.id, !p.paid_on)}>
          <button
            type="submit"
            aria-label={p.paid_on ? `Mark "${p.description}" as not paid` : `Mark "${p.description}" as paid`}
            className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-sm transition ${
              p.paid_on ? "bg-ink text-ivory" : "bg-champagne-100 text-champagne-600 hover:bg-cream"
            }`}
          >
            {p.paid_on ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden /> : "£"}
          </button>
        </form>
        <Link href={`/money/payments/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3">
          <span className="min-w-0 flex-1">
            <span className={`type-item block truncate ${p.paid_on ? "!text-stone" : ""}`}>{p.description}</span>
            <span className="type-meta mt-1 block">
              {late && <span className="text-champagne-600">Overdue · </span>}
              {[when, who].filter(Boolean).join(" · ")}
            </span>
          </span>
          <span className={`type-figure shrink-0 text-lg !font-light ${p.paid_on ? "!text-stone" : ""}`}>{formatMoney(p.amount)}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        </Link>
      </li>
    );
  };

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
      <section className="glass-card mt-6 rounded-[26px] px-[18px] pb-4 pt-5" aria-label="Month by month">
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
              <div key={c.key} title={c.title} aria-label={c.title} role="img" className="flex h-full min-w-[26px] flex-1 flex-col items-center justify-end">
                {c.amount > 0 && <span className="mb-1 whitespace-nowrap text-[11px] tabular-nums text-ink/80">{shortMoney(c.amount)}</span>}
                <span
                  className={`w-full max-w-[20px] rounded-t ${c.paid ? PAID_BAR : AGREED_BAR}`}
                  style={{ height: c.amount ? `${Math.max(4, Math.round((c.amount / peak) * 108))}px` : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1" style={{ width: `max(100%, ${columns.length * 30}px)` }}>
            {columns.map((c) => (
              <span
                key={c.key}
                className={`min-w-[26px] flex-1 text-center text-[11px] ${
                  c.paid || c.key === weddingMonth ? "font-semibold text-champagne-600" : "text-stone"
                }`}
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

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="section-label">What&apos;s due</h2>
        <AddButton href="/money/payments/new" label="Add a payment" />
      </div>

      {[...byMonth.entries()].map(([key, list]) => (
        <section key={key} className="glass-card mt-3 overflow-hidden rounded-[22px] px-[18px] pb-1 pt-3.5 [--row-bleed:18px]">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[22px] font-light leading-tight text-ink">{cardTitle(key)}</h3>
            <span className="type-figure shrink-0 text-xl !font-light">{formatMoney(sum(list))}</span>
          </div>
          <p className="type-meta mt-0.5">{count(list.length)}</p>
          <ul className="mt-1 border-t border-linen/80">{list.map(row)}</ul>
        </section>
      ))}

      {(undated.length > 0 || balances.length > 0) && (
        <section className="mt-3 overflow-hidden rounded-[22px] border-[1.5px] border-dashed border-stone/30 px-[18px] pb-1 pt-3.5 [--row-bleed:18px]">
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

      {due.length === 0 && balances.length === 0 && (
        <p className="mt-4 text-[15px] text-stone">Nothing to pay right now. Balances, the rings, the licence — anything with a due date shows here.</p>
      )}

      {paid.length > 0 && (
        <details className="mt-7 px-1">
          <summary className="flex cursor-pointer list-none items-baseline gap-2 py-1">
            <span className="section-label !text-stone">Paid · {paid.length}</span>
            <span aria-hidden className="min-w-4 flex-1 -translate-y-[4px] border-b-[1.5px] border-dotted border-stone/35" />
            <span className="type-figure text-base !font-light !text-stone">{formatMoney(sum(paid))}</span>
          </summary>
          <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-[18px] [--row-bleed:18px]">{paid.map(row)}</ul>
        </details>
      )}
    </>
  );
}
