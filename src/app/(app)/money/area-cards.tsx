"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, X } from "lucide-react";
import BudgetBar, { PAID_BAR } from "@/components/budget-bar";
import { usePullToClose } from "@/components/use-pull-to-close";
import { areaIcon, type AreaOption } from "@/lib/areas";
import type { Money } from "@/lib/budget";
import { formatMoney } from "@/lib/money";
import type { mealCost } from "@/lib/meals";
import { replaceQuery } from "@/lib/url-state";
import type { Payment, SupplierStatus } from "@/types/db";
import CardLink from "@/components/card-link";
import TickForm from "@/components/tick-form";
import { Check } from "lucide-react";
import { markPaidAction } from "./actions";
import { formatDayMonth, todayISO } from "@/lib/dates";
import MoneyFigures from "./money-figures";
import QuoteCompare from "@/components/quote-compare";

/** What an area's money card lists under its figures. */
export interface AreaDetail {
  suppliers: { id: string; name: string; status: SupplierStatus; quote: number; deposit: number }[];
  /** Still to pay, soonest first (no date last), as the payment rows show them. */
  toPay: Payment[];
  /** Paid, newest first. */
  paid: Payment[];
  /** Booked suppliers' balances nobody has put a date on yet. */
  balances: { supplierId: string; name: string; balance: number }[];
  /** Food & drink: the cost per guest expected (owner, 17 Oct 2026); `budgeted` while nothing's agreed yet. */
  perHead?: { amount: number; guests: number; budgeted: boolean } | null;
  /** Food & drink: the caterer's prices a head times who's coming (Area page's "What it comes to"). */
  foodCost?: ReturnType<typeof mealCost>;
}

/** "£68 a head" — whole pounds, it's a rough guide. */
const aHead = (p: NonNullable<AreaDetail["perHead"]>) => `${formatMoney(Math.round(p.amount))} a head`;

export type AreaCard = AreaOption & Money & { detail: AreaDetail };

/**
 * What an area's card shows (owner, 21 Oct 2026): one figure and where it
 * stands — the agreed price once booked, else the lowest quote in, else the
 * budget. Over-budget and the comparison live in the card that opens.
 */
function standing(a: AreaCard): { stage: "Booked" | "Quoted" | "Budgeted" | null; figure: number | null } {
  if (a.committed > 0) return { stage: "Booked", figure: a.committed };
  const quotes = a.detail.suppliers.filter((s) => s.status === "quoted" && s.quote > 0).map((s) => s.quote);
  if (quotes.length > 0) return { stage: "Quoted", figure: Math.min(...quotes) };
  if (a.budget !== null) return { stage: "Budgeted", figure: a.budget };
  return { stage: null, figure: null };
}

const PILL = {
  Booked: "bg-[#F1E7D4] text-[#6F5120]",
  Quoted: "border border-champagne-600 bg-white text-champagne-600",
  Budgeted: "border border-dashed border-stone text-stone",
};

/**
 * Money's areas as little cards, two to a row (owner, 12 Oct 2026; four on a laptop). Tapping
 * one brings up that area's money from the bottom (a right-hand panel on a
 * laptop) — simple first, detail on tap — rather than leaving for the area
 * page; the card links on to it. The open one lives in the address (`?open=`).
 */
export default function AreaCards({ areas, open: initial }: { areas: AreaCard[]; open: string | null }) {
  const [open, setOpen] = useState<string | null>(initial);
  const show = (key: string | null) => {
    setOpen(key);
    replaceQuery({ open: key });
  };
  const current = open === null ? undefined : areas.find((a) => (a.key || "other") === open);

  return (
    <>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:mt-5 lg:grid-cols-4 lg:gap-3.5">
        {areas.map((a) => {
          const { stage, figure } = standing(a);
          const Icon = areaIcon(a.key || "other", a.icon);
          return (
            <li key={a.key || "other"}>
              <button
                type="button"
                onClick={() => show(a.key || "other")}
                className="glass-card row-press flex h-full w-full flex-col justify-start overflow-hidden rounded-[22px] p-4 text-left [--row-bleed:16px]"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.6} aria-hidden />
                  <span className="type-item min-w-0 truncate text-[15px]">{a.label}</span>
                </span>
                <span className="mt-3 block type-figure text-[26px] leading-none !font-light">{figure === null ? "—" : formatMoney(figure)}</span>
                <span className="mt-2 block h-[22px]">
                  {stage && <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${PILL[stage]}`}>{stage}</span>}
                </span>
                {/* Every card has the bar and the line, so they line up; unbooked ones are just empty (owner, 21 Oct 2026). */}
                <span className="mt-2.5 block h-2">
                  <BudgetBar money={{ budget: null, committed: stage === "Booked" ? a.committed : 0, paid: stage === "Booked" ? a.paid : 0 }} />
                </span>
                <span className="mt-2.5 block text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] text-stone">
                  {stage === "Booked"
                    ? a.paid >= a.committed
                      ? "✓ All paid"
                      : `${formatMoney(a.committed - a.paid)} to go`
                    : stage === "Quoted"
                      ? "Not booked yet"
                      : stage === "Budgeted"
                        ? "No quote yet"
                        : "No budget yet"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {current && <AreaMoneySheet area={current} onClose={() => show(null)} />}
    </>
  );
}

/**
 * The one thing to do next in an area (owner, 21 Oct 2026: "always pushing
 * for the next step"). A link, or — for a payment that's due — a button that
 * marks it paid. Null once everything's paid.
 */
function nextStep(area: AreaCard, today: string): { title: string; line: string; href?: string; payId?: string } | null {
  const { stage } = standing(area);
  const key = encodeURIComponent(area.key);
  if (stage === null) return { title: "Set a budget", line: "Share it out, or type one in", href: "/money/budget" };
  if (!area.key) return null;
  const live = area.detail.suppliers.filter((s) => s.status !== "cancelled");
  if (stage === "Budgeted") {
    return live.length > 0
      ? { title: "Add a quote", line: "Who have you asked?", href: `/area/${key}?stage=quotes` }
      : { title: "Add a quote", line: "Start with who you'd ask", href: `/people/suppliers/new?category=${key}` };
  }
  if (stage === "Quoted") {
    const quoted = live.filter((s) => s.status === "quoted");
    return quoted.length === 1
      ? { title: `Book ${quoted[0].name}`, line: "The only quote in", href: `/people/${quoted[0].id}` }
      : { title: "Choose a quote", line: `${quoted.length} to compare`, href: `/area/${key}?stage=quotes` };
  }
  const balance = area.detail.balances[0];
  const due = area.detail.toPay[0];
  if (due) {
    return {
      title: `Mark ${formatMoney(due.amount)} paid`,
      line: due.due_date && due.due_date < today ? `${due.description} · overdue` : due.description,
      payId: due.id,
    };
  }
  if (balance) {
    return {
      title: "Add the balance",
      line: `${balance.name} · ${formatMoney(balance.balance)} to pay`,
      href: `/money/payments/new?supplier=${balance.supplierId}&amount=${balance.balance}`,
    };
  }
  return null;
}

function NextStep({ area }: { area: AreaCard }) {
  const step = nextStep(area, todayISO());
  if (!step) return null;
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-xs uppercase tracking-[0.2em] text-champagne-600">Next step</span>
        <span className="mt-1 block truncate font-display text-[21px] leading-tight text-ink">{step.title}</span>
        <span className="mt-0.5 block truncate text-[13px] text-stone">{step.line}</span>
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-ivory">
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      </span>
    </>
  );
  const cls =
    "mt-5 flex w-full items-center gap-3 rounded-[22px] bg-gradient-to-br from-champagne-100 to-ivory py-3.5 pl-[18px] pr-3.5 text-left ring-[0.5px] ring-champagne-600/30";
  return step.payId ? (
    <form action={markPaidAction.bind(null, step.payId, true)}>
      <button type="submit" className={cls}>
        {body}
      </button>
    </form>
  ) : (
    <Link href={step.href!} className={cls}>
      {body}
    </Link>
  );
}

function AreaMoneySheet({ area, onClose }: { area: AreaCard; onClose: () => void }) {
  // Escape closes it, and the page behind doesn't scroll while it's open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  const drag = usePullToClose(onClose);
  const Icon = areaIcon(area.key || "other", area.icon);
  const { suppliers, toPay, paid, balances } = area.detail;
  const live = suppliers.filter((s) => s.status !== "cancelled");
  // Two or more quotes and no one booked: they're compared in the chart, so not listed again under it.
  const quoted = live.filter((s) => s.status === "quoted" && s.quote > 0);
  const comparing = area.key && !live.some((s) => s.status === "booked") && quoted.length >= 2 ? quoted : [];
  const booked = live.filter((s) => s.status === "booked");
  const others = live.filter((s) => s.status !== "booked" && !comparing.includes(s));
  // Payments no booked supplier card holds: tied to an area, or to someone not booked.
  const loose = [...toPay, ...paid].filter((p) => !booked.some((s) => s.id === p.contact_id));
  const today = todayISO();
  const addPayment = area.key ? `/money/payments/new?area=${encodeURIComponent(area.key)}` : "/money/payments/new";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${area.label} money`}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
      />
      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        className={`absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] ${
          drag.dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
      >
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>
        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] lg:pt-8">
          <div onPointerDown={drag.start} className="flex touch-none items-start gap-3 lg:touch-auto">
            <div className="min-w-0 flex-1">
              <p className="label flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                Money
              </p>
              <h2 className="mt-1 font-display text-[32px] font-light italic leading-[1.05] tracking-[-0.02em] text-ink">
                {area.label}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          </div>

          <div className="mt-3">
            <AreaBudgetPanel area={area} />
          </div>
          <NextStep area={area} />
          {area.detail.perHead && (
            <p className="mt-4 flex items-baseline justify-between gap-3 border-t border-linen pt-3 text-sm text-stone">
              <span>
                {area.detail.perHead.budgeted ? "Budget per guest" : "Per guest"} · {area.detail.perHead.guests}{" "}
                {area.detail.perHead.guests === 1 ? "guest" : "guests"} expected
              </span>
              <span className="type-figure text-lg !font-light text-ink">{aHead(area.detail.perHead)}</span>
            </p>
          )}

          {area.detail.foodCost && (
            <section className="mt-7">
              <h3 className="section-label">What it comes to</h3>
              <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
                {area.detail.foodCost.lines.map((l) => (
                  <li key={l.key} className="flex items-baseline justify-between gap-3 border-b border-ink/[0.12] py-3 last:border-b-0">
                    <span className="min-w-0">
                      <span className="type-item block truncate">{l.label}</span>
                      <span className="type-meta mt-1 block">
                        {l.n} × {formatMoney(l.each)}
                      </span>
                    </span>
                    <span className="type-figure shrink-0 text-lg !font-light">{formatMoney(l.total)}</span>
                  </li>
                ))}
                <li className="flex items-baseline justify-between gap-3 py-3">
                  <span className="type-item">Worked out</span>
                  <span className="type-figure text-xl !font-light">{formatMoney(area.detail.foodCost.total)}</span>
                </li>
              </ul>
              <Link href={`/area/${encodeURIComponent(area.key)}`} className="mt-2 inline-block py-1 text-sm text-champagne-600 hover:text-ink">
                Change the prices ›
              </Link>
            </section>
          )}

          {live.length > 0 && (
            <section className="mt-7">
              <h3 className="section-label">Suppliers</h3>
              {/* A card each for who's booked, with their payments inside (owner, 22 Oct 2026, canvas 4 "Money · Round 6"). */}
              <div className="mt-2 flex flex-col gap-2.5">
                {booked.map((s) => (
                  <SupplierMoney
                    key={s.id}
                    supplier={s}
                    payments={[...toPay, ...paid].filter((p) => p.contact_id === s.id)}
                    balance={balances.find((b) => b.supplierId === s.id)?.balance ?? 0}
                    today={today}
                  />
                ))}
              </div>
              {/* Quotes aren't counted above; two or more with no one booked are compared, a tap opens their card on the area page. */}
              {comparing.length > 0 && (
                <QuoteCompare
                  quotes={comparing.map((s) => ({ id: s.id, name: s.name, quote: s.quote }))}
                  room={area.budget !== null ? area.budget - area.committed : null}
                  row={(id, className, children) => (
                    <Link href={`/area/${encodeURIComponent(area.key)}?supplier=${id}`} className={className}>
                      {children}
                    </Link>
                  )}
                />
              )}
              {others.length > 0 && (
                <ul className="mt-2.5 flex flex-col gap-2.5">
                  {others.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/people/${s.id}`}
                        className="row-press flex items-center gap-3 rounded-[22px] border border-dashed border-champagne-400/60 px-4 py-3.5"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[17px] text-stone">{s.name}</span>
                          <span className="mt-0.5 block text-[13px] text-stone">
                            {s.quote > 0 ? "Quote · not chosen, not counted" : "Not booked yet"}
                          </span>
                        </span>
                        {s.quote > 0 && <span className="type-figure shrink-0 text-xl !font-light !text-stone">{formatMoney(s.quote)}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {loose.length > 0 && (
            <section className="mt-5">
              <h3 className="section-label">Other payments</h3>
              <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
                {loose.map((p) => (
                  <PayLine key={p.id} payment={p} today={today} />
                ))}
              </ul>
            </section>
          )}

          <Link href={addPayment} className="mt-3 inline-flex items-center gap-1.5 py-2 text-sm text-champagne-600 hover:text-ink">
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Add a payment
          </Link>

          <div className="mt-7 flex flex-col gap-1">
            {area.key && area.key !== "other" && (
              <Link href={`/area/${encodeURIComponent(area.key)}`} className="flex items-center justify-between py-2.5 text-[15px] text-ink">
                Open the {area.label} page
                <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
              </Link>
            )}
            <Link href="/money/budget" className="flex items-center justify-between py-2.5 text-[15px] text-ink">
              {area.budget === null ? "Set a budget" : "Change the budget"}
              <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const OVER_STRIPES = { background: "repeating-linear-gradient(135deg,#B5523B 0 3px,#E8B4A6 3px 6px)" };

/**
 * The top of an area's money card (owner, 22 Oct 2026, canvas 4 "Money ·
 * Round 6", 2): the area against its budget as three bars on one scale —
 * Budget, Booked, Paid — so they compare by length. Quotes aren't counted.
 * Before anything's booked it's the plain figures.
 */
function AreaBudgetPanel({ area }: { area: AreaCard }) {
  if (area.committed <= 0 && area.paid <= 0) return <MoneyFigures money={area} size={36} />;
  const { budget, committed, paid } = area;
  const free = budget !== null ? budget - committed : null;
  const scale = Math.max(budget ?? 0, committed, paid, 1);
  const w = (x: number) => `${Math.min((x / scale) * 100, 100)}%`;
  const over = budget !== null && committed > budget;
  const bar = (label: string, value: number, fill: string, extra?: React.ReactNode) => (
    <div className="mt-2.5">
      <p className="flex items-baseline justify-between text-[13px] text-stone">
        <span>{label}</span>
        <span className="font-medium text-ink">{formatMoney(value)}</span>
      </p>
      <span aria-hidden className="relative mt-1.5 block h-2 overflow-hidden rounded-full bg-white ring-[0.5px] ring-ink/10">
        <span className={`absolute inset-y-0 left-0 ${fill}`} style={{ width: w(value) }} />
        {extra}
      </span>
    </div>
  );
  return (
    <section
      aria-label="Against your budget"
      className="mt-3.5 rounded-[22px] bg-champagne-100/70 p-4 ring-[0.5px] ring-champagne-600/25"
    >
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-600">
          {budget !== null ? "Against your budget" : "Booked and paid"}
        </span>
        {free !== null && (
          <span className={`text-[13px] ${over ? "text-[#9A3F2B]" : "text-ink"}`}>
            <b className="font-semibold">{over ? `▲ Over by ${formatMoney(-free)}` : formatMoney(free)}</b>
            {over ? "" : " left"}
          </span>
        )}
      </p>
      {budget !== null && bar("Budget", budget, "bg-champagne-400/45")}
      {bar(
        "Booked",
        committed,
        "bg-champagne-400",
        over && <span className="absolute inset-y-0 rounded-r-full" style={{ left: w(budget), width: w(committed - budget), ...OVER_STRIPES }} />,
      )}
      {bar("Paid", paid, PAID_BAR)}
    </section>
  );
}

/** A booked supplier: what's agreed and how much is paid, then each of its payments (deposit last). */
function SupplierMoney({
  supplier: s,
  payments,
  balance,
  today,
}: {
  supplier: AreaDetail["suppliers"][number];
  payments: Payment[];
  balance: number;
  today: string;
}) {
  const paidIn = payments.filter((p) => p.paid_on);
  const open = payments.filter((p) => !p.paid_on);
  const paid = s.deposit + paidIn.reduce((sum, p) => sum + p.amount, 0);
  const toGo = Math.max(s.quote - paid, 0);
  return (
    <div className="glass-card rounded-[22px] p-4">
      <Link href={`/people/${s.id}`} className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate font-display text-xl text-ink">{s.name}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${PILL.Booked}`}>Booked</span>
      </Link>
      <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2">
        <span className="type-figure text-[28px] leading-none !font-light">{formatMoney(s.quote)}</span>
        <span className="text-[13px] text-stone">{toGo <= 0 ? "All paid" : `${formatMoney(paid)} paid · ${formatMoney(toGo)} to go`}</span>
      </p>
      <div className="mt-2.5 h-1.5">
        <BudgetBar money={{ budget: null, committed: s.quote, paid }} />
      </div>
      <ul className="mt-1.5 [--row-bleed:0px]">
        {open.map((p) => (
          <PayLine key={p.id} payment={p} today={today} />
        ))}
        {balance > 0 && (
          <li className="row-press border-b border-linen last:border-b-0">
            <Link href={`/money/payments/new?supplier=${s.id}&amount=${balance}`} className="flex items-center gap-3 py-2.5">
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-dashed border-champagne-400 text-champagne-600">
                <Plus className="h-3 w-3" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] italic text-stone">
                Balance<span className="text-[13px] not-italic"> · pick a date</span>
              </span>
              <span className="type-figure shrink-0 text-lg !font-light !text-stone">{formatMoney(balance)}</span>
            </Link>
          </li>
        )}
        {paidIn.map((p) => (
          <PayLine key={p.id} payment={p} today={today} />
        ))}
        {s.deposit > 0 && (
          <li className="flex items-center gap-3 py-2.5">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-champagne-600 text-white">
              <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px] text-stone">
              Deposit<span className="text-[13px]"> · paid</span>
            </span>
            <span className="type-figure shrink-0 text-lg !font-light !text-stone">{formatMoney(s.deposit)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

/** One payment as a line inside a card: what, when (paid date once paid), the amount and the £ to mark it paid. */
function PayLine({ payment: p, today }: { payment: Payment; today: string }) {
  const paid = !!p.paid_on;
  const late = !paid && !!p.due_date && p.due_date < today;
  const when = paid ? `paid ${formatDayMonth(p.paid_on!)}` : p.due_date ? `${late ? "overdue · " : "due "}${formatDayMonth(p.due_date)}` : null;
  return (
    <li className="row-press flex items-center gap-3 border-b border-linen last:border-b-0">
      <TickForm
        action={markPaidAction.bind(null, p.id, !paid)}
        undo={markPaidAction.bind(null, p.id, paid)}
        ticking={!paid}
        label="Marked paid"
        ariaLabel={paid ? `Mark "${p.description}" as not paid` : `Mark "${p.description}" as paid`}
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition ${
          paid
            ? "bg-champagne-600 text-white"
            : "border-[1.5px] border-champagne-400 bg-white font-display text-[12px] text-champagne-600 hover:bg-champagne-100"
        }`}
      >
        {paid ? <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden /> : "£"}
      </TickForm>
      <CardLink href={`/money/payments/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-2.5">
        <span className={`min-w-0 flex-1 truncate text-[15px] ${paid ? "text-stone" : "text-ink"}`}>
          {p.description}
          {when && <span className="text-[13px] text-stone"> · {when}</span>}
        </span>
        <span className={`type-figure shrink-0 text-lg !font-light ${paid ? "!text-stone" : ""}`}>{formatMoney(p.amount)}</span>
      </CardLink>
    </li>
  );
}
