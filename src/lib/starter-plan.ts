/**
 * The usual wedding to-dos, each dated a set number of days before the day.
 * Offered once, on an empty timeline, so a couple doesn't start from a blank
 * page. Everything added is an ordinary to-do they can change or remove.
 */
const STARTER_PLAN: { title: string; daysBefore: number; area: string | null }[] = [
  { title: "Set the budget", daysBefore: 450, area: null },
  { title: "Book the venue", daysBefore: 420, area: "venue" },
  { title: "Draw up the guest list", daysBefore: 390, area: "guests" },
  { title: "Book the photographer", daysBefore: 360, area: "photography" },
  { title: "Send save-the-dates", daysBefore: 270, area: "guests" },
  { title: "Choose the outfits", daysBefore: 240, area: "attire" },
  { title: "Book the florist", daysBefore: 240, area: "flowers" },
  { title: "Book the band or DJ", daysBefore: 210, area: "music" },
  { title: "Order the cake", daysBefore: 150, area: "cake" },
  { title: "Send the invitations", daysBefore: 90, area: "guests" },
  { title: "Chase the last RSVPs", daysBefore: 42, area: "guests" },
  { title: "Give the venue final numbers", daysBefore: 21, area: "venue" },
  { title: "Plan the order of the day", daysBefore: 14, area: null },
  { title: "Final outfit fitting", daysBefore: 14, area: "attire" },
];

/**
 * The starter to-dos for a wedding on `weddingDate` (or undated if there's
 * no date). A to-do whose ideal date has already passed gets no date rather
 * than piling up as overdue — the couple may well have done it already.
 */
export function starterPlan(weddingDate: string | null, today: string) {
  return STARTER_PLAN.map((item) => {
    let due: string | null = null;
    if (weddingDate) {
      const [year, month, day] = weddingDate.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day - item.daysBefore))
        .toISOString()
        .slice(0, 10);
      if (date >= today) due = date;
    }
    return { title: item.title, category: item.area, due_date: due };
  });
}
