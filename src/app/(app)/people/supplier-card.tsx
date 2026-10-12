"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { ChevronRight, Mail, Pencil, Phone, Plus, X } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { usePullToClose } from "@/components/use-pull-to-close";
import { areaName, supplierCategories, type AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { formatDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { SUPPLIER_STATUSES } from "@/lib/supplier-status";
import type { Payment, SupplierStatus } from "@/types/db";
import { CHEVRON, FIELD, SaveCancel, TextRow, editorKeys, safely, useSaver } from "./guest-card";
import { deleteSupplierAction, updateSupplierAction, type SupplierEdit } from "./supplier-actions";

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
 * like the guest card. Everything is changed right here — the stage with a
 * tap, any detail by tapping it — so there's no edit page any more.
 */
export default function SupplierCard({
  supplier,
  areas,
  payments,
  onClose,
}: {
  supplier: Supplier;
  /** The wedding's areas, with each one's budget if set. */
  areas: (AreaOption & { budget?: number | null })[];
  /** Payments recorded for this supplier. */
  payments: Payment[];
  onClose: () => void;
}) {
  const name = supplierName(supplier);
  const d = supplier.supplier_details;
  const area = areas.find((a) => a.key === d?.category);
  const save = (edit: SupplierEdit) => updateSupplierAction(supplier.id, edit);
  const drag = usePullToClose(onClose);
  const phone = supplier.phone?.replace(/\s+/g, "");

  // Escape closes it, and the list behind doesn't scroll while it's open.
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

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={name}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
      />
      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        className={`absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] ${
          drag.dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
      >
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>

        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] pt-0 lg:pt-8">
          <div onPointerDown={drag.start} className="flex touch-none items-start gap-3 lg:touch-auto">
            <div className="min-w-0 flex-1">
              {d?.category && (
                area ? (
                  <Link href={`/area/${encodeURIComponent(area.key)}`} className="label hover:text-ink">
                    {area.label} ›
                  </Link>
                ) : (
                  <span className="label">{areaName(d.category, areas)}</span>
                )
              )}
              <BusinessName name={name} onSave={(v) => save({ field: "company_name", value: v })} />
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

          {(phone || supplier.email) && (
            <div className="mt-5 flex gap-2.5">
              {phone && (
                <a href={`tel:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm text-ivory hover:bg-ink/90">
                  <Phone className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                  Call
                </a>
              )}
              {supplier.email && (
                <a
                  href={`mailto:${supplier.email}`}
                  className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm ${
                    phone ? "border border-linen bg-white text-ink hover:border-champagne-400" : "bg-ink text-ivory hover:bg-ink/90"
                  }`}
                >
                  <Mail className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                  Email
                </a>
              )}
            </div>
          )}

          <Stage supplierId={supplier.id} status={d?.status ?? "enquired"} />

          {/* A hairline right across the card between sections, as on the guest card. */}
          <section className="-mx-[22px] mt-6 border-t border-linen px-[22px] pt-6">
            <h3 className="section-label">Money</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MoneyFigure label="Quote" value={d?.quoted_cost ?? null} onSave={(v) => save({ field: "quoted_cost", value: v })} />
              <MoneyFigure label="Deposit paid" value={d?.deposit_paid ?? null} onSave={(v) => save({ field: "deposit_paid", value: v })} />
              <div>
                <p className="type-meta">Area budget</p>
                <p className="type-figure mt-1 text-[24px] !font-light text-stone">
                  {area?.budget != null ? formatMoney(area.budget) : "—"}
                </p>
              </div>
            </div>
            {payments.length > 0 && (
              <ul className="mt-4 border-t border-linen [--row-bleed:22px]">
                {payments.map((p) => (
                  <li key={p.id} className="row-press border-b border-linen">
                    <Link href={`/money/payments/${p.id}`} className="flex items-center gap-3 py-3">
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[15px] ${p.paid_on ? "text-stone" : "text-ink"}`}>{p.description}</span>
                        <span className="type-meta mt-0.5 block">
                          {p.paid_on ? `Paid ${formatDayMonth(p.paid_on)}` : p.due_date ? `Due ${formatDayMonth(p.due_date)}` : "No date"}
                        </span>
                      </span>
                      <span className={`type-figure shrink-0 text-lg !font-light ${p.paid_on ? "!text-stone" : ""}`}>{formatMoney(p.amount)}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/money/payments/new?supplier=${supplier.id}`}
              className="mt-3 inline-flex h-11 items-center gap-1.5 text-sm text-champagne-600 hover:text-ink"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              {payments.length > 0 ? "Add another payment" : "Add a payment"}
            </Link>
          </section>

          <section className="-mx-[22px] mt-4 border-t border-linen px-[22px] pt-6">
            <h3 className="section-label">Details</h3>
            <dl className="mt-1">
              <AreaRow value={d?.category ?? null} areas={areas} onSave={(v) => save({ field: "category", value: v })} />
              <TextRow label="Contact" value={supplierContact(supplier)} onSave={(v) => save({ field: "contact_name", value: v })} />
              <TextRow label="Phone" value={supplier.phone} type="tel" onSave={(v) => save({ field: "phone", value: v })} />
              <TextRow label="Email" value={supplier.email} type="email" onSave={(v) => save({ field: "email", value: v })} />
              <TextRow label="Contract" value={d?.contract_url ?? null} type="url" onSave={(v) => save({ field: "contract_url", value: v })} />
              <TextRow label="Notes" value={supplier.notes} multiline onSave={(v) => save({ field: "notes", value: v })} />
            </dl>
            {d?.contract_url && /^https?:\/\//.test(d.contract_url) && (
              <a href={d.contract_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-champagne-600 underline underline-offset-4 hover:text-ink">
                Open the contract
              </a>
            )}
          </section>

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

/** The business's name, large; tap it to change it. */
function BusinessName({ name, onSave }: { name: string; onSave: (value: string) => Promise<{ error?: string }> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const { pending, error, setError, run } = useSaver();
  const submit = () => run(() => onSave(draft), () => setEditing(false));
  const keys = editorKeys(submit, () => setEditing(false));

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(name);
          setError(undefined);
          setEditing(true);
        }}
        className="group mt-1.5 block text-left"
        aria-label={`${name} — change name`}
      >
        <span className="type-display text-[34px] leading-[1.05]">{name}</span>
        <Pencil className="ml-2 inline h-4 w-4 align-baseline text-stone/60 group-hover:text-ink" strokeWidth={1.6} aria-hidden />
      </button>
    );
  }
  return (
    <form
      className="mt-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keys} aria-label="Business name" className={FIELD} />
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
    </form>
  );
}

/** Where you're up to with them: Asked · Quote in · Booked · Not taken, one tap. */
function Stage({ supplierId, status }: { supplierId: string; status: SupplierStatus }) {
  const [current, setCurrent] = useOptimistic<SupplierStatus>(status === "researching" ? "enquired" : status);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <section className="mt-6">
      <h3 className="section-label">Where you&apos;re up to</h3>
      <div role="group" aria-label="Where you're up to" className="mt-2.5 grid grid-cols-4 gap-0.5 rounded-2xl bg-cream p-[3px]">
        {SUPPLIER_STATUSES.map((s) => (
          <button
            key={s.status}
            type="button"
            aria-pressed={current === s.status}
            onClick={() =>
              startTransition(async () => {
                setCurrent(s.status);
                setError((await safely(() => updateSupplierAction(supplierId, { field: "status", value: s.status }))).error);
              })
            }
            className={`h-10 min-w-0 rounded-xl px-1 text-[13px] transition ${
              current === s.status ? "bg-white text-ink shadow-[0_1px_4px_rgb(60_50_40/0.14)]" : "text-stone hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
    </section>
  );
}

/** A money figure; tap it to change the amount. */
function MoneyFigure({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number | null;
  onSave: (value: string) => Promise<{ error?: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? "");
  const { pending, error, setError, run } = useSaver();
  const submit = () => run(() => onSave(draft), () => setEditing(false));
  const keys = editorKeys(submit, () => setEditing(false));

  if (editing) {
    return (
      <form
        className="col-span-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="type-meta">
          {label}
          <input autoFocus inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keys} placeholder="e.g. 1800" className={`${FIELD} mt-1.5`} />
        </label>
        {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
        <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
      </form>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value?.toString() ?? "");
        setError(undefined);
        setEditing(true);
      }}
      className="min-h-11 text-left"
      aria-label={`${label}: ${value != null ? formatMoney(value) : "not set"} — change`}
    >
      <span className="type-meta block">{label}</span>
      <span className={`type-figure mt-1 block text-[24px] !font-light ${value != null ? "" : "!text-stone/60"}`}>
        {value != null ? formatMoney(value) : "Add"}
      </span>
    </button>
  );
}

/** Which area they're for, picked from the wedding's own (plus Other). */
function AreaRow({
  value,
  areas,
  onSave,
}: {
  value: string | null;
  areas: AreaOption[];
  onSave: (value: string) => Promise<{ error?: string }>;
}) {
  const [current, setCurrent] = useState(value ?? "");
  const { pending, error, run } = useSaver();
  const options = supplierCategories(areas);
  // An area since switched off still shows as itself, so saving doesn't drop it.
  const all = value && !options.some((o) => o.key === value) ? [...options, { key: value, label: areaName(value, areas) ?? value }] : options;

  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5">Area</dt>
      <dd className="min-w-0 py-2">
        <select
          value={current}
          disabled={pending}
          aria-label="Area"
          onChange={(e) => {
            const next = e.target.value;
            setCurrent(next);
            run(() => onSave(next));
          }}
          style={{ backgroundImage: CHEVRON, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1rem" }}
          className={`${FIELD} appearance-none pr-9`}
        >
          {!current && <option value="">Pick an area</option>}
          {all.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
        {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      </dd>
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
