"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AddButton from "./add-button";
import CardSheet from "./card-sheet";

export type AddChoice = {
  /** Its icon, drawn by the caller (`<UserRound />`); sized here. */
  icon: React.ReactNode;
  title: string;
  /** One short line on what it is. */
  line: string;
  /** Its own full-screen add form. */
  href: string;
};

/**
 * The round black + when a tab can add more than one kind of thing (owner,
 * 16 Oct 2026: "give the option first and THEN open up the form"): it opens a
 * small card of choices — a guest, a household, a group… — and each opens
 * its own full-screen form (adding is always a full screen; a card is for
 * something that already exists).
 */
export default function AddMenu({
  label,
  title,
  choices,
  textClass,
  children,
}: {
  label: string;
  title: string;
  choices: AddChoice[];
  /** Shown as a quiet text link in a card's foot ("+ Add an idea") instead of the round black +. */
  textClass?: string;
  /** What the text-link button shows in place of the label (a chevron circle, say). */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {textClass ? (
        <button type="button" onClick={() => setOpen(true)} className={textClass}>
          {children ?? label}
        </button>
      ) : (
        <AddButton onClick={() => setOpen(true)} label={label} />
      )}
      {/* On the page's body: inside a glass card (backdrop-filter) a fixed sheet
          is trapped in the card and clipped (21 Oct 2026: Inspo didn't open). */}
      {open && createPortal(
        <CardSheet label={title} onClose={close} top={<span className="label">{title}</span>}>
          <ul className="mt-1 pb-2">
            {choices.map((c) => (
              <li key={c.title} className="border-b border-linen last:border-b-0">
                <Link href={c.href} onClick={close} className="row-press flex min-h-[68px] w-full items-center gap-3.5 py-2.5 text-left [--row-bleed:22px]">
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-champagne-600 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[1.6]">
                    {c.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="type-item block text-lg">{c.title}</span>
                    <span className="mt-0.5 block text-[13px] text-stone">{c.line}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone/70" strokeWidth={1.8} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </CardSheet>,
        document.body,
      )}
    </>
  );
}
