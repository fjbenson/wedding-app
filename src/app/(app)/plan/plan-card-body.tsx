"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Clock, ExternalLink } from "lucide-react";
import { AreaTiles, BARE, CARD, DateCard, Line, Part } from "@/components/visual-form";
import { areaName, type AreaOption } from "@/lib/areas";
import type { Appointment, Milestone, Payment, RunSheetItem } from "@/types/db";
import { todayISO, formatDayMonth, formatLongDate } from "@/lib/dates";
import { replaceQuery } from "@/lib/url-state";
import type { InspoWithPicture } from "@/lib/db/inspo";
import { formatMoney, withCommas } from "@/lib/money";
import { CHEVRON, editorKeys, FIELD, safely, SaveCancel, TextRow, useSaver } from "../people/guest-card";
import { DetailLabel } from "../people/guest-table";
import { updatePlanFieldsAction, type Involved } from "./card-actions";
import { InvolvedPart } from "./involved";

type Save = (fields: Record<string, string | null>) => Promise<{ error?: string }>;

/** Saves one change and refreshes the page behind, so its list matches. */
function useSave(kind: "todo" | "appointment" | "payment" | "moment" | "journey" | "idea", id: string): Save {
  const router = useRouter();
  return async (fields) => {
    const result = await safely(() => updatePlanFieldsAction(kind, id, fields));
    if (!result.error) router.refresh();
    return result;
  };
}

/**
 * The inside of a to-do's card, edited in place like a guest's (owner, 16
 * Oct 2026): a tap — a date, a quick pick, an area — saves at once; typing
 * (the name, notes) gets a small Save under the box.
 */
export function TodoBody({
  milestone: m,
  areas,
  weddingDate,
  involved,
}: {
  milestone: Milestone;
  areas: AreaOption[];
  weddingDate: string | null;
  involved: Involved;
}) {
  const save = useSave("todo", m.id);
  const [date, setDate] = useState(m.due_date ?? m.remind_at?.slice(0, 10) ?? "");
  const [error, setError] = useState<string>();
  const change = async (fields: Record<string, string | null>) => setError((await save(fields)).error);

  // An area that's since been switched off (or an old "Guests" tag) keeps its tile.
  const current = m.category;
  const options = current && !areas.some((a) => a.key === current) ? [...areas, { key: current, label: areaName(current, areas) ?? current }] : areas;

  return (
    <>
      <TitleEditor value={m.title} onSave={(v) => save({ title: v })} />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <Part label="When">
        <DateCard
          name="when"
          value={date}
          onChange={(v) => {
            setDate(v);
            change({ due_date: v || null });
          }}
          weddingDate={weddingDate}
        />
      </Part>

      <Part label="Area">
        <AreaTiles name="category" areas={options} otherValue="" defaultValue={current ?? ""} onChange={(v) => change({ category: v || null })} folded />
      </Part>

      <InvolvedPart kind="todo" id={m.id} involved={involved} />

      <section className="mt-7">
        <h3 className="section-label">Details</h3>
        <dl className="mt-1">
          <TextRow label="Notes" value={m.description} multiline onSave={(v) => save({ description: v })} />
        </dl>
      </section>
    </>
  );
}

/** The inside of an appointment's card: the same rule — taps save, typing gets a small Save. */
export function AppointmentBody({
  appointment: a,
  areas,
  suppliers,
  weddingDate,
  involved,
}: {
  appointment: Appointment;
  areas: AreaOption[];
  suppliers: { id: string; name: string; area?: string | null }[];
  weddingDate: string | null;
  involved: Involved;
}) {
  const save = useSave("appointment", a.id);
  const [date, setDate] = useState(a.on_date);
  const [time, setTime] = useState(a.at_time?.slice(0, 5) ?? "");
  const [area, setArea] = useState(a.area_key ?? "");
  const [round, setRound] = useState(0);
  const [error, setError] = useState<string>();
  const change = async (fields: Record<string, string | null>) => setError((await save(fields)).error);
  const known = new Set(areas.map((x) => x.key));
  const original = a.area_key;
  const options = original && original !== "other" && !known.has(original) ? [...areas, { key: original, label: original }] : areas;
  const setTimeTo = (t: string) => {
    setTime(t);
    change({ at_time: t || null });
  };

  return (
    <>
      <TitleEditor value={a.title} onSave={(v) => save({ title: v })} />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <Part label="When">
        <DateCard
          name="on_date"
          value={date}
          quick={false}
          clearable={false}
          onChange={(v) => {
            // An appointment always has a day.
            if (!v) return;
            setDate(v);
            change({ on_date: v });
          }}
          weddingDate={weddingDate}
        />
        <div className={CARD}>
          <Line icon={Clock} label="Time">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={(e) => e.target.value !== (a.at_time?.slice(0, 5) ?? "") && setTimeTo(e.target.value)}
              aria-label="Time"
              className={`${BARE} ${time ? "" : "text-stone/60"}`}
            />
            {time && (
              <button type="button" onClick={() => setTimeTo("")} className="text-xs text-stone hover:text-ink">
                No time
              </button>
            )}
          </Line>
        </div>
      </Part>

      <Part label="Area">
        <AreaTiles
          key={round}
          name="area"
          areas={options}
          otherValue="other"
          value={area}
          onChange={(v) => {
            setArea(v);
            change({ area_key: v || null });
          }}
          folded={!!a.area_key}
        />
      </Part>

      <InvolvedPart kind="appointment" id={a.id} involved={involved} />

      <section className="mt-7">
        <h3 className="section-label">Details</h3>
        <dl className="mt-1">
          <TextRow label="Where" value={a.location} onSave={(v) => save({ location: v })} />
          <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
            <dt className="type-meta py-3.5">
              <DetailLabel label="With" />
            </dt>
            <dd className="min-w-0 py-2">
              <select
                aria-label="With"
                defaultValue={a.contact_id ?? ""}
                onChange={(e) => {
                  const s = suppliers.find((x) => x.id === e.target.value);
                  const fields: Record<string, string | null> = { contact_id: e.target.value || null };
                  // Picking a supplier picks their area too, unless one's already chosen (as on the form).
                  if (s?.area && !area) {
                    const next = known.has(s.area) ? s.area : "other";
                    fields.area_key = next;
                    setArea(next);
                    setRound((r) => r + 1);
                  }
                  change(fields);
                }}
                className="h-9 w-full cursor-pointer appearance-none bg-transparent bg-[length:14px] bg-[right_2px_center] bg-no-repeat py-0 pr-6 leading-9 text-[15px] text-ink hover:text-champagne-600 focus:outline-none"
                style={{ backgroundImage: CHEVRON }}
              >
                <option value="">No one in particular</option>
                {/* That area's suppliers when it has some (16 Oct 2026), plus whoever's already picked. */}
                {suppliers
                  .filter((s) => s.id === a.contact_id || !suppliers.some((x) => x.area === area) || s.area === area)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </dd>
          </div>
          <TextRow label="Notes" value={a.notes} multiline onSave={(v) => save({ notes: v })} />
        </dl>
      </section>
    </>
  );
}

/**
 * The inside of a payment's card, by the same rule: Mark as paid, the date
 * (when it's due, or the day it was paid), the area and who it's to save at
 * a tap; what it's for, the amount and notes get a small Save.
 */
export function PaymentBody({
  payment: p,
  areas,
  suppliers,
  weddingDate,
}: {
  payment: Payment;
  areas: AreaOption[];
  suppliers: { id: string; name: string; area?: string | null }[];
  weddingDate: string | null;
}) {
  const save = useSave("payment", p.id);
  const [paidOn, setPaidOn] = useState(p.paid_on ?? "");
  const [due, setDue] = useState(p.due_date ?? "");
  const [area, setArea] = useState(p.area_key ?? "");
  const [round, setRound] = useState(0);
  const [error, setError] = useState<string>();
  const change = async (fields: Record<string, string | null>) => setError((await save(fields)).error);
  const known = new Set(areas.map((x) => x.key));
  const original = p.area_key;
  const options = original && original !== "other" && !known.has(original) ? [...areas, { key: original, label: original }] : areas;
  const paid = !!paidOn;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const next = paid ? "" : todayISO();
          setPaidOn(next);
          change({ paid_on: next || null });
        }}
        aria-pressed={paid}
        className={`mb-4 flex h-11 items-center gap-2.5 rounded-full pl-1.5 pr-4 text-[15px] transition ${
          paid ? "bg-champagne-100 text-champagne-600" : "border border-linen bg-white text-ink hover:border-champagne-400"
        }`}
      >
        <span
          className={`flex h-[30px] w-[30px] items-center justify-center rounded-full font-display text-[15px] ${
            paid ? "bg-champagne-600 text-white" : "border-[1.5px] border-champagne-400 bg-white text-champagne-600"
          }`}
        >
          {paid ? <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden /> : "£"}
        </span>
        {paid ? `Paid ${formatLongDate(paidOn).replace(/^\w+, /, "")}` : "Mark as paid"}
      </button>

      <TitleEditor value={p.description} onSave={(v) => save({ description: v })} />
      <AmountEditor value={p.amount} onSave={(v) => save({ amount: v })} />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <Part label={paid ? "Paid on" : "Due"}>
        {paid ? (
          <DateCard
            name="paid_on"
            value={paidOn}
            quick={false}
            clearable={false}
            onChange={(v) => {
              if (!v) return;
              setPaidOn(v);
              change({ paid_on: v });
            }}
          />
        ) : (
          <DateCard
            name="due_date"
            value={due}
            onChange={(v) => {
              setDue(v);
              change({ due_date: v || null });
            }}
            weddingDate={weddingDate}
          />
        )}
      </Part>

      <Part label="Area">
        <AreaTiles
          key={round}
          name="area"
          areas={options}
          otherValue="other"
          value={area}
          onChange={(v) => {
            setArea(v);
            change({ area_key: v || null });
          }}
          folded={!!p.area_key}
        />
      </Part>

      <section className="mt-7">
        <h3 className="section-label">Details</h3>
        <dl className="mt-1">
          <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
            <dt className="type-meta py-3.5">
              <DetailLabel label="To" />
            </dt>
            <dd className="min-w-0 py-2">
              <select
                aria-label="Who it's to"
                defaultValue={p.contact_id ?? ""}
                onChange={(e) => {
                  const s = suppliers.find((x) => x.id === e.target.value);
                  const fields: Record<string, string | null> = { contact_id: e.target.value || null };
                  // Picking a supplier picks their area too, unless one's already chosen (as on the form).
                  if (s?.area && !area) {
                    const next = known.has(s.area) ? s.area : "other";
                    fields.area_key = next;
                    setArea(next);
                    setRound((r) => r + 1);
                  }
                  change(fields);
                }}
                className="h-9 w-full cursor-pointer appearance-none bg-transparent bg-[length:14px] bg-[right_2px_center] bg-no-repeat py-0 pr-6 leading-9 text-[15px] text-ink hover:text-champagne-600 focus:outline-none"
                style={{ backgroundImage: CHEVRON }}
              >
                <option value="">Not a supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </dd>
          </div>
          <TextRow label="Notes" value={p.notes} multiline onSave={(v) => save({ notes: v })} />
        </dl>
      </section>
    </>
  );
}

/** The amount, as one big figure; tap it to change it (commas as you type). */
function AmountEditor({ value, onSave }: { value: number; onSave: (v: string) => Promise<{ error?: string }> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const { pending, error, setError, run } = useSaver();
  const submit = () => run(() => onSave(draft), () => setEditing(false));

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(withCommas(String(value)));
          setError(undefined);
          setEditing(true);
        }}
        className="type-figure mt-2 block text-left text-[34px] leading-none text-ink hover:text-champagne-600"
      >
        {formatMoney(value)}
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
      <span className="flex items-center gap-1">
        <span className="type-figure text-[28px] text-stone">£</span>
        <input
          autoFocus
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(withCommas(e.target.value))}
          onKeyDown={editorKeys(submit, () => setEditing(false))}
          aria-label="Amount"
          className={`${FIELD} type-figure !text-[24px]`}
        />
      </span>
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
    </form>
  );
}

/**
 * A run sheet moment (The Day), by the same rule: the time and the area
 * save at once; what happens, where, who and notes get a small Save.
 */
export function MomentBody({ moment: m, areas }: { moment: RunSheetItem; areas: AreaOption[] }) {
  const save = useSave("moment", m.id);
  const [error, setError] = useState<string>();
  const change = async (fields: Record<string, string | null>) => setError((await save(fields)).error);
  const original = m.area_key;
  const options = original && original !== "other" && !areas.some((a) => a.key === original) ? [...areas, { key: original, label: original }] : areas;

  return (
    <>
      <TitleEditor value={m.title} onSave={(v) => save({ title: v })} />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <Part label="When">
        <TimeCard value={m.at_time.slice(0, 5)} onSave={(v) => change({ at_time: v })} required />
      </Part>

      <Part label="Area">
        <AreaTiles name="area" areas={options} otherValue="" defaultValue={original ?? ""} onChange={(v) => change({ area_key: v || null })} folded />
      </Part>

      <section className="mt-7">
        <h3 className="section-label">Details</h3>
        <dl className="mt-1">
          <TextRow label="Where" value={m.location} onSave={(v) => save({ location: v })} />
          <TextRow label="Who" value={m.who} onSave={(v) => save({ who: v })} />
          <TextRow label="Notes" value={m.notes} multiline onSave={(v) => save({ notes: v })} />
        </dl>
      </section>
    </>
  );
}

/**
 * An Inspo idea, large (screen 32): the picture, ‹ › through its folder,
 * where it came from, then its folder (a tap moves it) and a note (a small
 * Save) — the same rule as every card.
 */
export function IdeaBody({ idea, folderIds, areas }: { idea: InspoWithPicture; folderIds: string[]; areas: AreaOption[] }) {
  const save = useSave("idea", idea.id);
  const [error, setError] = useState<string>();
  const at = folderIds.indexOf(idea.id);
  const prev = at > 0 ? folderIds[at - 1] : null;
  const next = at >= 0 && at < folderIds.length - 1 ? folderIds[at + 1] : null;
  const go = (id: string) => replaceQuery({ idea: id }, { sync: true });
  const step = "flex h-11 w-11 items-center justify-center rounded-full border border-linen bg-white text-ink hover:border-champagne-400";

  return (
    <>
      {idea.picture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={idea.picture} alt={idea.title ?? idea.note ?? "A saved idea"} className="max-h-[55dvh] w-full rounded-2xl bg-cream object-contain" />
      )}
      {folderIds.length > 1 && (
        <nav aria-label="More ideas in this folder" className="mt-3 flex items-center justify-between">
          {prev ? (
            <button type="button" onClick={() => go(prev)} aria-label="Previous idea" className={step}>
              <ChevronLeft className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-stone">
            {at + 1} of {folderIds.length}
          </span>
          {next ? (
            <button type="button" onClick={() => go(next)} aria-label="Next idea" className={step}>
              <ChevronRight className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
        </nav>
      )}

      {idea.title && <h2 className="mt-5 font-display text-[22px] leading-snug text-ink">{idea.title}</h2>}
      <p className="mt-1 text-xs text-stone">Saved {formatDayMonth(idea.created_at.slice(0, 10))}</p>
      {idea.url && (
        <a href={idea.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-champagne-600 underline underline-offset-4 hover:text-ink">
          <ExternalLink className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          Open where it came from
        </a>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <Part label="Folder">
        {/* Nothing picked is Unsorted, as when it was saved. */}
        <AreaTiles
          name="folder"
          areas={areas}
          otherValue="other"
          defaultValue={idea.area_key ?? ""}
          onChange={async (v) => setError((await save({ area_key: v || null })).error)}
          folded={!!idea.area_key}
        />
      </Part>

      <section className="mt-7">
        <h3 className="section-label">Details</h3>
        <dl className="mt-1">
          <TextRow label="Notes" value={idea.note} multiline onSave={(v) => save({ note: v })} />
        </dl>
      </section>
    </>
  );
}

/** A time on its own card; it saves when the phone's time picker closes. */
export function TimeCard({ value, onSave, required }: { value: string; onSave: (v: string) => void; required?: boolean }) {
  const [time, setTime] = useState(value);
  const [last, setLast] = useState(value);
  const commit = (v: string) => {
    if (v === last || (required && !v)) return setTime(last);
    setLast(v);
    onSave(v);
  };
  return (
    <div className={CARD}>
      <Line icon={Clock} label="Time">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          aria-label="Time"
          className={`${BARE} font-display !text-[21px] font-light`}
        />
      </Line>
    </div>
  );
}

/** The name, large; tap it to change it (a small Save under the box). */
export function TitleEditor({ value, onSave }: { value: string; onSave: (v: string) => Promise<{ error?: string }> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const { pending, error, setError, run } = useSaver();
  const submit = () => run(() => onSave(draft), () => setEditing(false));

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setError(undefined);
          setEditing(true);
        }}
        className="block w-full text-left font-display text-[26px] leading-tight text-ink hover:text-champagne-600"
      >
        {value}
      </button>
    );
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={editorKeys(submit, () => setEditing(false))}
        aria-label="Name"
        className={`${FIELD} font-display !text-[22px]`}
      />
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      <SaveCancel pending={pending} onCancel={() => setEditing(false)} />
    </form>
  );
}
