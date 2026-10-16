"use client";

import { useState } from "react";
import { SubmitBar } from "@/components/form-bits";
import { Clock, Flag, MapPin, NotebookPen, UserRound } from "lucide-react";
import { ReturnTo } from "@/components/back-link";
import { AreaTiles, BARE, CARD, Folded, Ideas, Line, Part, TITLE_INPUT } from "@/components/visual-form";
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

      <Part label="Area (optional)">
        <AreaTiles name="area_key" areas={areas} otherValue="other" defaultValue={item ? (item.area_key ?? "") : (defaultArea ?? "")} folded={!!item} optional />
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

/** Tap one to name the journey. */
const VEHICLES = ["The coach", "Minibus", "Wedding car", "Car 1", "Car 2", "Taxis"];

/** The usual times on the day, for the time card. */
const DAY_TIMES = ["11:00", "12:30", "14:00", "17:00", "23:00", "00:00"];

/**
 * One journey on the day (screen 28; passengers are added on Travel). Laid
 * out like the other visual forms (15 Oct 2026): the vehicle large with
 * one-tap ideas, the time as a card with quick taps, the route From → To on
 * one card, notes folded unless there are some.
 */
export function TransportForm({ action, run }: { action: Action; run?: TransportRun }) {
  const [vehicle, setVehicle] = useState(run?.vehicle ?? "");
  const [time, setTime] = useState(run?.at_time.slice(0, 5) ?? "");
  return (
    <form action={action}>
      <input
        name="vehicle"
        required
        autoFocus={!run}
        autoComplete="off"
        value={vehicle}
        onChange={(e) => setVehicle(e.target.value)}
        aria-label="What's taking them"
        placeholder="What's taking them?"
        className={TITLE_INPUT}
      />
      {!run && <Ideas ideas={VEHICLES} value={vehicle} onPick={setVehicle} />}

      <Part label="Leaves at">
        <div className={CARD}>
          <Line icon={Clock} label="Time">
            <input
              name="at_time"
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`${BARE} font-display !text-[21px] font-light ${time ? "" : "text-stone/60"}`}
            />
          </Line>
          {!run && (
            <div className="flex flex-wrap gap-2 border-t border-linen px-4 py-3">
              {DAY_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`h-9 rounded-full border px-3.5 text-[13px] tabular-nums transition ${
                    time === t ? "border-ink bg-ink text-ivory" : "border-linen bg-white/80 text-ink hover:border-champagne-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </Part>

      <Part label="The route">
        <div className={CARD}>
          <Line icon={MapPin} label="From">
            <input name="from_place" autoComplete="off" defaultValue={run?.from_place ?? ""} placeholder="From — e.g. The Bell Inn" className={BARE} />
          </Line>
          <Line icon={Flag} label="To">
            <input name="to_place" autoComplete="off" defaultValue={run?.to_place ?? ""} placeholder="To — e.g. St Mary's" className={BARE} />
          </Line>
        </div>
      </Part>

      <Folded label="Add notes" open={!!run?.notes}>
        <Part label="Notes">
          <div className={CARD}>
            <Line icon={NotebookPen} label="Notes" top>
              <textarea
                name="notes"
                rows={3}
                defaultValue={run?.notes ?? ""}
                placeholder="e.g. Driver: Mike, 07700 900555"
                className={`${BARE} w-full resize-none`}
              />
            </Line>
          </div>
        </Part>
      </Folded>

      <SubmitBar label={run ? "Save changes" : "Add the journey"} whenChanged={!!run} />
    </form>
  );
}
