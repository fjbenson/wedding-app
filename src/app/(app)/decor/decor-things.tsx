"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Check, ChevronDown, Hash, MapPin, Palette, UserRound } from "lucide-react";
import CardSheet from "@/components/card-sheet";
import DateStamp from "@/components/date-stamp";
import NumbersCard from "@/components/numbers-card";
import { DateCard, Part } from "@/components/visual-form";
import { byPlace, decorCounts, goesBack, nextStatus, packList, PLACES, sourceLabel, SOURCES, STATUSES, withQuantity } from "@/lib/decor";
import { formatDayMonth, formatWeekdayDayMonth, todayISO } from "@/lib/dates";
import { initialsOf } from "@/lib/names";
import { replaceQuery } from "@/lib/url-state";
import type { DecorWithHelpers } from "@/lib/db/decor";
import type { DecorStatus } from "@/types/db";
import { CHEVRON, safely, TextRow } from "../people/guest-card";
import { DetailLabel } from "../people/guest-table";
import { TitleEditor } from "../plan/plan-card-body";
import { ItemAction } from "../plan/item-parts";
import { useCycle, useRegisterCycle } from "@/lib/card-cycle";
import { removeDecorAction, setDecorHelpersAction, updateDecorFieldsAction } from "./actions";
import { FromSelect, PlacePicker, SOURCE_ICONS } from "./decor-bits";
import type { DecorPerson } from "./decor-people";

type Items = DecorWithHelpers[];

/* ── Shared ─────────────────────────────────────────────────────────────── */

const ROW = "row-press flex items-center gap-3 border-b border-ink/[0.12] last:border-b-0";
const GROUP_HEAD = "mt-6 flex items-baseline justify-between px-1";

/** Opens an item's card over the page (`?thing=`), wherever its row is. */
const open = (id: string) => replaceQuery({ thing: id }, { sync: true });

/** The circle at a row's end: dashed still to get, a ring got it, gold packed or given back. A tap moves it on. */
function StatusCircle({ item, after = false }: { item: DecorWithHelpers; after?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // On the pack list's "after the day", the circle is only about giving it back.
  const next: DecorStatus | null = after ? (item.status === "returned" ? "packed" : "returned") : nextStatus(item);
  const done = after ? item.status === "returned" : item.status === "packed" || item.status === "returned";
  const look = done
    ? "bg-champagne-600 text-white"
    : item.status === "got" && !after
      ? "border-2 border-champagne-400 bg-white"
      : "border-[1.5px] border-dashed border-champagne-400 bg-white";
  const label = next ? `Mark "${item.name}" as ${STATUSES.find((s) => s.value === next)?.label.toLowerCase()}` : `${item.name}: packed`;
  return (
    <button
      type="button"
      disabled={!next || pending}
      aria-label={label}
      onClick={() =>
        next &&
        start(async () => {
          const result = await safely(() => updateDecorFieldsAction(item.id, { status: next }));
          if (!result.error) router.refresh();
        })
      }
      className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full transition disabled:cursor-default ${look} ${pending ? "opacity-50" : ""}`}
    >
      {done && <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />}
    </button>
  );
}

/** "Borrowed · Auntie Jo" — where it's from and who from. */
function fromLine(item: DecorWithHelpers, people: DecorPerson[]) {
  const who = people.find((p) => p.id === item.from_contact_id)?.name ?? item.from_name;
  const src = sourceLabel(item.source);
  return [src, who ?? (item.source === "made" ? "by us" : null)].filter(Boolean).join(" · ");
}

function Initials({ ids, names, people }: { ids: string[]; names?: string | null; people: DecorPerson[] }) {
  const all = [...ids.map((id) => people.find((p) => p.id === id)?.name).filter((n): n is string => !!n), ...(names ? names.split(/,| and /).map((n) => n.trim()).filter(Boolean) : [])];
  if (all.length === 0) return null;
  return (
    <span className="flex shrink-0" aria-label={`Set up by ${all.join(", ")}`}>
      {all.slice(0, 3).map((n, i) => (
        <span key={n + i} aria-hidden className={`flex h-6 w-6 items-center justify-center rounded-full bg-champagne-100 text-[9.5px] font-medium text-champagne-600 ring-2 ring-white ${i ? "-ml-1.5" : ""}`}>
          {initialsOf(n)}
        </span>
      ))}
    </span>
  );
}

/** One thing: how many, its name, where it's from, then its circle. */
function ThingRow({ item, people }: { item: DecorWithHelpers; people: DecorPerson[] }) {
  const line = fromLine(item, people);
  return (
    <li className={ROW}>
      <button type="button" onClick={() => open(item.id)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
        <span className="type-figure w-10 shrink-0 text-[21px] tabular-nums !text-champagne-600">{item.quantity ?? 1}</span>
        <span className="min-w-0 flex-1">
          <span className={`type-item block truncate ${item.status === "returned" ? "!text-stone" : ""}`}>{item.name}</span>
          {line && <span className="block truncate text-[13px] text-stone">{line}</span>}
        </span>
      </button>
      <StatusCircle item={item} />
    </li>
  );
}

function Key() {
  return (
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 px-1 text-[12.5px] text-stone">
      <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full border-[1.5px] border-dashed border-champagne-400" />still to get</span>
      <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full border-2 border-champagne-400" />got it</span>
      <span className="flex items-center gap-1.5"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-champagne-600 text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden /></span>packed</span>
    </div>
  );
}

/* ── The Decor area page ────────────────────────────────────────────────── */

/**
 * In place of the five stages on the Decor area (canvas 3 "Decor · Round 2",
 * owner's pick 19 Oct 2026): the things counted, then grouped by where they go.
 */
export function DecorThings({ items, people, areaKey, weddingDate }: { items: Items; people: DecorPerson[]; areaKey: string; weddingDate: string | null }) {
  const counts = decorCounts(items);
  const back = encodeURIComponent(`/area/${areaKey}`);
  return (
    <section aria-label="Items">
      {/* Added from the page's one + (the cover's), not a second one here. */}
      <h2 className="section-label">Items</h2>
      <NumbersCard
        big={{ label: "Items", value: counts.all, sub: counts.goBack ? `${counts.goBack} go back after` : undefined }}
        rows={[
          { value: counts.toGet, label: "Still to get" },
          { value: counts.got, label: "Got it" },
          { value: counts.packed, label: "Packed" },
        ]}
      />
      {items.length === 0 ? (
        // An empty screen still shows its shape: the usual places, each a faded add.
        <ul className="glass-card mt-4 overflow-hidden rounded-[22px] px-4">
          {["Ceremony", "Arrival and entrance", "The tables"].map((p) => (
            <li key={p} className="border-b border-ink/[0.12] last:border-b-0">
              <a href={`/decor/new?back=${back}&place=${encodeURIComponent(p)}`} className="flex min-h-[52px] items-center gap-3 text-stone/80">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 text-champagne-600">+</span>
                <span className="font-display italic">Something for {p.toLowerCase()}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {byPlace(items).map((g) => (
            <div key={g.place}>
              <h3 className={GROUP_HEAD}>
                <span className="section-label">{g.place}</span>
                <span className="text-[12px] text-stone">{g.items.length === 1 ? "1 item" : `${g.items.length} items`}</span>
              </h3>
              <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
                {g.items.map((item) => (
                  <ThingRow key={item.id} item={item} people={people} />
                ))}
              </ul>
            </div>
          ))}
          <Key />
        </>
      )}
      <ThingCard items={items} people={people} weddingDate={weddingDate} />
    </section>
  );
}

/* ── The Day › Decor: the pack list ─────────────────────────────────────── */

/** The same things as the day's logistics (canvas 3 "Decor · Round 2", 3). */
export function PackList({ items, people, weddingDate }: { items: Items; people: DecorPerson[]; weddingDate: string | null }) {
  const today = todayISO();
  const { before, setUp, after } = packList(items);
  const counts = decorCounts(items);
  return (
    <>
      <NumbersCard
        big={{ label: "Packed", value: counts.packed, sub: `of ${counts.all}` }}
        rows={[
          { value: counts.toGet, label: "Still to get" },
          { value: counts.toCollect, label: "To collect" },
          { value: counts.goBack, label: "Go back" },
        ]}
      />

      {items.length === 0 && (
        <p className="mt-6 px-1 text-[15px] text-stone">Nothing on the list yet. Add the first item with the +.</p>
      )}

      {/* On a laptop two columns (owner, 23 Oct 2026): what to get and pack on the left, the venue and the way back on the right. */}
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
      <div>
      {before.length > 0 && (
        <>
          <h2 className={GROUP_HEAD}>
            <span className="section-label">Before the day</span>
            <span className="text-[12px] text-stone">{before.length === 1 ? "1 item" : `${before.length} items`}</span>
          </h2>
          <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
            {before.map((item) => (
              <li key={item.id} className={ROW}>
                <button type="button" onClick={() => open(item.id)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                  <DateStamp date={item.collect_on} today={today} overdue={!!item.collect_on && item.collect_on < today && item.status === "to_get"} done={false} />
                  <span className="min-w-0 flex-1">
                    <span className="type-item block truncate">{withQuantity(item)}</span>
                    <span className="block truncate text-[13px] text-stone">{fromLine(item, people) || (item.status === "got" ? "Got it · to pack" : "Still to get")}</span>
                  </span>
                </button>
                <StatusCircle item={item} />
              </li>
            ))}
          </ul>
        </>
      )}

      </div>
      <div>
      {setUp.length > 0 && (
        <>
          <h2 className={GROUP_HEAD}>
            <span className="section-label">Set up at the venue</span>
            <span className="text-[12px] text-stone">by who</span>
          </h2>
          <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
            {setUp.map((g) => {
              const helpers = [...new Set(g.items.flatMap((i) => i.helpers))];
              const names = g.items.map((i) => i.setup_names).filter(Boolean).join(", ");
              return (
                <li key={g.place} className={ROW}>
                  <button type="button" onClick={() => open(g.items[0].id)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="type-item block truncate">{g.place}</span>
                      <span className="block text-[13px] text-stone">{g.items.map((i) => withQuantity(i)).join(", ")}</span>
                    </span>
                    <Initials ids={helpers} names={names} people={people} />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {after.length > 0 && (
        <>
          <h2 className={GROUP_HEAD}>
            <span className="section-label">After the day</span>
            <span className="text-[12px] text-stone">{counts.goBack} to go back</span>
          </h2>
          <ul className="glass-card mt-2 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
            {after.map((item) => {
              const who = people.find((p) => p.id === item.from_contact_id)?.name ?? item.from_name;
              return (
                <li key={item.id} className={ROW}>
                  <button type="button" onClick={() => open(item.id)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                    <DateStamp date={item.return_on} today={today} overdue={false} done={item.status === "returned"} />
                    <span className="min-w-0 flex-1">
                      <span className={`type-item block truncate ${item.status === "returned" ? "!text-stone" : ""}`}>
                        {withQuantity(item)}{who ? ` back to ${who}` : ""}
                      </span>
                      <span className="block truncate text-[13px] text-stone">{item.status === "returned" ? "Given back" : sourceLabel(item.source) ?? "Goes back"}</span>
                    </span>
                  </button>
                  <StatusCircle item={item} after />
                </li>
              );
            })}
          </ul>
        </>
      )}
      </div>
      </div>
      <ThingCard items={items} people={people} weddingDate={weddingDate} />
    </>
  );
}

/* ── One thing's card ───────────────────────────────────────────────────── */

const PILL = "h-9 rounded-full border px-3.5 text-[13px] transition";
const pill = (on: boolean) => `${PILL} ${on ? "border-champagne-600 bg-champagne-100 text-champagne-600" : "border-linen bg-white/80 text-ink hover:border-champagne-400"}`;

/** The card over the page for whichever thing is in `?thing=`. Taps save at once; typing gets a small Save. */
function ThingCard({ items, people, weddingDate }: { items: Items; people: DecorPerson[]; weddingDate: string | null }) {
  const id = useSearchParams().get("thing");
  const item = items.find((i) => i.id === id);
  // Steps through the things in the order they're listed (owner, 23 Oct 2026).
  useRegisterCycle("decor", items.map((i) => i.id), (next) => replaceQuery({ thing: next }, { sync: true }));
  const cycle = useCycle("decor", id);
  if (!id) return null;
  const close = () => replaceQuery({ thing: null }, { sync: true });
  return (
    <CardSheet label={item?.name ?? "An item"} cycle={cycle} onClose={close} top={<span className="label">Decor{item?.place ? ` · ${item.place}` : ""}</span>}>
      {item ? <ThingBody key={item.id} item={item} people={people} weddingDate={weddingDate} onGone={close} /> : <p className="py-10 text-center text-[15px] text-stone">This isn&apos;t here any more.</p>}
    </CardSheet>
  );
}

function ThingBody({ item, people, weddingDate, onGone }: { item: DecorWithHelpers; people: DecorPerson[]; weddingDate: string | null; onGone: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const save = async (fields: Record<string, string | null>) => {
    const result = await safely(() => updateDecorFieldsAction(item.id, fields));
    setError(result.error);
    if (!result.error) router.refresh();
    return result;
  };
  const tap = (fields: Record<string, string | null>) => start(async () => void (await save(fields)));
  const [from, setFrom] = useState(item.from_contact_id ?? (item.from_name ? "typed" : ""));
  const helpers = item.helpers;
  const setHelpers = (ids: string[]) =>
    start(async () => {
      const result = await safely(() => setDecorHelpersAction(item.id, ids));
      setError(result.error);
      if (!result.error) router.refresh();
    });
  const showFrom = item.source !== "own" && item.source !== "made";
  const steps = STATUSES.filter((s) => s.value !== "returned" || goesBack(item));
  const at = steps.findIndex((s) => s.value === item.status);
  const next = nextStatus(item);
  const nextLabel = steps.find((s) => s.value === next)?.label.toLowerCase();
  const fromName = people.find((p) => p.id === item.from_contact_id)?.name ?? item.from_name;
  const fromLine = [sourceLabel(item.source), showFrom ? fromName : null].filter(Boolean).join(" · ");
  const datesLine = [item.collect_on && `Collect ${formatWeekdayDayMonth(item.collect_on)}`, goesBack(item) && item.return_on && `Give back ${formatWeekdayDayMonth(item.return_on)}`].filter(Boolean).join(" · ");

  const [askPlace, setAskPlace] = useState(false);
  const customPlace = !!item.place && !PLACES.includes(item.place);
  const qty = item.quantity ?? 0;
  const label = "flex min-w-0 flex-1 items-center gap-3";
  const dot = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600";
  const dateRow = (title: string, value: string | null, field: "collect_on" | "return_on") => (
    <div className="flex min-h-[60px] items-center gap-3 border-b border-linen px-3.5 last:border-b-0">
      <span aria-hidden className={dot}>
        <CalendarDays className="h-[18px] w-[18px]" strokeWidth={1.6} />
      </span>
      <span className="text-[15px] text-ink">{title}</span>
      <input
        type="date"
        aria-label={title}
        defaultValue={value ?? ""}
        onBlur={(e) => e.target.value !== (value ?? "") && tap({ [field]: e.target.value || null })}
        className="ml-auto h-10 min-w-0 rounded-xl border border-linen bg-white px-3 text-[15px] text-ink focus:border-champagne-400 focus:outline-none"
      />
    </div>
  );

  return (
    <div className={`pt-1 ${pending ? "opacity-80" : ""}`}>
      <div className="flex items-center gap-3.5">
        <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
          <Palette className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <TitleEditor value={item.name} onSave={(v) => save({ name: v })} />
          {(item.quantity || item.source) && (
            <p className="mt-1 text-[14px] text-stone">{[item.quantity ? String(item.quantity) : null, sourceLabel(item.source)].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      {/* The black action moves it to its next step; the steps below are the whole way, and a tap on one goes there. */}
      <ItemAction
        label={next ? `Mark as ${nextLabel}` : ""}
        doneLabel={steps[at]?.label ?? ""}
        done={!next}
        pending={pending}
        onClick={() => next && tap({ status: next })}
      />
      <div className="mt-5 flex items-start">
        {steps.map((s, i) => {
          const done = i < at || (!next && i === at);
          const here = i === at && !done;
          return (
            <div key={s.value} className="flex flex-1 items-start last:flex-none">
              <button type="button" aria-pressed={i === at} onClick={() => tap({ status: s.value })} className="flex w-16 flex-col items-center gap-1.5">
                <span
                  className={`flex h-[26px] w-[26px] items-center justify-center rounded-full ${
                    done ? "bg-champagne-600 text-white" : here ? "border-2 border-champagne-600 bg-white" : "border-[1.5px] border-[#D8D0C4] bg-white"
                  }`}
                >
                  {done && <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />}
                </span>
                <span className={`text-center text-[12px] ${here ? "font-semibold text-ink" : "text-stone"}`}>{s.label}</span>
              </button>
              {i < steps.length - 1 && <span aria-hidden className={`mt-3 h-0.5 flex-1 ${i < at ? "bg-champagne-600" : "bg-linen"}`} />}
            </div>
          );
        })}
      </div>

      {/* The facts sit on the card, each changed where it is: no fold-outs for single things (owner, 23 Oct 2026). */}
      <div className="mt-5 rounded-2xl border border-linen bg-white/75">
        <div className="flex min-h-[60px] items-center gap-3 border-b border-linen px-3.5">
          <span className={label}>
            <span aria-hidden className={dot}>
              <Hash className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </span>
            <span className="text-[15px] text-ink">How many</span>
          </span>
          <span className="flex items-center gap-2">
            <button type="button" aria-label="One fewer" disabled={qty <= 1} onClick={() => save({ quantity: String(qty - 1) })} className="flex h-9 w-9 items-center justify-center rounded-full border border-linen bg-white text-lg text-ink disabled:opacity-40">
              −
            </button>
            <span className="min-w-8 text-center font-display text-[20px] tabular-nums">{item.quantity ?? "–"}</span>
            <button type="button" aria-label="One more" onClick={() => save({ quantity: String(qty + 1) })} className="flex h-9 w-9 items-center justify-center rounded-full border border-linen bg-white text-lg text-ink">
              +
            </button>
          </span>
        </div>

        <div className="border-b border-linen px-3.5 py-2.5">
          <div className="flex min-h-[44px] items-center gap-3">
            <span aria-hidden className={dot}>
              <MapPin className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </span>
            <span className="text-[15px] text-ink">Where it goes</span>
            <select
              aria-label="Where it goes"
              value={askPlace || customPlace ? "__other" : (item.place ?? "")}
              onChange={(e) => {
                if (e.target.value === "__other") return setAskPlace(true);
                setAskPlace(false);
                tap({ place: e.target.value || null });
              }}
              className="ml-auto h-10 min-w-0 max-w-[55%] cursor-pointer appearance-none truncate rounded-xl border border-linen bg-white bg-[length:14px] bg-[right_10px_center] bg-no-repeat pl-3 pr-8 text-[15px] text-ink focus:border-champagne-400 focus:outline-none"
              style={{ backgroundImage: CHEVRON }}
            >
              <option value="">Not set</option>
              {PLACES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="__other">{customPlace ? item.place : "Somewhere else…"}</option>
            </select>
          </div>
          {(askPlace || customPlace) && (
            <PlaceTyped key={item.place ?? ""} value={customPlace ? (item.place ?? "") : ""} onSave={(v) => { setAskPlace(false); tap({ place: v || null }); }} />
          )}
        </div>

        <div className="border-b border-linen px-3.5 py-3">
          <div className="flex items-center gap-3">
            <span aria-hidden className={dot}>
              <UserRound className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </span>
            <span className="text-[15px] text-ink">From</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {SOURCES.map((s) => {
              const Icon = SOURCE_ICONS[s.value];
              const on = item.source === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => tap({ source: on ? null : s.value })}
                  className={`flex h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl border text-[12px] transition ${
                    on ? "border-champagne-600 bg-champagne-100 font-medium text-champagne-600" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.7} aria-hidden />
                  {s.label}
                </button>
              );
            })}
          </div>
          {showFrom && (
            <div className="mt-3">
              <FromSelect
                people={people}
                value={from}
                onChange={(v) => {
                  setFrom(v);
                  if (v !== "typed") tap({ from_contact_id: v || null, from_name: null });
                }}
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-linen bg-white bg-[length:14px] bg-[right_12px_center] bg-no-repeat px-3.5 pr-8 text-[15px] text-ink focus:outline-none"
              />
              {from === "typed" && (
                <dl className="mt-1">
                  <TextRow label="Their name" value={item.from_name} startEditing={!item.from_name} onSave={(v) => save({ from_name: v, from_contact_id: null })} />
                </dl>
              )}
            </div>
          )}
        </div>

        {/* Dates are for what's borrowed or hired: you collect it, then give it back. Own, bought and made have none (a date already saved still shows). */}
        {(goesBack(item) || item.collect_on) && dateRow("Collect", item.collect_on, "collect_on")}
        {goesBack(item) && dateRow("Give back", item.return_on, "return_on")}
      </div>

      <section className="mt-7">
        <h3 className="section-label">Who sets it up</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {helpers.map((hid) => {
            const name = people.find((p) => p.id === hid)?.name ?? "Someone";
            return (
              <span key={hid} className="flex h-9 items-center gap-1.5 rounded-full border border-linen bg-white pl-1 pr-1.5 text-[15px] text-ink">
                <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-champagne-100 text-[11px] font-medium text-champagne-600">{initialsOf(name)}</span>
                {name}
                <button type="button" onClick={() => setHelpers(helpers.filter((x) => x !== hid))} aria-label={`Take ${name} off`} className="flex h-6 w-6 items-center justify-center rounded-full text-stone hover:bg-linen hover:text-ink">
                  ×
                </button>
              </span>
            );
          })}
          <select
            value=""
            onChange={(e) => e.target.value && setHelpers([...helpers, e.target.value])}
            aria-label="Add someone to set it up"
            className="h-9 cursor-pointer appearance-none rounded-full border border-dashed border-champagne-400 bg-transparent bg-[length:14px] bg-[right_10px_center] bg-no-repeat pl-3.5 pr-8 text-[13px] text-champagne-600"
            style={{ backgroundImage: CHEVRON }}
          >
            <option value="">+ Add someone</option>
            {people.filter((p) => !helpers.includes(p.id)).map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.kind === "supplier" ? " (supplier)" : ""}</option>
            ))}
          </select>
        </div>
        <dl className="mt-2">
          <TextRow label="Others" value={item.setup_names} onSave={(v) => save({ setup_names: v })} />
        </dl>
      </section>

      <section className="mt-7">
        <dl>
          <TextRow label="Notes" value={item.notes} multiline onSave={(v) => save({ notes: v })} />
        </dl>
      </section>

      <Link href="/area/decor" className="mt-6 flex h-12 items-center justify-center rounded-full border border-champagne-400 text-[15px] text-ink hover:bg-cream">
        Open the Decor page ›
      </Link>

      <div className="mt-4 text-center">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Remove "${item.name}"?`)) return;
            start(async () => {
              const result = await safely(() => removeDecorAction(item.id));
              if (result.error) return setError(result.error);
              onGone();
              router.refresh();
            });
          }}
          className="min-h-11 py-3 text-sm text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
        >
          Remove this item
        </button>
      </div>
    </div>
  );
}

/** A place that isn't on the usual list: typed, with a small Save. */
function PlaceTyped({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="text"
        autoFocus={!value}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. The photo booth"
        aria-label="Somewhere else"
        className="h-10 min-w-0 flex-1 rounded-xl border border-linen bg-white px-3.5 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none"
      />
      {draft !== value && (
        <button type="button" onClick={() => onSave(draft.trim())} className="h-10 rounded-full bg-ink px-4 text-sm text-ivory hover:bg-ink/90">
          Save
        </button>
      )}
    </div>
  );
}

/** Where it goes on the card: a tap on a usual place saves; a typed place gets a small Save. */
function PlacePickerSaving({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const typed = draft !== value;
  return (
    <>
      <PlacePicker
        value={draft}
        onChange={(v) => {
          setDraft(v);
          // A usual place (or taking one off) saves at once.
          if (v === "" || PLACES.includes(v)) onSave(v);
        }}
      />
      {typed && draft && (
        <button type="button" onClick={() => onSave(draft)} className="mt-2 h-9 rounded-full bg-ink px-4 text-sm text-ivory hover:bg-ink/90">
          Save
        </button>
      )}
    </>
  );
}

/** A date row on the card: tap to open the phone's calendar; saves at once. */
function DateRow({ label, value, weddingDate, onSave }: { label: string; value: string | null; weddingDate: string | null; onSave: (v: string | null) => void }) {
  const [date, setDate] = useState(value ?? "");
  return (
    <div className="border-b border-linen py-2">
      <span className="type-meta"><DetailLabel label={label} /></span>
      <DateCard
        name={label}
        value={date}
        quick={false}
        weddingDate={weddingDate}
        onChange={(v) => {
          setDate(v);
          onSave(v || null);
        }}
      />
    </div>
  );
}
