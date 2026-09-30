"use client";

import { useOptimistic, useTransition } from "react";
import type { RsvpStatus } from "@/types/db";
import { setStatusAction } from "./rsvp-actions";

const CHOICES: { status: RsvpStatus; label: string; aria: string; on: string }[] = [
  { status: "attending", label: "Yes", aria: "coming", on: "border-ink bg-ink text-ivory" },
  { status: "declined", label: "No", aria: "not coming", on: "border-stone bg-stone text-ivory" },
  { status: "pending", label: "?", aria: "not heard yet", on: "border-champagne-400 bg-champagne-100 text-ink" },
];

/**
 * Yes / No / ? beside a name. Lights up the moment it's tapped and saves in
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
            className={`h-9 min-w-9 rounded-full border px-2.5 text-sm transition sm:min-w-10 sm:px-3 ${
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
