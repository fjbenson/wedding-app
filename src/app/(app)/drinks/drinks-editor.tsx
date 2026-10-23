"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Utensils } from "lucide-react";
import AddButton from "@/components/add-button";
import NumbersCard from "@/components/numbers-card";
import { formatClock } from "@/lib/dates";
import type { Drink, DrinkKind, DrinkStatus } from "@/types/db";
import { addDrinkAction, removeDrinkAction, setDrinkStatusAction, updateDrinkAction, type DrinkInput } from "../menu/actions";

/**
 * Drinks (canvas 3 "Food & drink · Round 1", C, owner's pick 18 Oct 2026):
 * grouped as fizz, wine, beer and spirits, soft and hot, the rest; each with
 * how much, when and who is supplying it. The mark on the right is where it's
 * up to — dashed to order, a ring ordered, a tick delivered — and a tap moves
 * it on. "Not decided yet" is a faded italic row. Edits use a small Save.
 */
const GROUPS: { title: string; kinds: DrinkKind[] }[] = [
  { title: "Fizz", kinds: ["fizz"] },
  { title: "Wine", kinds: ["wine"] },
  { title: "Beer and spirits", kinds: ["beer", "spirits"] },
  { title: "Soft and hot", kinds: ["soft", "hot"] },
  { title: "Other", kinds: ["other"] },
];

const KIND_LABEL: Record<DrinkKind, string> = {
  fizz: "Fizz",
  wine: "Wine",
  beer: "Beer",
  spirits: "Spirits",
  soft: "Soft",
  hot: "Tea and coffee",
  other: "Other",
};

const STATUS_LABEL: Record<DrinkStatus, string> = {
  undecided: "Not decided yet",
  to_order: "To order",
  ordered: "Ordered",
  delivered: "Delivered",
};

const NEXT: Record<DrinkStatus, DrinkStatus> = {
  undecided: "to_order",
  to_order: "ordered",
  ordered: "delivered",
  delivered: "to_order",
};

const EMPTY: DrinkInput = { name: "", moment: "", kind: "fizz", time: "", quantity: "", unit: "bottles", suppliedBy: "", status: "to_order" };

const FIELD =
  "h-11 w-full rounded-xl border border-linen bg-ivory px-3 text-[16px] text-ink placeholder:text-stone/70 focus:border-champagne-500 focus:outline-none";

const toInput = (d: Drink): DrinkInput => ({
  name: d.name,
  moment: d.moment ?? "",
  kind: d.kind,
  time: d.serve_time?.slice(0, 5) ?? "",
  quantity: d.quantity === null ? "" : String(d.quantity),
  unit: d.unit ?? "",
  suppliedBy: d.supplied_by ?? "",
  status: d.status,
});

function Mark({ status, label, onClick }: { status: DrinkStatus; label: string; onClick: () => void }) {
  const cls =
    status === "delivered"
      ? "bg-champagne-500 text-white"
      : status === "ordered"
        ? "border-2 border-champagne-500"
        : "border-[1.5px] border-dashed border-champagne-500";
  return (
    <button type="button" onClick={onClick} aria-label={label} className="flex h-11 w-11 shrink-0 items-center justify-center">
      <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[13px] ${cls}`}>{status === "delivered" ? "✓" : ""}</span>
    </button>
  );
}

export default function DrinksEditor({ drinks, areaHref, areaLabel }: { drinks: Drink[]; areaHref: string; areaLabel: string }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function run(job: () => Promise<{ error?: string }>, closes = true) {
    start(async () => {
      try {
        const result = await job();
        if (result.error) setMessage(result.error);
        else {
          setMessage("");
          if (closes) setEditing(null);
        }
      } catch {
        setMessage("That didn't save. Try again in a moment.");
      }
    });
  }

  const bottles = drinks.filter((d) => (d.unit ?? "").toLowerCase().startsWith("bottle")).reduce((n, d) => n + (d.quantity ?? 0), 0);
  const count = (s: DrinkStatus) => drinks.filter((d) => d.status === s).length;

  return (
    <main className="page pb-40 lg:max-w-[1040px]">
      <Link
        href={areaHref}
        className="inline-flex items-center gap-1.5 rounded-full bg-champagne-100 py-1.5 pl-2.5 pr-3 text-[13px] font-medium text-champagne-600"
      >
        <Utensils className="h-4 w-4" strokeWidth={1.6} aria-hidden />
        {areaLabel} ›
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">Drinks</h1>
        <AddButton label="Add a drink" onClick={() => setEditing("new")} />
      </div>

      <NumbersCard
        big={{ label: "Bottles", value: bottles }}
        rows={[
          { value: count("to_order"), label: "To order" },
          { value: count("ordered") + count("delivered"), label: "Ordered" },
          { value: count("undecided"), label: "Not decided" },
        ]}
      />

      {message && (
        <p role="alert" className="mt-4 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {message}
        </p>
      )}

      {editing === "new" && (
        <DrinkForm
          title="New drink"
          initial={EMPTY}
          pending={pending}
          onCancel={() => setEditing(null)}
          onSave={(v) => run(() => addDrinkAction(v))}
        />
      )}

      {drinks.length === 0 && editing !== "new" && (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl border-[1.5px] border-dashed border-champagne-500 px-4 font-display text-[16px] italic text-champagne-600"
        >
          + Add the first drink
        </button>
      )}

      {/* Laptop: the groups side by side (owner, 23 Oct 2026). */}
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
      {GROUPS.map((group) => {
        const rows = drinks.filter((d) => group.kinds.includes(d.kind));
        if (rows.length === 0) return null;
        const total = rows.filter((d) => (d.unit ?? "").toLowerCase().startsWith("bottle")).reduce((n, d) => n + (d.quantity ?? 0), 0);
        return (
          <section key={group.title} className="mt-6">
            <h2 className="flex items-baseline justify-between px-1">
              <span className="section-label">{group.title}</span>
              {total > 0 && <span className="text-[12px] text-stone">{total} bottles</span>}
            </h2>
            <ul className="glass-card mt-2.5 overflow-hidden rounded-[22px] px-4">
              {rows.map((d) => (
                <li key={d.id} className="border-b border-ink/[0.12] last:border-b-0">
                  {editing === d.id ? (
                    <DrinkForm
                      title="Change this drink"
                      initial={toInput(d)}
                      pending={pending}
                      onCancel={() => setEditing(null)}
                      onSave={(v) => run(() => updateDrinkAction(d.id, v))}
                      onRemove={() => run(() => removeDrinkAction(d.id))}
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setEditing(d.id)} className="row-press flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                        <span className="w-[52px] shrink-0 font-display text-[22px] font-light tabular-nums text-champagne-600">
                          {d.quantity ?? "–"}
                          {d.quantity !== null && d.unit && <small className="block font-body text-[11px] text-stone">{d.unit}</small>}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[16px] ${d.status === "undecided" ? "font-display italic text-champagne-600" : "text-ink"}`}
                          >
                            {d.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[13px] text-stone">
                            {[d.serve_time && formatClock(d.serve_time), d.moment, d.supplied_by, d.status === "undecided" ? STATUS_LABEL.undecided : null]
                              .filter(Boolean)
                              .join(" · ") || KIND_LABEL[d.kind]}
                          </span>
                        </span>
                      </button>
                      <Mark
                        status={d.status}
                        label={`${STATUS_LABEL[d.status]}. Move ${d.name} on`}
                        onClick={() => run(() => setDrinkStatusAction(d.id, NEXT[d.status]), false)}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      </div>

      {drinks.length > 0 && (
        <p className="mt-6 px-1 text-[12.5px] text-stone">Tap the circle to move a drink on: to order, ordered, delivered.</p>
      )}
    </main>
  );
}

function DrinkForm({
  title,
  initial,
  pending,
  onSave,
  onCancel,
  onRemove,
}: {
  title: string;
  initial: DrinkInput;
  pending: boolean;
  onSave: (v: DrinkInput) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const [v, setV] = useState(initial);
  const [sure, setSure] = useState(false);
  const set = (patch: Partial<DrinkInput>) => setV({ ...v, ...patch });
  return (
    <div className="my-3 rounded-2xl bg-ivory p-4 shadow-[0_0_0_0.5px_rgb(60_50_40/0.12)]">
      <p className="label">{title}</p>
      <input id="drink-name" aria-label="Drink" value={v.name} onChange={(e) => set({ name: e.target.value })} placeholder="Arrival fizz" className={`${FIELD} mt-3`} />
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(KIND_LABEL) as DrinkKind[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={v.kind === k}
            onClick={() => set({ kind: k })}
            className={`min-h-10 rounded-full px-3.5 text-[13px] ${
              v.kind === k ? "bg-champagne-100 font-medium text-ink shadow-[0_0_0_1.5px_#B8914F]" : "bg-white text-stone shadow-[0_0_0_0.5px_rgb(60_50_40/0.18)]"
            }`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input id="drink-quantity" aria-label="How many" inputMode="decimal" value={v.quantity} onChange={(e) => set({ quantity: e.target.value })} placeholder="How many" className={FIELD} />
        <input id="drink-unit" aria-label="Of what (bottles, a cask)" value={v.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="bottles" className={FIELD} />
        <input id="drink-time" aria-label="Time" type="time" value={v.time} onChange={(e) => set({ time: e.target.value })} className={FIELD} />
        <input id="drink-moment" aria-label="When (arrival, with the meal…)" value={v.moment} onChange={(e) => set({ moment: e.target.value })} placeholder="With the meal" className={FIELD} />
      </div>
      <input id="drink-supplier" aria-label="Who is supplying it" value={v.suppliedBy} onChange={(e) => set({ suppliedBy: e.target.value })} placeholder="Bar company, or us" className={`${FIELD} mt-2`} />
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABEL) as DrinkStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={v.status === s}
            onClick={() => set({ status: s })}
            className={`min-h-10 rounded-full px-3.5 text-[13px] ${
              v.status === s ? "bg-champagne-100 font-medium text-ink shadow-[0_0_0_1.5px_#B8914F]" : "bg-white text-stone shadow-[0_0_0_0.5px_rgb(60_50_40/0.18)]"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {onRemove && (
          <button type="button" onClick={sure ? onRemove : () => setSure(true)} disabled={pending} className="mr-auto min-h-11 text-[13px] text-stone hover:text-ink">
            {sure ? "Yes, remove it" : "Remove this drink"}
          </button>
        )}
        <button type="button" onClick={onCancel} className={`${onRemove ? "" : "ml-auto "}min-h-11 px-3 text-[14px] text-stone hover:text-ink`}>
          Cancel
        </button>
        <button type="button" onClick={() => onSave(v)} disabled={pending} className="min-h-11 rounded-full bg-ink px-5 text-[14px] font-medium text-ivory disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
