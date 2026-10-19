"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BedDouble, Bus, ChevronRight, Search, X } from "lucide-react";
import AddMenu from "@/components/add-menu";
import NumbersCard from "@/components/numbers-card";
import AddButton from "@/components/add-button";
import PageTitle from "@/components/page-title";
import { AlsoInTheDay, DayPill } from "./day-pieces";
import { usePullToClose } from "@/components/use-pull-to-close";
import { formatClock } from "@/lib/dates";
import { replaceQuery } from "@/lib/url-state";
import type { Contact, Stay, TransportPassenger, TransportRun } from "@/types/db";
import { fullName, initials } from "../people/guest-table";
import { safely, TextRow } from "../people/guest-card";
import { removePlanCardAction, updatePlanFieldsAction } from "../plan/card-actions";
import { TimeCard, TitleEditor } from "../plan/plan-card-body";
import {
  addStayAction,
  boardAction,
  deleteStayAction,
  leaveAction,
  renameStayAction,
  saveStayNoteAction,
  setOwnWayAction,
  setStayAction,
} from "./travel-actions";

/**
 * Travel (canvas 3 "Travel · First version", owner's pick 15 Oct 2026): The
 * Day's Transport became Travel, and answers two questions only — where is
 * everyone sleeping, and how is everyone getting there and back. Everything
 * else (maps, nights, rooms, vehicle types) waits until a couple asks for it.
 *
 * Places to stay and journeys open as cards over the screen; so do the two
 * dashed "still to sort" lists. The open card lives in the address (`?open=`).
 */

const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

/** Runs a save, holding on to any problem to show it in place. */
function useSave() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const run = (save: () => Promise<{ error?: string; id?: string }>, after?: (id?: string) => void) =>
    startTransition(async () => {
      try {
        const result = await save();
        setError(result.error);
        if (!result.error) after?.(result.id);
      } catch {
        setError(UNSAVED);
      }
    });
  return { pending, error, run };
}

export default function Travel({
  stays,
  runs,
  passengers,
  guests,
  open: initial,
  ready,
}: {
  stays: Stay[];
  runs: TransportRun[];
  passengers: TransportPassenger[];
  /** Everyone coming (or not yet answered): those who've said no to everything are left out. */
  guests: Contact[];
  open: string | null;
  /** False until 0020_travel.sql is run. */
  ready: boolean;
}) {
  const [open, setOpen] = useState<string | null>(initial);
  // The black +'s "A place to stay" links here with ?open=stay:new: follow the address.
  const params = useSearchParams();
  useEffect(() => setOpen(params.get("open")), [params]);
  const show = (value: string | null) => {
    setOpen(value);
    // Heard by useSearchParams, so the + can open the same card again later.
    replaceQuery({ open: value }, { sync: true });
  };

  const onBoard = new Set(passengers.map((p) => p.contact_id));
  const staying = guests.filter((g) => g.staying === "yes");
  const unsure = staying.filter((g) => !g.stay_id || !stays.some((s) => s.id === g.stay_id));
  const withLift = guests.filter((g) => onBoard.has(g.id) || g.own_way);
  const noLift = guests.filter((g) => !onBoard.has(g.id) && !g.own_way);

  const [kind, id] = (open ?? "").split(":");
  const stay = kind === "stay" ? stays.find((s) => s.id === id) : undefined;
  const run = kind === "run" ? runs.find((r) => r.id === id) : undefined;

  return (
    <>
      <DayPill />
      <PageTitle drawing="day" spacing="mt-3" className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">
        Travel
      </PageTitle>

      {!ready && (
        <p className="mt-5 rounded-xl border border-dashed border-champagne-400 px-4 py-3 text-sm text-ink">
          Places to stay need one more database step: run <span className="font-mono text-xs">supabase/migrations/0020_travel.sql</span>.
        </p>
      )}

      {/* The tab's numbers, search with the black +, like Seating and the run sheet (canvas 3 "The Day · Round 1", A, owner 17 Oct 2026). */}
      <NumbersCard
        big={{ label: "Have a lift", value: withLift.length, sub: `of ${guests.length} coming` }}
        rows={[
          { value: noLift.length, label: "No lift yet", onClick: noLift.length > 0 ? () => show("nolift") : undefined },
          { value: staying.length, label: "Staying over" },
          { value: unsure.length, label: "Not sure where", onClick: unsure.length > 0 ? () => show("unsure") : undefined },
        ]}
      />
      <TravelSearch
        guests={guests}
        stays={stays}
        runs={runs}
        passengers={passengers}
        end={
          <AddMenu
            label="Add to Travel"
            title="Add to Travel"
            choices={[
              ...(ready ? [{ icon: <BedDouble />, title: "A place to stay", line: "A hotel, the pub, someone's spare room", href: "/day?tab=travel&open=stay:new" }] : []),
              { icon: <Bus />, title: "A journey", line: "A car, a coach or a lift", href: "/day/transport/new" },
            ]}
          />
        }
      />

      {/* Where is everyone sleeping? */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="section-label">Staying</h2>
      </div>
      {stays.length > 0 ? (
        <ul className="glass-card mt-3 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
          {stays.map((s) => {
            const here = staying.filter((g) => g.stay_id === s.id);
            return (
              <li key={s.id} className="row-press border-b border-linen last:border-b-0">
                <button type="button" onClick={() => show(`stay:${s.id}`)} className="flex min-h-[60px] w-full items-center gap-3 text-left">
                  <span className="min-w-0 flex-1 truncate font-display text-[18px] text-ink">{s.name}</span>
                  <Faces people={here} />
                  <span className="w-6 text-right text-sm tabular-nums text-stone">{here.length}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        ready && <Ghost onClick={() => show("stay:new")} text="Add where people are staying" />
      )}
      {unsure.length > 0 && (
        <Dashed onClick={() => show("unsure")} text={`${unsure.length} staying, not sure where`} />
      )}

      {/* How is everyone getting there and back? */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="section-label">Getting there and back</h2>
      </div>
      {runs.length > 0 ? (
        <ul className="glass-card mt-3 overflow-hidden rounded-[22px] px-4 [--row-bleed:16px]">
          {runs.map((r) => {
            const aboard = passengers.filter((p) => p.run_id === r.id).length;
            return (
              <li key={r.id} className="row-press border-b border-linen last:border-b-0">
                <button type="button" onClick={() => show(`run:${r.id}`)} className="flex min-h-[60px] w-full items-center gap-3 py-2 text-left">
                  <span className="w-12 shrink-0 text-sm tabular-nums text-stone">{formatClock(r.at_time)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink">{r.vehicle}</span>
                    {(r.from_place || r.to_place) && (
                      <span className="block truncate text-[13px] text-stone">{[r.from_place, r.to_place].filter(Boolean).join(" → ")}</span>
                    )}
                  </span>
                  <span className="text-sm tabular-nums text-stone">{aboard}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <Ghost href="/day/transport/new" text="Add a car, coach or lift" />
      )}
      {guests.length > 0 && noLift.length > 0 && (
        <Dashed onClick={() => show("nolift")} text={`${noLift.length} ${noLift.length === 1 ? "guest has" : "guests have"} no lift yet`} />
      )}

      {kind === "stay" && id === "new" && <NewStaySheet onClose={() => show(null)} onAdded={(newId) => show(`stay:${newId}`)} />}
      {stay && <StaySheet key={stay.id} stay={stay} guests={guests} onClose={() => show(null)} />}
      {run && <RunSheet key={run.id} run={run} guests={guests} passengers={passengers} onClose={() => show(null)} />}
      {open === "unsure" && <UnsureSheet people={unsure} stays={stays} onClose={() => show(null)} />}
      {open === "nolift" && <NoLiftSheet people={noLift} runs={runs} onClose={() => show(null)} />}
      <AlsoInTheDay current="travel" />
    </>
  );
}

/**
 * Travel's search with the black + at its end: type a name to see where
 * they're sleeping and how they're getting there, right under the box.
 */
function TravelSearch({
  guests,
  stays,
  runs,
  passengers,
  end,
}: {
  guests: Contact[];
  stays: Stay[];
  runs: TransportRun[];
  passengers: TransportPassenger[];
  end: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const found = words.length ? guests.filter((g) => words.every((w) => fullName(g).toLowerCase().includes(w))).slice(0, 8) : [];
  const sleeping = (g: Contact) =>
    g.staying === "yes" ? (stays.find((x) => x.id === g.stay_id)?.name ?? "Staying, not sure where") : g.staying === "no" ? "Going home" : null;
  const lift = (g: Contact) => {
    const run = runs.find((r) => passengers.some((p) => p.run_id === r.id && p.contact_id === g.id));
    return run ? `${run.vehicle} · ${formatClock(run.at_time)}` : g.own_way ? "Own way" : "No lift yet";
  };
  return (
    <>
      <div className="mt-5 flex items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-linen bg-white px-4 focus-within:border-champagne-400">
          <Search className="h-[17px] w-[17px] shrink-0 text-stone" strokeWidth={1.8} aria-hidden />
          <span className="sr-only">Find a guest</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a guest"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone/70 focus:outline-none"
          />
        </label>
        {end}
      </div>
      {words.length > 0 && (
        <ul className="glass-card mt-2.5 overflow-hidden rounded-[22px] px-4">
          {found.map((g) => (
            <li key={g.id} className="border-b border-linen py-2.5 last:border-b-0">
              <span className="block truncate text-[15px] text-ink">{fullName(g)}</span>
              <span className="block truncate text-[13px] text-stone">{[sleeping(g), lift(g)].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
          {found.length === 0 && <li className="py-4 text-sm text-stone">No one matches that.</li>}
        </ul>
      )}
    </>
  );
}

/** Up to three guests' initials, overlapping. */
function Faces({ people }: { people: Contact[] }) {
  return (
    <span className="flex shrink-0" aria-hidden>
      {people.slice(0, 3).map((g, i) => (
        <span
          key={g.id}
          className={`flex h-[26px] w-[26px] items-center justify-center rounded-full bg-champagne-100 text-[9.5px] text-champagne-600 ring-2 ring-white ${
            i > 0 ? "-ml-[7px]" : ""
          }`}
        >
          {initials(g)}
        </span>
      ))}
    </span>
  );
}

/** A dashed card for what's still to sort (the app's "still to do" look). */
function Dashed({ onClick, text }: { onClick: () => void; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2.5 flex w-full items-center rounded-[20px] border-[1.5px] border-dashed border-champagne-400 px-4 py-3 text-left font-display text-[16px] italic text-champagne-600 hover:bg-champagne-100/40"
    >
      <span className="flex-1">{text}</span>
      <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
    </button>
  );
}

/** A faded row standing in for something not added yet. */
function Ghost({ onClick, href, text }: { onClick?: () => void; href?: string; text: string }) {
  const inner = (
    <>
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 text-champagne-600">+</span>
      <span className="font-display text-[16px] italic text-stone">{text}</span>
    </>
  );
  const className = "glass-card mt-3 flex w-full items-center gap-3 rounded-[22px] px-4 py-3.5 text-left opacity-80 hover:opacity-100";
  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

/** The slide-up card (a right-hand panel on a laptop), as the guest card. */
function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
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
  const drag = usePullToClose(onClose);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
      />
      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] ${
          drag.dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
      >
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>
        <div className="overflow-y-auto overscroll-contain px-[22px] pb-[max(2rem,env(safe-area-inset-bottom))] lg:pt-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full text-stone hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrorLine({ error }: { error?: string }) {
  return error ? (
    <p role="alert" className="mt-3 text-sm text-ink">
      {error}
    </p>
  ) : null;
}

const BIG_INPUT =
  "w-full border-0 border-b border-linen bg-transparent px-0 pb-2 font-display !text-[30px] leading-tight text-ink placeholder:text-stone/50 focus:border-champagne-400 focus:outline-none focus:ring-0";

function NewStaySheet({ onClose, onAdded }: { onClose: () => void; onAdded: (id: string) => void }) {
  const [name, setName] = useState("");
  const { pending, error, run } = useSave();
  return (
    <Sheet label="Add a place to stay" onClose={onClose}>
      <p className="label">Add a place to stay</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addStayAction(name), (newId) => newId && onAdded(newId));
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Swan"
          aria-label="Name of the place"
          className={`mt-3 ${BIG_INPUT}`}
        />
        <p className="mt-2 text-[13px] text-stone">A hotel, the pub, a rented cottage, or "At home".</p>
        <ErrorLine error={error} />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="mt-6 h-12 w-full rounded-full bg-ink text-[15px] text-ivory disabled:opacity-40"
        >
          {pending ? "Adding…" : "Add it"}
        </button>
      </form>
    </Sheet>
  );
}

/** Search the guest list by name; the people to suggest first come first. */
function GuestSearch({
  candidates,
  suggested,
  suggestedLabel,
  onPick,
  pending,
}: {
  candidates: Contact[];
  suggested: Contact[];
  suggestedLabel: string;
  onPick: (g: Contact) => void;
  pending: boolean;
}) {
  const [q, setQ] = useState("");
  const words = q.trim().toLowerCase();
  const found = words ? candidates.filter((g) => fullName(g).toLowerCase().includes(words)).slice(0, 8) : suggested.slice(0, 12);
  return (
    <div className="glass-card mt-2 rounded-[20px] p-3.5">
      <label className="flex h-10 items-center gap-2 rounded-xl bg-cream px-3">
        <Search className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search guests"
          aria-label="Search guests"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-ink placeholder:text-stone focus:outline-none focus:ring-0"
        />
      </label>
      {!words && suggested.length > 0 && <p className="mt-3 text-xs text-stone">{suggestedLabel}</p>}
      {found.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {found.map((g) => (
            <button
              key={g.id}
              type="button"
              disabled={pending}
              onClick={() => {
                onPick(g);
                setQ("");
              }}
              className="inline-flex h-[38px] items-center gap-2 rounded-full bg-ivory pl-1 pr-3.5 text-sm text-ink ring-1 ring-linen hover:ring-champagne-400 disabled:opacity-50"
            >
              <Initials guest={g} />
              {fullName(g)}
            </button>
          ))}
        </div>
      ) : (
        words && <p className="mt-3 text-sm text-stone">No one by that name.</p>
      )}
    </div>
  );
}

function Initials({ guest }: { guest: Contact }) {
  return (
    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-[10.5px] text-champagne-600">
      {initials(guest)}
    </span>
  );
}

/** A guest's row with a ✕ to take them off. */
function PersonRow({ guest, onRemove, removeLabel, pending }: { guest: Contact; onRemove: () => void; removeLabel: string; pending: boolean }) {
  return (
    <li className="flex min-h-[54px] items-center gap-3 border-b border-linen last:border-b-0">
      <Initials guest={guest} />
      <Link href={`/people?guest=${guest.id}`} className="min-w-0 flex-1 truncate text-[15px] text-ink hover:underline">
        {fullName(guest)}
      </Link>
      <button
        type="button"
        onClick={onRemove}
        disabled={pending}
        aria-label={removeLabel}
        className="flex h-9 w-9 items-center justify-center rounded-full text-stone hover:text-ink disabled:opacity-50"
      >
        <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      </button>
    </li>
  );
}

function StaySheet({ stay, guests, onClose }: { stay: Stay; guests: Contact[]; onClose: () => void }) {
  const here = guests.filter((g) => g.staying === "yes" && g.stay_id === stay.id);
  const unsure = guests.filter((g) => g.staying === "yes" && !g.stay_id);
  const others = guests.filter((g) => g.stay_id !== stay.id);
  const [name, setName] = useState(stay.name);
  const [note, setNote] = useState(stay.note ?? "");
  const [confirming, setConfirming] = useState(false);
  const { pending, error, run } = useSave();

  return (
    <Sheet label={stay.name} onClose={onClose}>
      <p className="label">Staying</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name.trim() !== stay.name && run(() => renameStayAction(stay.id, name))}
        aria-label="Name of the place"
        className={`mt-2 ${BIG_INPUT}`}
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note.trim() !== (stay.note ?? "") && run(() => saveStayNoteAction(stay.id, note))}
        rows={note ? 2 : 1}
        placeholder="+ Add a note (address, booking code…)"
        aria-label="Note"
        className="mt-3 w-full resize-none border-0 bg-transparent p-0 text-[15px] text-ink placeholder:italic placeholder:text-stone focus:outline-none focus:ring-0"
      />
      <ErrorLine error={error} />

      <h3 className="section-label mt-6">Staying here · {here.length}</h3>
      {here.length > 0 && (
        <ul className="glass-card mt-2 rounded-[20px] px-4">
          {here.map((g) => (
            <PersonRow
              key={g.id}
              guest={g}
              pending={pending}
              removeLabel={`${g.first_name} isn't staying here`}
              onRemove={() => run(() => setStayAction(g.id, "unsure"))}
            />
          ))}
        </ul>
      )}

      <h3 className="section-label mt-6">Add people</h3>
      <GuestSearch
        candidates={others}
        suggested={unsure}
        suggestedLabel="Staying, not sure where"
        pending={pending}
        onPick={(g) => run(() => setStayAction(g.id, stay.id))}
      />

      <div className="mt-8 text-center">
        {confirming ? (
          <p className="text-sm text-ink">
            Remove {stay.name}? Its guests stay on the list, staying but not sure where.{" "}
            <button type="button" onClick={() => run(() => deleteStayAction(stay.id), onClose)} className="font-medium underline underline-offset-4">
              Remove
            </button>{" "}
            ·{" "}
            <button type="button" onClick={() => setConfirming(false)} className="text-stone underline underline-offset-4">
              Keep it
            </button>
          </p>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="text-sm text-stone underline underline-offset-4 hover:text-ink">
            Remove this place
          </button>
        )}
      </div>
    </Sheet>
  );
}

function RunSheet({
  run: journey,
  guests,
  passengers,
  onClose,
}: {
  run: TransportRun;
  guests: Contact[];
  passengers: TransportPassenger[];
  onClose: () => void;
}) {
  const aboardIds = new Set(passengers.filter((p) => p.run_id === journey.id).map((p) => p.contact_id));
  const anyLift = new Set(passengers.map((p) => p.contact_id));
  const aboard = guests.filter((g) => aboardIds.has(g.id));
  const noLift = guests.filter((g) => !anyLift.has(g.id) && !g.own_way);
  const { pending, error, run } = useSave();
  const router = useRouter();
  const [fieldError, setFieldError] = useState<string>();
  const saveField = async (fields: Record<string, string | null>) => {
    const result = await safely(() => updatePlanFieldsAction("journey", journey.id, fields));
    setFieldError(result.error);
    if (!result.error) router.refresh();
    return result;
  };

  return (
    <Sheet label={journey.vehicle} onClose={onClose}>
      {/* Edited right here, like every card (owner, 16 Oct 2026): the time
          saves when it's picked; the name, from, to and notes get a small Save. */}
      <TitleEditor value={journey.vehicle} onSave={(v) => saveField({ vehicle: v })} />
      <div className="mt-4">
        <TimeCard key={journey.at_time} value={journey.at_time.slice(0, 5)} onSave={(v) => saveField({ at_time: v })} required />
      </div>
      <dl className="mt-3">
        <TextRow label="From" value={journey.from_place} onSave={(v) => saveField({ from_place: v })} />
        <TextRow label="To" value={journey.to_place} onSave={(v) => saveField({ to_place: v })} />
        <TextRow label="Notes" value={journey.notes} multiline onSave={(v) => saveField({ notes: v })} />
      </dl>
      <ErrorLine error={error ?? fieldError} />

      <h3 className="section-label mt-6">On board · {aboard.length}</h3>
      {aboard.length > 0 && (
        <ul className="glass-card mt-2 rounded-[20px] px-4">
          {aboard.map((g) => (
            <PersonRow
              key={g.id}
              guest={g}
              pending={pending}
              removeLabel={`Take ${g.first_name} off`}
              onRemove={() => run(() => leaveAction(journey.id, g.id))}
            />
          ))}
        </ul>
      )}

      <h3 className="section-label mt-6">Add people</h3>
      <GuestSearch
        candidates={guests.filter((g) => !aboardIds.has(g.id))}
        suggested={noLift}
        suggestedLabel="No lift yet"
        pending={pending}
        onPick={(g) => run(() => boardAction(journey.id, g.id))}
      />

      <div className="mt-8 border-t border-linen pt-4 text-center">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Remove ${journey.vehicle}? The people on it will show as having no lift.`)) return;
            run(async () => {
              const result = await removePlanCardAction("journey", journey.id);
              if (!result.error) onClose();
              return result;
            });
          }}
          className="text-sm text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
        >
          Remove this journey
        </button>
      </div>
    </Sheet>
  );
}

const CHIP =
  "inline-flex h-9 items-center rounded-full bg-ivory px-3.5 text-sm text-ink ring-1 ring-linen hover:ring-champagne-400 disabled:opacity-50";

/** Everyone staying but not sure where, each with the places to tap. */
function UnsureSheet({ people, stays, onClose }: { people: Contact[]; stays: Stay[]; onClose: () => void }) {
  const { pending, error, run } = useSave();
  return (
    <Sheet label="Staying, not sure where" onClose={onClose}>
      <h2 className="font-display text-[28px] italic leading-tight text-ink">Staying, not sure where</h2>
      <p className="mt-1 text-sm text-stone">Tap where each one is staying.</p>
      <ErrorLine error={error} />
      {people.length === 0 && <p className="mt-6 font-display text-lg italic text-stone">Everyone's sorted.</p>}
      <ul className="mt-4">
        {people.map((g) => (
          <li key={g.id} className="border-b border-linen py-3 last:border-b-0">
            <div className="flex items-center gap-3">
              <Initials guest={g} />
              <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{fullName(g)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 pl-[42px]">
              {stays.map((s) => (
                <button key={s.id} type="button" disabled={pending} onClick={() => run(() => setStayAction(g.id, s.id))} className={CHIP}>
                  {s.name}
                </button>
              ))}
              <button type="button" disabled={pending} onClick={() => run(() => setStayAction(g.id, "no"))} className={`${CHIP} text-stone`}>
                Not staying over
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/** Everyone with no lift yet, each with the journeys to tap, or their own way. */
function NoLiftSheet({ people, runs, onClose }: { people: Contact[]; runs: TransportRun[]; onClose: () => void }) {
  const { pending, error, run } = useSave();
  return (
    <Sheet label="No lift yet" onClose={onClose}>
      <h2 className="font-display text-[28px] italic leading-tight text-ink">No lift yet</h2>
      <p className="mt-1 text-sm text-stone">Tap a journey for each, or that they're making their own way.</p>
      <ErrorLine error={error} />
      {people.length === 0 && <p className="mt-6 font-display text-lg italic text-stone">Everyone has a way there.</p>}
      <ul className="mt-4">
        {people.map((g) => (
          <li key={g.id} className="border-b border-linen py-3 last:border-b-0">
            <div className="flex items-center gap-3">
              <Initials guest={g} />
              <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{fullName(g)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 pl-[42px]">
              {runs.map((r) => (
                <button key={r.id} type="button" disabled={pending} onClick={() => run(() => boardAction(r.id, g.id))} className={CHIP}>
                  {r.vehicle} · {formatClock(r.at_time)}
                </button>
              ))}
              <button type="button" disabled={pending} onClick={() => run(() => setOwnWayAction(g.id, true))} className={`${CHIP} text-stone`}>
                Own way
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
