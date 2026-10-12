import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import CornerSwitch from "@/components/corner-switch";
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
 * - By month: when do we pay? A column per month to the wedding, then the
 *   payments grouped by month, ticked off in place.
 *
 * No sentences — figures and bars. "Agreed" is what src/lib/budget.ts calls
 * committed. Going over budget is never shown by colour alone: the bar runs
 * on in stripes and the row says "Over by £…".
 */

const BUDGET_BAR = "bg-stone/25";
const AGREED_BAR = "bg-champagne-400/50";
const PAID_BAR = "bg-champagne-600";
const OVER_STRIPES = { background: "repeating-linear-gradient(135deg,#B5523B 0 3px,#E8B4A6 3px 6px)" };

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
}: {
  view: "area" | "month";
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
          { label: "By area", href: "/money", active: view === "area" },
          { label: "By month", href: "/money?view=month", active: view === "month" },
        ]}
      />
      <PageTitle drawing="money" spacing="mt-3" className="type-display text-[40px] leading-[1.05] tracking-[-0.02em]">
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
        <ByArea total={total} byArea={byArea} payments={payments} />
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

const pct = (x: number, of: number) => `${Math.min((x / of) * 100, 100)}%`;

/** One bar on the budget's scale: agreed inside, paid inside that, stripes past a tick when over. */
function BudgetBar({ money, thick = false }: { money: Money; thick?: boolean }) {
  const budget = money.budget ?? 0;
  const scale = Math.max(budget, money.committed, money.paid, 1);
  const over = money.budget !== null && money.committed > budget;
  return (
    <span
      aria-hidden
      className={`relative block rounded-full bg-linen ${thick ? "h-3.5 overflow-hidden" : "h-2"}`}
    >
      <span
        className={`absolute inset-y-0 left-0 ${over ? "rounded-l-full" : "rounded-full"} ${AGREED_BAR}`}
        style={{ width: pct(over ? budget : money.committed, scale) }}
      />
      <span className={`absolute inset-y-0 left-0 rounded-full ${PAID_BAR}`} style={{ width: pct(money.paid, scale) }} />
      {over && (
        <>
          <span
            className="absolute -inset-y-0.5 rounded-r-full"
            style={{ left: pct(budget, scale), width: pct(money.committed - budget, scale), ...OVER_STRIPES }}
          />
          <span className="absolute -inset-y-1 w-[1.5px] bg-ink" style={{ left: pct(budget, scale) }} />
        </>
      )}
    </span>
  );
}

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

function ByArea({ total, byArea, payments }: { total: Money; byArea: (AreaOption & Money)[]; payments: Payment[] }) {
  const next = payments
    .filter((p) => !p.paid_on && p.due_date)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0];
  const toPay = Math.max(total.committed - total.paid, 0);
  const free = total.budget !== null ? total.budget - total.committed : null;

  return (
    <>
      <section className="glass-card mt-6 rounded-[26px] p-5">
        <p className="type-meta">The whole wedding</p>
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
        {total.budget === null && (
          <Link href="/money/budget" className="mt-3 inline-block text-sm text-champagne-600 underline underline-offset-4 hover:text-ink">
            Set your budget
          </Link>
        )}
      </section>

      {next && (
        <Link
          href={`/money/payments/${next.id}`}
          className="glass-card row-press mt-3 flex items-center gap-3 overflow-hidden rounded-[18px] px-4 py-3 [--row-bleed:16px]"
        >
          <span className="min-w-0 flex-1">
            <span className="type-meta block">Next to pay · {formatWeekdayDayMonth(next.due_date!)}</span>
            <span className="type-item mt-0.5 block truncate">{next.description}</span>
          </span>
          <span className="type-figure shrink-0 text-xl !font-light">{formatMoney(next.amount)}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        </Link>
      )}

      <section className="mt-9">
        <div className="text-center">
          <h2 className="section-label">By area</h2>
          <span aria-hidden className="mx-auto mt-2.5 block h-px w-[60px] bg-champagne-400" />
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

  return (
    <>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <dt className="type-meta !text-champagne-600">Paid so far</dt>
          <dd className="type-figure mt-1 text-[28px] !font-light text-champagne-600">{formatMoney(total.paid)}</dd>
        </div>
        <div>
          <dt className="type-meta">Still to pay</dt>
          <dd className="type-figure mt-1 text-[28px] !font-light">{formatMoney(stillToPay)}</dd>
        </div>
      </dl>

      <Link
        href="/money/payments/new"
        className="mt-5 flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-ink px-4 text-sm text-ivory transition hover:bg-ink/90 lg:w-fit lg:px-6"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Add a payment
      </Link>

      <section className="mt-8" aria-label="Month by month">
        <p className="flex items-baseline justify-between gap-3">
          <span className="section-label">Month by month</span>
          {weddingMonth && <span className="text-xs text-stone">to the wedding, {formatMonthYear(`${weddingMonth}-01`)}</span>}
        </p>
        <div className="mt-3 overflow-x-auto pb-1">
          <div className="flex h-[170px] min-w-full items-end gap-1 border-b border-stone/30" style={{ width: `max(100%, ${columns.length * 34}px)` }}>
            {columns.map((c) => (
              <div key={c.key} title={c.title} aria-label={c.title} role="img" className="flex h-full min-w-[30px] flex-1 flex-col items-center justify-end">
                {c.amount > 0 && <span className="mb-1 whitespace-nowrap text-xs tabular-nums text-ink/80">{shortMoney(c.amount)}</span>}
                <span
                  className={`w-full max-w-[26px] rounded-t ${c.paid ? PAID_BAR : AGREED_BAR}`}
                  style={{ height: c.amount ? `${Math.max(4, Math.round((c.amount / peak) * 130))}px` : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1" style={{ width: `max(100%, ${columns.length * 34}px)` }}>
            {columns.map((c) => (
              <span
                key={c.key}
                className={`min-w-[30px] flex-1 text-center text-xs ${c.key === weddingMonth ? "font-semibold text-champagne-600" : "text-stone"}`}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 flex gap-4 text-xs text-stone" aria-hidden>
          <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${PAID_BAR}`} />Paid</span>
          <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${AGREED_BAR}`} />Due</span>
        </p>
      </section>

      {balances.length > 0 && (
        <section className="mt-8 rounded-2xl border border-dashed border-champagne-400 p-5">
          <h2 className="section-label">Not scheduled yet</h2>
          <ul className="mt-2">
            {balances.map((b) => (
              <li key={b.supplierId} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
                <span className="text-[15px] text-ink">
                  {b.name} <span className="text-stone">· {formatMoney(b.balance)} balance</span>
                </span>
                <Link
                  href={`/money/payments/new?supplier=${b.supplierId}&amount=${b.balance}`}
                  className="text-sm text-champagne-600 underline underline-offset-4 hover:text-ink"
                >
                  Add as a payment
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {[...byMonth.entries()].map(([key, list]) => (
        <section key={key} className="mt-7">
          <p className="flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-1.5">
            <span className="section-label">{formatMonthYear(`${key}-01`)}</span>
            <span className="type-figure text-base !font-light">{formatMoney(sum(list))}</span>
          </p>
          <ul>{list.map(row)}</ul>
        </section>
      ))}

      {undated.length > 0 && (
        <section className="mt-7">
          <p className="flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-1.5">
            <span className="section-label">No date yet</span>
            <span className="type-figure text-base !font-light">{formatMoney(sum(undated))}</span>
          </p>
          <ul>{undated.map(row)}</ul>
        </section>
      )}

      {due.length === 0 && balances.length === 0 && (
        <p className="mt-8 text-[15px] text-stone">Nothing to pay right now. Balances, the rings, the licence — anything with a due date shows here.</p>
      )}

      {paid.length > 0 && (
        <details className="mt-9 border-t border-linen pt-3">
          <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 py-1">
            <span className="section-label !text-stone">Paid · {paid.length}</span>
            <span className="type-figure text-base !font-light">{formatMoney(sum(paid))}</span>
          </summary>
          <ul className="mt-1">{paid.map(row)}</ul>
        </details>
      )}
    </>
  );
}
