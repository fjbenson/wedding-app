"use client";

import { Field, INPUT, SubmitBar } from "@/components/form-bits";
import { Clock, MapPin, NotebookPen, UserRound } from "lucide-react";
import { ReturnTo } from "@/components/back-link";
import { AreaTiles, BARE, CARD, Line, Part, TITLE_INPUT } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import type { RunSheetItem, TransportRun } from "@/types/db";

type Action = (formData: FormData) => void | Promise<void>;

/**
 * One moment of the run sheet (screen 25), laid out like the other visual
 * forms (12 Oct 2026): what happens, large; the time; the area it belongs to
 * (so its area page shows it, and the run sheet can be narrowed to it); where
 * and who; notes. `fromArea` (added from an area page) goes back there.
 */
export function RunSheetForm({
  action,
  item,
  areas,
  defaultArea,
  fromArea,
}: {
  action: Action;
  item?: RunSheetItem;
  areas: AreaOption[];
  defaultArea?: string;
  fromArea?: string;
}) {
  return (
    <form action={action}>
      <ReturnTo href="/day" />
      {fromArea && <input type="hidden" name="from_area" value={fromArea} />}
      <input
        name="title"
        required
        autoFocus={!item}
        autoComplete="off"
        defaultValue={item?.title}
        aria-label="What happens"
        placeholder="What happens?"
        className={TITLE_INPUT}
      />

      <Part label="When">
        <div className={CARD}>
          <Line icon={Clock} label="Time">
            <input
              name="at_time"
              type="time"
              required
              defaultValue={item?.at_time.slice(0, 5) ?? ""}
              className={`${BARE} font-display !text-[21px] font-light`}
            />
          </Line>
        </div>
      </Part>

      <Part label="Area">
        <AreaTiles name="area_key" areas={areas} otherValue="" defaultValue={item ? (item.area_key ?? "") : defaultArea} />
      </Part>

      <section className="mt-7">
        <h2 className="section-label font-body">Where and who</h2>
        <div className={CARD}>
          <Line icon={MapPin} label="Where">
            <input name="location" defaultValue={item?.location ?? ""} placeholder="Where — e.g. The orchard" className={BARE} />
          </Line>
          <Line icon={UserRound} label="Who's in charge">
            <input name="who" defaultValue={item?.who ?? ""} placeholder="Who's in charge — e.g. the band" className={BARE} />
          </Line>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="section-label font-body">Notes</h2>
        <div className={CARD}>
          <Line icon={NotebookPen} label="Notes" top>
            <textarea
              name="notes"
              rows={3}
              defaultValue={item?.notes ?? ""}
              placeholder="e.g. Ushers hand out order of service"
              className={`${BARE} w-full resize-none`}
            />
          </Line>
        </div>
      </section>

      <SubmitBar label={item ? "Save changes" : "Add to the run sheet"} whenChanged={!!item} />
    </form>
  );
}

/** One run of a car or coach (screen 28). Passengers are added on the Transport tab. */
export function TransportForm({ action, run }: { action: Action; run?: TransportRun }) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-[7.5rem_1fr] items-end gap-3">
        <Field label="Leaves at">
          <input name="at_time" type="time" required defaultValue={run?.at_time.slice(0, 5) ?? ""} className={INPUT} />
        </Field>
        <Field label="Vehicle">
          <input name="vehicle" required defaultValue={run?.vehicle} placeholder="e.g. Car 2, The coach" className={INPUT} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From" hint="optional">
          <input name="from_place" defaultValue={run?.from_place ?? ""} placeholder="e.g. The Bensons' house" className={INPUT} />
        </Field>
        <Field label="To" hint="optional">
          <input name="to_place" defaultValue={run?.to_place ?? ""} placeholder="e.g. St Mary's" className={INPUT} />
        </Field>
      </div>
      <Field label="Notes" hint="optional">
        <textarea name="notes" rows={3} defaultValue={run?.notes ?? ""} placeholder="e.g. Driver: Mike, 07700 900555" className={INPUT} />
      </Field>
      <SubmitBar label={run ? "Save changes" : "Add"} whenChanged={!!run} />
    </form>
  );
}
