import { daysUntil, formatLongDate } from "@/lib/dates";

/** The couple's name, the date, and how many days to go. */
export default function HomeHeader({
  name,
  weddingDate,
}: {
  name: string;
  weddingDate: string | null;
}) {
  const days = weddingDate ? daysUntil(weddingDate) : null;
  const countdown =
    days === null
      ? null
      : days > 1
        ? `${days} days to go`
        : days === 1
          ? "Tomorrow"
          : days === 0
            ? "Today"
            : "Married";

  return (
    <header>
      <p className="label">Your wedding</p>
      <h1 className="mt-3 text-4xl leading-tight text-ink">{name}</h1>
      <p className="mt-2 text-base text-stone">
        {weddingDate ? formatLongDate(weddingDate) : "No date set yet"}
      </p>
      {countdown && <p className="mt-1 text-base text-ink">{countdown}</p>}
    </header>
  );
}
