"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { Ideas, Part, TITLE_INPUT } from "@/components/visual-form";

type Action = (formData: FormData) => void | Promise<void>;

const SHEET_IDEAS = ["Bridesmaids", "Groomsmen", "Photographer's list", "The morning", "Rehearsal"];

/**
 * A run sheet besides the main one (canvas 3 "Run sheets · Round 1", owner's
 * idea 20 Oct 2026): a name, optionally the group of guests it is for (so it
 * can be emailed to them), and — on a new one — a blank start or copies of
 * some of the main sheet's moments. A copy is its own moment.
 */
export default function SheetForm({
  action,
  sheet,
  groups,
  moments = [],
}: {
  action: Action;
  sheet?: { name: string; group_id: string | null };
  groups: { id: string; name: string; count: number }[];
  /** The main sheet's moments, to copy some of onto a new sheet. */
  moments?: { id: string; time: string; title: string }[];
}) {
  const [name, setName] = useState(sheet?.name ?? "");
  const [group, setGroup] = useState(sheet?.group_id ?? "");
  const [start, setStart] = useState<"blank" | "copy">("blank");
  const [copy, setCopy] = useState<string[]>([]);

  const radio = (on: boolean) =>
    `flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${on ? "bg-ink text-ivory" : "border-[1.5px] border-[#D8D0C4]"}`;
  const pickRow = (key: string, title: string, line: string | null) => {
    const on = group === key;
    return (
      <li key={key || "none"} className="border-b border-linen last:border-b-0">
        <button type="button" role="radio" aria-checked={on} onClick={() => setGroup(key)} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-[15px] text-ink">
          <span className="min-w-0 flex-1">
            <span className="block truncate">{title}</span>
            {line && <span className="block truncate text-[13px] text-stone">{line}</span>}
          </span>
          <span aria-hidden className={radio(on)}>
            {on && <Check className="h-3 w-3" strokeWidth={2.6} />}
          </span>
        </button>
      </li>
    );
  };

  return (
    <form action={action}>
      <input
        name="name"
        required
        autoFocus={!sheet}
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="What is it called?"
        placeholder="What is it called?"
        className={TITLE_INPUT}
      />
      {!sheet && <Ideas ideas={SHEET_IDEAS} value={name} onPick={setName} />}

      <Part label="Who is it for? (optional)">
        <input type="hidden" name="group_id" value={group} />
        <ul role="radiogroup" aria-label="Who is it for?" className="mt-2.5 overflow-hidden rounded-[22px] border-[0.5px] border-white/70 bg-white/70 shadow-[0_0_0_0.5px_rgb(60_50_40/0.06)]">
          {groups.map((g) => pickRow(g.id, `The ${g.name} group`, `${g.count} ${g.count === 1 ? "person" : "people"}`))}
          {pickRow("", "Not for a group, just a list", null)}
        </ul>
        <p className="mt-2 px-1 text-[13px] text-stone">Tied to a group, you can email them their sheet in one go. You can change it later.</p>
      </Part>

      {!sheet && moments.length > 0 && (
        <Part label="Start with">
          <input type="hidden" name="start" value={start} />
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {([
              ["blank", "A blank sheet", "Add moments yourself"],
              ["copy", "Some from The day", "Pick which to copy"],
            ] as const).map(([k, title, line]) => (
              <button
                key={k}
                type="button"
                aria-pressed={start === k}
                onClick={() => setStart(k)}
                className={`rounded-2xl px-2 py-3 text-center text-[14px] ${start === k ? "border border-champagne-600 bg-champagne-100 text-champagne-600" : "border border-linen bg-white text-ink"}`}
              >
                {title}
                <span className={`mt-0.5 block text-[12px] ${start === k ? "text-champagne-600/80" : "text-stone"}`}>{line}</span>
              </button>
            ))}
          </div>
          {start === "copy" && (
            <ul className="mt-3 overflow-hidden rounded-[22px] border-[0.5px] border-white/70 bg-white/70 shadow-[0_0_0_0.5px_rgb(60_50_40/0.06)]">
              {moments.map((m) => {
                const on = copy.includes(m.id);
                return (
                  <li key={m.id} className="border-b border-linen last:border-b-0">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => setCopy(on ? copy.filter((x) => x !== m.id) : [...copy, m.id])}
                      className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-[15px] text-ink"
                    >
                      <span className="w-11 shrink-0 text-[13px] text-champagne-600">{m.time}</span>
                      <span className="min-w-0 flex-1 truncate">{m.title}</span>
                      <span aria-hidden className={radio(on)}>
                        {on && <Check className="h-3 w-3" strokeWidth={2.6} />}
                      </span>
                    </button>
                    {on && <input type="hidden" name="copy_id" value={m.id} />}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-2 px-1 text-[13px] text-stone">A copy is its own moment, so changing one doesn&apos;t change the other.</p>
        </Part>
      )}

      <SubmitBar label={sheet ? "Save changes" : "Make the run sheet"} whenChanged={!!sheet} />
    </form>
  );
}
