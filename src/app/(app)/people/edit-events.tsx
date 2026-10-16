"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import CardSheet from "@/components/card-sheet";
import type { WeddingEvent } from "@/types/db";
import { safely, TextRow } from "./guest-card";
import { removeEventAction, updateEventFieldAction } from "./rsvp-actions";
import { TitleEditor } from "../plan/plan-card-body";

/**
 * "Edit events" at the foot of the guest list (owner, 16 Oct 2026: one link
 * in place of "Rename the day · Rename the evening · Add an event"): a card
 * listing the parts of the day, each renamed or given a place right here
 * (a small Save under the box, like every card), removed, or another added
 * on its own screen.
 */
export default function EditEvents({ events }: { events: WeddingEvent[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className="mt-6 text-center">
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-stone underline underline-offset-4 hover:text-ink">
          Edit events
        </button>
      </p>
      {open && (
        <CardSheet label="Your events" onClose={() => setOpen(false)} top={<span className="label">Your events</span>}>
          <p className="mt-1 text-sm text-stone">The parts of the day guests are asked to, in date order.</p>
          {events.map((e) => (
            <EventPart key={e.id} event={e} />
          ))}
          <Link href="/people/events/new" className="mt-6 flex min-h-12 items-center gap-3 font-display text-[15px] italic text-stone hover:text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-champagne-400 text-champagne-600">
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </span>
            Add an event
          </Link>
        </CardSheet>
      )}
    </>
  );
}

function EventPart({ event }: { event: WeddingEvent }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const save = (field: "name" | "location") => (value: string) => safely(() => updateEventFieldAction(event.id, field, value));

  return (
    <section className="mt-6 border-t border-linen pt-5">
      {/* Its name, large — tap to rename (as on every card). */}
      <TitleEditor value={event.name} onSave={save("name")} />
      <dl className="mt-1">
        <TextRow label="Where" value={event.location} onSave={save("location")} />
      </dl>
      {error && <p role="alert" className="mt-2 text-sm text-ink">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Remove ${event.name}? Everyone's answers for it go too.`)) return;
          startTransition(async () => setError((await safely(() => removeEventAction(event.id))).error));
        }}
        className="mt-3 text-xs text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
      >
        Remove {event.name.toLowerCase()}
      </button>
    </section>
  );
}
