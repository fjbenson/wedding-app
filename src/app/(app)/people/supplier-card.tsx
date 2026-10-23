"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Check, ChevronDown, Globe, Mail, MapPin, MoreHorizontal, Phone } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import CardSheet from "@/components/card-sheet";
import { jumpTo } from "@/lib/jump-to";
import type { Cycle } from "@/lib/card-cycle";
import { areaName, supplierCategories, type AreaOption } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { formatDayMonth, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { FileKind, Payment, SupplierStatus } from "@/types/db";
import { Fold, SaveCancel, TextRow, editorKeys, safely, useSaver } from "./guest-card";
import StageCircles from "@/components/stage-circles";
import CardLink from "@/components/card-link";
import PaymentRow from "@/components/payment-row";
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
  cycle,
}: {
  /** Stepping through the suppliers on the list this card came from (owner, 23 Oct 2026). */
  cycle?: Cycle | null;
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
  const phone = supplier.phone?.replace(/\s+/g, "");
  const [error, setError] = useState<string>();
  const save = async (edit: SupplierEdit) => {
    const result = await safely(() => updateSupplierAction(supplier.id, edit));
    return result;
  };
  const site = websiteHref(d?.website ?? null);
  // Which Contact box to open ready to type: from the list's dashed buttons
  // (editField) or the card's own (addField). `n` redraws the row to open it.
  const [adding, setAdding] = useState<{ field?: "phone" | "email" | "website"; n: number }>({ field: editField, n: 0 });
  // The stage open (owner, 23 Oct 2026): where they are, or In touch when a dashed button sent us to a detail.
  const [open, setOpen] = useState(() => (editField ? 0 : stageState(d?.status ?? "enquired", paidUp).open));
  const addField = (field: "phone" | "email" | "website") => {
    // The details live in In touch: open it first, then the box takes the cursor.
    setOpen(0);
    window.setTimeout(() => {
      jumpTo(`supplier-${field}`);
      setAdding((a) => ({ field, n: a.n + 1 }));
    }, 80);
  };
  useEffect(() => {
    if (editField) jumpTo(editField === "phone" ? "supplier-phone" : "supplier-email");
    // Once, on opening: the list's greyed-out button sent us here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const detailsLine = [supplierContact(supplier), supplier.phone, supplier.email].filter(Boolean).join(" · ") || "Add a number or email";
  // In touch has no panel of its own: its circle opens the Details fold at the foot (owner, 23 Oct 2026),
  // which is there whatever stage they're at, like History.
  const openStage = (i: number) => {
    setOpen(i);
    if (i === 0) requestAnimationFrame(() => jumpTo("supplier-details"));
    // Any other stage tucks Details away again.
    else (document.getElementById("supplier-details")?.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
  };
  // Stepping to another supplier opens that one at where they are.
  useEffect(() => {
    setOpen(stageState(d?.status ?? "enquired", paidUp).open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier.id]);

  return (
    // Every card has the same frame (owner, 23 Oct 2026, canvas 4 "Cards · Rounds 1–10"): a small label left, the ✕ right.
    <CardSheet beside cycle={cycle} label={name} onClose={onClose} top={<span className="label">Supplier</span>}>
      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      {/* Canvas 2 "Suppliers · Round 3", A (owner's pick 13 Oct 2026:
          "business card baby you nailed it"): something to look at, each
          part changed by tapping it — no longer the add form filled in. */}
      <BusinessCard supplier={supplier} areas={areas} phone={phone} site={site} onError={setError} onAdd={addField} />

      <SupplierStages
        supplier={supplier}
        area={area}
        payments={payments}
        paidUp={paidUp}
        open={open}
        onOpen={openStage}
        save={save}
        onError={setError}
      />

      {/* History, then Details (the typed facts), always last (owner, 23 Oct 2026). */}
      <div className="-mx-[22px] mt-6 border-y border-linen">
        <section className="px-[22px]">
          <Timeline scope={`supplier:${supplier.id}`} folded />
        </section>
        <Fold title="Details" icon={MapPin} summary={detailsLine}>
          <dl id="supplier-details">
            <TextRow label="Contact" value={supplierContact(supplier)} onSave={(v) => save({ field: "contact_name", value: v })} />
            <div id="supplier-phone">
              <TextRow key={`phone-${adding.n}`} label="Phone" type="tel" value={supplier.phone} startEditing={adding.field === "phone"} onSave={(v) => save({ field: "phone", value: v })} />
            </div>
            <div id="supplier-email">
              <TextRow key={`email-${adding.n}`} label="Email" type="email" value={supplier.email} startEditing={adding.field === "email"} onSave={(v) => save({ field: "email", value: v })} />
            </div>
            <div id="supplier-website">
              <TextRow key={`website-${adding.n}`} label="Website" value={d?.website ?? null} startEditing={adding.field === "website"} onSave={(v) => save({ field: "website", value: v })} />
            </div>
            {d?.contract_url && <TextRow label="Contract link" value={d.contract_url} onSave={(v) => save({ field: "contract_url", value: v })} />}
            <TextRow label="Notes" multiline value={supplier.notes} onSave={(v) => save({ field: "notes", value: v })} />
          </dl>
        </Fold>
      </div>

      {area && (
        <Link
          href={`/area/${encodeURIComponent(area.key)}`}
          className="mt-6 flex h-12 items-center justify-center rounded-full border border-champagne-400 text-[15px] text-ink hover:bg-cream"
        >
          Open the {area.label} page ›
        </Link>
      )}

      {/* The quiet links at the very foot, side by side. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6">
        <NotTaken supplierId={supplier.id} status={d?.status ?? "enquired"} quoted={d?.quoted_cost != null} />
        <RemoveSupplier id={supplier.id} name={name} />
      </div>
    </CardSheet>
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
    <div>
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
      <button type="button" onClick={() => setAsking(true)} className="min-h-11 py-3 text-sm text-stone underline underline-offset-4 hover:text-ink">
        Remove this supplier
      </button>
    );
  }
  return (
    <div className="w-full rounded-2xl border border-linen bg-white p-4 text-center">
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
  onAdd: (field: "phone" | "email" | "website") => void;
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
    site ? { href: site, label: "Website", Icon: Globe, out: true } : { add: "website" as const, label: "Website", Icon: Globe },
  ] as { href?: string; add?: "phone" | "email" | "website"; label: string; Icon: typeof Phone; out?: boolean }[];
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
          <ChevronDown aria-hidden className={`h-3.5 w-3.5 transition ${picking ? "rotate-180" : ""}`} strokeWidth={1.8} />
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
                  aria-label={b.add === "phone" ? "Add their phone number" : b.add === "email" ? "Add their email" : "Add their website"}
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
 * Which of In touch → Quote in → Booked → Paid are done, and which one they're
 * at (the first not done). A stage ticks once reached; Paid isn't a status, it
 * ticks itself from their money. Not taken ticks nothing.
 */
function stageState(status: SupplierStatus, paidUp: boolean) {
  const at = SUPPLIER_STAGES.findIndex((s) => s.status === (status === "researching" ? "enquired" : status));
  const done = [0, 1, 2, 3].map((i) => (i < SUPPLIER_STAGES.length ? at >= 0 && i <= at : at === SUPPLIER_STAGES.length - 1 && paidUp));
  for (let i = done.length - 1; i > 0; i--) if (done[i]) done[i - 1] = true;
  const here = at >= 0 ? done.indexOf(false) : -1;
  return { done, here, open: here >= 0 ? here : at >= 0 ? done.length - 1 : 0 };
}

const STAGE_NAMES = [
  { id: "touch", name: "In touch" },
  { id: "quote", name: "Quote in" },
  { id: "booked", name: "Booked" },
  { id: "paid", name: "Paid" },
];

/**
 * In touch → Quote in → Booked → Paid as circles you can look at (owner, 23 Oct
 * 2026, canvas 5 "Supplier card · Round 20", A): tapping one only shows what
 * belongs to that stage, it never moves them, like the area page. What moves
 * them: a quote typed in is Quote in, and every payment paid is Paid — both
 * tick themselves. Booked is the one button (Mark as booked), because it's a
 * decision; "Not booked after all" steps back. Each stage ends in its own
 * quiet "+ Add a …". In touch has no panel: its circle opens the Details fold.
 */
function SupplierStages({
  supplier,
  area,
  payments,
  paidUp,
  open,
  onOpen,
  save,
  onError,
}: {
  supplier: Supplier;
  area: (AreaOption & { budget?: number | null }) | undefined;
  payments: Payment[];
  paidUp: boolean;
  open: number;
  onOpen: (i: number) => void;
  save: (edit: SupplierEdit) => Promise<{ error?: string }>;
  onError: (message?: string) => void;
}) {
  const d = supplier.supplier_details;
  const name = supplierName(supplier);
  const [current, setCurrent] = useOptimistic<SupplierStatus>(d?.status === "researching" ? "enquired" : (d?.status ?? "enquired"));
  const [, startTransition] = useTransition();
  const { done, here } = stageState(current, paidUp);
  const move = (next: SupplierStatus) =>
    startTransition(async () => {
      setCurrent(next);
      onError((await safely(() => updateSupplierAction(supplier.id, { field: "status", value: next }))).error);
    });

  const quote = d?.quoted_cost ?? null;
  const deposit = d?.deposit_paid ?? null;
  const paid = (deposit ?? 0) + payments.filter((p) => p.paid_on).reduce((sum, p) => sum + p.amount, 0);
  const saveMoney = async (field: "quoted_cost" | "deposit_paid", value: string) => {
    const result = await save({ field, value });
    onError(undefined);
    return result;
  };
  // The deposit is a payment like any other (owner, 23 Oct 2026); the old "deposit paid" figure only shows if it was filled in.
  const depositPayment = payments.find((p) => /deposit/i.test(p.description));
  const today = todayISO();
  const schedule = [...payments].sort((a, b) => Number(!!a.paid_on) - Number(!!b.paid_on) || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  const card = "glass-card rounded-[22px] px-4 [--row-bleed:16px]";
  const files = (kinds: FileKind[], addLabel: string) => (
    <SupplierFiles supplierId={supplier.id} weddingId={supplier.wedding_id} areaKey={d?.category ?? null} supplierName={name} kinds={kinds} addLabel={addLabel} />
  );
  const ghost = (label: string, line: string) => (
    <div className="flex min-h-[60px] items-center gap-3 border-b border-linen last:border-b-0">
      <span aria-hidden className="h-[34px] w-[34px] shrink-0 rounded-full border border-dashed border-stone/40" />
      <span className="min-w-0">
        <span className="block text-[15px] text-stone">{label}</span>
        <span className="block text-[13px] text-stone/80">{line}</span>
      </span>
    </div>
  );

  return (
    <section className="mt-6" aria-label="Stages">
      <StageCircles stages={STAGE_NAMES} done={done} current={here} open={open} onOpen={onOpen} panelId="supplier-stage-panel" />

      {/* In touch (0) has nothing here: it opens the Details fold below. */}
      <div role="tabpanel" id="supplier-stage-panel" aria-labelledby={`stage-tab-${STAGE_NAMES[open].id}`} hidden={open === 0} className="mt-5">
        <h3 className="sr-only">{STAGE_NAMES[open].name}</h3>

        {open === 1 && (
          <div className={card}>
            <div className="border-b border-linen py-3.5">
              <div className="flex items-end justify-between gap-4">
                <Figure label="Quote" value={quote} onSave={(v) => saveMoney("quoted_cost", v)} />
                {area?.budget != null && (
                  <span className="pb-0.5 text-right">
                    <span className="type-meta block">{area.label} budget</span>
                    <span className="mt-0.5 block font-display text-[20px] font-light leading-tight text-stone">{formatMoney(area.budget)}</span>
                  </span>
                )}
              </div>
              {quote != null && quote > 0 && area?.budget != null && area.budget > 0 && <QuoteVsBudget quote={quote} budget={area.budget} />}
            </div>
            {files(["quote", "other"], "Add a quote")}
          </div>
        )}

        {open === 2 && current !== "booked" && (
          <>
            <button
              type="button"
              onClick={() => move("booked")}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink text-[15.5px] font-medium text-ivory transition hover:bg-ink/90"
            >
              <Check className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
              Mark as booked
              {quote != null && quote > 0 && <span className="font-normal opacity-65">· {formatMoney(quote)} agreed</span>}
            </button>
            <div aria-hidden className="mt-3.5 rounded-[22px] border border-dashed border-linen px-4 opacity-75">
              {ghost("Contract", "Add it once it’s signed")}
              {ghost("Deposit", "Add what you’ve paid")}
            </div>
            <div className={`${card} mt-3 empty:hidden`}>
              <SupplierDecor supplierId={supplier.id} />
            </div>
          </>
        )}

        {open === 2 && current === "booked" && (
          <>
            <div className={card}>
              <div className="border-b border-linen py-3.5">
                <Figure label="Agreed" value={quote} onSave={(v) => saveMoney("quoted_cost", v)} />
                {depositPayment ? (
                  <CardLink href={`/money/payments/${depositPayment.id}`} className="mt-1 block text-[13px] text-stone hover:text-ink">
                    Deposit {formatMoney(depositPayment.amount)} ·{" "}
                    {depositPayment.paid_on ? `paid ${formatDayMonth(depositPayment.paid_on)}` : depositPayment.due_date ? `due ${formatDayMonth(depositPayment.due_date)}` : "not paid yet"}
                  </CardLink>
                ) : deposit != null && deposit > 0 ? (
                  <p className="mt-1 text-[13px] text-stone">Deposit paid {formatMoney(deposit)}</p>
                ) : (
                  <Link href={`/money/payments/new?supplier=${supplier.id}&what=deposit`} className="mt-1 flex min-h-11 items-center text-[15px] text-champagne-600 hover:text-ink">
                    + Add a deposit
                  </Link>
                )}
              </div>
              <SupplierDecor supplierId={supplier.id} />
              {files(["contract"], "Add a contract")}
            </div>
            <button type="button" onClick={() => move(quote != null && quote > 0 ? "quoted" : "enquired")} className="mt-2 min-h-11 px-1 text-[13px] text-stone underline underline-offset-4 hover:text-ink">
              Not booked after all
            </button>
          </>
        )}

        {open === 3 && (
          <div className={card}>
            {quote != null && quote > 0 && (
              <div className="border-b border-linen py-3.5">
                <p className="flex justify-between text-[13px] text-stone">
                  <span>
                    Paid {formatMoney(Math.min(paid, quote))}
                    {paid < quote && <> · {formatMoney(quote - paid)} to go</>}
                  </span>
                  <span>of {formatMoney(quote)}</span>
                </p>
                <span aria-hidden className="mt-1.5 block h-2 overflow-hidden rounded-full bg-champagne-100">
                  <span className="block h-full rounded-full bg-champagne-600" style={{ width: `${Math.min(100, Math.round((paid / quote) * 100))}%` }} />
                </span>
              </div>
            )}
            {schedule.length > 0 && (
              <ul>
                {schedule.map((p) => (
                  <PaymentRow key={p.id} payment={p} today={today} />
                ))}
              </ul>
            )}
            <Link
              href={`/money/payments/new?supplier=${supplier.id}`}
              className={`flex min-h-12 items-center text-[15px] text-champagne-600 hover:text-ink ${schedule.length > 0 ? "border-t border-linen" : ""}`}
            >
              + Add a payment
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * The quote against the area's budget on one bar (owner's pick 23 Oct 2026,
 * canvas 5 "Supplier card · Round 20", viz A): the budget is the track, the
 * quote fills it, a fine ink line marks the budget. Over budget the extra is
 * rose stripes past the line, with the words as well (never colour alone).
 */
function QuoteVsBudget({ quote, budget }: { quote: number; budget: number }) {
  const over = quote > budget;
  const top = Math.max(quote, budget);
  const budgetAt = (budget / top) * 100;
  const quoteAt = (Math.min(quote, budget) / top) * 100;
  return (
    <div className="mt-4">
      <div aria-hidden className="relative h-3 rounded-full bg-champagne-100">
        <span className="absolute inset-y-0 left-0 rounded-full bg-champagne-600" style={{ width: `${quoteAt}%` }} />
        {over && (
          <span
            className="absolute inset-y-0 rounded-r-full"
            style={{ left: `${budgetAt}%`, width: `${100 - budgetAt}%`, background: "repeating-linear-gradient(135deg, #9A3F2B 0 3px, #F4DCD5 3px 7px)" }}
          />
        )}
        <span className="absolute -inset-y-1 w-0.5 bg-ink" style={{ left: `calc(${budgetAt}% - 1px)` }} />
      </div>
      <p className={`mt-2.5 text-sm ${over ? "text-[#9A3F2B]" : "text-champagne-600"}`}>
        {over ? `▲ Over by ${formatMoney(quote - budget)}` : quote === budget ? "Right on budget" : `${formatMoney(budget - quote)} under budget`}
      </p>
    </div>
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
