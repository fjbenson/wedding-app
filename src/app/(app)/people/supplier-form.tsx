"use client";

import { useState } from "react";
import { ChevronDown, FileText, Globe, Mail, MoreHorizontal, Phone, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import MoneyInput from "@/components/money-input";
import { areaIcon, type AreaOption } from "@/lib/areas";
import { SUPPLIER_STAGES } from "@/lib/supplier-status";
import { StageIcon } from "./supplier-list";

/** A box inside one of the form's cards: no border of its own, the card is the frame. */
const BARE =
  "min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-ink placeholder:text-stone/60 focus:outline-none";

/** One line of a card: an icon, then the box. Hairlines between, like the supplier card. */
function Line({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 border-b border-linen px-4 last:border-b-0">
      <Icon aria-hidden className="h-[18px] w-[18px] shrink-0 text-champagne-600" strokeWidth={1.6} />
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}

const CARD = "mt-2.5 overflow-hidden rounded-[22px] border border-white/85 bg-white/60 shadow-[0_14px_34px_-22px_rgb(60_50_40/0.4),inset_0_1px_0_rgb(255_255_255/0.9)]";

/**
 * Adding a supplier (12 Oct 2026, owner: "one massive form… feels quite heavy").
 * Laid out like their card once they're on the list: the name large, then
 * what they do as picture tiles of the wedding's own areas, where you're up
 * to with the list's own stage icons, then two short cards — money, and how
 * to reach them — with the rest folded under "More". Editing happens on the
 * card, so this form only adds.
 */
export default function SupplierForm({
  action,
  categories,
  defaultCategory,
}: {
  action: (formData: FormData) => void | Promise<void>;
  /** The wedding's areas plus "Other" (src/lib/areas.ts, supplierCategories). */
  categories: AreaOption[];
  /** Adding from an area: start with that area picked. */
  defaultCategory?: string;
}) {
  const [more, setMore] = useState(false);

  return (
    <form action={action}>
      <input
        name="company_name"
        required
        autoFocus
        autoComplete="off"
        aria-label="Business name"
        placeholder="Business name"
        className="w-full border-b border-champagne-400 bg-transparent pb-2 font-display !text-[30px] font-light leading-tight tracking-[-0.02em] text-ink placeholder:italic placeholder:text-stone/50 focus:border-ink focus:outline-none"
      />

      <fieldset className="mt-7">
        <legend className="section-label">What they do</legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {categories.map((c) => {
            const Icon = areaIcon(c.key);
            return (
              <label key={c.key} className="cursor-pointer">
                <input type="radio" name="category" value={c.key} defaultChecked={c.key === defaultCategory} className="peer sr-only" />
                <span className="flex h-full min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-linen bg-white/70 px-1.5 py-2.5 text-center text-[13px] leading-tight text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400 peer-checked:[&>svg]:text-champagne-100">
                  <Icon aria-hidden className="h-5 w-5 text-champagne-600" strokeWidth={1.6} />
                  {c.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="section-label">Where you&apos;re up to</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SUPPLIER_STAGES.map((s) => (
            <label key={s.status} className="cursor-pointer">
              <input type="radio" name="status" value={s.status} defaultChecked={s.status === "enquired"} className="peer sr-only" />
              <span className="flex h-full flex-col items-center gap-1.5 rounded-2xl border border-linen bg-white/70 px-1 py-3 text-center text-[12px] leading-tight text-ink transition peer-checked:border-ink peer-checked:shadow-[0_0_0_1px_#1E1B18] peer-focus-visible:ring-2 peer-focus-visible:ring-champagne-400">
                <StageIcon status={s.status} />
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="mt-7">
        <h2 className="section-label font-body">Money</h2>
        <div className={`${CARD} grid grid-cols-2`}>
          {(
            [
              ["quoted_cost", "Quote"],
              ["deposit_paid", "Deposit paid"],
            ] as const
          ).map(([name, label], i) => (
            <label key={name} className={`block px-4 pb-2 pt-3 ${i ? "border-l border-linen" : ""}`}>
              <span className="type-meta block">{label}</span>
              <span className="flex items-baseline gap-1">
                <span className="font-display text-[22px] font-light text-stone">£</span>
                <MoneyInput name={name} placeholder="0" className="w-full min-w-0 bg-transparent py-1 font-display !text-[24px] font-light text-ink placeholder:text-stone/40 focus:outline-none" />
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="section-label font-body">How to reach them</h2>
        <div className={CARD}>
          <Line icon={UserRound} label="Contact person">
            <input name="contact_name" autoComplete="off" placeholder="Who to ask for" className={BARE} />
          </Line>
          <Line icon={Phone} label="Phone">
            <input name="phone" type="tel" placeholder="Phone" className={BARE} />
          </Line>
          <Line icon={Mail} label="Email">
            <input name="email" type="email" autoCapitalize="none" placeholder="Email" className={BARE} />
          </Line>
          <Line icon={Globe} label="Website">
            <input name="website" type="text" inputMode="url" autoCapitalize="none" placeholder="Website" className={BARE} />
          </Line>
        </div>
      </section>

      {more ? (
        <section className="mt-7">
          <h2 className="section-label font-body">More</h2>
          <div className={CARD}>
            <Line icon={FileText} label="Contract link">
              <input name="contract_url" type="url" placeholder="Contract link (https://…)" className={BARE} />
            </Line>
            <label className="block px-4">
              <span className="sr-only">Notes</span>
              <textarea name="notes" rows={3} placeholder="Notes — what's included, dates they're holding…" className={`${BARE} w-full resize-none`} />
            </label>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setMore(true)}
          className="mt-5 flex h-11 items-center gap-2 text-sm text-champagne-600 hover:text-ink"
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          Add a contract link or notes
          <ChevronDown className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </button>
      )}

      <div className="mt-8">
        <SubmitButton label="Add supplier" />
      </div>
    </form>
  );
}
