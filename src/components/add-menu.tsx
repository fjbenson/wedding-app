"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AddButton from "./add-button";
import CardSheet from "./card-sheet";

export type AddChoice = {
  /** Its icon, drawn by the caller (`<UserRound />`); sized here. */
  icon: React.ReactNode;
  title: string;
  /** One short line on what it is. */
  line: string;
} & (
  | { href: string }
  | {
      /** Just a name, asked right here; then `done` opens what was made. */
      ask: { label: string; placeholder: string; button: string };
      save: (name: string) => Promise<{ error?: string; id?: string }>;
      done: (id: string) => void;
    }
);

/**
 * The round black + when a tab can add more than one kind of thing (owner,
 * 16 Oct 2026: "give the option first and THEN open up the form"): it opens a
 * small card of choices — a guest, a household, a group… — and each opens
 * its own form. Something that needs only a name (a household, a group) is
 * asked for right here, then opens.
 */
export default function AddMenu({ label, title, choices }: { label: string; title: string; choices: AddChoice[] }) {
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState<AddChoice | null>(null);
  const close = () => {
    setOpen(false);
    setAsking(null);
  };

  return (
    <>
      <AddButton onClick={() => setOpen(true)} label={label} />
      {open && (
        <CardSheet
          label={title}
          onClose={close}
          top={
            asking ? (
              <button type="button" onClick={() => setAsking(null)} className="label flex items-center gap-1 hover:text-ink">
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {title}
              </button>
            ) : (
              <span className="label">{title}</span>
            )
          }
        >
          {asking && "ask" in asking ? (
            <AskName choice={asking} onDone={close} />
          ) : (
            <ul className="mt-1 pb-2">
              {choices.map((c) => {
                const inner = (
                  <>
                    <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[1.6]">
                      {c.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="type-item block text-lg">{c.title}</span>
                      <span className="mt-0.5 block text-[13px] text-stone">{c.line}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone/70" strokeWidth={1.8} aria-hidden />
                  </>
                );
                const row = "row-press flex min-h-[68px] w-full items-center gap-3.5 py-2.5 text-left [--row-bleed:22px]";
                return (
                  <li key={c.title} className="border-b border-linen last:border-b-0">
                    {"href" in c ? (
                      <Link href={c.href} onClick={close} className={row}>
                        {inner}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => setAsking(c)} className={row}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardSheet>
      )}
    </>
  );
}

/** The one question for a household or a group: its name. */
function AskName({ choice, onDone }: { choice: Extract<AddChoice, { ask: unknown }>; onDone: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="pb-2"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            const result = await choice.save(name);
            if (result.error || !result.id) return setError(result.error ?? "That didn't save.");
            onDone();
            choice.done(result.id);
          } catch {
            setError("That didn't save — the app may have just been updated. Pull down to refresh, then try again.");
          }
        });
      }}
    >
      <h2 className="mt-1 font-display text-[26px] leading-tight text-ink">{choice.title}</h2>
      <label className="mt-5 block">
        <span className="section-label">{choice.ask.label}</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={choice.ask.placeholder}
          className="mt-2 w-full border-b border-champagne-400 bg-transparent pb-2 font-display !text-[24px] text-ink placeholder:text-stone/50 focus:border-ink focus:outline-none"
        />
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="mt-6 h-[52px] w-full rounded-2xl bg-ink text-ivory transition hover:bg-ink/90 disabled:opacity-50"
      >
        {pending ? "Adding…" : choice.ask.button}
      </button>
    </form>
  );
}
