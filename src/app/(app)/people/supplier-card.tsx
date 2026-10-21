"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Check, ChevronRight, Globe, Mail, MoreHorizontal, Phone, X } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { useBeside } from "@/components/card-sheet";
import { usePullToClose } from "@/components/use-pull-to-close";
import { areaName, supplierCategories, type AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { formatWeekdayDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Payment, SupplierStatus } from "@/types/db";
import { SaveCancel, TextRow, editorKeys, safely, useSaver } from "./guest-card";
import { AreaTiles } from "@/components/visual-form";
import { areaIcon } from "@/lib/areas";
import { SUPPLIER_STAGES } from "@/lib/supplier-status";
import { withCommas } from "@/lib/money";
import { deleteSupplierAction, updateSupplierAction, type SupplierEdit } from "./supplier-actions";
import SupplierFiles from "@/components/supplier-files";
import SupplierDecor from "@/components/supplier-decor";
import Timeline from "@/components/timeline";

export function supplierName(s: Supplier) {
  return s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");
}

/** The person to ask for, when it isn't just the business's name again. */
export function supplierContact(s: Supplier) {
  const person = [s.first_name, s.last_name].filter(Boolean).join(" ");
  return person && person !== s.supplier_details?.company_name ? person : null;
}

/**
 * One supplier, over the list (canvas 2 "Suppliers · Round 1", B, owner's
 * pick 12 Oct 2026): a sheet on a phone, a panel on the right on a laptop,
 * like the guest card. Since 12 Oct 2026 it's the add-a-supplier form filled
 * in (owner: the card looked nothing like the form), with Call · Email ·
 * Website under the name and Cancel / Save changes once something's changed.
 */
export default function SupplierCard({
  supplier,
  areas,
  payments,
  editField,
  onClose,
}: {
  supplier: Supplier;
  /** Open with this detail ready to fill in (the list's greyed-out buttons). */
  editField?: "phone" | "email";
  /** The wedding's areas, with each one's budget if set. */
  areas: (AreaOption & { budget?: number | null })[];
  /** Payments recorded for this supplier. */
  payments: Payment[];
  onClose: () => void;
}) {
  const name = supplierName(supplier);
  const d = supplier.supplier_details;
  const area = areas.find((a) => a.key === d?.category);
  // Paid up: booked, and what was agreed (the quote, else the payments) is paid.
  const paidSoFar = (d?.deposit_paid ?? 0) + payments.filter((p) => p.paid_on).reduce((sum, p) => sum + p.amount, 0);
  const paidUp =
    d?.status === "booked" &&
    (d.quoted_cost && d.quoted_cost > 0 ? paidSoFar >= d.quoted_cost : payments.length > 0 && payments.every((p) => p.paid_on));
  const moneyHref = area ? `/money?view=month&area=${encodeURIComponent(area.key)}` : "/money?view=month";
  const drag = usePullToClose(onClose);
  const phone = supplier.phone?.replace(/\s+/g, "");
  const [error, setError] = useState<string>();
  const save = async (edit: SupplierEdit) => {
    const result = await safely(() => updateSupplierAction(supplier.id, edit));
    return result;
  };
  const site = websiteHref(d?.website ?? null);
  // Which Contact box to open ready to type: from the list's dashed buttons
  // (editField) or the card's own (addField). `n` redraws the row to open it.
  const [adding, setAdding] = useState<{ field?: "phone" | "email"; n: number }>({ field: editField, n: 0 });
  const phoneRow = useRef<HTMLDivElement>(null);
  const emailRow = useRef<HTMLDivElement>(null);
  const addField = (field: "phone" | "email") => {
    setAdding((a) => ({ field, n: a.n + 1 }));
    requestAnimationFrame(() => (field === "phone" ? phoneRow : emailRow).current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  // Escape closes it, and the list behind doesn't scroll while it's open.
  // On a laptop it sits beside the list instead (as CardSheet's `beside`).
  const wide = useBeside(true);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    if (wide) return () => document.removeEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, wide]);

  return (
    <div className={`fixed inset-0 z-50 ${wide ? "left-auto w-[440px]" : ""}`} role="dialog" aria-modal={!wide} aria-label={name}>
      {!wide && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
          className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
        />
      )}
      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        className={`absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none ${
          wide ? "border-l border-champagne-400/45 lg:shadow-[-24px_0_50px_-36px_rgb(60_50_40/0.4)]" : "lg:rounded-l-[28px]"
        } ${drag.dragging ? "" : "transition-transform duration-200 ease-out"}`}
      >
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>

        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] pt-0 lg:pt-8">
          <div onPointerDown={drag.start} className="flex touch-none items-center gap-3 lg:touch-auto">
            {/* The area is the tag on the business card now. */}
            <div className="min-w-0 flex-1" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          </div>

          {error && (
            <p role="alert" className="mb-3 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
              {error}
            </p>
          )}

          {/* Canvas 2 "Suppliers · Round 3", A (owner's pick 13 Oct 2026:
              "business card baby you nailed it"): something to look at, each
              part changed by tapping it — no longer the add form filled in. */}
          <BusinessCard supplier={supplier} areas={areas} phone={phone} site={site} onError={setError} onAdd={addField} />

          <Progress supplierId={supplier.id} status={d?.status ?? "enquired"} paidUp={paidUp} moneyHref={moneyHref} onError={setError} />

          <MoneyPart supplier={supplier} area={area} payments={payments} onError={setError} />

          {/* Their contract, quotes and invoices (canvas 2 "Files · Round 1", A). */}
          <SupplierFiles supplierId={supplier.id} weddingId={supplier.wedding_id} areaKey={d?.category ?? null} supplierName={name} />

          {/* What they lend or hire out, from Decor (owner, 19 Oct 2026). */}
          <SupplierDecor supplierId={supplier.id} />

          <section className="mt-7">
            <h2 className="section-label font-body">Contact</h2>
            <dl className="mt-1">
              <TextRow label="Contact person" value={supplierContact(supplier)} onSave={(v) => save({ field: "contact_name", value: v })} />
              <div ref={phoneRow}>
                <TextRow key={`phone-${adding.n}`} label="Phone" type="tel" value={supplier.phone} startEditing={adding.field === "phone"} onSave={(v) => save({ field: "phone", value: v })} />
              </div>
              <div ref={emailRow}>
                <TextRow key={`email-${adding.n}`} label="Email" type="email" value={supplier.email} startEditing={adding.field === "email"} onSave={(v) => save({ field: "email", value: v })} />
              </div>
              <TextRow label="Website" value={d?.website ?? null} onSave={(v) => save({ field: "website", value: v })} />
              {d?.contract_url && <TextRow label="Contract link" value={d.contract_url} onSave={(v) => save({ field: "contract_url", value: v })} />}
              <TextRow label="Notes" multiline value={supplier.notes} onSave={(v) => save({ field: "notes", value: v })} />
            </dl>
          </section>

          {/* Everything with them, past and to come (canvas 3 "Timeline · Round 3"), folded to one line after Contact (owner, 20 Oct 2026). */}
          <section className="mt-6 -mx-[22px] border-y border-linen px-[22px]">
            <Timeline scope={`supplier:${supplier.id}`} folded />
          </section>

          <NotTaken supplierId={supplier.id} status={d?.status ?? "enquired"} quoted={d?.quoted_cost != null} />

          {area && (
            <Link
              href={`/area/${encodeURIComponent(area.key)}`}
              className="mt-6 flex h-12 items-center justify-center rounded-full border border-champagne-400 text-[15px] text-ink hover:bg-cream"
            >
              Open the {area.label} page ›
            </Link>
          )}

          <RemoveSupplier id={supplier.id} name={name} />
        </div>
      </div>
    </div>
  );
}

/**
 * "We didn't go with them" (not taken): greys them out on the list and keeps
 * their quote; "Bring them back" undoes it. Saves at once, apart from the form.
 */
function NotTaken({ supplierId, status, quoted }: { supplierId: string; status: SupplierStatus; quoted: boolean }) {
  const [current, setCurrent] = useOptimistic<SupplierStatus>(status);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const set = (next: SupplierStatus) =>
    startTransition(async () => {
      setCurrent(next);
      setError((await safely(() => updateSupplierAction(supplierId, { field: "status", value: next }))).error);
    });
  return (
    <div className="mt-2">
      {current === "cancelled" ? (
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-stone">
          You didn&apos;t go with them.
          <button type="button" onClick={() => set(quoted ? "quoted" : "enquired")} className="min-h-11 text-champagne-600 underline underline-offset-4 hover:text-ink">
            Bring them back
          </button>
        </p>
      ) : (
        <button type="button" onClick={() => set("cancelled")} className="min-h-11 text-sm text-stone underline underline-offset-4 hover:text-ink">
          We didn&apos;t go with them
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
    </div>
  );
}

/** Taking them off altogether — asks first, on the card itself. */
function RemoveSupplier({ id, name }: { id: string; name: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="mt-6 w-full py-3 text-sm text-stone underline underline-offset-4 hover:text-ink">
        Remove this supplier
      </button>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-linen bg-white p-4 text-center">
      <p className="text-sm text-ink">Remove {name}? Their payments stay in Money.</p>
      <div className="mt-3 flex justify-center gap-2">
        <form action={deleteSupplierAction.bind(null, id)}>
          <InlineSubmit label="Yes, remove" pendingLabel="Removing…" />
        </form>
        <button type="button" onClick={() => setAsking(false)} className="rounded-full px-3 py-1.5 text-sm text-stone hover:text-ink">
          Keep them
        </button>
      </div>
    </div>
  );
}

/** "ellierose.co.uk" → "https://ellierose.co.uk"; anything that isn't a web address → null. */
function websiteHref(value: string | null): string | null {
  const v = value?.trim();
  if (!v || /\s/.test(v)) return null;
  const href = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(href).hostname.includes(".") ? href : null;
  } catch {
    return null;
  }
}

const STAMP: Record<SupplierStatus, string> = {
  booked: "Booked ✓",
  quoted: "Quote in",
  enquired: "In touch",
  researching: "In touch",
  cancelled: "Not taken",
};

/**
 * The top of the card: a cream business card — the stage stamped in gold,
 * the area as a tag (tap to move them), the name large (tap to rename), the
 * person and the website under it, then round Call · Email · Website.
 */
function BusinessCard({
  supplier,
  areas,
  phone,
  site,
  onError,
  onAdd,
}: {
  supplier: Supplier;
  areas: AreaOption[];
  phone: string | undefined;
  site: string | null;
  onError: (message?: string) => void;
  /** A missing phone or email was tapped: open its box in Contact. */
  onAdd: (field: "phone" | "email") => void;
}) {
  const d = supplier.supplier_details;
  const name = supplierName(supplier);
  const person = supplierContact(supplier);
  const category = d?.category ?? null;
  const area = areas.find((a) => a.key === category);
  const AreaIcon = category && category !== "other" ? areaIcon(category, area?.icon) : MoreHorizontal;
  const [picking, setPicking] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);
  const { pending, error, run } = useSaver();
  const rename = () =>
    run(() => safely(() => updateSupplierAction(supplier.id, { field: "company_name", value: draft })), () => setRenaming(false));

  const button = (dark: boolean) =>
    `flex h-[52px] w-[52px] items-center justify-center rounded-full ${dark ? "bg-ink text-ivory" : "border border-linen bg-white text-ink"}`;
  // A missing phone or email shows as a faded dashed button, like the list's,
  // that takes you to its box in Contact ready to type (owner, 16 Oct 2026).
  const buttons = [
    phone ? { href: `tel:${phone}`, label: "Call", Icon: Phone } : { add: "phone" as const, label: "Call", Icon: Phone },
    supplier.email ? { href: `mailto:${supplier.email}`, label: "Email", Icon: Mail } : { add: "email" as const, label: "Email", Icon: Mail },
    site && { href: site, label: "Website", Icon: Globe, out: true },
  ].filter(Boolean) as { href?: string; add?: "phone" | "email"; label: string; Icon: typeof Phone; out?: boolean }[];
  const dark = buttons.findIndex((b) => b.href);

  return (
    <>
      <div className="relative mt-1 rounded-[10px] bg-[#FFFDF8] px-5 pb-5 pt-[22px] shadow-[0_18px_34px_-20px_rgb(60_45_20/0.5),0_0_0_1px_#EDE4D3]">
        <button
          type="button"
          onClick={() => setPicking((p) => !p)}
          aria-expanded={picking}
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-champagne-100 px-2.5 py-1 text-[12px] font-semibold text-champagne-600"
        >
          <AreaIcon aria-hidden className="h-3.5 w-3.5" strokeWidth={1.8} />
          {area?.label ?? (category === "other" ? "Other" : "Pick an area")}
        </button>
        <p className="type-meta !text-champagne-600">{STAMP[d?.status ?? "enquired"]}</p>

        {renaming ? (
          <form
            className="mt-2"
            onSubmit={(event) => {
              event.preventDefault();
              rename();
            }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={editorKeys(rename, () => setRenaming(false))}
              aria-label="Business name"
              className="w-full rounded-xl border border-linen bg-white px-3 py-2 font-display !text-[24px] font-light text-ink focus:border-champagne-400 focus:outline-none"
            />
            {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
            <SaveCancel pending={pending} onCancel={() => setRenaming(false)} />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(name);
              setRenaming(true);
            }}
            className="mt-2.5 block pr-24 text-left font-display text-[30px] font-light leading-[1.05] tracking-[-0.01em] text-ink"
          >
            {name}
          </button>
        )}
        {(person || d?.website) && (
          <p className="mt-2.5 text-sm text-stone">{[person, d?.website?.replace(/^https?:\/\//, "").replace(/\/$/, "")].filter(Boolean).join(" · ")}</p>
        )}

        {buttons.length > 0 && (
          <div className="mt-5 flex justify-center gap-8">
            {buttons.map((b, i) =>
              b.add ? (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => onAdd(b.add!)}
                  aria-label={b.add === "phone" ? "Add their phone number" : "Add their email"}
                  className="flex flex-col items-center gap-1.5 text-[13px] text-stone/60"
                >
                  <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed border-stone/30 text-stone/40">
                    <b.Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                  </span>
                  {b.label}
                </button>
              ) : (
                <a
                  key={b.label}
                  href={b.href}
                  {...(b.out ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="flex flex-col items-center gap-1.5 text-[13px] text-ink"
                >
                  <span className={button(i === dark)}>
                    <b.Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                  </span>
                  {b.label}
                </a>
              ),
            )}
          </div>
        )}
      </div>

      {picking && (
        <div className="mt-3">
          <p className="section-label">What they do</p>
          <AreaTiles
            name="move_area"
            areas={supplierCategories(areas)}
            otherValue="other"
            value={category ?? "\u0000"}
            onChange={async (value) => {
              setPicking(false);
              onError((await safely(() => updateSupplierAction(supplier.id, { field: "category", value }))).error);
            }}
          />
        </div>
      )}
    </>
  );
}

/**
 * In touch → Quote in → Booked → Paid, as steps joined by a line that fills
 * gold. A step ticks when it's been reached, like the area page's stages
 * (owner, 21 Oct 2026); the first one not ticked is where they are. Tap one
 * of the first three to move them on (or back); Paid ticks itself from
 * Money, so it opens Money instead.
 */
function Progress({
  supplierId,
  status,
  paidUp,
  moneyHref,
  onError,
}: {
  supplierId: string;
  status: SupplierStatus;
  paidUp: boolean;
  moneyHref: string;
  onError: (message?: string) => void;
}) {
  const [current, setCurrent] = useOptimistic<SupplierStatus>(status === "researching" ? "enquired" : status);
  const [, startTransition] = useTransition();
  const at = SUPPLIER_STAGES.findIndex((s) => s.status === current);
  const set = (next: SupplierStatus) =>
    startTransition(async () => {
      setCurrent(next);
      onError((await safely(() => updateSupplierAction(supplierId, { field: "status", value: next }))).error);
    });
  const steps = [...SUPPLIER_STAGES.map((s) => ({ key: s.status as string, label: s.label })), { key: "paid", label: "Paid" }];
  const done = steps.map((_, i) => (i < SUPPLIER_STAGES.length ? at >= 0 && i <= at : at === SUPPLIER_STAGES.length - 1 && paidUp));
  for (let i = done.length - 1; i > 0; i--) if (done[i]) done[i - 1] = true;
  const here = at >= 0 ? done.indexOf(false) : -1;

  return (
    <section className="mt-7">
      <h2 className="section-label font-body">Progress</h2>
      <div className="mt-3 flex items-start">
        {steps.map((step, i) => {
          const isHere = i === here;
          const mark = (
            <>
              <span
                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full ${
                  done[i] ? "bg-champagne-600 text-white" : isHere ? "border-2 border-champagne-600 bg-white" : "border-[1.5px] border-[#D8D0C4] bg-white"
                }`}
              >
                {done[i] && <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />}
              </span>
              <span className={`text-[12px] ${isHere ? "font-semibold text-ink" : "text-stone"}`}>{step.label}</span>
            </>
          );
          return (
            <div key={step.key} className="flex flex-1 items-start last:flex-none">
              {i < SUPPLIER_STAGES.length ? (
                <button
                  type="button"
                  onClick={() => set(SUPPLIER_STAGES[i].status)}
                  aria-pressed={done[i]}
                  className="flex w-16 flex-col items-center gap-1.5"
                >
                  {mark}
                </button>
              ) : (
                <Link href={moneyHref} className="flex w-16 flex-col items-center gap-1.5">
                  {mark}
                </Link>
              )}
              {i < steps.length - 1 && <span aria-hidden className={`mt-3 h-0.5 flex-1 ${done[i + 1] ? "bg-champagne-600" : "bg-linen"}`} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** A figure you tap to change: the quote, the deposit. */
function Figure({ label, value, align = "left", onSave }: { label: string; value: number | null; align?: "left" | "right"; onSave: (v: string) => Promise<{ error?: string }> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const { pending, error, setError, run } = useSaver();
  const submit = () => run(() => onSave(draft), () => setEditing(false));
  if (editing) {
    return (
      <form
        className="min-w-0 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <span className="type-meta block">{label}</span>
        <span className="mt-1 flex items-baseline gap-1 rounded-xl border border-linen bg-white px-3">
          <span className="font-display text-[20px] text-stone">£</span>
          <input
            autoFocus
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(withCommas(e.target.value))}
            onKeyDown={editorKeys(submit, () => setEditing(false))}
            aria-label={label}
            className="w-full min-w-0 bg-transparent py-1.5 font-display !text-[22px] font-light text-ink focus:outline-none"
          />
        </span>
        {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
        <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
      </form>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value != null ? withCommas(String(value)) : "");
        setError(undefined);
        setEditing(true);
      }}
      className={`min-w-0 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <span className="type-meta block">{label}</span>
      <span className={`mt-0.5 block font-display text-[26px] font-light leading-tight ${value == null ? "text-stone/60" : "text-ink"}`}>
        {value == null ? "Add" : formatMoney(value)}
      </span>
    </button>
  );
}

/**
 * Money in one card (owner, 13 Oct 2026: it "gets a bit messy"): the quote
 * and the deposit (tap to change), one bar of what's paid, what's left, the
 * area's budget as a small line, then the next payment — which opens the
 * payments themselves, not the area page.
 */
function MoneyPart({
  supplier,
  area,
  payments,
  onError,
}: {
  supplier: Supplier;
  area: (AreaOption & { budget?: number | null }) | undefined;
  payments: Payment[];
  onError: (message?: string) => void;
}) {
  const d = supplier.supplier_details;
  const quote = d?.quoted_cost ?? null;
  const deposit = d?.deposit_paid ?? null;
  const paid = (deposit ?? 0) + payments.filter((p) => p.paid_on).reduce((sum, p) => sum + p.amount, 0);
  const next = payments.filter((p) => !p.paid_on).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))[0];
  const href = area ? `/money?view=month&area=${encodeURIComponent(area.key)}` : "/money?view=month";
  const save = async (field: "quoted_cost" | "deposit_paid", value: string) => {
    const result = await safely(() => updateSupplierAction(supplier.id, { field, value }));
    onError(undefined);
    return result;
  };

  return (
    <section className="mt-7">
      <h2 className="section-label font-body">Money</h2>
      <div className="mt-3 rounded-[18px] border border-linen bg-white/75 p-4">
        <div className="flex items-start justify-between gap-4">
          <Figure label="Quote" value={quote} onSave={(v) => save("quoted_cost", v)} />
          <Figure label="Deposit paid" value={deposit} align="right" onSave={(v) => save("deposit_paid", v)} />
        </div>
        {quote != null && quote > 0 && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-champagne-100">
              <span className="block h-full rounded-full bg-champagne-600" style={{ width: `${Math.min(100, (paid / quote) * 100)}%` }} />
            </div>
            <p className="mt-2 flex justify-between gap-3 text-[13px] text-stone">
              <span>{paid >= quote ? "✓ All paid" : `${formatMoney(quote - paid)} to go`}</span>
              {area?.budget != null && <span>{area.label} budget {formatMoney(area.budget)}</span>}
            </p>
          </>
        )}
        {payments.length > 0 ? (
          <Link href={href} className="mt-3.5 flex min-h-11 items-center gap-2.5 border-t border-linen pt-3 text-ink hover:text-champagne-600">
            <span className="min-w-0 flex-1">
              <span className="type-meta block">{next ? "Next payment" : "Payments"}</span>
              <span className="type-item block">
                {next ? `${formatMoney(next.amount)}${next.due_date ? ` · ${formatWeekdayDayMonth(next.due_date)}` : ""}` : "All paid"}
              </span>
            </span>
            <span className="shrink-0 text-[13px] text-champagne-600">
              {payments.length} {payments.length === 1 ? "payment" : "payments"} ›
            </span>
          </Link>
        ) : (
          <Link
            href={`/money/payments/new?supplier=${supplier.id}`}
            className="mt-3.5 flex min-h-11 items-center border-t border-linen pt-3 text-sm text-champagne-600 hover:text-ink"
          >
            + Add a payment
          </Link>
        )}
      </div>
    </section>
  );
}
