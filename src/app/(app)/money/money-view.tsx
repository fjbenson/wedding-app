import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import ViewTabs from "@/components/view-tabs";
import type { AreaOption } from "@/lib/areas";
import type { Money } from "@/lib/budget";
import { formatDayMonth, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Payment } from "@/types/db";
import { markPaidAction } from "./actions";

/** Committed as a bar against the budget, with what's paid inside it. */
function Bar({ money }: { money: Money }) {
  const scale = Math.max(money.budget ?? 0, money.committed, money.paid, 1);
  const pct = (x: number) => `${Math.min((x / scale) * 100, 100)}%`;
  const over = money.budget !== null && money.committed > money.budget;
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-linen" aria-hidden>
      <div className={`absolute inset-y-0 left-0 rounded-full ${over ? "bg-stone" : "bg-champagne-400"}`} style={{ width: pct(money.committed) }} />
      <div className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: pct(money.paid) }} />
    </div>
  );
}

/**
 * The Money tab (screens 22 and 23): the budget against what's committed and
 * paid, by area; and the payments due, with anything booked but not yet
 * scheduled. How committed and paid are counted is in src/lib/budget.ts.
 */
export default function MoneyView({
  tab,
  total,
  byArea,
  payments,
  suppliers,
  balances,
  ready,
  error,
  detail,
}: {
  tab: "budget" | "payments";
  total: Money;
  byArea: (AreaOption & Money)[];
  payments: Payment[];
  suppliers: { id: string; name: string }[];
  balances: { supplierId: string; name: string; balance: number }[];
  /** False until 0006_money.sql has been run. */
  ready: boolean;
  error?: string;
  detail?: string;
}) {
  return (
    <main className="page pb-28 lg:pb-16">
      <p className="label">Money</p>
      <ViewTabs
        label="Money"
        tabs={[
          { label: "Budget", href: "/money", active: tab === "budget" },
          { label: "Payments", href: "/money?tab=payments", active: tab === "payments" },
        ]}
      />

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

      {tab === "budget" ? <Budget total={total} byArea={byArea} /> : <Payments payments={payments} suppliers={suppliers} balances={balances} />}
    </main>
  );
}

function Budget({ total, byArea }: { total: Money; byArea: (AreaOption & Money)[] }) {
  const left = total.budget !== null ? total.budget - total.committed : null;
  const stats: [string, string, string?][] = [
    ["Budget", total.budget !== null ? formatMoney(total.budget) : "Not set"],
    ["Committed", formatMoney(total.committed)],
    ["Paid", formatMoney(total.paid)],
    ...(left !== null ? ([[left >= 0 ? "Left to commit" : "Over budget", formatMoney(Math.abs(left)), left < 0 ? "text-stone" : undefined]] as [string, string, string?][]) : []),
  ];

  return (
    <>
      <h1 className="mt-8 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">The budget</h1>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-linen bg-white px-4 py-3">
            <dt className="text-xs uppercase tracking-[0.14em] text-stone">{label}</dt>
            <dd className={`mt-1 font-display text-2xl ${tone ?? "text-ink"}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <Bar money={total} />
        <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-stone">
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-ink align-middle" />Paid</span>
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-champagne-400 align-middle" />Committed</span>
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-linen align-middle" />Budget</span>
        </p>
      </div>

      <Link
        href="/money/budget"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-champagne-400 px-4 py-2 text-sm text-ink hover:bg-champagne-100"
      >
        {total.budget === null ? "Set your budget" : "Change budgets"}
      </Link>

      <section className="mt-10">
        <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">By area</h2>
        <ul>
          {byArea.map((a) => {
            const empty = a.committed === 0 && a.paid === 0 && a.budget === null;
            const label = (
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] text-ink">{a.label}</span>
                <span className="text-right text-sm">
                  {empty ? (
                    <span className="text-stone/70">Nothing yet</span>
                  ) : (
                    <>
                      <span className="text-ink">{formatMoney(a.committed)}</span>
                      {a.budget !== null && <span className="text-stone"> of {formatMoney(a.budget)}</span>}
                    </>
                  )}
                </span>
              </span>
            );
            return (
              <li key={a.key || "none"} className="border-b border-linen py-3 last:border-b-0">
                {a.key ? (
                  <Link href={`/area/${encodeURIComponent(a.key)}`} className="block hover:opacity-80">
                    {label}
                  </Link>
                ) : (
                  label
                )}
                {!empty && (
                  <div className="mt-2">
                    <Bar money={a} />
                    {(a.paid > 0 || (a.budget !== null && a.committed > a.budget)) && (
                      <p className="mt-1 text-xs text-stone">
                        {[
                          a.paid > 0 && `${formatMoney(a.paid)} paid`,
                          a.budget !== null && a.committed > a.budget && `${formatMoney(a.committed - a.budget)} over`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-xs leading-relaxed text-stone">
          Committed is what you&apos;ve agreed to: booked suppliers&apos; quotes, plus payments that aren&apos;t for a
          supplier. Paid counts deposits recorded on a supplier and payments marked paid — so record a deposit in
          one place, not both.
        </p>
      </section>
    </>
  );
}

function Payments({
  payments,
  suppliers,
  balances,
}: {
  payments: Payment[];
  suppliers: { id: string; name: string }[];
  balances: { supplierId: string; name: string; balance: number }[];
}) {
  const today = todayISO();
  const due = payments.filter((p) => !p.paid_on);
  const paid = payments.filter((p) => p.paid_on).sort((a, b) => b.paid_on!.localeCompare(a.paid_on!));
  const owed = due.reduce((sum, p) => sum + p.amount, 0);
  const overdue = due.filter((p) => p.due_date && p.due_date < today).length;

  const row = (p: Payment) => {
    const who = suppliers.find((s) => s.id === p.contact_id)?.name;
    const late = !p.paid_on && p.due_date && p.due_date < today;
    const when = p.paid_on ? `Paid ${formatDayMonth(p.paid_on)}` : p.due_date ? `Due ${formatDayMonth(p.due_date)}` : "No date";
    return (
      <li key={p.id} className="flex items-center gap-3 border-b border-linen last:border-b-0">
        <form action={markPaidAction.bind(null, p.id, !p.paid_on)}>
          <button
            type="submit"
            aria-label={p.paid_on ? `Mark "${p.description}" as not paid` : `Mark "${p.description}" as paid`}
            className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
              p.paid_on ? "border-ink bg-ink text-ivory" : "border-champagne-400 bg-white hover:bg-champagne-100"
            }`}
          >
            {p.paid_on && <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />}
          </button>
        </form>
        <Link href={`/money/payments/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 hover:bg-cream/60">
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-[15px] ${p.paid_on ? "text-stone" : "text-ink"}`}>{p.description}</span>
            <span className="mt-0.5 block text-xs text-stone">
              {late && <span className="font-medium text-champagne-600">Overdue · </span>}
              {[when, who].filter(Boolean).join(" · ")}
            </span>
          </span>
          <span className={`shrink-0 font-display text-lg ${p.paid_on ? "text-stone" : "text-ink"}`}>{formatMoney(p.amount)}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
        </Link>
      </li>
    );
  };

  return (
    <>
      <h1 className="mt-8 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        {due.length > 0 ? "Payments due" : "Nothing owed right now."}
      </h1>
      <p className="mt-2 text-sm text-stone">
        {due.length > 0
          ? [`${formatMoney(owed)} to pay`, overdue > 0 && `${overdue} overdue`].filter(Boolean).join(" · ")
          : "Balances, the rings, the licence — anything with a due date goes here."}
      </p>

      <Link
        href="/money/payments/new"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90 lg:w-fit lg:px-6"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Add a payment
      </Link>

      {balances.length > 0 && (
        <section className="mt-8 rounded-2xl border border-dashed border-champagne-400 p-5">
          <h2 className="label font-body">Not scheduled yet</h2>
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

      {due.length > 0 && (
        <section className="mt-10">
          <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">To pay</h2>
          <ul>{due.map(row)}</ul>
        </section>
      )}
      {paid.length > 0 && (
        <section className="mt-10">
          <h2 className="border-b border-champagne-400 pb-2 text-xl text-ink">Paid</h2>
          <ul>{paid.map(row)}</ul>
        </section>
      )}
    </>
  );
}
