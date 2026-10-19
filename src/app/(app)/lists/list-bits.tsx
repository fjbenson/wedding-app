"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ListChecks, Plus, X } from "lucide-react";
import CardSheet from "@/components/card-sheet";
import { AreaTiles } from "@/components/visual-form";
import { areaName, type AreaOption } from "@/lib/areas";
import { replaceQuery } from "@/lib/url-state";
import type { ListWithItems } from "@/lib/db/lists";
import { TitleEditor } from "../plan/plan-card-body";
import { addLineAction, removeLineAction, removeListAction, updateLineAction, updateListAction } from "./actions";

/*
 * Lists live with Your notes (owner, 19 Oct 2026): a plain tick-list — the
 * toilet baskets, the bridesmaids' room — on the wall beside the notes,
 * filed under an area like a note (and then on that area's page too).
 */

type Result = { error?: string; id?: string };

/** After a deploy a page left open can call an action that's gone; say so rather than blank the screen. */
async function safely(work: () => Promise<Result>): Promise<Result> {
  try {
    return (await work()) ?? {};
  } catch (error) {
    console.error("list action failed", error);
    return { error: "That didn't work. Reload the page and try again." };
  }
}

const openList = (id: string) => replaceQuery({ list: id }, { sync: true });

const ticked = (list: ListWithItems) => list.items.filter((i) => i.done).length;

/** A list on the notes wall: its name, the first few lines with their boxes, and how many are ticked. */
export function ListPaper({ list, areas, background, turn }: { list: ListWithItems; areas: AreaOption[]; background: string; turn: number }) {
  const shown = list.items.slice(0, 6);
  return (
    <button
      type="button"
      onClick={() => openList(list.id)}
      className="relative block w-full rounded-[4px] px-4 pb-3.5 pt-[22px] text-left shadow-[0_1px_2px_rgb(60_45_20/0.08),0_10px_22px_-14px_rgb(60_45_20/0.35)] transition active:scale-[0.98] motion-reduce:transform-none"
      style={{ background, transform: `rotate(${turn}deg)` }}
    >
      <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-[54px] -translate-x-1/2 border-x border-dashed border-white/60 bg-[rgb(225_205_165/0.55)]" />
      <span className="flex items-center gap-1.5 font-display text-[17px] italic leading-snug text-ink">
        <ListChecks className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.8} aria-hidden />
        {list.name}
      </span>
      <span className="mt-2 block space-y-1">
        {shown.map((item) => (
          <span key={item.id} className={`flex items-start gap-2 text-[14px] leading-snug ${item.done ? "text-stone line-through" : "text-ink"}`}>
            <span aria-hidden className={`mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${item.done ? "border-champagne-600 bg-champagne-600 text-white" : "border-champagne-400"}`}>
              {item.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0">{item.text}</span>
          </span>
        ))}
        {list.items.length > shown.length && <span className="block text-[13px] text-stone">and {list.items.length - shown.length} more</span>}
      </span>
      <span className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="type-meta">{list.items.length ? `${ticked(list)} of ${list.items.length} ticked` : "No lines yet"}</span>
        {list.area_key && (
          <span className="rounded-full bg-white/75 px-2 py-0.5 text-[12px] font-medium text-champagne-600 shadow-[inset_0_0_0_1px_rgb(205_183_142/0.6)]">
            {areaName(list.area_key, areas)}
          </span>
        )}
      </span>
    </button>
  );
}

/** Lists as rows, for an area page's notes. */
export function ListRows({ lists }: { lists: ListWithItems[] }) {
  return (
    <ul>
      {lists.map((l) => (
        <li key={l.id} className="border-b border-linen">
          <button type="button" onClick={() => openList(l.id)} className="row-press flex w-full items-center gap-3 py-3 text-left">
            <span aria-hidden className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
              <ListChecks className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="type-item block truncate">{l.name}</span>
              <span className="type-meta mt-0.5 block">{l.items.length ? `${ticked(l)} of ${l.items.length} ticked` : "No lines yet"}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The card for whichever list is in `?list=`: tick lines, add more in place, rename, file it, remove it. */
export function ListCard({ lists, areas }: { lists: ListWithItems[]; areas: AreaOption[] }) {
  const id = useSearchParams().get("list");
  if (!id) return null;
  const list = lists.find((l) => l.id === id);
  const close = () => replaceQuery({ list: null }, { sync: true });
  return (
    <CardSheet label={list?.name ?? "A list"} onClose={close} top={<span className="label">List</span>}>
      {list ? <ListBody key={list.id} list={list} areas={areas} onGone={close} /> : <p className="py-10 text-center text-[15px] text-stone">This isn&apos;t here any more.</p>}
    </CardSheet>
  );
}

function ListBody({ list, areas, onGone }: { list: ListWithItems; areas: AreaOption[]; onGone: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  // Ticks show at once; the save follows.
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const box = useRef<HTMLInputElement>(null);
  const run = (work: () => Promise<Result>) =>
    start(async () => {
      const result = await safely(work);
      setError(result.error);
      if (!result.error) router.refresh();
    });
  const isDone = (itemId: string, saved: boolean) => done[itemId] ?? saved;

  return (
    <div className="pt-1">
      <TitleEditor value={list.name} onSave={async (v) => {
        const result = await safely(() => updateListAction(list.id, { name: v }));
        if (!result.error) router.refresh();
        return result;
      }} />
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}

      <ul className="mt-5">
        {list.items.map((item) => {
          const on = isDone(item.id, item.done);
          return (
            <li key={item.id} className="flex items-center gap-3 border-b border-linen">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setDone((d) => ({ ...d, [item.id]: !on }));
                  run(() => updateLineAction(item.id, { done: !on }));
                }}
                className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span aria-hidden className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition ${on ? "border-champagne-600 bg-champagne-600 text-white" : "border-champagne-400 bg-white"}`}>
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}
                </span>
                <span className={`min-w-0 text-[16px] ${on ? "text-stone line-through" : "text-ink"}`}>{item.text}</span>
              </button>
              <button type="button" onClick={() => run(() => removeLineAction(item.id))} aria-label={`Take "${item.text}" off`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone/70 hover:text-ink">
                <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Add a line in place: Enter adds it and leaves the box ready for the next. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const line = draft.trim();
          if (!line) return;
          setDraft("");
          run(() => addLineAction(list.id, line, list.items.length));
          box.current?.focus();
        }}
        className="flex items-center gap-3 border-b border-linen"
      >
        <Plus className="h-[22px] w-[22px] shrink-0 text-champagne-600" strokeWidth={1.6} aria-hidden />
        <input
          ref={box}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a line"
          aria-label="Add a line"
          enterKeyHint="done"
          className="min-h-12 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-stone/60 focus:outline-none"
        />
        {draft.trim() && (
          <button type="submit" disabled={pending} className="h-8 rounded-full bg-ink px-3 text-[13px] text-ivory disabled:opacity-60">
            Add
          </button>
        )}
      </form>

      <section className="mt-7">
        <h3 className="section-label">Filed under</h3>
        <AreaTiles
          name="list-area"
          areas={areas}
          otherValue="other"
          defaultValue={list.area_key ?? ""}
          onChange={(v) => run(() => updateListAction(list.id, { area_key: v || null }))}
          folded={!!list.area_key}
          optional
        />
      </section>

      <div className="mt-6 border-t border-linen pt-4 text-center">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Remove the list "${list.name}"?`)) return;
            start(async () => {
              const result = await safely(() => removeListAction(list.id));
              if (result.error) return setError(result.error);
              onGone();
              router.refresh();
            });
          }}
          className="text-xs text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
        >
          Remove this list
        </button>
      </div>
    </div>
  );
}
