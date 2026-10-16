"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CardLink from "@/components/card-link";
import { ArrowDown, ArrowUp, Check, ChevronRight, Plus, X } from "lucide-react";
import BudgetBar from "@/components/budget-bar";
import { usePullToClose } from "@/components/use-pull-to-close";
import { areaIcon, type AreaOption } from "@/lib/areas";
import type { Money } from "@/lib/budget";
import { formatDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { replaceQuery } from "@/lib/url-state";
import type { SupplierStatus } from "@/types/db";
import { StageIcon } from "../people/supplier-list";
import MoneyFigures from "./money-figures";
import QuoteCompare from "@/components/quote-compare";

/** What an area's money card lists under its figures. */
export interface AreaDetail {
  suppliers: { id: string; name: string; status: SupplierStatus; quote: number; deposit: number }[];
  /** Still to pay, soonest first (no date last). */
  toPay: { id: string; what: string; amount: number; due: string | null }[];
  paid: { id: string; what: string; amount: number; on: string }[];
  /** Booked suppliers' balances nobody has put a date on yet. */
  balances: { supplierId: string; name: string; balance: number }[];
  /** Food & drink: the cost per guest expected (owner, 17 Oct 2026); `budgeted` while nothing's agreed yet. */
  perHead?: { amount: number; guests: number; budgeted: boolean } | null;
}

/** "£68 a head" — whole pounds, it's a rough guide. */
const aHead = (p: NonNullable<AreaDetail["perHead"]>) => `${formatMoney(Math.round(p.amount))} a head`;

export type AreaCard = AreaOption & Money & { detail: AreaDetail };

/** The short word under an area's bar (short enough for a half-width card). */
function flag(m: Money): { text: string; tone: string } {
  if (m.budget !== null && m.committed > m.budget) {
    return { text: `▲ Over by ${formatMoney(m.committed - m.budget)}`, tone: "text-[#9A3F2B]" };
  }
  if (m.committed > 0 && m.paid >= m.committed) return { text: "✓ All paid", tone: "text-ink" };
  if (m.committed > 0) return { text: `${formatMoney(m.committed - m.paid)} to go`, tone: "text-stone" };
  if (m.budget !== null) return { text: "Not booked yet", tone: "text-stone" };
  return { text: "No budget yet", tone: "text-champagne-600" };
}

/**
 * Money's areas as little cards, two to a row (owner, 12 Oct 2026). Tapping
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
      <BudgetTable areas={areas} onOpen={show} />
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:hidden">
        {areas.map((a) => {
          const note = !a.key && a.committed === 0 && a.paid === 0 ? { text: "Nothing yet", tone: "text-stone" } : flag(a);
          const figure = a.committed > 0 ? formatMoney(a.committed) : a.budget !== null ? formatMoney(a.budget) : "—";
          const ofBudget = a.committed > 0 ? (a.budget !== null ? `of ${formatMoney(a.budget)}` : "agreed") : a.budget !== null ? "budget" : "";
          const Icon = areaIcon(a.key || "other", a.icon);
          return (
            <li key={a.key || "other"}>
              <button
                type="button"
                onClick={() => show(a.key || "other")}
                className="glass-card row-press block h-full w-full overflow-hidden rounded-[22px] p-4 text-left [--row-bleed:16px]"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.6} aria-hidden />
                  <span className="type-item min-w-0 truncate text-[15px]">{a.label}</span>
                </span>
                <span className="mt-3 block type-figure text-[26px] leading-none !font-light">{figure}</span>
                <span className="mt-1 block h-4 text-xs text-stone">{ofBudget}</span>
                {/* No budget and nothing agreed: no bar, just the word. */}
                <span className="mt-2.5 block h-2">{(a.budget !== null || a.committed > 0) && <BudgetBar money={a} />}</span>
                <span className={`mt-2.5 block text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] ${note.tone}`}>
                  {note.text}
                </span>
                {a.detail.perHead && <span className="mt-1 block text-xs text-stone">{aHead(a.detail.perHead)}</span>}
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

          <section className="mt-7">
            <h3 className="section-label">To pay</h3>
            <ul className="mt-1">
              {toPay.map((p) => (
                <li key={p.id} className="row-press border-b border-linen last:border-b-0">
                  <CardLink href={`/money/payments/${p.id}`} className="flex items-center gap-3 py-3">
                    <span className="w-14 shrink-0 text-xs text-stone">{p.due ? formatDayMonth(p.due) : "No date"}</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{p.what}</span>
                    <span className="type-figure shrink-0 text-lg !font-light">{formatMoney(p.amount)}</span>
                  </CardLink>
                </li>
              ))}
              {balances.map((b) => (
                <li key={b.supplierId} className="row-press border-b border-linen last:border-b-0">
                  <Link
                    href={`/money/payments/new?supplier=${b.supplierId}&amount=${b.balance}`}
                    className="flex items-center gap-3 py-3 opacity-70"
                  >
                    <span className="w-14 shrink-0 text-xs italic text-stone">No date</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] italic text-ink">Balance · {b.name}</span>
                    <span className="type-figure shrink-0 text-lg !font-light">{formatMoney(b.balance)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={addPayment} className="mt-2 inline-flex items-center gap-1.5 py-2 text-sm text-champagne-600 hover:text-ink">
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Add a payment
            </Link>
          </section>

          {paid.length > 0 && (
            <section className="mt-5">
              <h3 className="section-label">Paid</h3>
              <ul className="mt-1">
                {paid.map((p) => (
                  <li key={p.id} className="row-press border-b border-linen last:border-b-0">
                    <CardLink href={`/money/payments/${p.id}`} className="flex items-center gap-3 py-3 text-stone">
                      <span className="w-14 shrink-0 text-xs">{formatDayMonth(p.on)}</span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[15px]">
                        <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                        {p.what}
                      </span>
                      <span className="type-figure shrink-0 text-lg !font-light !text-stone">{formatMoney(p.amount)}</span>
                    </CardLink>
                  </li>
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

type Column = "area" | "budget" | "quote" | "committed" | "paid" | "toPay" | "left";

/**
 * Laptops only: the budget as a table (owner's idea, agreed 12 Oct 2026 —
 * "the phone stays high level; the laptop's budget can go to town"). One row
 * per area: Budget · Best quote (the lowest still being weighed up) · Agreed
 * · Paid · To pay · Left (budget minus agreed; over shows ▲ in words, never
 * colour alone). Tap a heading to sort by it, again to flip; tap a row for
 * the area's money, as the cards do on a phone. Totals along the foot.
 */
function BudgetTable({ areas, onOpen }: { areas: AreaCard[]; onOpen: (key: string) => void }) {
  const [sort, setSort] = useState<{ by: Column; down: boolean } | null>(null);
  const quote = (a: AreaCard) => {
    const q = a.detail.suppliers.filter((x) => x.status === "quoted" && x.quote > 0).map((x) => x.quote);
    return q.length ? Math.min(...q) : null;
  };
  const value = (a: AreaCard, by: Column): number | string | null =>
    by === "area" ? a.label
    : by === "budget" ? a.budget
    : by === "quote" ? quote(a)
    : by === "committed" ? a.committed
    : by === "paid" ? a.paid
    : by === "toPay" ? Math.max(a.committed - a.paid, 0)
    : a.budget === null ? null : a.budget - a.committed;
  const rows = sort
    ? [...areas].sort((x, y) => {
        const a = value(x, sort.by);
        const b = value(y, sort.by);
        // Empty cells always last.
        if (a === null) return b === null ? 0 : 1;
        if (b === null) return -1;
        const c = typeof a === "string" ? a.localeCompare(String(b)) : a - (b as number);
        return sort.down ? -c : c;
      })
    : areas;
  const sum = (f: (a: AreaCard) => number | null) => areas.reduce((t, a) => t + (f(a) ?? 0), 0);
  const budgeted = areas.some((a) => a.budget !== null);
  const totalLeft = sum((a) => a.budget) - sum((a) => (a.budget === null ? 0 : a.committed));
  const money = (n: number | null) => (n === null ? <span className="text-stone/60">—</span> : formatMoney(n));
  const left = (n: number | null) =>
    n === null ? <span className="text-stone/60">—</span>
    : n < 0 ? <span className="font-medium text-[#9A3F2B]">▲ {formatMoney(-n)} over</span>
    : formatMoney(n);
  const cols: { key: Column; label: string }[] = [
    { key: "area", label: "Area" },
    { key: "budget", label: "Budget" },
    { key: "quote", label: "Best quote" },
    { key: "committed", label: "Agreed" },
    { key: "paid", label: "Paid" },
    { key: "toPay", label: "To pay" },
    { key: "left", label: "Left" },
  ];

  return (
    <div className="glass-card mt-3 hidden overflow-hidden rounded-[22px] lg:block">
      <table className="w-full text-[15px] tabular-nums">
        <thead>
          <tr className="border-b border-linen">
            {cols.map((c) => {
              const on = sort?.by === c.key;
              const Arrow = sort?.down ? ArrowDown : ArrowUp;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={on ? (sort!.down ? "descending" : "ascending") : "none"}
                  className={`px-4 py-3 font-normal ${c.key === "area" ? "text-left" : "text-right"}`}
                >
                  <button
                    type="button"
                    onClick={() => setSort(on ? { by: c.key, down: !sort!.down } : { by: c.key, down: c.key !== "area" })}
                    className={`type-meta inline-flex items-center gap-1 hover:text-ink ${on ? "!text-ink" : ""}`}
                  >
                    {c.label}
                    {on && <Arrow className="h-3 w-3" strokeWidth={2} aria-hidden />}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const Icon = areaIcon(a.key || "other", a.icon);
            return (
              <tr
                key={a.key || "other"}
                onClick={() => onOpen(a.key || "other")}
                className="cursor-pointer border-b border-linen last:border-b-0 hover:bg-white/70"
              >
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  {/* The row's real button, for keyboards; the whole row takes a click too. */}
                  <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(a.key || "other"); }} className="flex items-center gap-2 text-left text-ink">
                    <Icon className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.6} aria-hidden />
                    {a.label}
                  </button>
                </th>
                <td className="px-4 py-3 text-right">{money(a.budget)}</td>
                <td className="px-4 py-3 text-right text-stone">{money(quote(a))}</td>
                <td className="px-4 py-3 text-right">{money(a.committed || null)}</td>
                <td className="px-4 py-3 text-right">{money(a.paid || null)}</td>
                <td className="px-4 py-3 text-right">{money(Math.max(a.committed - a.paid, 0) || null)}</td>
                <td className="px-4 py-3 text-right">{left(a.budget === null ? null : a.budget - a.committed)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-champagne-400 bg-white/40">
            <th scope="row" className="px-4 py-3 text-left font-medium text-ink">All areas</th>
            <td className="px-4 py-3 text-right font-medium">{money(budgeted ? sum((a) => a.budget) : null)}</td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right font-medium">{money(sum((a) => a.committed))}</td>
            <td className="px-4 py-3 text-right font-medium">{money(sum((a) => a.paid))}</td>
            <td className="px-4 py-3 text-right font-medium">{money(sum((a) => Math.max(a.committed - a.paid, 0)))}</td>
            <td className="px-4 py-3 text-right font-medium">{left(budgeted ? totalLeft : null)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
