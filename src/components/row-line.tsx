/**
 * The grey line under every to-do, appointment and payment row — the same
 * everywhere: the Hub's This week, Plan, Money and area pages (owner,
 * 16 Oct 2026). What kind it is first ("To do", "Appointment", "To pay", or
 * "Done" / "Been" / "Paid 3 Oct"), then the one detail that helps most (an
 * appointment's day and time, who it's with or to), then the area — left
 * off where the whole list is one area. Overdue leads, in rose.
 */
export default function RowLine({
  kind,
  details = [],
  overdue = false,
  className = "",
}: {
  kind: string;
  details?: (string | null | undefined | false)[];
  overdue?: boolean;
  className?: string;
}) {
  return (
    <span className={`type-meta mt-1 block ${className}`}>
      {overdue && <span className="text-[#9A3F2B]">Overdue · </span>}
      {[kind, ...details].filter(Boolean).join(" · ")}
    </span>
  );
}
