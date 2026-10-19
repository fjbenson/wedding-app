"use client";

import { Circle, PanelTop, RectangleHorizontal } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { CARD, Part, TITLE_INPUT, Tiles } from "@/components/visual-form";
import { addTableAndBackAction } from "../../actions";

const SHAPES = [
  { value: "round", label: "Round", icon: Circle },
  { value: "long", label: "Long", icon: RectangleHorizontal },
  { value: "top", label: "Top table", icon: PanelTop },
];

/** A table: its name large, how many it seats, round, long or a top table. */
export default function TableForm() {
  return (
    <form action={addTableAndBackAction}>
      <input name="name" autoFocus autoComplete="off" aria-label="Table name" placeholder="Table name, e.g. Table 4" className={TITLE_INPUT} />

      <Part label="Seats">
        <label className={`${CARD} flex items-baseline gap-2 px-5 py-3`}>
          <input
            name="capacity"
            type="number"
            min={1}
            max={40}
            defaultValue={8}
            inputMode="numeric"
            aria-label="Seats"
            className="w-24 bg-transparent font-display !text-[44px] font-light leading-tight text-ink focus:outline-none"
          />
          <span className="text-stone">people</span>
        </label>
      </Part>

      <Part label="Shape">
        <Tiles name="shape" options={SHAPES} defaultValue="round" columns="grid-cols-3" />
      </Part>

      <SubmitBar label="Add table" />
    </form>
  );
}
