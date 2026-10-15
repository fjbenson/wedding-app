"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { BARE, CARD, Ideas, Line, Part, TITLE_INPUT } from "@/components/visual-form";
import type { WeddingEvent } from "@/types/db";

/** Tap one to name it — the usual extra parts of a wedding. */
const IDEAS = ["The evening", "Welcome drinks", "Sunday brunch", "Rehearsal dinner", "The ceremony"];

/**
 * Add or rename one part of the wedding (`event` is missing when adding).
 * Laid out like the other visual forms (15 Oct 2026): the name large with
 * one-tap ideas, then where on a glass card.
 */
export default function EventForm({
  action,
  event,
}: {
  action: (formData: FormData) => void | Promise<void>;
  event?: WeddingEvent;
}) {
  const [name, setName] = useState(event?.name ?? "");
  return (
    <form action={action}>
      <input
        name="name"
        required
        autoFocus={!event}
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="What's it called?"
        placeholder="What's it called?"
        className={TITLE_INPUT}
      />
      {!event && <Ideas ideas={IDEAS} value={name} onPick={setName} />}

      <Part label="Where">
        <div className={CARD}>
          <Line icon={MapPin} label="Where">
            <input
              name="location"
              autoComplete="off"
              defaultValue={event?.location ?? ""}
              placeholder="Where — e.g. Hazel Gap Barn"
              className={BARE}
            />
          </Line>
        </div>
      </Part>

      <SubmitBar label={event ? "Save changes" : "Add it"} whenChanged={!!event} />
    </form>
  );
}
