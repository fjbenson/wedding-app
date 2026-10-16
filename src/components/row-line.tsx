/**
 * The grey line under every to-do, appointment and payment row — the same
 * everywhere: the Hub's This week, Plan, Money and area pages. Short, at
 * most two facts (owner, 16 Oct 2026; the mark on the right already says
 * what kind it is): a status only when something's off or finished
 * ("Overdue" in rose, "Done", "Been", "Paid 3 Oct", "Start now"), then for
 * appointments the day and time, then who it's with or paid to — or, when
 * there's no one, the area (left off where the whole list is one area).
 */
export default function RowLine({
  status,
  details = [],
  overdue = false,
  className = "",
}: {
  status?: string | null;
  details?: (string | null | undefined | false)[];
  overdue?: boolean;
  className?: string;
}) {
  const text = [status, ...details].filter(Boolean).join(" · ");
  if (!overdue && !text) return null;
  return (
    <span className={`type-meta mt-1 block ${className}`}>
      {overdue && <span className="text-[#9A3F2B]">Overdue{text ? " · " : ""}</span>}
      {text}
    </span>
  );
}
