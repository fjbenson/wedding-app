import { Calendar, TriangleAlert } from "lucide-react";

type Tile = {
  pick: "overdue" | "todos" | "appointments" | "undated";
  /** The whole plan. */
  value: number;
  /** The month in view; null where there's no month (No date). */
  month: number | null;
};

const LABELS = { overdue: "Overdue", todos: "To-dos open", appointments: "Appointments", undated: "No date" } as const;
const ICONS = {
  overdue: <TriangleAlert className="h-3 w-3" strokeWidth={2.2} aria-hidden />,
  todos: <span aria-hidden className="h-[9px] w-[9px] rounded-full border-[1.6px] border-current" />,
  appointments: <Calendar className="h-3 w-3" strokeWidth={2.2} aria-hidden />,
  undated: null,
} as const;

/**
 * Where the plan stands, on a laptop, at the top of both the Calendar and the
 * List so the search row sits in the same place in each (owner, 24 Oct 2026;
 * canvas 5 "The tiles", B): the whole plan's figure large with "total", then
 * the month in view small after a line. Tapping one picks it (the calendar
 * lights up its things, the list narrows to them); again to clear. No date has
 * no month, so one figure.
 */
export default function PlanTiles({
  tiles,
  monthName,
  active,
  onPick,
}: {
  tiles: Tile[];
  monthName: string;
  active: string | null;
  onPick: (pick: Tile["pick"]) => void;
}) {
  return (
    <section aria-label="Where the plan stands" className="mb-4 hidden grid-cols-4 gap-3 room-md:grid">
      {tiles.map((t) => {
        const label = LABELS[t.pick];
        const on = t.pick === active;
        const late = t.pick === "overdue" && t.value > 0;
        const faint = t.pick === "undated";
        const tone = on
          ? "border-[0.5px] border-[#E3D3B3] bg-[#F1E7D4]"
          : late
            ? "border-[0.5px] border-[#E8C2B9] bg-[#FBEDEA] hover:bg-[#F8E3DE]"
            : faint
              ? "border border-dashed border-[#D8C7A4] bg-white/30 hover:bg-white/60"
              : "border-[0.5px] border-linen bg-white/70 shadow-[0_10px_24px_-18px_rgb(60_50_40/0.4)] hover:bg-white";
        return (
          <button
            key={label}
            type="button"
            disabled={t.value === 0}
            aria-pressed={faint ? undefined : on}
            onClick={() => onPick(t.pick)}
            className={`rounded-[18px] px-[18px] py-3.5 text-left transition disabled:cursor-default ${tone}`}
          >
            {/* Overdue carries the warning sign as well as the rose, never colour alone. */}
            <span className={`type-meta flex items-center gap-2 ${late ? "!text-[#9A3F2B]" : ""}`}>
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
                  late ? "bg-[#F6D9D2] text-[#9A3F2B]" : faint ? "border border-dashed border-[#B8A27A]" : "bg-champagne-100 text-champagne-600"
                }`}
              >
                {ICONS[t.pick]}
              </span>
              {label}
            </span>
            <span className="mt-3 flex items-baseline gap-3">
              <span className={`type-figure text-[40px] leading-none ${late ? "text-[#9A3F2B]" : faint ? "text-stone" : on ? "text-[#6E5120]" : "text-ink"}`}>{t.value}</span>
              {t.month !== null && (
                <>
                  <span className={`text-sm ${late ? "text-[#9A3F2B]" : "text-stone"}`}>total</span>
                  <span aria-hidden className={`my-[5px] w-px self-stretch ${late ? "bg-[#E8C2B9]" : "bg-[#D8C7A4]"}`} />
                  <span className={`type-figure text-[32px] leading-none ${late ? "text-[#9A3F2B]" : "text-champagne-600"}`}>{t.month}</span>
                  <span className={`text-sm ${late ? "text-[#9A3F2B]" : "text-stone"}`}>in {monthName}</span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </section>
  );
}
