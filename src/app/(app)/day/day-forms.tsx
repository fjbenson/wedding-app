"use client";

import { useState } from "react";
import { SubmitBar } from "@/components/form-bits";
import { Bus, BusFront, Car, CarFront, CarTaxiFront, Clock, Flag, Footprints, Link2, MapPin, Music, NotebookPen, UserRound } from "lucide-react";
import PeoplePicker from "../people/people-picker";
import { ReturnTo } from "@/components/back-link";
import { AreaTiles, BARE, CARD, Folded, Line, Part, TITLE_INPUT, Tiles } from "@/components/visual-form";
import type { AreaOption } from "@/lib/areas";
import { PLAYED_BY } from "@/lib/music";
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

      {/* A song for the moment (owner, 19 Oct 2026): open from the Music area, folded elsewhere. */}
      <Folded label="Add a song" open={!!item?.music || !!item?.music_url || defaultArea === "music"}>
        <section className="mt-7">
          <h2 className="section-label font-body">Music</h2>
          <div className={CARD}>
            <Line icon={Music} label="Song or playlist">
              <input name="music" defaultValue={item?.music ?? ""} placeholder="e.g. Harvest Moon, Neil Young" className={BARE} />
            </Line>
            <Line icon={Link2} label="Link">
              <input name="music_url" type="url" inputMode="url" defaultValue={item?.music_url ?? ""} placeholder="Spotify, YouTube or Apple Music link" className={BARE} />
            </Line>
            <Line icon={UserRound} label="Who presses play">
              <input name="music_who" defaultValue={item?.music_who ?? ""} placeholder="Who presses play — e.g. Sam" className={BARE} />
            </Line>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["song", "playlist"] as const).map((k) => (
              <label key={k} className="cursor-pointer">
                <input type="radio" name="music_kind" value={k} defaultChecked={(item?.music_kind ?? "song") === k} className="peer sr-only" />
                <span className="flex h-9 items-center rounded-full border border-linen bg-white/80 px-3.5 text-[13px] text-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory">
                  {k === "song" ? "A song" : "A playlist"}
                </span>
              </label>
            ))}
          </div>
          <p className="type-meta mt-4">Played by</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLAYED_BY.map((p) => (
              <label key={p.value} className="cursor-pointer">
                <input type="radio" name="music_played" value={p.value} defaultChecked={item?.music_played === p.value} className="peer sr-only" />
                <span className="flex h-9 items-center rounded-full border border-linen bg-white/80 px-3.5 text-[13px] text-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory">
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </section>
      </Folded>

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

/** What's taking them, as picture tiles; a tap names the journey (it can still be typed). */
const VEHICLES = [
  { value: "The coach", label: "Coach", icon: Bus },
  { value: "Minibus", label: "Minibus", icon: BusFront },
  { value: "Wedding car", label: "Wedding car", icon: Car },
  { value: "Taxis", label: "Taxi", icon: CarTaxiFront },
  { value: "A lift", label: "A lift", icon: CarFront },
  { value: "On foot", label: "On foot", icon: Footprints },
];

/**
 * One journey on the day (screen 28). Laid out like the other visual forms:
 * the vehicle large, with picture tiles to name it in a tap (17 Oct 2026, as
 * the canvas's "Journeys" round had them); the time as a card (no quick taps,
 * like appointments since 16 Oct 2026); the route From → To; who's going
 * (a new journey only — after that they're added on its card); notes folded.
 */
export function TransportForm({ action, run, guests = [] }: { action: Action; run?: TransportRun; guests?: { id: string; name: string }[] }) {
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
      {!run && (
        <Tiles
          name="kind"
          options={VEHICLES}
          value={VEHICLES.some((v) => v.value === vehicle) ? vehicle : ""}
          onChange={setVehicle}
          columns="grid-cols-3"
        />
      )}

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

      {!run && guests.length > 0 && (
        <Part label="Who's going (optional)">
          <div className="mt-1">
            <PeoplePicker people={guests} />
          </div>
        </Part>
      )}

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
