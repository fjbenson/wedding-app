import CardLink from "./card-link";
import { Check } from "lucide-react";
import DateStamp from "./date-stamp";
import TickForm from "./tick-form";
import { formatDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { markPaidAction } from "@/app/(app)/money/actions";
import type { Payment } from "@/types/db";

/**
 * One payment, laid out like every Plan row and the Hub's This week (owner,
 * 16 Oct 2026): the due date large on the left, what it's for and who it's
 * to, the amount, then the £ circle on the right — tap it to mark it paid
 * (a gold tick once paid; tap again to undo). Tap the row and its card opens
 * over the page (`plan-cards.tsx`).
 */
export default function PaymentRow({ payment: p, today, who }: { payment: Payment; today: string; who?: string | null }) {
  const paid = !!p.paid_on;
  const late = !paid && !!p.due_date && p.due_date < today;
  const sub = [paid ? `Paid ${formatDayMonth(p.paid_on!)}` : null, who].filter(Boolean);
  return (
    <li className="row-press flex items-center gap-3.5 border-b border-ink/[0.12] last:border-b-0">
      <CardLink href={`/money/payments/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 py-3">
        <DateStamp date={p.due_date ?? p.paid_on ?? null} today={today} overdue={late} done={paid} />
        <span className="min-w-0 flex-1">
          <span className={`type-item block ${paid ? "!text-stone" : ""}`}>{p.description}</span>
          {(late || sub.length > 0) && (
            <span className="type-meta mt-1 block">
              {late && <span className="text-[#9A3F2B]">Overdue{sub.length ? " · " : ""}</span>}
              {sub.join(" · ")}
            </span>
          )}
        </span>
        <span className={`type-figure shrink-0 text-[18px] ${paid ? "!text-stone" : ""}`}>{formatMoney(p.amount)}</span>
      </CardLink>
      <TickForm
        action={markPaidAction.bind(null, p.id, !paid)}
        undo={markPaidAction.bind(null, p.id, paid)}
        ticking={!paid}
        label="Marked paid"
        ariaLabel={paid ? `Mark "${p.description}" as not paid` : `Mark "${p.description}" as paid`}
        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full transition ${
          paid
            ? "bg-champagne-600 text-white"
            : "border-[1.5px] border-champagne-400 bg-white font-display text-[13px] text-champagne-600 hover:bg-champagne-100"
        }`}
      >
        {paid ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> : "£"}
      </TickForm>
    </li>
  );
}
