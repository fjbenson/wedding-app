"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { AreaTiles, BARE, CARD, Ideas, Line, Part, TITLE_INPUT } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import { saveNewListAction } from "../actions";

const IDEAS = ["Toilet baskets", "Bridesmaids' room", "Emergency kit", "Groomsmen's bag", "In the car", "Questions for the venue"];

/** The list's name large with one-tap ideas, then its first lines (one per line), then an area if it belongs to one. */
export default function NewListForm({ areas, back, area }: { areas: AreaOption[]; back: string; area: string }) {
  const [name, setName] = useState("");
  return (
    <form action={saveNewListAction}>
      <input type="hidden" name="back" value={back} />
      <input
        name="name"
        required
        autoFocus
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="The list's name"
        placeholder="e.g. Toilet baskets"
        className={TITLE_INPUT}
      />
      <Ideas ideas={IDEAS} value={name} onPick={setName} />

      <Part label="What's on it">
        <div className={CARD}>
          <Line icon={ListChecks} label="One thing per line" top>
            <textarea name="lines" rows={6} placeholder={"Hairspray\nPlasters\nMints"} className={`${BARE} resize-none`} />
          </Line>
        </div>
        <p className="mt-2 px-1 text-[13px] text-stone">One per line. You can add more and tick them off once it&apos;s made.</p>
      </Part>

      <Part label="Area (optional)">
        <AreaTiles name="area" areas={areas} otherValue="other" defaultValue={area} optional />
      </Part>

      <SubmitBar label="Make the list" />
    </form>
  );
}
