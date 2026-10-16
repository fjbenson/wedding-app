"use client";

import Link from "next/link";
import AddButton from "@/components/add-button";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronRight, Mail, Phone, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import PageTitle from "@/components/page-title";
import { areaName, type AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { formatMoney } from "@/lib/money";
import { supplierStatusLabel } from "@/lib/supplier-status";
import { replaceQuery } from "@/lib/url-state";
import type { Payment, SupplierStatus } from "@/types/db";
import SupplierCard, { supplierContact, supplierName } from "./supplier-card";

type Show = "all" | "booked" | "quoted" | "enquired";
type SortBy = "area" | "name";
const SORT_KEY = "supplier-list-sort";
const SORTS: { key: SortBy; label: string; short: string }[] = [
  { key: "area", label: "Area", short: "by area" },
  { key: "name", label: "Name, A–Z", short: "A to Z" },
];
/** "Looking" was folded into "In touch" (0012_area_stages.sql). */
const stage = (s: Supplier): SupplierStatus => {
  const status = s.supplier_details?.status ?? "enquired";
  return status === "researching" ? "enquired" : status;
};

/**
 * The Suppliers tab of People (screen 12), shaped like the guest list
 * (canvas 2 "Suppliers · Round 1", A, owner's pick 12 Oct 2026): a count
 * card (All · Booked · Quote in · In touch, each one shows just those), search
 * and a Filter (areas, Still to pay, No phone or email, Not taken), then
 * everyone grouped by area in the wedding's own
 * order — so quotes for the same thing sit together. Each row: initials,
 * the business, who to ask for, the quote and a stage icon. Tapping one
 * opens their card (`supplier-card.tsx`). Search, the card's choice, the
 * area filter and an open card live in the address (?q= ?show= ?f=
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
  // Filters: areas ("area:venue", any of), plus "topay", "nocontact" and
  // "nottaken" (each narrows further). Old ?area= links still work.
  const [filters, setFilters] = useState<string[]>(() => {
    const asked = (params.get("f") ?? "").split(",").filter(Boolean);
    const old = params.get("area");
    return old ? [...asked, `area:${old}`] : asked;
  });
  const [openId, setOpenId] = useState<string | null>(params.get("supplier"));
  useEffect(() => {
    replaceQuery({ q: query.trim() || null, show: show === "all" ? null : show, f: filters.length ? filters.join(",") : null, area: null, supplier: openId });
  }, [query, show, filters, openId]);
  const toggle = (key: string) => setFilters((on) => (on.includes(key) ? on.filter((k) => k !== key) : [...on, key]));
  const [editField, setEditField] = useState<"phone" | "email">();
  const close = useCallback(() => {
    setOpenId(null);
    setEditField(undefined);
  }, []);

  // By area, or A to Z by business name — a preference kept on this phone
  // until it's changed, like the guest list's sort. Read after the first
  // draw so the server's page and the phone's agree.
  const [sort, setSort] = useState<SortBy>("area");
  const [remembered, setRemembered] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SORT_KEY);
      if (saved === "area" || saved === "name") setSort(saved);
    } catch {
      // Private browsing or blocked storage: start from the default.
    }
    setRemembered(true);
  }, []);
  useEffect(() => {
    if (!remembered) return;
    try {
      window.localStorage.setItem(SORT_KEY, sort);
    } catch {
      // Not remembered, but still works.
    }
  }, [sort, remembered]);

  const counts = { booked: 0, quoted: 0, enquired: 0 };
  for (const s of suppliers) {
    const st = stage(s);
    if (st === "booked" || st === "quoted" || st === "enquired") counts[st] += 1;
  }

  const needle = query.trim().toLowerCase();
  const narrowed = show !== "all" || filters.length > 0 || !!needle;

  // What each filter keeps.
  const owes = (s: Supplier) => {
    const theirs = payments.filter((p) => p.contact_id === s.id);
    if (theirs.some((p) => !p.paid_on)) return true;
    const d = s.supplier_details;
    const paid = (d?.deposit_paid ?? 0) + theirs.reduce((sum, p) => sum + p.amount, 0);
    return stage(s) === "booked" && (d?.quoted_cost ?? 0) - paid > 0.005;
  };
  const tests: Record<string, (s: Supplier) => boolean> = {
    topay: owes,
    nocontact: (s) => !s.phone && !s.email,
    nottaken: (s) => stage(s) === "cancelled",
  };
  const areaOn = filters.filter((f) => f.startsWith("area:")).map((f) => f.slice(5));
  const otherOn = filters.filter((f) => tests[f]);
  const passes = (s: Supplier) =>
    (areaOn.length === 0 || areaOn.includes(s.supplier_details?.category ?? "")) && otherOn.every((f) => tests[f](s));
  const filterRows = [
    ...areas.map((a) => ({ key: `area:${a.key}`, label: a.label, count: suppliers.filter((s) => s.supplier_details?.category === a.key).length })),
    ...OTHER_FILTERS.map((f) => ({ ...f, count: suppliers.filter(tests[f.key]).length })),
  ];
  const labelOf = (key: string) => filterRows.find((r) => r.key === key)?.label ?? key;

  const shown = suppliers.filter((s) => {
    if (show !== "all" && stage(s) !== show) return false;
    if (!passes(s)) return false;
    if (!needle) return true;
    return [supplierName(s), supplierContact(s), s.email, s.phone, areaName(s.supplier_details?.category ?? null, areas)]
      .filter(Boolean)
      .some((t) => t!.toLowerCase().includes(needle));
  });

  // Grouped by area in the wedding's own order, anything else after.
  const cat = (s: Supplier) => s.supplier_details?.category || "other";
  const keys = [...areas.map((a) => a.key), ...new Set(shown.map(cat))];
  const byArea = [...new Set(keys)]
    .map((key) => ({
      key,
      label: areaName(key, areas) ?? key,
      href: areas.some((x) => x.key === key) ? `/area/${encodeURIComponent(key)}` : null,
      rows: shown
        .filter((s) => cat(s) === key)
        // Booked first, then quotes, then in touch; not taken last.
        .sort((a, b) => ORDER[stage(a)] - ORDER[stage(b)]),
    }))
    // With nothing narrowing the list, every area shows — an empty one as a
    // faded row to fill in — so the page has its shape from day one (owner,
    // 12 Oct 2026: "an empty page should still show its structure").
    .filter((g) => g.rows.length > 0 || (!narrowed && areas.some((x) => x.key === g.key)));
  // Or A to Z by business name, one plain list like the guest list's — no
  // letter dividers (owner, 12 Oct 2026). "The" doesn't count.
  const sortName = (s: Supplier) => supplierName(s).replace(/^the\s+/i, "");
  const byName = [
    {
      key: "a-to-z",
      label: "",
      href: null as string | null,
      rows: [...shown].sort((a, b) => sortName(a).localeCompare(sortName(b))),
    },
  ].filter((g) => g.rows.length > 0);
  const groups = sort === "name" ? byName : byArea;
  const open = suppliers.find((s) => s.id === openId);

  return (
    <>
      <PageTitle drawing="suppliers" className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">
        Suppliers
      </PageTitle>

        <div className="lg:max-w-xl">
          <CountCard
            total={suppliers.length}
            areasWith={areas.filter((a) => suppliers.some((s) => s.supplier_details?.category === a.key)).length}
            areas={areas.length}
            counts={counts}
            show={show}
            onShow={setShow}
          />

          <div className="mt-5 flex items-center gap-2">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
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
            <AddButton href="/people/suppliers/new" label="Add a supplier" />
          </div>

          <div className="mt-3 flex min-h-9 items-center justify-between gap-3 px-1">
            <FilterMenu rows={filterRows} areaCount={areas.length} on={filters} onToggle={toggle} onClear={() => setFilters([])} />
            <SortMenu sort={sort} onSort={setSort} />
          </div>
          {filters.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
              {filters.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  aria-label={`Take off ${labelOf(key)}`}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-champagne-600 bg-champagne-100 pl-3 pr-2.5 text-[13px] font-medium text-champagne-600"
                >
                  {labelOf(key)}
                  <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                </button>
              ))}
              <button type="button" onClick={() => setFilters([])} className="h-8 px-1 text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                Clear
              </button>
            </div>
          )}

          {groups.length === 0 && (
            <p className="mt-6 px-1 text-sm text-stone">
              {narrowed ? "No one matches that. " : "Add your first supplier above."}
              {narrowed && (
                <button
                  type="button"
                  onClick={() => {
                    setShow("all");
                    setFilters([]);
                    setQuery("");
                  }}
                  className="text-champagne-600 underline underline-offset-4 hover:text-ink"
                >
                  Show everyone
                </button>
              )}
            </p>
          )}
          {groups.map((g) => (
            <section key={g.key || "none"} aria-label={g.label || "A to Z"}>
              {g.label ? (
                <p className="mt-6 flex items-baseline justify-between gap-3 border-b border-champagne-400 pb-1.5">
                  {/* An area's heading opens its page: where the choosing happens. */}
                  {g.href ? (
                    <Link href={g.href} className="label hover:text-ink">
                      {g.label} ›
                    </Link>
                  ) : (
                    <span className="label">{g.label}</span>
                  )}
                  <span className="text-xs text-stone">{supplierCount(g.rows.length)}</span>
                </p>
              ) : (
                <div aria-hidden className="mt-4 border-b border-champagne-400" />
              )}
              <ul>
                {g.rows.length === 0 && (
                  <li className="row-press border-b-[0.5px] border-champagne-400">
                    <Link href={`/people/suppliers/new?category=${encodeURIComponent(g.key)}&from=suppliers`} className="flex min-h-[58px] items-center gap-3 py-1.5">
                      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 text-champagne-600 max-[359px]:hidden">
                        <Plus className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1 font-display text-lg italic text-stone/70">Add a supplier</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-stone/60" strokeWidth={1.8} aria-hidden />
                    </Link>
                  </li>
                )}
                {g.rows.map((s) => (
                  <li key={s.id} className="row-press border-b-[0.5px] border-champagne-400">
                    <SupplierRow
                      supplier={s}
                      onOpen={(field) => {
                        setEditField(field);
                        setOpenId(s.id);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <Key />
        </div>

      {open && (
        <SupplierCard
          key={open.id}
          supplier={open}
          areas={areas}
          payments={payments.filter((p) => p.contact_id === open.id)}
          editField={editField}
          onClose={close}
        />
      )}
    </>
  );
}

const ORDER: Record<SupplierStatus, number> = { booked: 0, quoted: 1, enquired: 2, researching: 2, cancelled: 3 };

/** "1 supplier", "3 suppliers", "0 suppliers" — like the guest list's counts. */
const supplierCount = (n: number) => `${n} ${n === 1 ? "supplier" : "suppliers"}`;

function CountCard({
  total,
  areasWith,
  areas,
  counts,
  show,
  onShow,
}: {
  total: number;
  /** Areas with anyone in them, of the wedding's areas. */
  areasWith: number;
  areas: number;
  counts: Record<"booked" | "quoted" | "enquired", number>;
  show: Show;
  onShow: (show: Show) => void;
}) {
  const all = show === "all";
  const rows: { status: Exclude<Show, "all">; label: string }[] = [
    { status: "booked", label: "Booked" },
    { status: "quoted", label: "Quote in" },
    { status: "enquired", label: "In touch" },
  ];
  return (
    <section
      aria-label="Where you're up to"
      className="mt-6 grid grid-cols-[6.25rem_minmax(0,1fr)] gap-2.5 rounded-[22px] border-[0.5px] border-white/70 bg-white/50 p-3 pb-2 shadow-[0_0_0_0.5px_rgb(60_50_40/0.06),0_18px_40px_-24px_rgb(60_50_40/0.32)] backdrop-blur-xl sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3 sm:p-3.5 sm:pb-2.5"
    >
      <button
        type="button"
        aria-pressed={all}
        onClick={() => onShow("all")}
        className={`mb-1 flex flex-col justify-between rounded-2xl p-3 text-left transition ${all ? "glass-tile-on text-ink" : "glass-tile text-ink hover:bg-champagne-100/60"}`}
      >
        <span className="type-meta text-champagne-600">All</span>
        <span>
          <span className={`type-figure block text-[46px] leading-none sm:text-[52px] text-ink`}>{total}</span>
          <span className="mt-1.5 block text-xs text-stone">
            {areasWith} of {areas} {areas === 1 ? "area" : "areas"}
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

/** Beyond area: the things worth narrowing a list of suppliers to. Booked is the count card's. */
const OTHER_FILTERS = [
  { key: "topay", label: "Still to pay" },
  { key: "nocontact", label: "No phone or email" },
  { key: "nottaken", label: "Not taken" },
];

/**
 * The Filter button and its menu, as on the guest list: a round button that
 * goes dark with a count when anything's on, and "Show only" — the areas
 * (any of them), then the rest — ticked as you go, no apply step.
 */
function FilterMenu({
  rows,
  areaCount,
  on,
  onToggle,
  onClear,
}: {
  rows: { key: string; label: string; count: number }[];
  /** How many of the rows are areas (they come first). */
  areaCount: number;
  on: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
}) {
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
  const active = on.length;

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={active > 0 ? `Filter, ${active} on` : "Filter"}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-1.5 rounded-full transition ${
          active > 0
            ? "border border-champagne-600 bg-champagne-100 pl-2.5 pr-3 text-[13px] font-medium text-champagne-600"
            : "type-meta hover:text-ink"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
        {active > 0 ? `Filter · ${active}` : "Filter"}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 max-h-[70dvh] w-[17rem] overflow-y-auto rounded-[20px] border border-linen bg-white px-4 pb-2 pt-2.5 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]">
          <div className="flex items-baseline justify-between py-1">
            <span className="section-label">Show only</span>
            {active > 0 && (
              <button type="button" onClick={onClear} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
                Clear
              </button>
            )}
          </div>
          <ul>
            {rows.map((f, i) => {
              const ticked = on.includes(f.key);
              return (
                // A firmer line between the areas and the rest.
                <li key={f.key} className={`border-t first:border-t-0 ${i === areaCount && i > 0 ? "border-champagne-400" : "border-linen"}`}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={ticked}
                    onClick={() => onToggle(f.key)}
                    className="flex min-h-11 w-full items-center gap-3 text-left text-sm text-ink"
                  >
                    <span
                      aria-hidden
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
                        ticked ? "bg-ink text-ivory" : "border-[1.5px] border-[#D8D0C4]"
                      }`}
                    >
                      {ticked && <Check className="h-3 w-3" strokeWidth={2.6} />}
                    </span>
                    <span className="flex-1">{f.label}</span>
                    <span className="text-[13px] text-stone">{f.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** "BY AREA ⌄" on the line above the list — the guest list's Sort, for suppliers. */
function SortMenu({ sort, onSort }: { sort: SortBy; onSort: (s: SortBy) => void }) {
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
  const current = SORTS.find((o) => o.key === sort)!;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Sort: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        className="type-meta flex h-9 items-center gap-1 hover:text-ink"
      >
        {current.short}
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[14rem] rounded-[20px] border border-linen bg-white px-4 pb-1.5 pt-2.5 shadow-[0_24px_50px_-20px_rgb(30_27_24/0.45)]">
          <span className="section-label block py-1">Sort by</span>
          <ul>
            {SORTS.map((o) => (
              <li key={o.key} className="border-t border-linen first:border-t-0">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={sort === o.key}
                  onClick={() => {
                    onSort(o.key);
                    setOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center gap-3 text-left text-sm text-ink"
                >
                  <span className="flex-1">{o.label}</span>
                  {sort === o.key && <Check className="h-4 w-4 text-ink" strokeWidth={2.4} aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
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

/**
 * One supplier, like a phone book entry (canvas 2 "Suppliers · Round 2", A,
 * owner's pick 12 Oct 2026): initials with the stage as a badge on them
 * (as a guest's role star sits on theirs), the business and who to ask
 * for, then round Call and Email buttons — the quote and the rest are one
 * tap away on the card. A missing number or email shows greyed out, and
 * tapping it opens the card ready to type it in.
 */
function SupplierRow({ supplier, onOpen }: { supplier: Supplier; onOpen: (field?: "phone" | "email") => void }) {
  const st = stage(supplier);
  const name = supplierName(supplier);
  const phone = supplier.phone?.replace(/\s+/g, "");
  const notTaken = st === "cancelled";
  const action = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-linen bg-white text-ink hover:border-champagne-400";
  // Not added yet: greyed out with a dashed edge; a tap opens the card ready to fill it in.
  const missing = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-stone/30 text-stone/40 hover:border-champagne-400 hover:text-champagne-600";
  return (
    <div className="flex min-h-[62px] items-center gap-2">
      <button type="button" onClick={() => onOpen()} className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left">
        <span aria-hidden className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-linen bg-white font-display text-sm text-champagne-600 max-[359px]:hidden">
          {initials(name)}
          <span className="absolute -bottom-1 -right-1.5">
            <StageIcon status={st} badge />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={`type-item block break-words text-lg ${notTaken ? "!text-stone line-through" : ""}`}>{name}</span>
          {supplierContact(supplier) && <span className="mt-0.5 block truncate text-[13px] text-stone">{supplierContact(supplier)}</span>}
          <span className="sr-only">, {supplierStatusLabel(st)}</span>
        </span>
      </button>
      {phone ? (
        <a href={`tel:${phone}`} aria-label={`Call ${name}`} className={action}>
          <Phone className="h-[17px] w-[17px]" strokeWidth={1.6} aria-hidden />
        </a>
      ) : (
        <button type="button" onClick={() => onOpen("phone")} aria-label={`Add a phone number for ${name}`} className={missing}>
          <Phone className="h-[17px] w-[17px]" strokeWidth={1.6} aria-hidden />
        </button>
      )}
      {supplier.email ? (
        <a href={`mailto:${supplier.email}`} aria-label={`Email ${name}`} className={action}>
          <Mail className="h-[17px] w-[17px]" strokeWidth={1.6} aria-hidden />
        </a>
      ) : (
        <button type="button" onClick={() => onOpen("email")} aria-label={`Add an email for ${name}`} className={missing}>
          <Mail className="h-[17px] w-[17px]" strokeWidth={1.6} aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Booked ✓ on ink · Quote in £ on champagne · In touch a dashed ? · Not taken ✕ on grey. */
export function StageIcon({ status, small = false, badge = false }: { status: SupplierStatus; small?: boolean; badge?: boolean }) {
  const look: Record<string, { ring: string; mark: React.ReactNode }> = {
    // Gold like a guest's Coming, not ink (owner, 13 Oct 2026).
    booked: { ring: "bg-champagne-600 text-white", mark: <Check className="h-[55%] w-[55%]" strokeWidth={2.4} /> },
    quoted: { ring: "bg-champagne-100 text-champagne-600 font-display", mark: "£" },
    enquired: { ring: "border-[1.5px] border-dashed border-champagne-400 bg-ivory text-champagne-600 font-display", mark: "?" },
    cancelled: { ring: "bg-[#EEE9E1] text-[#8A837B]", mark: <X className="h-1/2 w-1/2" strokeWidth={2.4} /> },
  };
  const l = look[status] ?? look.enquired;
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full leading-none ${l.ring} ${
        badge ? "h-[19px] w-[19px] text-[10px] shadow-[0_0_0_2px_#FBF9F5]" : small ? "h-5 w-5 text-[12px]" : "h-[26px] w-[26px] text-[14px]"
      }`}>
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
