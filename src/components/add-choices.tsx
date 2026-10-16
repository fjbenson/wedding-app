import { CalendarDays, CircleCheck, HandCoins, PiggyBank, PoundSterling } from "lucide-react";
import type { AddChoice } from "./add-menu";

/**
 * What the round black + offers on Plan and Money (owner, 16 Oct 2026: pick
 * the kind first, then its form). Shared by every + that adds to them, so
 * they always offer the same. `area` / `date` carry through to the form.
 */
export function planChoices({ area, date }: { area?: string; date?: string } = {}): AddChoice[] {
  const q = new URLSearchParams();
  if (area) q.set("area", area);
  if (date) q.set("date", date);
  const tail = q.size ? `?${q}` : "";
  return [
    { icon: <CircleCheck />, title: "A to-do", line: "Something to get done", href: `/plan/new${tail}` },
    { icon: <CalendarDays />, title: "An appointment", line: "Somewhere to be, at a time", href: `/plan/appointments/new${tail}` },
  ];
}

export function moneyChoices({ area }: { area?: string } = {}): AddChoice[] {
  const tail = area ? `?area=${encodeURIComponent(area)}` : "";
  return [
    { icon: <PoundSterling />, title: "A payment", line: "Something to pay, or already paid", href: `/money/payments/new${tail}` },
    { icon: <PiggyBank />, title: "A budget", line: "For the wedding or an area", href: `/money/budget/new${tail}` },
    { icon: <HandCoins />, title: "Money towards it", line: "From family, or what you're putting in", href: "/money/contributions/new" },
  ];
}
