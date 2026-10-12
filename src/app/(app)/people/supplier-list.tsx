"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronRight, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import PageTitle from "@/components/page-title";
import { areaName, type AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { formatMoney } from "@/lib/money";
import { supplierStatusLabel } from "@/lib/supplier-status";
import { replaceQuery } from "@/lib/url-state";
import type { Payment, SupplierStatus } from "@/types/db";
import SupplierCard, { supplierContact, supplierName } from "./supplier-card";

type Show = "all" | "booked" | "quoted" | "enquired";
/** "Looking" was folded into "Asked" (0012_area_stages.sql). */
const stage = (s: Supplier): SupplierStatus => {
  const status = s.supplier_details?.status ?? "enquired";
  return status === "researching" ? "enquired" : status;
};

/**
 * The Suppliers tab of People (screen 12), shaped like the guest list
 * (canvas 2 "Suppliers · Round 1", A, owner's pick 12 Oct 2026): a count
 * card (All · Booked · Quote in · Asked, each one shows just those), search
 * and a Filter by area, then everyone grouped by area in the wedding's own
 * order — so quotes for the same thing sit together. Each row: initials,
 * the business, who to ask for, the quote and a stage icon. Tapping one
 * opens their card (`supplier-card.tsx`). Search, the card's choice, the
 * area filter and an open card live in the address (?q= ?show= ?area=
 * ?supplier=), like the guest list.
 */
export default function SupplierList({
  suppliers,
  areas,
  payments,
}: {
  suppliers: Supplier[];
  areas: (AreaOption & { budget?: number | null })[];
  payments: Payment[];
}) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [show, setShow] = useState<Show>(() => {
    const s = params.get("show");
    return s === "booked" || s === "quoted" || s === "enquired" ? s : "all";
  });
  const [area, setArea] = useState<string | null>(params.get("area"));
  const [openId, setOpenId] = useState<string | null>(params.get("supplier"));
  useEffect(() => {
    replaceQuery({ q: query.trim() || null, show: show === "all" ? null : show, area, supplier: openId });
  }, [query, show, area, openId]);
  const close = useCallback(() => setOpenId(null), []);

  const counts = { booked: 0, quoted: 0, enquired: 0 };
  for (const s of suppliers) {
    const st = stage(s);
    if (st === "booked" || st === "quoted" || st === "enquired") counts[st] += 1;
  }

  const needle = query.trim().toLowerCase();
  const shown = suppliers.filter((s) => {
    if (show !== "all" && stage(s) !== show) return false;
    if (area && (s.supplier_details?.category ?? "") !== area) return false;
    if (!needle) return true;
    return [supplierName(s), supplierContact(s), s.email, s.phone, areaName(s.supplier_details?.category ?? null, areas)]
      .filter(Boolean)
      .some((t) => t!.toLowerCase().includes(needle));
  });

  // Grouped by area in the wedding's own order, anything else after.
  const keys = [...areas.map((a) => a.key), ...new Set(shown.map((s) => s.supplier_details?.category ?? ""))];
  const groups = [...new Set(keys)]
    .map((key) => ({
      key,
      label: key ? (areaName(key, areas) ?? key) : "No area",
      rows: shown
        .filter((s) => (s.supplier_details?.category ?? "") === key)
        // Booked first, then quotes, then asked; not taken last.
        .sort((a, b) => ORDER[stage(a)] - ORDER[stage(b)]),
    }))
    .filter((g) => g.rows.length > 0);
  const usedAreas = areas.filter((a) => suppliers.some((s) => s.supplier_details?.category === a.key));
  const open = suppliers.find((s) => s.id === openId);

  return (
    <>
      <PageTitle drawing="suppliers" spacing="mt-3" className="type-display text-[40px] leading-[1.05] tracking-[-0.02em]">
        {suppliers.length === 0 ? "No suppliers yet." : "Suppliers"}
      </PageTitle>

      {suppliers.length === 0 ? (
        <>
          <p className="mt-2 text-sm text-stone">The venue, the photographer, the florist — everyone you&apos;re asking, and what they cost.</p>
          <Link
            href="/people/suppliers/new"
            className="mt-6 flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-ink px-4 text-sm text-ivory hover:bg-ink/90 lg:w-fit lg:px-6"
          >
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Add a supplier
          </Link>
        </>
      ) : (
        <div className="lg:max-w-xl">
          <CountCard total={suppliers.length} areas={new Set(suppliers.map((s) => s.supplier_details?.category ?? "")).size} counts={counts} show={show} onShow={setShow} />

          <div className="mt-5 flex items-center gap-2">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
              <Search className="h-[17px] w-[17px] shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
              <span className="sr-only">Find a supplier</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a supplier"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
              />
            </label>
            <AreaFilter areas={usedAreas} value={area} onChange={setArea} />
          </div>

          <div className="mt-4 flex min-h-9 items-center justify-between gap-3 px-1">
            <Link href="/people/suppliers/new" className="flex h-9 items-center gap-1 text-sm text-champagne-600 hover:text-ink">
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              Add a supplier
            </Link>
            {(show !== "all" || area || needle) && (
              <button
                type="button"
                onClick={() => {
                  setShow("all");
                  setArea(null);
                  setQuery("");
                }}
                className="h-9 text-[13px] text-stone underline underline-offset-4 hover:text-ink"
              >
                Show everyone
              </button>
            )}
          </div>
          {area && (
            <div className="mt-1 flex px-1">
              <button
                type="button"
                onClick={() => setArea(null)}
                className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 text-[13px] font-medium text-champagne-600"
              >
                {areaName(area, areas)}
                <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                <span className="sr-only">— take off this filter</span>
              </button>
            </div>
          )}

          {groups.length === 0 && <p className="mt-6 px-1 text-sm text-stone">No one matches that.</p>}
          {groups.map((g) => (
            <section key={g.key || "none"} aria-label={g.label}>
              <p className="mt-6 flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-1.5">
                <span className="label">{g.label}</span>
                <span className="text-xs text-stone">{groupNote(g.rows)}</span>
              </p>
              <ul>
                {g.rows.map((s) => (
                  <li key={s.id} className="row-press border-b-[0.5px] border-champagne-400">
                    <SupplierRow supplier={s} onOpen={() => setOpenId(s.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <Key />
        </div>
      )}

      {open && (
        <SupplierCard
          key={open.id}
          supplier={open}
          areas={areas}
          payments={payments.filter((p) => p.contact_id === open.id)}
          onClose={close}
        />
      )}
    </>
  );
}

const ORDER: Record<SupplierStatus, number> = { booked: 0, quoted: 1, enquired: 2, researching: 2, cancelled: 3 };

/** "Booked", or what's still open: "2 quotes · 1 asked". */
function groupNote(rows: Supplier[]) {
  if (rows.some((s) => stage(s) === "booked")) return "Booked";
  const quotes = rows.filter((s) => stage(s) === "quoted").length;
  const asked = rows.filter((s) => stage(s) === "enquired").length;
  return [quotes && `${quotes} ${quotes === 1 ? "quote" : "quotes"}`, asked && `${asked} asked`].filter(Boolean).join(" · ");
}

function CountCard({
  total,
  areas,
  counts,
  show,
  onShow,
}: {
  total: number;
  areas: number;
  counts: Record<"booked" | "quoted" | "enquired", number>;
  show: Show;
  onShow: (show: Show) => void;
}) {
  const all = show === "all";
  const rows: { status: Exclude<Show, "all">; label: string }[] = [
    { status: "booked", label: "Booked" },
    { status: "quoted", label: "Quote in" },
    { status: "enquired", label: "Asked" },
  ];
  return (
    <section
      aria-label="Where you're up to"
      className="mt-6 grid grid-cols-[6.25rem_minmax(0,1fr)] gap-2.5 rounded-[22px] border border-white/85 bg-white/45 p-3 pb-2 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-xl sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3 sm:p-3.5 sm:pb-2.5"
    >
      <button
        type="button"
        aria-pressed={all}
        onClick={() => onShow("all")}
        className={`mb-1 flex flex-col justify-between rounded-2xl p-3 text-left transition ${all ? "bg-ink text-ivory" : "bg-cream text-ink hover:bg-champagne-100"}`}
      >
        <span className={`type-meta ${all ? "text-ivory/75" : ""}`}>All</span>
        <span>
          <span className={`type-figure block text-[46px] leading-none sm:text-[52px] ${all ? "text-ivory" : ""}`}>{total}</span>
          <span className={`mt-1.5 block text-xs ${all ? "text-ivory/75" : "text-stone"}`}>
            in {areas} {areas === 1 ? "area" : "areas"}
          </span>
        </span>
      </button>
      <div className="flex min-w-0 flex-col justify-center">
        {rows.map((row, i) => {
          const on = show === row.status;
          return (
            <button
              key={row.status}
              type="button"
              aria-pressed={on}
              onClick={() => onShow(on ? "all" : row.status)}
              className={`relative flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-left transition sm:gap-2.5 sm:px-2.5 ${
                on ? "bg-white shadow-[0_1px_4px_rgb(60_50_40/0.14)]" : "hover:bg-white/60"
              }`}
            >
              {i > 0 && !on && show !== rows[i - 1].status && <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-linen" />}
              <span className="type-figure min-w-[2.25rem] text-[26px] leading-none tabular-nums text-champagne-600">{counts[row.status]}</span>
              <span className={`type-meta min-w-0 flex-1 leading-tight tracking-[0.12em] ${on ? "text-ink" : ""}`}>{row.label}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone" strokeWidth={2} aria-hidden />
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** A Filter button by the search that drops down the areas in use. */
function AreaFilter({ areas, value, onChange }: { areas: AreaOption[]; value: string | null; onChange: (key: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (areas.length < 2) return null;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 items-center gap-1.5 rounded-full border px-4 text-sm transition ${
          value ? "border-ink bg-ink text-ivory" : "border-linen bg-white text-ink hover:border-champagne-400"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Filter{value && " · 1"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-[18px] bg-white p-2 shadow-[0_18px_40px_-16px_rgba(60,50,40,0.45)]">
          <p className="type-meta px-3 pb-1 pt-2">Area</p>
          {areas.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                onChange(value === a.key ? null : a.key);
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-[15px] text-ink hover:bg-cream"
            >
              {a.label}
              {value === a.key && <Check className="h-4 w-4 text-champagne-600" strokeWidth={2} aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const initials = (name: string) =>
  name
    .replace(/[^\p{L} ]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

function SupplierRow({ supplier, onOpen }: { supplier: Supplier; onOpen: () => void }) {
  const st = stage(supplier);
  const name = supplierName(supplier);
  const quote = supplier.supplier_details?.quoted_cost;
  const notTaken = st === "cancelled";
  return (
    <button type="button" onClick={onOpen} className="flex min-h-[58px] w-full items-center gap-3 py-1.5 text-left">
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-linen bg-white font-display text-sm text-champagne-600 max-[359px]:hidden">
        {initials(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`type-item block break-words text-lg ${notTaken ? "!text-stone line-through" : ""}`}>{name}</span>
        {supplierContact(supplier) && <span className="mt-0.5 block truncate text-[13px] text-stone">{supplierContact(supplier)}</span>}
      </span>
      {quote != null && (
        <span className={`type-figure shrink-0 text-[17px] !font-light ${notTaken ? "!text-stone" : st === "booked" ? "" : "!text-champagne-600"}`}>
          {formatMoney(quote)}
        </span>
      )}
      <StageIcon status={st} />
      <span className="sr-only">{supplierStatusLabel(st)}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
    </button>
  );
}

/** Booked ✓ on ink · Quote in £ on champagne · Asked a dashed ? · Not taken ✕ on grey. */
function StageIcon({ status, small = false }: { status: SupplierStatus; small?: boolean }) {
  const look: Record<string, { ring: string; mark: React.ReactNode }> = {
    booked: { ring: "bg-ink text-ivory", mark: <Check className="h-[55%] w-[55%]" strokeWidth={2.4} /> },
    quoted: { ring: "bg-champagne-100 text-champagne-600 font-display", mark: "£" },
    enquired: { ring: "border-[1.5px] border-dashed border-champagne-400 text-champagne-600 font-display", mark: "?" },
    cancelled: { ring: "bg-[#EEE9E1] text-[#8A837B]", mark: <X className="h-1/2 w-1/2" strokeWidth={2.4} /> },
  };
  const l = look[status] ?? look.enquired;
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full leading-none ${l.ring} ${small ? "h-5 w-5 text-[12px]" : "h-[30px] w-[30px] text-[16px]"}`}>
      {l.mark}
    </span>
  );
}

function Key() {
  return (
    <p className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-stone">
      {(["booked", "quoted", "enquired", "cancelled"] as const).map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <StageIcon status={s} small />
          {supplierStatusLabel(s)}
        </span>
      ))}
    </p>
  );
}
