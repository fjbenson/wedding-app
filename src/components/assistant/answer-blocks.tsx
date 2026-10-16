"use client";

import Link from "next/link";
import CardLink from "../card-link";
import { Check, ChevronRight, StickyNote, Star } from "lucide-react";
import BudgetBar from "@/components/budget-bar";
import { AnswerIcon } from "@/app/(app)/people/guest-browser";
import { StageIcon } from "@/app/(app)/people/supplier-list";
import { formatDayMonth, formatMonthYear, formatTime, formatWeekdayDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Block } from "@/lib/assistant/blocks";

/**
 * Your assistant's answer blocks (canvas 2 "Your planner · Round 2", owner
 * "absolutely love it", 13 Oct 2026): drawn by the app from a lookup's own
 * data, never retyped by the AI. Each ends with a way into the screen that
 * shows the same thing, already filtered.
 */

const CARD = "mt-3 overflow-hidden rounded-[18px] border border-linen bg-white";
const ROW = "flex items-center gap-3 border-t border-linen px-3.5 py-2.5 first:border-t-0";
const OPEN = "flex items-center justify-between border-t border-linen px-3.5 py-3 text-sm text-champagne-600 hover:text-ink";
const SHOWN = 6;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Initials({ name, star = false }: { name: string; star?: boolean }) {
  return (
    <span className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-linen bg-white font-display text-sm text-champagne-600">
      {initials(name)}
      {star && (
        <span aria-hidden className="absolute -bottom-[3px] -right-[3px] flex h-[17px] w-[17px] items-center justify-center rounded-full bg-champagne-400 shadow-[0_0_0_2px_#fff]">
          <Star className="h-[9px] w-[9px] fill-white text-white" strokeWidth={1.4} />
        </span>
      )}
    </span>
  );
}

function Big({ n, title, meta }: { n: string; title: string; meta?: string }) {
  return (
    <div className="flex items-baseline gap-3 px-4 pb-3 pt-4">
      <span className="font-display text-[52px] font-light leading-[0.9] text-champagne-600">{n}</span>
      <span className="min-w-0">
        <span className="block font-display text-[17px] leading-tight text-ink">{title}</span>
        {meta && <span className="type-meta mt-1 block">{meta}</span>}
      </span>
    </div>
  );
}

function OpenLink({ href, label, onGo }: { href: string; label: string; onGo: () => void }) {
  return (
    <Link href={href} onClick={onGo} className={OPEN}>
      {label}
      <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
    </Link>
  );
}

export default function AnswerBlock({ block, onGo }: { block: Block; onGo: () => void }) {
  switch (block.type) {
    case "guests": {
      const day = block.guests.filter((g) => g.guestOf === "day").length;
      const evening = block.guests.filter((g) => g.guestOf === "evening").length;
      const split = block.count === block.guests.length && day + evening > 0 ? `${day} day · ${evening} evening` : undefined;
      return (
        <div className={CARD}>
          <Big n={String(block.count)} title={block.title} meta={split} />
          {block.guests.length > 0 && (
            <div className="border-t border-linen">
              {block.guests.slice(0, SHOWN).map((g) => (
                <Link key={g.id} href={`/people?guest=${g.id}`} onClick={onGo} className={ROW}>
                  <Initials name={g.name} star={g.roles.length > 0} />
                  <span className="min-w-0 flex-1 truncate font-display text-[17px] text-ink">
                    {g.name} {g.guestOf && <em className="text-[15px] text-champagne-600">{g.guestOf}</em>}
                  </span>
                  <AnswerIcon status={g.answer ?? undefined} />
                </Link>
              ))}
            </div>
          )}
          {block.count > SHOWN && <p className="px-3.5 pb-3 pt-1 text-[13px] text-stone">and {block.count - SHOWN} more</p>}
          <OpenLink href={block.link} label="Open in the guest list" onGo={onGo} />
        </div>
      );
    }

    case "money": {
      const s = block.summary;
      const over = s.stillFree !== null && s.stillFree < 0;
      const top = Math.max(...s.months.map((m) => m.total), 1);
      return (
        <div className={CARD}>
          <div className="px-4 pb-3 pt-4">
            <p className="type-meta">{s.area ? s.area.label : "The whole wedding"}</p>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-[40px] font-light leading-none text-ink">{formatMoney(s.toPay)}</span>
              <span className="text-sm text-stone">still to pay</span>
            </p>
            <div className="mt-3">
              <BudgetBar money={{ budget: s.budget, committed: s.agreed, paid: s.paid }} />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-champagne-600">Paid</dt>
                <dd className="font-display text-lg text-champagne-600">{formatMoney(s.paid)}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone">Agreed</dt>
                <dd className="font-display text-lg text-ink">{formatMoney(s.agreed)}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone">{over ? "Over" : "Still free"}</dt>
                <dd className={`font-display text-lg ${over ? "text-[#9A3F2B]" : "text-ink"}`}>
                  {s.stillFree === null ? "—" : over ? `▲ ${formatMoney(-s.stillFree)}` : formatMoney(s.stillFree)}
                </dd>
              </div>
            </dl>
          </div>
          {s.months.length > 0 && (
            <div className="flex items-end gap-1.5 overflow-x-auto border-t border-linen px-4 pb-3 pt-4">
              {s.months.map((m) => (
                <span key={m.month} className="flex w-9 shrink-0 flex-col items-center gap-1">
                  <span className="block w-full rounded-t-md bg-champagne-400/50" style={{ height: `${8 + (m.total / top) * 56}px` }} />
                  <span className="text-[11px] text-stone">{formatMonthYear(`${m.month}-01`).slice(0, 3)}</span>
                </span>
              ))}
            </div>
          )}
          {s.next.length > 0 && (
            <div className="border-t border-linen">
              {s.next.map((p) => (
                <CardLink key={p.id} href={`/money/payments/${p.id}`} onOpen={onGo} className={ROW}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[16px] text-ink">{p.description}</span>
                    <span className={`type-meta block ${p.overdue ? "!text-[#9A3F2B]" : ""}`}>
                      {p.overdue ? "Overdue · " : ""}
                      {formatWeekdayDayMonth(p.due)}
                      {p.supplier ? ` · ${p.supplier}` : ""}
                    </span>
                  </span>
                  <span className="font-display text-[16px] text-ink">{formatMoney(p.amount)}</span>
                </CardLink>
              ))}
            </div>
          )}
          <OpenLink href={block.summary.link} label="Open in Money" onGo={onGo} />
        </div>
      );
    }

    case "week": {
      return (
        <div className={CARD}>
          <div className="flex items-baseline justify-between px-4 pb-2 pt-4">
            <span className="section-label">This week</span>
            <span className="type-meta">
              {formatDayMonth(block.from)} – {formatDayMonth(block.to)}
            </span>
          </div>
          {block.items.length === 0 ? (
            <p className="px-4 pb-4 font-display text-[17px] italic text-stone">Nothing more this week.</p>
          ) : (
            <div className="border-t border-linen">
              {block.items.slice(0, 8).map((e) => (
                <CardLink key={`${e.kind}-${e.id}`} href={e.link} onOpen={onGo} className={ROW}>
                  <span className={`w-12 shrink-0 font-display text-[15px] ${e.overdue ? "text-[#9A3F2B]" : "text-champagne-600"}`}>
                    {e.overdue ? "Late" : formatWeekdayDayMonth(e.date).split(" ")[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[16px] text-ink">{e.title}</span>
                    <span className="type-meta block">
                      {e.kind === "payment" ? "To pay" : e.kind === "appointment" ? (e.time ? formatTime(e.time) : "Appointment") : "To do"}
                    </span>
                  </span>
                  {e.amount !== undefined && <span className="font-display text-[16px]">{formatMoney(e.amount)}</span>}
                </CardLink>
              ))}
            </div>
          )}
          <OpenLink href={block.link} label="Open the Hub" onGo={onGo} />
        </div>
      );
    }

    case "seating": {
      return (
        <div className={CARD}>
          {block.tables.length === 0 ? (
            <p className="px-4 py-4 font-display text-[17px] italic text-stone">No tables yet.</p>
          ) : (
            block.tables.slice(0, 4).map((t) => (
              <div key={t.id} className="border-t border-linen px-4 py-3.5 first:border-t-0">
                <p className="flex items-baseline justify-between">
                  <span className="font-display text-[18px] text-ink">{t.name}</span>
                  <span className={`type-meta ${t.guests.length > t.seats ? "!text-[#9A3F2B]" : ""}`}>
                    {t.guests.length} of {t.seats} seats
                  </span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {t.guests.map((g) => (
                    <span key={g.id} title={g.name} className="flex h-8 w-8 items-center justify-center rounded-full border border-linen bg-white font-display text-xs text-champagne-600">
                      {initials(g.name)}
                    </span>
                  ))}
                  {Array.from({ length: Math.max(t.seats - t.guests.length, 0) }, (_, i) => (
                    <span key={i} aria-hidden className="h-8 w-8 rounded-full border border-dashed border-champagne-400/60" />
                  ))}
                </div>
              </div>
            ))
          )}
          {block.unseated > 0 && (
            <p className="border-t border-linen px-4 py-2.5 text-[13px] text-stone">{block.unseated} guests still to seat</p>
          )}
          <OpenLink href={block.link} label="Open the seating" onGo={onGo} />
        </div>
      );
    }

    case "suppliers": {
      return (
        <div className={CARD}>
          <Big
            n={String(block.count)}
            title={block.title}
            meta={block.budget !== null ? `Budget ${formatMoney(block.budget)}` : undefined}
          />
          {block.suppliers.length > 0 && (
            <div className="border-t border-linen">
              {block.suppliers.slice(0, SHOWN).map((s) => (
                <Link key={s.id} href={`/people?tab=suppliers&supplier=${s.id}`} onClick={onGo} className={ROW}>
                  <span className="relative">
                    <Initials name={s.name} />
                    <span className="absolute -bottom-[3px] -right-[3px]">
                      <StageIcon status={s.stage} badge />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[17px] text-ink">{s.name}</span>
                    <span className="type-meta block">
                      {s.stageLabel}
                      {s.area ? ` · ${s.area}` : ""}
                    </span>
                  </span>
                  {s.quote !== null && <span className="font-display text-[16px] text-ink">{formatMoney(s.quote)}</span>}
                </Link>
              ))}
            </div>
          )}
          {block.count > SHOWN && <p className="px-3.5 pb-3 pt-1 text-[13px] text-stone">and {block.count - SHOWN} more</p>}
          <OpenLink href={block.link} label="Open in Suppliers" onGo={onGo} />
        </div>
      );
    }

    case "note": {
      return (
        <div className="mt-3">
          <div className="flex max-w-[85%] -rotate-1 items-start gap-2.5 rounded-[4px] bg-[#FFFDF8] px-3.5 py-3 shadow-[0_10px_20px_-12px_rgb(60_45_20/0.45)]">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.7} aria-hidden />
            <span className="font-display text-[16px] italic text-ink">
              {block.body ? `“${block.body}”` : block.url}
            </span>
          </div>
          <Link href="/inbox" onClick={onGo} className="mt-2.5 inline-flex items-center gap-1.5 text-sm text-champagne-600 hover:text-ink">
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
            Saved to your notes
          </Link>
        </div>
      );
    }

    case "lookup": {
      const rows = block.rows.slice(0, SHOWN);
      return (
        <div className={CARD}>
          <Big n={String(block.total)} title={block.title} meta={block.sum ? `${block.sum.total} ${block.sum.label}` : undefined} />
          {block.counts && block.counts.length > 0 && (
            <div className="border-t border-linen px-4 py-2.5">
              {block.counts.map((c) => (
                <div key={c.value} className="flex items-baseline gap-2 py-1 text-sm">
                  <span className="text-ink">{c.value}</span>
                  <span className="mb-1 flex-1 border-b border-dotted border-linen" aria-hidden />
                  <span className="font-display text-champagne-600">{c.count}</span>
                </div>
              ))}
            </div>
          )}
          {rows.map((row, i) => (
            <div key={i} className={ROW}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-ink">{row.primary}</span>
                {row.secondary && <span className="block truncate text-xs text-stone">{row.secondary}</span>}
              </span>
            </div>
          ))}
          {block.total > rows.length && !block.counts && (
            <p className="border-t border-linen px-4 py-2 text-xs text-stone">And {block.total - rows.length} more</p>
          )}
          <OpenLink href={block.link} label="Open it" onGo={onGo} />
        </div>
      );
    }

    case "confirm":
    case "guest_steps":
    case "todo_steps":
    case "payment_steps":
    case "appointment_steps":
      // Drawn by the panel, which owns the Yes.
      return null;
  }
}
