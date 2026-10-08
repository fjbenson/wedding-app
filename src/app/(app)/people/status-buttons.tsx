"use client";

import { useOptimistic, useTransition } from "react";
import type { RsvpStatus } from "@/types/db";
import { setStatusAction } from "./rsvp-actions";

const CHOICES: { status: RsvpStatus; label: string; aria: string; on: string }[] = [
  { status: "attending", label: "✓", aria: "coming", on: "border-ink bg-ink text-ivory" },
  { status: "pending", label: "?", aria: "waiting", on: "border-champagne-400 bg-champagne-100 text-champagne-600" },
  { status: "declined", label: "✕", aria: "can't come", on: "border-stone bg-stone text-ivory" },
];

/**
 * Coming / waiting / can't come (✓ ? ✕) beside an event on the guest card. Lights up the moment it's tapped and saves in
 * the background, so ticking through a pile of replies doesn't lag.
 */
export default function StatusButtons({
  rsvpId,
  status,
  name,
}: {
  rsvpId: string;
  status: RsvpStatus;
  name: string;
}) {
  const [shown, setShown] = useOptimistic(status);
  const [, startTransition] = useTransition();

  return (
    <div role="group" aria-label={`${name}'s answer`} className="flex shrink-0 gap-1">
      {CHOICES.map((choice) => {
        const active = shown === choice.status;
        return (
          <button
            key={choice.status}
            type="button"
            aria-pressed={active}
            aria-label={`${name}: ${choice.aria}`}
            onClick={() =>
              startTransition(async () => {
                setShown(choice.status);
                await setStatusAction(rsvpId, choice.status);
              })
            }
            className={`h-10 w-11 rounded-full border text-[15px] transition ${
              active ? choice.on : "border-linen bg-white text-stone hover:border-champagne-400"
            }`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
