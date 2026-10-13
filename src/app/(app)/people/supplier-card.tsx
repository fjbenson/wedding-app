"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { ChevronRight, Globe, Mail, Phone, X } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { usePullToClose } from "@/components/use-pull-to-close";
import { areaName, supplierCategories, type AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { formatWeekdayDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Payment, SupplierStatus } from "@/types/db";
import { safely } from "./guest-card";
import { deleteSupplierAction, saveSupplierCardAction, updateSupplierAction } from "./supplier-actions";
import SupplierForm from "./supplier-form";
import SupplierFiles from "@/components/supplier-files";

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
  const drag = usePullToClose(onClose);
  const phone = supplier.phone?.replace(/\s+/g, "");
  const [saves, setSaves] = useState(0);
  const [error, setError] = useState<string>();
  const site = websiteHref(d?.website ?? null);

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
          <div onPointerDown={drag.start} className="flex touch-none items-center gap-3 lg:touch-auto">
            <div className="min-w-0 flex-1">
              {d?.category ? (
                area ? (
                  <Link href={`/area/${encodeURIComponent(area.key)}`} className="label hover:text-ink">
                    {area.label} ›
                  </Link>
                ) : (
                  <span className="label">{areaName(d.category, areas)}</span>
                )
              ) : (
                <span className="label">Supplier</span>
              )}
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

          {error && (
            <p role="alert" className="mb-3 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
              {error}
            </p>
          )}

          {/* The add form, filled in (owner, 12 Oct 2026): it saves together,
              with Cancel / Save changes once something's changed. A fresh copy
              after each save, so it starts from what's now saved. */}
          <SupplierForm
            key={saves}
            supplier={supplier}
            categories={supplierCategories(areas)}
            focus={editField}
            onCancel={() => setSaves((n) => n + 1)}
            action={async (formData) => {
              const result = await safely(() => saveSupplierCardAction(supplier.id, formData));
              setError(result.error);
              if (!result.error) setSaves((n) => n + 1);
            }}
            afterName={
              (phone || supplier.email || site) && (
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
                  {site && (
                    <a
                      href={site}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm ${
                        phone || supplier.email ? "border border-linen bg-white text-ink hover:border-champagne-400" : "bg-ink text-ivory hover:bg-ink/90"
                      }`}
                    >
                      <Globe className="h-4 w-4" strokeWidth={1.6} aria-hidden />
                      Website
                    </a>
                  )}
                </div>
              )
            }
            afterMoney={
              <>
                {area?.budget != null && (
                  <p className="mt-2.5 flex justify-between px-1 text-[13px] text-stone">
                    <span>{area.label} budget</span>
                    <span className="text-ink">{formatMoney(area.budget)}</span>
                  </p>
                )}
                {/* The payments themselves live on the area page and in Money —
                    deciding and paying — so the card just says where they stand. */}
                <PaymentsLine payments={payments} areaKey={area?.key ?? null} supplierId={supplier.id} />
              </>
            }
          />

          {/* Their contract, quotes and invoices (canvas 2 "Files · Round 1", A). */}
          <SupplierFiles supplierId={supplier.id} weddingId={supplier.wedding_id} areaKey={d?.category ?? null} supplierName={name} />

          <NotTaken supplierId={supplier.id} status={d?.status ?? "enquired"} quoted={d?.quoted_cost != null} />

          {d?.contract_url && /^https?:\/\//.test(d.contract_url) && (
            <a href={d.contract_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-champagne-600 underline underline-offset-4 hover:text-ink">
              Open the contract
            </a>
          )}

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

/** "2 payments · next £250 Wed 14 Oct ›", or a way to add the first. */
function PaymentsLine({ payments, areaKey, supplierId }: { payments: Payment[]; areaKey: string | null; supplierId: string }) {
  const next = payments
    .filter((p) => !p.paid_on && p.due_date)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0];
  const href = areaKey ? `/area/${encodeURIComponent(areaKey)}#payments` : "/money?view=month";
  if (payments.length === 0) {
    return (
      <Link href={`/money/payments/new?supplier=${supplierId}`} className="mt-3 inline-flex h-11 items-center text-sm text-champagne-600 hover:text-ink">
        + Add a payment
      </Link>
    );
  }
  return (
    <Link href={href} className="mt-3 flex min-h-11 items-center gap-2 border-t border-linen pt-3 text-sm text-ink hover:text-champagne-600">
      <span className="min-w-0 flex-1">
        {payments.length} {payments.length === 1 ? "payment" : "payments"}
        {next && (
          <span className="text-stone">
            {" "}
            · next {formatMoney(next.amount)} {formatWeekdayDayMonth(next.due_date!)}
          </span>
        )}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
    </Link>
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
