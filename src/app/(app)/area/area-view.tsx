import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { InlineSubmit } from "@/components/form-bits";
import { areaIcon } from "@/lib/areas";
import type { Supplier } from "@/lib/db/suppliers";
import { todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { supplierStatusLabel } from "@/lib/supplier-status";
import type { AreaRow, Milestone } from "@/types/db";
import { MilestoneRow } from "../plan/timeline-view";
import { saveAreaDetailsAction, setAreaAction } from "./actions";

const isOpen = (m: Milestone) => m.status === "todo" || m.status === "in_progress";

function supplierName(s: Supplier) {
  return s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");
}

/**
 * One area of the wedding (screens 5 and 6 in docs/information-architecture.md):
 * the same template for every area, including ones a couple invents. It
 * gathers what's already tagged with the area elsewhere — to-dos from Plan,
 * suppliers from People — plus a plain key-facts block and the cost so far.
 * Notes and saved inspiration join when Quick capture and Inspo are built.
 */
export default function AreaView({
  area,
  milestones,
  suppliers,
  error,
  detail,
}: {
  area: AreaRow;
  milestones: Milestone[];
  suppliers: Supplier[];
  error?: string;
  detail?: string;
}) {
  const Icon = areaIcon(area.key);
  const today = todayISO();
  const todos = [...milestones.filter(isOpen), ...milestones.filter((m) => !isOpen(m))];
  const open = milestones.filter(isOpen).length;

  const live = suppliers.filter((s) => s.supplier_details?.status !== "cancelled");
  const booked = live.find((s) => s.supplier_details?.status === "booked");
  const quoted = live.reduce((sum, s) => sum + (s.supplier_details?.quoted_cost ?? 0), 0);
  const paid = live.reduce((sum, s) => sum + (s.supplier_details?.deposit_paid ?? 0), 0);

  const summary = [
    open > 0 ? `${open} to do` : milestones.length > 0 ? "All done" : null,
    booked ? `${supplierName(booked)} booked` : live.length > 0 ? `${live.length} supplier${live.length === 1 ? "" : "s"}` : null,
    quoted > 0 && `${formatMoney(quoted)} quoted`,
  ].filter(Boolean);

  const section = "flex items-baseline justify-between border-b border-champagne-400 pb-2";
  const addLink = "inline-flex items-center gap-1 text-sm text-champagne-600 hover:text-ink";

  return (
    <main className="page pb-28 lg:pb-16">
      <Link href="/" className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-stone hover:text-ink">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Hub
      </Link>

      <p className="label mt-4">Area</p>
      <h1 className="mt-3 flex items-center gap-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">
        <Icon className="h-7 w-7 shrink-0 text-champagne-600" strokeWidth={1.5} aria-hidden />
        {area.label}
      </h1>
      <p className="mt-2 text-sm text-stone">{summary.length > 0 ? summary.join(" · ") : "Barely started — and that's fine."}</p>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}

      {!area.show_on_hub && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-champagne-400 px-5 py-4">
          <p className="text-sm text-ink">
            {area.enabled ? "Not on your hub." : "You're not planning this one."}
          </p>
          <form action={setAreaAction.bind(null, area.id, area.key, "bring-back")}>
            <InlineSubmit label="Put it back on the hub" pendingLabel="Adding…" />
          </form>
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-linen bg-white p-5">
          <h2 className="label font-body">Key facts</h2>
          <form action={saveAreaDetailsAction.bind(null, area.id, area.key)} className="mt-3">
            <textarea
              name="details"
              rows={4}
              defaultValue={area.details ?? ""}
              aria-label={`Key facts about ${area.label}`}
              placeholder="Anything worth having to hand — colours, a budget, who's deciding, what you've ruled out."
              className="w-full resize-y rounded-xl border border-linen bg-ivory px-3 py-2 text-[15px] leading-relaxed text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
            />
            <div className="mt-2 flex justify-end">
              <InlineSubmit label="Save" pendingLabel="Saving…" />
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-linen bg-white p-5">
          <h2 className="label font-body">Cost</h2>
          {quoted > 0 ? (
            <dl className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-stone">Quoted</dt>
                <dd className="font-display text-2xl text-ink">{formatMoney(quoted)}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-stone">Paid</dt>
                <dd className="text-[15px] text-ink">{formatMoney(paid)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-linen pt-2">
                <dt className="text-sm text-stone">Left to pay</dt>
                <dd className="text-[15px] text-ink">{formatMoney(Math.max(quoted - paid, 0))}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-stone">No quotes yet. Add a supplier with a quote and it shows here.</p>
          )}
        </section>
      </div>

      <section className="mt-10">
        <div className={section}>
          <h2 className="text-xl text-ink">To-dos</h2>
          <Link href={`/plan/new?area=${encodeURIComponent(area.key)}`} className={addLink}>
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Add a to-do
          </Link>
        </div>
        {todos.length > 0 ? (
          <ul>
            {todos.map((m) => (
              <MilestoneRow key={m.id} milestone={m} overdue={isOpen(m) && !!m.due_date && m.due_date < today} />
            ))}
          </ul>
        ) : (
          <p className="py-3 text-sm text-stone">Nothing to do here yet.</p>
        )}
      </section>

      <section className="mt-10">
        <div className={section}>
          <h2 className="text-xl text-ink">Suppliers</h2>
          <Link href={`/people/suppliers/new?category=${encodeURIComponent(area.key)}`} className={addLink}>
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Add a supplier
          </Link>
        </div>
        {suppliers.length > 0 ? (
          <ul>
            {suppliers.map((s) => {
              const d = s.supplier_details;
              const cancelled = d?.status === "cancelled";
              return (
                <li key={s.id} className="border-b border-linen last:border-b-0">
                  <Link href={`/people/${s.id}`} className="flex items-center gap-3 py-3 hover:bg-cream/60">
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[15px] ${cancelled ? "text-stone line-through" : "text-ink"}`}>
                        {supplierName(s)}
                      </span>
                      {d && <span className="mt-0.5 block text-xs text-stone">{supplierStatusLabel(d.status)}</span>}
                    </span>
                    {d?.quoted_cost != null && (
                      <span className="shrink-0 font-display text-lg text-ink">{formatMoney(d.quoted_cost)}</span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-3 text-sm text-stone">No one yet.</p>
        )}
      </section>

      {area.show_on_hub && (
        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-linen pt-4 text-sm">
          <form action={setAreaAction.bind(null, area.id, area.key, "hide")}>
            <button type="submit" className="py-2 text-stone underline underline-offset-4 hover:text-ink">
              Take off the hub
            </button>
          </form>
          <form action={setAreaAction.bind(null, area.id, area.key, "stop")}>
            <button type="submit" className="py-2 text-stone underline underline-offset-4 hover:text-ink">
              We&apos;re not planning this
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
