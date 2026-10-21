"use client";

import { useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronLeft, X } from "lucide-react";
import BackLink from "@/components/back-link";
import MoneyInput from "@/components/money-input";
import IconPicker from "@/components/icon-picker";
import { guessIcon, iconByName } from "@/lib/area-icons";
import { formatMoney } from "@/lib/money";
import { addAreaAction, quickAddAreaAction } from "../actions";

/** Ideas to tap on the first step, after any areas the couple took off the ring. */
const IDEAS = ["Decor", "Accommodation", "Honeymoon", "Favours", "Lighting", "Children", "Entertainment"];

/**
 * Adding an area, one question per screen (owner, 12 Oct 2026; canvas 2
 * "Area · Add in three steps"): 1 its name, 2 its icon — already guessed from
 * the name, with a search ("lights") over the shortlist in
 * src/lib/area-icons.ts — 3 a budget, or skip. One form underneath, so Back
 * keeps what was typed; it saves at the end and opens the new area's page.
 *
 * `sheet`: the same steps over another form ("+ Add an area" in the area
 * tiles, `AreaTiles`): no form of its own (it would sit inside theirs), it
 * saves through `quickAddAreaAction` and hands the new area back, picked.
 */
export default function AreaSteps({
  hidden,
  taken = [],
  stillFree,
  error,
  sheet,
}: {
  sheet?: { onAdded: (area: { key: string; label: string; icon: string | null }) => void; onClose: () => void };
  /** Areas taken off the ring or switched off: offered first on step 1. */
  hidden: string[];
  /** Areas already on the ring, so an idea isn't one they have ("Decor" when there's a Decor). */
  taken?: string[];
  /** The whole budget less what's shared out, if there's a budget. */
  stillFree: number | null;
  error?: string;
}) {
  const [step, setStep] = useState(1);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const [saving, start] = useTransition();
  const [sheetError, setSheetError] = useState<string | undefined>();
  const finishSheet = (skip: boolean) =>
    start(async () => {
      if (!sheet) return;
      const budget = skip ? null : (root.current?.querySelector<HTMLInputElement>('input[name="budget"]')?.value ?? null);
      let result: { key?: string; label?: string; icon?: string; error?: string };
      try {
        result = await quickAddAreaAction(name, { icon, budget });
      } catch {
        result = { error: "That didn't add it. Reload the page and try again." };
      }
      if (result.error || !result.key) return setSheetError(result.error);
      sheet.onAdded({ key: result.key, label: result.label ?? name, icon: result.icon ?? icon });
    });

  const name = label.trim();
  const toIcons = () => {
    if (!name) return;
    // A first guess from the name, until they pick one themselves.
    setIcon((picked) => picked ?? guessIcon(name));
    setStep(2);
  };
  const Picked = iconByName(icon) ?? iconByName("Sparkles")!;
  const suggestions = [...hidden, ...IDEAS.filter((i) => ![...hidden, ...taken].some((h) => h.toLowerCase() === i.toLowerCase()))];

  const body = (
    <>
      <input type="hidden" name="icon" value={icon ?? ""} />

      <div className="flex items-center justify-between">
        {step === 1 && sheet ? (
          <button type="button" onClick={sheet.onClose} aria-label="Close" className="-ml-1 flex h-11 w-11 items-center text-stone hover:text-ink">
            <X className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden />
          </button>
        ) : step === 1 ? (
          <BackLink href="/" className="-ml-1 flex h-11 w-11 items-center text-stone hover:text-ink">
            <X className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden />
            <span className="sr-only">Close</span>
          </BackLink>
        ) : (
          <button type="button" onClick={() => setStep(step - 1)} aria-label="Back" className="-ml-1 flex h-11 w-11 items-center text-ink">
            <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden />
          </button>
        )}
        {/* Circles joined by a line that fills gold as you go (owner's pick, canvas 2 "Area · The step marker", B). */}
        <span className="flex items-center" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((s) => (
            <span key={s} className="flex items-center" aria-hidden>
              {s < step ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-champagne-400 text-white">
                  <Check className="h-3 w-3" strokeWidth={2.4} />
                </span>
              ) : s === step ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-champagne-400 bg-white">
                  <span className="h-2 w-2 rounded-full bg-champagne-400" />
                </span>
              ) : (
                <span className="h-6 w-6 rounded-full border-[1.5px] border-linen bg-white" />
              )}
              {s < 3 && <span className={`h-0.5 w-[34px] rounded-full transition-colors ${s < step ? "bg-champagne-400" : "bg-linen"}`} />}
            </span>
          ))}
        </span>
        <span className="w-11 text-right text-xs text-stone">{step} of 3</span>
      </div>

      {(error || sheetError) && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {sheetError ?? error}
        </p>
      )}

      {/* 1 · The name */}
      <section hidden={step !== 1}>
        <p className="label mt-8">A new area</p>
        <h1 className="mt-2.5 font-display text-[36px] font-light leading-[1.08] tracking-[-0.02em] text-ink">What shall we call it?</h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-stone">Anything you&apos;re planning that isn&apos;t on the ring yet.</p>
        <input
          name="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              toIcons();
            }
          }}
          autoFocus
          autoComplete="off"
          maxLength={40}
          aria-label="The area's name"
          placeholder="e.g. Fireworks"
          className="mt-7 w-full border-b border-champagne-400 bg-transparent pb-2 font-display !text-[26px] font-light text-ink placeholder:italic placeholder:text-stone/50 focus:border-ink focus:outline-none"
        />
        <p className="mt-7 text-xs uppercase tracking-[0.16em] text-stone">{hidden.length ? "Bring one back, or try" : "Or one of these"}</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setLabel(s);
                setIcon(null);
              }}
              className={`h-9 rounded-full border px-3.5 text-[13px] transition ${
                name === s ? "border-champagne-600 bg-champagne-100 text-champagne-600" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* 2 · The icon */}
      <section hidden={step !== 2}>
        <p className="label mt-8">{name}</p>
        <h1 className="mt-2.5 font-display text-[36px] font-light leading-[1.08] tracking-[-0.02em] text-ink">Pick its icon</h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-stone">It becomes its dot on the hub ring.</p>
        <div className="mt-5 flex items-center gap-3.5">
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-white/90 bg-white/70 text-champagne-600 shadow-[0_10px_24px_-14px_rgb(60_50_40/0.5),inset_0_1px_0_#fff]">
            <Picked className="h-6 w-6" strokeWidth={1.6} aria-hidden />
          </span>
          <span className="font-display text-xl font-light text-ink">{name}</span>
        </div>
        <div className="mt-5">
          <IconPicker value={icon} onPick={setIcon} />
        </div>
      </section>

      {/* 3 · A budget, or none */}
      <section hidden={step !== 3}>
        <p className="label mt-8">{name}</p>
        <h1 className="mt-2.5 font-display text-[36px] font-light leading-[1.08] tracking-[-0.02em] text-ink">Is there a budget for it?</h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-stone">You can set or change it any time on Money&apos;s budget page.</p>
        <label className="mt-7 flex items-baseline gap-1.5 border-b border-champagne-400 pb-1.5 focus-within:border-ink">
          <span className="font-display text-[34px] font-light text-stone">£</span>
          <span className="sr-only">Budget</span>
          <MoneyInput
            name="budget"
            placeholder="0"
            className="w-full min-w-0 bg-transparent font-display !text-[44px] font-light text-ink placeholder:text-stone/40 focus:outline-none"
          />
        </label>
        {stillFree !== null && (
          <p className="mt-3 flex justify-between text-[13px] text-stone">
            <span>Still to share out</span>
            <span className="text-ink">{formatMoney(stillFree)}</span>
          </p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-lg bg-gradient-to-t from-ivory from-60% to-ivory/0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 md:max-w-2xl">
        {step < 3 ? (
          <button
            type="button"
            onClick={() => (step === 1 ? toIcons() : setStep(3))}
            disabled={step === 1 && !name}
            className="h-[52px] w-full rounded-2xl bg-ink text-ivory shadow-[0_10px_24px_-12px_rgb(30_27_24/0.5)] transition hover:bg-ink/90 disabled:opacity-40"
          >
            Next
          </button>
        ) : sheet ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => finishSheet(false)}
              disabled={saving}
              className="h-[52px] w-full rounded-2xl bg-ink text-ivory shadow-[0_10px_24px_-12px_rgb(30_27_24/0.5)] transition hover:bg-ink/90 disabled:opacity-60"
            >
              {saving ? "Adding…" : `Add ${name}`}
            </button>
            <button type="button" onClick={() => finishSheet(true)} disabled={saving} className="h-11 text-sm text-champagne-600 hover:text-ink">
              Skip — no budget yet
            </button>
          </div>
        ) : (
          <Finish name={name} />
        )}
      </div>
    </>
  );

  return sheet ? (
    <div ref={root} className="pb-40">
      {body}
    </div>
  ) : (
    <form action={addAreaAction} className="pb-40">
      {body}
    </form>
  );
}

/** Step 3's two ways to finish: with the budget typed, or without one. */
function Finish({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-1">
      <button
        type="submit"
        disabled={pending}
        className="h-[52px] w-full rounded-2xl bg-ink text-ivory shadow-[0_10px_24px_-12px_rgb(30_27_24/0.5)] transition hover:bg-ink/90 disabled:opacity-60"
      >
        {pending ? "Adding…" : `Add ${name}`}
      </button>
      <button type="submit" name="skip" value="1" disabled={pending} className="h-11 text-sm text-champagne-600 hover:text-ink">
        Skip — no budget yet
      </button>
    </div>
  );
}
