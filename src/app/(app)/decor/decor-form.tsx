"use client";

import { useState } from "react";
import { Circle, CircleCheck, CircleDashed, Hash, NotebookPen, UserRound, Users } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { BARE, CARD, DateCard, Folded, Ideas, Line, Part, TITLE_INPUT, Tiles } from "@/components/visual-form";
import { goesBack, SOURCES, STATUSES } from "@/lib/decor";
import type { DecorSource } from "@/types/db";
import PeoplePicker from "../people/people-picker";
import { saveDecorAction } from "./actions";
import { FromSelect, PlacePicker, SOURCE_ICONS } from "./decor-bits";
import type { DecorPerson } from "./decor-people";

const IDEAS = ["Jam jars", "Tea lights", "Easel for the table plan", "Table numbers", "Welcome sign", "Guest book and pen", "Fairy lights"];

/** Adding a decor thing: its name large, then where it goes, where it's at, where it's from, dates and who sets it up. */
export default function DecorForm({
  people,
  back,
  place: startPlace,
  weddingDate,
}: {
  people: DecorPerson[];
  back: string;
  place: string;
  weddingDate: string | null;
}) {
  const [name, setName] = useState("");
  const [place, setPlace] = useState(startPlace);
  const [source, setSource] = useState<DecorSource | "">("");
  const [from, setFrom] = useState("");
  const [collect, setCollect] = useState("");
  const [giveBack, setGiveBack] = useState("");
  const returns = goesBack({ source: source || null, return_on: giveBack || null });

  return (
    <form action={saveDecorAction}>
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="place" value={place} />
      <input
        name="name"
        required
        autoFocus
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="What it is"
        placeholder="e.g. Jam jars"
        className={TITLE_INPUT}
      />
      <Ideas ideas={IDEAS} value={name} onPick={setName} />

      <div className={`${CARD} mt-5`}>
        <Line icon={Hash} label="How many">
          <input name="quantity" type="number" min={1} inputMode="numeric" placeholder="How many (optional)" className={BARE} />
        </Line>
      </div>

      <Part label="Where it goes">
        <PlacePicker value={place} onChange={setPlace} />
      </Part>

      <Part label="Where it's at">
        <Tiles
          name="status"
          defaultValue="to_get"
          columns="grid-cols-3"
          options={STATUSES.filter((s) => s.value !== "returned").map((s) => ({
            value: s.value,
            label: s.label,
            icon: s.value === "to_get" ? CircleDashed : s.value === "got" ? Circle : CircleCheck,
          }))}
        />
      </Part>

      <Part label="Where it's from">
        <Tiles
          name="source"
          value={source}
          onChange={(v) => setSource(v as DecorSource)}
          columns="grid-cols-3 sm:grid-cols-5"
          options={SOURCES.map((s) => ({ value: s.value, label: s.label, icon: SOURCE_ICONS[s.value] }))}
        />
        {source && source !== "own" && source !== "made" && (
          <div className={CARD}>
            <Line icon={UserRound} label="Who it's from">
              <input type="hidden" name="from" value={from} />
              <FromSelect people={people} value={from} onChange={setFrom} className={`${BARE} cursor-pointer appearance-none`} />
            </Line>
            {from === "typed" && (
              <Line icon={UserRound} label="Their name">
                <input name="from_name" type="text" placeholder="e.g. Auntie Jo" className={BARE} />
              </Line>
            )}
          </div>
        )}
      </Part>

      <Part label="Collect it">
        <DateCard name="collect_on" value={collect} onChange={setCollect} weddingDate={weddingDate} quick={false} />
      </Part>
      {returns && (
        <Part label="Give it back">
          <DateCard name="return_on" value={giveBack} onChange={setGiveBack} weddingDate={weddingDate} quick={false} />
        </Part>
      )}

      <Part label="Who sets it up">
        <div className="mt-3">
          <PeoplePicker people={people.map((p) => ({ id: p.id, name: p.name, note: p.kind === "supplier" ? "Supplier" : undefined }))} />
        </div>
        <div className={CARD}>
          <Line icon={Users} label="Anyone not on the list">
            <input name="setup_names" type="text" placeholder="Anyone not on the list" className={BARE} />
          </Line>
        </div>
      </Part>

      <Folded label="Add notes">
        <Part label="Notes">
          <div className={CARD}>
            <Line icon={NotebookPen} label="Notes" top>
              <textarea name="notes" rows={3} placeholder="e.g. Ask Jo for the clips too" className={`${BARE} resize-none`} />
            </Line>
          </div>
        </Part>
      </Folded>

      <SubmitBar label="Add it" />
    </form>
  );
}
