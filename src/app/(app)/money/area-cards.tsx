"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, X } from "lucide-react";
import BudgetBar from "@/components/budget-bar";
import { usePullToClose } from "@/components/use-pull-to-close";
import { areaIcon, type AreaOption } from "@/lib/areas";
import type { Money } from "@/lib/budget";
import { formatMoney } from "@/lib/money";
import type { mealCost } from "@/lib/meals";
import { replaceQuery } from "@/lib/url-state";
import type { Payment, SupplierStatus } from "@/types/db";
import PaymentRow from "@/components/payment-row";
import { todayISO } from "@/lib/dates";
import { StageIcon } from "../people/supplier-list";
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
  Booked: "bg-champagne-600 text-white",
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
                  {stage && <span className={`inline-block rounded-full px-2.5 py-[3px] text-xs ${PILL[stage]}`}>{stage}</span>}
                </span>
                {stage === "Booked" && (
                  <>
                    <span className="mt-2.5 block h-2">
                      <BudgetBar money={{ budget: null, committed: a.committed, paid: a.paid }} />
                    </span>
                    <span className="mt-2.5 block text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] text-stone">
                      {a.paid >= a.committed ? "✓ All paid" : `${formatMoney(a.committed - a.paid)} to go`}
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {current && <AreaMoneySheet area={current} onClose={() => show(null)} />}
    </>
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
  const listed = live.filter((s) => !comparing.includes(s));
  const today = todayISO();
  const who = (p: Payment) => suppliers.find((x) => x.id === p.contact_id)?.name ?? null;
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
            <MoneyFigures money={area} size={36} />
          </div>
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
              {/* Two or more quotes and no one booked: compare them; a tap opens their card on the area page, where you decide. */}
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
              <ul className="mt-1">
                {listed.map((s) => (
                  <li key={s.id} className="row-press border-b border-linen last:border-b-0">
                    <Link href={`/people/${s.id}`} className="flex items-center gap-3 py-3">
                      <StageIcon status={s.status} small />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-ink">{s.name}</span>
                        {s.deposit > 0 && (
                          <span className="block text-xs text-stone">{formatMoney(s.deposit)} deposit paid</span>
                        )}
                      </span>
                      <span className={`type-figure shrink-0 text-lg !font-light ${s.status === "booked" ? "" : "!text-stone"}`}>
                        {s.quote > 0 ? formatMoney(s.quote) : "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* The same rows as Money's By month, on a card (owner, 17 Oct 2026: these were flat). */}
          <section className="mt-7">
            <h3 className="section-label">To pay</h3>
            {(toPay.length > 0 || balances.length > 0) && (
              <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
                {toPay.map((p) => (
                  <PaymentRow key={p.id} payment={p} today={today} who={who(p)} />
                ))}
                {balances.map((b) => (
                  <li key={b.supplierId} className="row-press border-b border-ink/[0.12] last:border-b-0">
                    <Link href={`/money/payments/new?supplier=${b.supplierId}&amount=${b.balance}`} className="flex items-center gap-3.5 py-3">
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
            )}
            <Link href={addPayment} className="mt-2 inline-flex items-center gap-1.5 py-2 text-sm text-champagne-600 hover:text-ink">
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Add a payment
            </Link>
          </section>

          {paid.length > 0 && (
            <section className="mt-5">
              <h3 className="section-label">Paid</h3>
              <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
                {paid.map((p) => (
                  <PaymentRow key={p.id} payment={p} today={today} who={who(p)} />
                ))}
              </ul>
            </section>
          )}

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

