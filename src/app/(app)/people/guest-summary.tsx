"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import type { Rsvp } from "@/types/db";

/**
 * The card at the top of the guest list once a filter is on (canvas 3
 * "Guest list · A card for every filter", owner, 14 Oct 2026). Filters narrow
 * the list, all together; this card adds up whoever is left, so nobody opens
 * card after card to count:
 *
 * - a headline: how many are coming, large, with the other answers under it
 *   (each a button that shows just those people, like the plain card's rows);
 * - a tally for what the filter has kinds of — diets, roles, meals… — a line
 *   per kind, as many as there are, the number in the big serif. Tapping a
 *   line narrows the list again. With two filters that both have kinds, a
 *   small "Add up by" switch picks which one is added up.
 *
 * No bars (owner, 14 Oct 2026): most lines are 1s and 2s, where the number is
 * what matters. Filters whose kinds would just repeat the list (no address,
 * a group) show the headline only.
 */

export type SplitKind = "diet" | "role" | "meal" | "age" | "when";

export interface TallyLine {
  /** `${kind}:${label}` — what the list narrows to when tapped. */
  id: string;
  label: string;
  count: number;
  /** An allergy: what the kitchen must avoid. */
  rose?: boolean;
  /** "Not picked yet": something still to do, not a kind. */
  faded?: boolean;
}

export interface Split {
  kind: SplitKind;
  /** The word on the switch. */
  word: string;
  sections: { title?: string; rose?: boolean; lines: TallyLine[] }[];
  /** Text for "Copy the list for the caterer". */
  copy?: string;
}

const LINK = "underline-offset-4 hover:text-ink hover:underline";

/** The headline, switch and tally — inside the summary card here, or a group's card. */
export function SummaryBody({
  counts,
  total,
  homes,
  showing,
  onShow,
  splits,
  splitBy,
  onSplit,
  pick,
  onPick,
}: {
  counts: Record<Rsvp["status"], number>;
  total: number;
  homes: number;
  showing: "all" | Rsvp["status"];
  onShow: (s: "all" | Rsvp["status"]) => void;
  splits: Split[];
  splitBy?: SplitKind;
  onSplit: (kind: SplitKind) => void;
  pick?: string;
  onPick: (id: string | undefined) => void;
}) {
  const split = splits.find((s) => s.kind === splitBy) ?? splits[splits.length - 1];
  const others: { status: Rsvp["status"]; word: string }[] = [
    { status: "pending", word: "still to answer" },
    { status: "to_invite", word: "to invite" },
    { status: "declined", word: "can't come" },
  ];
  const toggle = (s: Rsvp["status"]) => onShow(showing === s ? "all" : s);
  const lines = split?.sections.some((s) => s.lines.length > 0);

  return (
    <>
      <button
        type="button"
        aria-pressed={showing === "attending"}
        onClick={() => toggle("attending")}
        className={`-mx-2 mt-2 flex items-baseline gap-2.5 rounded-2xl px-2 py-1 text-left transition ${showing === "attending" ? "bg-white shadow-[0_1px_4px_rgb(60_50_40/0.14)]" : "hover:bg-white/60"}`}
      >
        <span className="type-figure text-[54px] font-light leading-none text-ink">{counts.attending}</span>
        <span className="font-display text-xl italic text-champagne-600">coming</span>
      </button>
      <p className="mt-1 flex flex-wrap gap-x-1.5 text-[13px] text-stone">
        {others
          .filter((o) => counts[o.status] > 0)
          .map((o, i) => (
            <span key={o.status}>
              {i > 0 && <span aria-hidden>· </span>}
              <button
                type="button"
                aria-pressed={showing === o.status}
                onClick={() => toggle(o.status)}
                className={`${LINK} ${showing === o.status ? "font-medium text-ink underline" : ""}`}
              >
                {counts[o.status]} {o.word} ›
              </button>
            </span>
          ))}
        <span>
          {others.some((o) => counts[o.status] > 0) && <span aria-hidden>· </span>}
          of {total} {total === 1 ? "person" : "people"}
          {homes > 0 && ` · ${homes} ${homes === 1 ? "home" : "homes"}`}
        </span>
      </p>

      {splits.length > 1 && (
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <span className="type-meta">Add up by</span>
          <span role="group" aria-label="Add up by" className="inline-flex rounded-full bg-cream p-[3px] text-[13px]">
            {splits.map((s) => (
              <button
                key={s.kind}
                type="button"
                aria-pressed={s.kind === split?.kind}
                onClick={() => onSplit(s.kind)}
                className={`h-8 rounded-full px-3 transition ${s.kind === split?.kind ? "bg-white text-ink shadow-[0_1px_4px_rgb(60_50_40/0.14)]" : "text-stone hover:text-ink"}`}
              >
                {s.word}
              </button>
            ))}
          </span>
        </div>
      )}

      {split && lines && (
        <div className="mt-3.5 border-t border-linen pt-1">
          {split.sections
            .filter((section) => section.lines.length > 0)
            .map((section, i) => (
              <div key={section.title ?? i}>
                {section.title && (
                  <p className={`type-meta mt-3 ${section.rose ? "text-[#9A3F2B]" : ""}`}>{section.title}</p>
                )}
                {section.lines.map((line) => {
                  const on = pick === line.id;
                  return (
                    <button
                      key={line.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onPick(on ? undefined : line.id)}
                      className={`-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-baseline gap-1.5 rounded-xl px-2 py-2 text-left text-[15px] transition ${
                        on ? "bg-white shadow-[0_1px_4px_rgb(60_50_40/0.14)]" : "hover:bg-white/60"
                      } ${line.rose ? "text-[#9A3F2B]" : line.faded ? "text-stone" : "text-ink"}`}
                    >
                      <span className="min-w-0">{line.label}</span>
                      <span aria-hidden className="min-w-4 flex-1 -translate-y-1 border-b-[1.5px] border-dotted border-[#C9BBA0]" />
                      <span className="type-figure text-xl leading-none tabular-nums">{line.count}</span>
                      <span aria-hidden className="ml-0.5 text-sm text-stone">›</span>
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      )}

      {split?.copy && lines && <CopyButton text={split.copy} label="Copy the list for the caterer" />}
    </>
  );
}

/** A pill that copies text; if the phone won't allow it, the text opens to select by hand. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("manual");
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="mt-4 flex h-[42px] w-full items-center justify-center gap-2 rounded-full border border-linen bg-white text-sm text-ink hover:border-champagne-400"
      >
        <Copy className="h-4 w-4" strokeWidth={1.7} aria-hidden />
        {state === "copied" ? "Copied ✓" : label}
      </button>
      {state === "manual" && (
        <textarea
          readOnly
          value={text}
          rows={6}
          aria-label={label}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 w-full rounded-xl border border-linen bg-ivory px-3 py-2 text-[13px] leading-relaxed text-ink"
        />
      )}
    </>
  );
}

/** The card itself, for filters other than a group: an icon and what's filtered, then the body. */
export function SummaryCard({
  icon: Icon,
  title,
  ...body
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  title: string;
} & React.ComponentProps<typeof SummaryBody>) {
  return (
    <section
      aria-label={title}
      className="rounded-[22px] border-[0.5px] border-white/70 bg-white/55 p-[18px] shadow-[0_18px_40px_-28px_rgb(60_45_20/0.4)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />
        </span>
        <p className="label min-w-0 text-champagne-600">{title}</p>
      </div>
      <SummaryBody {...body} />
    </section>
  );
}
