/**
 * The usual wedding to-dos, each dated a set number of days before the day.
 * Offered once, on an empty timeline, so a couple doesn't start from a blank
 * page. Everything added is an ordinary to-do they can change or remove.
 *
 * `area` is a starter-area key (src/lib/areas.ts). Guest-list jobs have none:
 * the guest list is the People tab, not an area. `start` marks a nudge —
 * "start around" then rather than "done by" (src/lib/plan.ts) — so the plan
 * says when to begin thinking about something, not only when it's due
 * (owner's ask, 10 Oct 2026).
 */
const STARTER_PLAN: { title: string; daysBefore: number; area: string | null; start?: true }[] = [
  { title: "Start looking at venues", daysBefore: 480, area: "venue", start: true },
  { title: "Set the budget", daysBefore: 450, area: null },
  { title: "Start looking at photographers", daysBefore: 420, area: "photography", start: true },
  { title: "Book the venue", daysBefore: 420, area: "venue" },
  { title: "Draw up the guest list", daysBefore: 390, area: null },
  { title: "Book the photographer", daysBefore: 360, area: "photography" },
  { title: "Start thinking about outfits", daysBefore: 330, area: "attire", start: true },
  { title: "Start looking at florists", daysBefore: 300, area: "flowers", start: true },
  { title: "Start thinking about music", daysBefore: 270, area: "music", start: true },
  { title: "Send save-the-dates", daysBefore: 270, area: "stationery" },
  { title: "Choose the outfits", daysBefore: 240, area: "attire" },
  { title: "Book the florist", daysBefore: 240, area: "flowers" },
  { title: "Book the band or DJ", daysBefore: 210, area: "music" },
  { title: "Start thinking about the cake", daysBefore: 210, area: "cake", start: true },
  { title: "Start on the invitations", daysBefore: 150, area: "stationery", start: true },
  { title: "Order the cake", daysBefore: 150, area: "cake" },
  { title: "Send the invitations", daysBefore: 90, area: "stationery" },
  { title: "Chase the last RSVPs", daysBefore: 42, area: null },
  { title: "Give the venue final numbers", daysBefore: 21, area: "venue" },
  { title: "Plan the order of the day", daysBefore: 14, area: null },
  { title: "Final outfit fitting", daysBefore: 14, area: "attire" },
];

/**
 * The starter to-dos for a wedding on `weddingDate` (or undated if there's
 * no date). A to-do whose ideal date has already passed gets no date rather
 * than piling up as overdue — the couple may well have done it already. A
 * nudge whose moment has passed is left out for the same reason, and so is
 * every nudge when there's no date to hang it on.
 */
export function starterPlan(weddingDate: string | null, today: string) {
  return STARTER_PLAN.flatMap((item) => {
    let date: string | null = null;
    if (weddingDate) {
      const [year, month, day] = weddingDate.split("-").map(Number);
      date = new Date(Date.UTC(year, month - 1, day - item.daysBefore)).toISOString().slice(0, 10);
      if (date < today) date = null;
    }
    if (item.start && !date) return [];
    return [
      {
        title: item.title,
        category: item.area,
        due_date: item.start ? null : date,
        remind_at: item.start ? date : null,
      },
    ];
  });
}

