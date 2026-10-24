"use client";

import Timeline from "@/components/timeline";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { CalendarPlus, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, ExternalLink, GlassWater, MapPin, Music as MusicIcon, NotebookPen, Sparkles, UserRound, Users, Utensils, X, type LucideIcon } from "lucide-react";
import { AreaTiles, BARE, CARD, DateCard, Line, Part } from "@/components/visual-form";
import { areaName, type AreaOption } from "@/lib/areas";
import type { Appointment, Milestone, Payment, RunSheetItem } from "@/types/db";
import { todayISO, formatClock, formatDayMonth, formatLongDate } from "@/lib/dates";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/ics";
import { musicSource, musicTitle } from "@/lib/music";
import { FromSelect } from "../decor/decor-bits";
import type { DecorPerson } from "../decor/decor-people";
import { replaceQuery } from "@/lib/url-state";
import type { InspoWithPicture } from "@/lib/db/inspo";
import { formatMoney, withCommas } from "@/lib/money";
import { initialsOf } from "@/lib/names";
import { CHEVRON, editorKeys, FIELD, safely, SaveCancel, TextRow, useSaver } from "../people/guest-card";
import { DetailLabel } from "../people/guest-table";
import { moveMomentAction, updatePlanFieldsAction, type Involved, type MomentFood } from "./card-actions";
import { addCourseForMomentAction, setMomentFoodAction } from "../menu/actions";
import { InvolvedPart } from "./involved";
import { AreaPageLink, AreaTagRow, ItemAction, ItemSignature, WhereRow } from "./item-parts";
import { host } from "@/components/note-text";

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
  done,
  pending,
  onToggle,
}: {
  milestone: Milestone;
  areas: AreaOption[];
  weddingDate: string | null;
  involved: Involved;
  done: boolean;
  pending: boolean;
  onToggle: (done: boolean) => void;
}) {
  const save = useSave("todo", m.id);
  const [date, setDate] = useState(m.due_date ?? m.remind_at?.slice(0, 10) ?? "");
  const [time, setTime] = useState(m.due_time?.slice(0, 5) ?? "");
  const [area, setArea] = useState(m.category ?? "");
  const [error, setError] = useState<string>();
  const change = async (fields: Record<string, string | null>) => setError((await save(fields)).error);

  // An area that's since been switched off (or an old "Guests" tag) keeps its tile.
  const current = m.category;
  const options = current && !areas.some((a) => a.key === current) ? [...areas, { key: current, label: areaName(current, areas) ?? current }] : areas;

  return (
    <>
      <ItemSignature
        titleEditor={<TitleEditor value={m.title} onSave={(v) => save({ title: v })} />}
        date={date}
        dateName="when"
        onDate={(v) => {
          setDate(v);
          // No day, no time: a time only means something with a date.
          if (!v) setTime("");
          change(v ? { due_date: v } : { due_date: null, due_time: null });
        }}
        weddingDate={weddingDate}
        // A time on a to-do (owner, 23 Oct 2026), once it has a day.
        time={date ? time : undefined}
        onTime={(t) => {
          setTime(t);
          change({ due_time: t || null });
        }}
        area={area}
        areaOptions={options}
        otherValue=""
        onArea={(v) => {
          setArea(v);
          change({ category: v || null });
        }}
      />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <ItemAction label="Mark as done" doneLabel="Done" done={done} pending={pending} onClick={() => onToggle(!done)} />

      <InvolvedPart kind="todo" id={m.id} involved={involved} />

      <section className="mt-7">
        <dl>
          <TextRow label="Notes" value={m.description} multiline onSave={(v) => save({ description: v })} />
        </dl>
      </section>

      <AreaPageLink areaKey={area} areas={areas} />
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
      <ItemSignature
        titleEditor={<TitleEditor value={a.title} onSave={(v) => save({ title: v })} />}
        date={date}
        dateName="on_date"
        onDate={(v) => {
          // An appointment always has a day.
          if (!v) return;
          setDate(v);
          change({ on_date: v });
        }}
        weddingDate={weddingDate}
        quick={false}
        clearable={false}
        time={time}
        onTime={setTimeTo}
        area={area}
        areaOptions={options}
        areaRound={round}
        onArea={(v) => {
          setArea(v);
          change({ area_key: v || null });
        }}
      />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      {/* Into their own calendar (feedback item 3; owner, 19 Oct 2026: "an option for which calendar"). The main action, so black. */}
      <AddToCalendar appointment={a} withWhom={suppliers.find((s) => s.id === a.contact_id)?.name ?? null} />

      <InvolvedPart kind="appointment" id={a.id} involved={involved} label="Who's coming" />

      <section className="mt-7">
        <dl>
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
        </dl>
      </section>

      <Part label="Where">
        <WhereRow value={a.location} onSave={(v) => save({ location: v })} />
      </Part>

      <section className="mt-7">
        <dl>
          <TextRow label="Notes" value={a.notes} multiline onSave={(v) => save({ notes: v })} />
        </dl>
      </section>

      <AreaPageLink areaKey={area} areas={areas} />
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
  involved,
}: {
  payment: Payment;
  /** Who's paying it: guests tagged, none means the couple. */
  involved: Involved;
  areas: AreaOption[];
  suppliers: { id: string; name: string; area?: string | null }[];
  weddingDate: string | null;
}) {
  const save = useSave("payment", p.id);
  const [paidOn, setPaidOn] = useState(p.paid_on ?? "");
  const [due, setDue] = useState(p.due_date ?? "");
  const known = new Set(areas.map((x) => x.key));
  // With no area of its own a payment belongs to its supplier's (as Money counts it),
  // so the card shows that one picked rather than none (owner, 17 Oct 2026).
  const supplierArea = (id: string | null) => {
    const a = suppliers.find((x) => x.id === id)?.area;
    return a ? (known.has(a) ? a : "other") : "";
  };
  const [followsSupplier, setFollowsSupplier] = useState(!p.area_key);
  const [area, setArea] = useState(p.area_key ?? supplierArea(p.contact_id));
  const [round, setRound] = useState(0);
  const [error, setError] = useState<string>();
  const change = async (fields: Record<string, string | null>) => setError((await save(fields)).error);
  const original = p.area_key;
  const options = original && original !== "other" && !known.has(original) ? [...areas, { key: original, label: original }] : areas;
  const paid = !!paidOn;
  const [contactId, setContactId] = useState(p.contact_id ?? "");
  const supplierName = suppliers.find((x) => x.id === contactId)?.name ?? null;
  const pickSupplier = (id: string) => {
    setContactId(id);
    const s = suppliers.find((x) => x.id === id);
    const fields: Record<string, string | null> = { contact_id: id || null };
    // Picking a supplier picks their area too, unless one's already chosen (as on the form).
    if (followsSupplier) {
      // Still following its supplier: show the new one's area (nothing to save).
      setArea(supplierArea(id || null));
      setRound((r) => r + 1);
    } else if (s?.area && !area) {
      const next = known.has(s.area) ? s.area : "other";
      fields.area_key = next;
      setArea(next);
      setRound((r) => r + 1);
    }
    change(fields);
  };

  return (
    <>
      <ItemSignature
        titleEditor={<TitleEditor value={p.description} onSave={(v) => save({ description: v })} />}
        date={paid ? paidOn : due}
        dateName={paid ? "paid_on" : "due_date"}
        dateNote={paid ? "Paid " : "Due "}
        slip={{
          howFar: !paid,
          head: (
            <label className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[14px] text-champagne-600 ${
                  supplierName ? "bg-white shadow-[0_0_0_1px_#E6E0D6]" : "border border-dashed border-champagne-600/50"
                }`}
              >
                {supplierName ? initialsOf(supplierName) : "+"}
              </span>
              <select
                aria-label="Who it's to"
                value={contactId}
                onChange={(e) => pickSupplier(e.target.value)}
                className={`h-9 min-w-0 cursor-pointer appearance-none truncate bg-transparent bg-[length:14px] bg-[right_2px_center] bg-no-repeat py-0 pr-6 leading-9 text-[15px] hover:text-champagne-600 focus:outline-none ${
                  supplierName ? "text-ink" : "text-champagne-600"
                }`}
                style={{ backgroundImage: CHEVRON }}
              >
                <option value="">Who it's to</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ),
          amount: <AmountEditor value={p.amount} onSave={(v) => save({ amount: v })} inSlip />,
        }}
        onDate={(v) => {
          if (paid) {
            // A paid payment always has the day it was paid.
            if (!v) return;
            setPaidOn(v);
            change({ paid_on: v });
          } else {
            setDue(v);
            change({ due_date: v || null });
          }
        }}
        weddingDate={weddingDate}
        quick={!paid}
        clearable={!paid}
        area={area}
        areaOptions={options}
        areaRound={round}
        onArea={(v) => {
          setArea(v);
          setFollowsSupplier(false);
          change({ area_key: v || null });
        }}
      />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <ItemAction
        label="Mark as paid"
        doneLabel={paid ? `Paid ${formatLongDate(paidOn).replace(/^\w+, /, "")}` : ""}
        mark="£"
        wide
        done={paid}
        onClick={() => {
          const next = paid ? "" : todayISO();
          setPaidOn(next);
          change({ paid_on: next || null });
        }}
      />

      {/* Family paying a bill themselves (owner, 17 Oct 2026). Nobody tagged = the couple. */}
      <InvolvedPart kind="payment" id={p.id} involved={involved} label="Who's paying" nobody="Us" />

      {/* Every payment to the same supplier, paid and to come (canvas 3 "Timeline · Round 3", 2). */}
      {contactId && (
        <Timeline
          scope={`supplier:${contactId}`}
          only="money"
          label={`All payments to ${supplierName ?? "them"}`}
        />
      )}

      <section className="mt-7">
        <dl>
          <TextRow label="Notes" value={p.notes} multiline onSave={(v) => save({ notes: v })} />
        </dl>
      </section>

      <AreaPageLink areaKey={area} areas={areas} />
    </>
  );
}

/** The amount, as one big figure; tap it to change it (commas as you type). */
function AmountEditor({ value, onSave, inSlip }: { value: number; onSave: (v: string) => Promise<{ error?: string }>; inSlip?: boolean }) {
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
        className={`type-figure block whitespace-nowrap text-left leading-none text-ink hover:text-champagne-600 ${inSlip ? "text-[38px]" : "mt-2 text-[34px]"}`}
      >
        {formatMoney(value)}
      </button>
    );
  }
  return (
    <form
      className={inSlip ? "w-full" : "mt-2"}
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
/**
 * A moment on the day (canvas 3 "Moment · Round 1", owner's pick 19 Oct 2026:
 * B's cue card on top, then C's lines that open in place). The cue card is
 * the moment at a glance — the time, what happens (tap to rename), where and
 * who's in charge, its song. Under it one line each — When, Where, In charge,
 * Music, Notes, Area — saying what's there or "Add …" in gold; tap to open
 * and change it in place. One person **in charge**, picked from the
 * suppliers and guests (0031), or a typed name for anyone else.
 */
export function MomentBody({
  moment: m,
  areas,
  people,
  inChargeEmail,
  weddingDate,
  sheets,
  food,
}: {
  moment: RunSheetItem;
  areas: AreaOption[];
  people: DecorPerson[];
  inChargeEmail: string | null;
  weddingDate: string | null;
  /** The run sheets besides the main one (0035); the moment is on one and can be moved or copied. */
  sheets: { id: string; name: string }[];
  /** The menu's courses and the drinks, and which are served at it (0034). */
  food: MomentFood;
}) {
  const router = useRouter();
  // Which run sheet it is on (0035): the main one, "The day", or another with its own moments.
  const [sheetId, setSheetId] = useState<string | null>(m.sheet_id ?? null);
  const sheetLabel = sheetId ? (sheets.find((x) => x.id === sheetId)?.name ?? "Another run sheet") : "The day";
  const [copied, setCopied] = useState<string | null>(null);
  const toSheet = async (target: string | null, copy: boolean) => {
    const result = await safely(() => moveMomentAction(m.id, target, copy));
    if (result.error) return setError(result.error);
    setError(undefined);
    if (copy) setCopied(target ?? "");
    else setSheetId(target);
    router.refresh();
  };
  const choices = [{ id: null as string | null, name: "The day" }, ...sheets.map((x) => ({ id: x.id as string | null, name: x.name }))];
  // Food and drink moments get Menu and Drinks lines (0034): the courses and drinks served here.
  const [courseIds, setCourseIds] = useState(food.courses.filter((c) => c.here).map((c) => c.id));
  const [drinkIds, setDrinkIds] = useState(food.drinks.filter((d) => d.here).map((d) => d.id));
  const toggled = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const setServed = async (courses: string[], drinks: string[]) => {
    const before = [courseIds, drinkIds];
    setCourseIds(courses);
    setDrinkIds(drinks);
    const result = await safely(() => setMomentFoodAction(m.id, courses, drinks));
    if (result.error) {
      setCourseIds(before[0]);
      setDrinkIds(before[1]);
      setError(result.error);
    } else {
      setError(undefined);
      router.refresh();
    }
  };
  const servedCourses = food.courses.filter((c) => courseIds.includes(c.id));
  const servedDrinks = food.drinks.filter((d) => drinkIds.includes(d.id));
  const isFoodMoment = m.area_key === "food" || m.area_key === "catering" || courseIds.length + drinkIds.length > 0;
  const save = useSave("moment", m.id);
  const [error, setError] = useState<string>();
  const change = async (fields: Record<string, string | null>) => setError((await save(fields)).error);
  const original = m.area_key;
  const options = original && original !== "other" && !areas.some((a) => a.key === original) ? [...areas, { key: original, label: original }] : areas;
  const inCharge = people.find((p) => p.id === m.contact_id)?.name ?? m.who ?? null;
  const [pick, setPick] = useState(m.contact_id ?? (m.who ? "typed" : ""));
  const areaLabel = original ? (areaName(original, options) ?? original) : null;
  const music = musicTitle(m);
  const [area, setArea] = useState(m.area_key ?? "");
  // What's been added shows as its own part; what hasn't is offered as a "+" chip at the foot, so nothing is forced (owner, 23 Oct 2026).
  const [shown, setShown] = useState<string[]>([]);
  const has: Record<string, boolean> = { where: !!m.location, charge: !!inCharge, menu: servedCourses.length > 0, drinks: servedDrinks.length > 0, music: !!music, notes: !!m.notes };
  const on = (key: string) => has[key] || shown.includes(key);
  const offered = [
    ["where", "Where"],
    ["charge", "In charge"],
    ...(isFoodMoment
      ? [
          ["menu", "Menu"],
          ["drinks", "Drinks"],
        ]
      : []),
    ["music", "Music"],
    ["notes", "Notes"],
  ].filter(([key]) => !on(key));

  return (
    <>
      <ItemSignature
        titleEditor={<TitleEditor value={m.title} onSave={(v) => save({ title: v })} />}
        date=""
        dateName="at_time"
        onDate={() => {}}
        stamp={{ big: formatClock(m.at_time), small: "Day", sub: sheetLabel, panel: <TimeCard value={m.at_time.slice(0, 5)} onSave={(v) => change({ at_time: v })} required /> }}
        area={area}
        areaOptions={options}
        onArea={(v) => {
          setArea(v);
          change({ area_key: v || null });
        }}
      />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <SendMoment moment={m} inCharge={inCharge} email={inChargeEmail} weddingDate={weddingDate} />

      {on("charge") && (
        <Part label="In charge">
          <FromSelect
            label="Who's in charge"
            people={people}
            value={pick}
            onChange={(v) => {
              setPick(v);
              if (v !== "typed") change({ contact_id: v || null, who: null });
            }}
            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-linen bg-white bg-[length:14px] bg-[right_12px_center] bg-no-repeat px-3.5 pr-8 text-[15px] text-ink focus:outline-none"
          />
          {pick === "typed" && (
            <dl className="mt-1">
              <TextRow label="Their name" value={m.who} startEditing={!m.who} onSave={(v) => save({ who: v, contact_id: null })} />
            </dl>
          )}
        </Part>
      )}

      {on("where") && (
        <Part label="Where">
          <WhereRow value={m.location} startEditing={!m.location && shown.includes("where")} onSave={(v) => save({ location: v })} />
        </Part>
      )}

      {/* Food and drink through the day (canvas 3 "Food & drink · Round 2", A): the courses and drinks served at this moment. */}
      {isFoodMoment && on("menu") && (
        <Part label="Menu served here">
          {servedCourses.map((c) => (
            <p key={c.id} className="mb-1.5 text-[13px] text-stone">
              <span className="text-[14px] text-ink">{c.name}</span> · {c.dishes.length ? c.dishes.join(" · ") : "no dishes yet"}
            </p>
          ))}
          <div className="mt-2 flex flex-wrap gap-2">
            {food.courses.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={courseIds.includes(c.id)}
                onClick={() => setServed(toggled(courseIds, c.id), drinkIds)}
                className={`h-9 rounded-full border px-3.5 text-[13px] ${courseIds.includes(c.id) ? "border-champagne-600 bg-champagne-100 font-medium text-champagne-600" : "border-linen bg-white text-ink"}`}
              >
                {c.name}
                {c.elsewhere && !courseIds.includes(c.id) && <span className="text-stone"> · moves here</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={async () => {
                const r = await safely(() => addCourseForMomentAction(m.id, m.title, m.at_time, false));
                if (r.error) setError(r.error);
                else router.refresh();
              }}
              className="h-9 rounded-full border border-dashed border-champagne-400 px-3.5 text-[13px] text-champagne-600"
            >
              + A course for {m.title}
            </button>
          </div>
          <a href="/menu" className="mt-2 inline-block text-[13px] text-champagne-600 underline underline-offset-4">The menu ›</a>
        </Part>
      )}
      {isFoodMoment && on("drinks") && (
        <Part label="Drinks served here">
          {servedDrinks.map((d) => (
            <p key={d.id} className="mb-1 text-[14px] text-ink">
              {d.name}
              {d.line && <span className="text-stone"> · {d.line}</span>}
            </p>
          ))}
          <div className="mt-2 flex flex-wrap gap-2">
            {food.drinks.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={drinkIds.includes(d.id)}
                onClick={() => setServed(courseIds, toggled(drinkIds, d.id))}
                className={`h-9 rounded-full border px-3.5 text-[13px] ${drinkIds.includes(d.id) ? "border-champagne-600 bg-champagne-100 font-medium text-champagne-600" : "border-linen bg-white text-ink"}`}
              >
                {d.name}
                {d.elsewhere && !drinkIds.includes(d.id) && <span className="text-stone"> · moves here</span>}
              </button>
            ))}
            {food.drinks.length === 0 && <span className="text-[13px] text-stone">No drinks yet.</span>}
          </div>
          <a href="/drinks" className="mt-2 inline-block text-[13px] text-champagne-600 underline underline-offset-4">The drinks ›</a>
        </Part>
      )}

      {on("music") && (
        <Part label="Music">
          <div className="flex rounded-full bg-cream p-[3px]">
            {(["song", "playlist"] as const).map((k) => {
              const picked = (m.music_kind ?? "song") === k;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => change({ music_kind: k })}
                  className={`h-9 flex-1 rounded-full text-[13.5px] transition ${picked ? "bg-white text-ink shadow-[0_1px_4px_rgb(60_50_40/0.12)]" : "text-stone"}`}
                >
                  {k === "song" ? "A song" : "A playlist"}
                </button>
              );
            })}
          </div>
          <dl className="mt-1">
            <TextRow label={m.music_kind === "playlist" ? "Playlist" : "Song"} value={m.music ?? null} startEditing={!m.music && shown.includes("music")} onSave={(v) => save({ music: v })} />
            <MusicLinkRow url={m.music_url ?? null} onSave={(v) => save({ music_url: v })} />
          </dl>
        </Part>
      )}

      {on("notes") && (
        <section className="mt-7">
          <dl>
            <TextRow label="Notes" value={m.notes} multiline startEditing={!m.notes && shown.includes("notes")} onSave={(v) => save({ notes: v })} />
          </dl>
        </section>
      )}

      {/* Which run sheet it is on (canvas 3 "Run sheets · Round 1"): move it, or copy it so it shows on two. */}
      {sheets.length > 0 && (
        <div className="glass-card mt-7 overflow-hidden rounded-[22px] px-4">
          <Fold icon={Users} title="Run sheet" value={sheetLabel}>
            <p className="text-[13px] text-stone">Move it to another run sheet, or copy it so it is on two (a copy is its own moment).</p>
            <p className="type-meta mt-3">Move to</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {choices.map((c) => {
                const here = c.id === sheetId;
                return (
                  <button
                    key={c.id ?? "main"}
                    type="button"
                    aria-pressed={here}
                    onClick={() => !here && toSheet(c.id, false)}
                    className={`h-9 rounded-full border px-3.5 text-[13px] ${here ? "border-champagne-600 bg-champagne-100 font-medium text-champagne-600" : "border-linen bg-white text-ink"}`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
            <p className="type-meta mt-3">Copy to</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {choices
                .filter((c) => c.id !== sheetId)
                .map((c) => (
                  <button
                    key={c.id ?? "main"}
                    type="button"
                    onClick={() => toSheet(c.id, true)}
                    className="h-9 rounded-full border border-linen bg-white px-3.5 text-[13px] text-ink"
                  >
                    {copied === (c.id ?? "") ? `✓ Copied to ${c.name}` : c.name}
                  </button>
                ))}
            </div>
          </Fold>
        </div>
      )}

      {offered.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Add to this moment">
          {offered.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setShown((list) => [...list, key])}
              className="h-9 rounded-full border border-dashed border-champagne-400 px-3.5 text-[13px] text-champagne-600 hover:bg-cream"
            >
              + {label}
            </button>
          ))}
        </div>
      )}

      <AreaPageLink areaKey={area} areas={areas} />
    </>
  );
}

/**
 * Send one moment to whoever's doing it — the song to the DJ, the timings to
 * the venue (owner, 19 Oct 2026: one copy of every song didn't fit; the
 * church, the venue and the DJ each need their own). Opens the couple's own
 * email with it written in; the app sends and keeps nothing.
 */
function SendMoment({ moment: m, inCharge, email, weddingDate }: { moment: RunSheetItem; inCharge: string | null; email: string | null; weddingDate: string | null }) {
  const [copied, setCopied] = useState(false);
  const when = `${formatClock(m.at_time)}${weddingDate ? `, ${formatLongDate(weddingDate)}` : ""}`;
  const body = [
    m.title,
    when,
    m.location && `Where: ${m.location}`,
    m.music && `${m.music_kind === "playlist" ? "Playlist" : "Song"}: ${m.music}`,
    m.music_url && `Link: ${m.music_url}`,
    m.notes && `Notes: ${m.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
  const subject = `${m.title} · ${formatClock(m.at_time)}`;
  const href = `mailto:${email ? encodeURIComponent(email) : ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  // Under the name, as the card's main action (owner, 23 Oct 2026): black "Email [name]", with Copy it beside it.
  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      <a href={href} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] text-ivory hover:bg-ink/90">
        {email && inCharge ? `Email ${inCharge}` : "Email it"}
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(body);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            setCopied(false);
          }
        }}
        className="h-12 rounded-full border border-linen bg-white px-5 text-[15px] text-ink hover:border-champagne-400"
      >
        {copied ? "Copied" : "Copy it"}
      </button>
    </div>
  );
}

/** One line of a moment's card: what's there (or "Add …" in gold), opening in place to change it. */
function Fold({ icon: Icon, title, value, add, children }: { icon: LucideIcon; title: string; value: string | null | undefined; add?: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-ink/[0.12] last:border-b-0">
      <summary className="flex min-h-[60px] cursor-pointer list-none items-center gap-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
          <Icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] text-ink">{title}</span>
          <span className={`block truncate text-[13px] ${value ? "text-stone" : "text-champagne-600"}`}>{value || add || "Not set"}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-stone transition group-open:rotate-180" strokeWidth={1.8} aria-hidden />
      </summary>
      <div className="pb-4 pl-[46px]">{children}</div>
    </details>
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
  const [area, setArea] = useState(idea.area_key ?? "");

  return (
    <>
      {/* Its folder is its area: the tag at the top right, like every card (owner, 23 Oct 2026). Nothing picked is Unsorted. */}
      <AreaTagRow
        area={area}
        areaOptions={areas}
        empty="Add to an area"
        onArea={async (v) => {
          setArea(v);
          setError((await save({ area_key: v || null })).error);
        }}
      />
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
          View on {host(idea.url)}
        </a>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <section className="mt-7">
        <dl>
          <TextRow label="Notes" value={idea.note} multiline onSave={(v) => save({ note: v })} />
        </dl>
      </section>

      <AreaPageLink areaKey={area} areas={areas} />
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

/**
 * "Add to my calendar" opens a choice in a pop-up in the middle (owner,
 * 19 Oct 2026: the choice opening under the button "doesn't feel right"):
 * the phone's own calendar (an .ics file), Google Calendar or Outlook. The
 * iPhone's own screen can't be changed from here, so the pop-up says what to
 * tap on it: Add to Calendar at the bottom, then the calendar (its blue tick
 * does nothing). The web ones open the couple's own account with the event
 * filled in; nothing is saved anywhere until they press Save there.
 */
function AddToCalendar({ appointment: a, withWhom }: { appointment: Appointment; withWhom: string | null }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const row = "flex min-h-[56px] items-center justify-between gap-3 border-b border-linen px-1 text-left text-[15px] text-ink last:border-b-0 hover:text-champagne-600";
  const go = () => setOpen(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex h-12 items-center gap-2.5 rounded-full bg-ink px-5 text-[15px] text-ivory hover:bg-ink/90"
      >
        <CalendarPlus className="h-4 w-4" strokeWidth={1.6} aria-hidden />
        Add to my calendar
      </button>
      {/* Over the whole screen, not inside the card (which can move as it's pulled). */}
      {open && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-label="Add to my calendar">
          <button type="button" aria-label="Close" onClick={go} className="absolute inset-0 h-full w-full cursor-default bg-ink/40" />
          <div className="relative w-full max-w-sm rounded-[26px] bg-ivory p-5 shadow-[0_24px_60px_-20px_rgb(30_27_24/0.5)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[22px] font-light leading-tight text-ink">Add to my calendar</h2>
                <p className="mt-1 text-[13px] text-stone">Which calendar do you use?</p>
              </div>
              <button type="button" onClick={go} aria-label="Close" className="-mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded-full text-stone hover:text-ink">
                <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-linen bg-white px-3">
              <a href={`/plan/appointments/${a.id}/calendar`} onClick={go} className={row}>
                <span>
                  iPhone or Mac calendar
                  <span className="mt-0.5 block text-[12px] leading-snug text-stone">On the next screen, tap Add to Calendar at the bottom, then pick the calendar (Home, Work…)</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.6} aria-hidden />
              </a>
              <a href={googleCalendarUrl(a, withWhom)} target="_blank" rel="noopener noreferrer" onClick={go} className={row}>
                Google Calendar
                <ExternalLink className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.6} aria-hidden />
              </a>
              <a href={outlookCalendarUrl(a, withWhom, false)} target="_blank" rel="noopener noreferrer" onClick={go} className={row}>
                Outlook (Hotmail, Outlook.com)
                <ExternalLink className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.6} aria-hidden />
              </a>
              <a href={outlookCalendarUrl(a, withWhom, true)} target="_blank" rel="noopener noreferrer" onClick={go} className={row}>
                Outlook for work or school
                <ExternalLink className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.6} aria-hidden />
              </a>
            </div>
            <button type="button" onClick={go} className="mt-4 h-11 w-full rounded-full text-[15px] text-stone hover:text-ink">
              Cancel
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * The song's link on a moment's card: "Play on Spotify" you can tap, rather
 * than the long address (owner, 19 Oct 2026), with Change to paste another.
 */
function MusicLinkRow({ url, onSave }: { url: string | null; onSave: (v: string) => Promise<{ error?: string }> }) {
  const [editing, setEditing] = useState(!url);
  if (editing || !url) {
    return <TextRow label="Link" value={url} type="url" startEditing={!!url} onSave={async (v) => {
      const result = await onSave(v);
      if (!result.error && v.trim()) setEditing(false);
      return result;
    }} />;
  }
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 border-b border-linen">
      <dt className="type-meta py-3.5"><DetailLabel label="Link" /></dt>
      <dd className="flex min-w-0 items-center justify-between gap-3 py-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[15px] text-champagne-600 hover:text-ink">
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
          Play on {musicSource(url)}
        </a>
        <button type="button" onClick={() => setEditing(true)} className="text-[13px] text-stone underline underline-offset-4 hover:text-ink">
          Change
        </button>
      </dd>
    </div>
  );
}

