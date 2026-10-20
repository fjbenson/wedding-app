import { redirect } from "next/navigation";
import { areaOptions } from "@/lib/areas";
import { moneyByArea, moneyFor, paymentArea, unscheduledBalances } from "@/lib/budget";
import { listAreas } from "@/lib/db/areas";
import { listPayments } from "@/lib/db/money";
import { listSuppliers } from "@/lib/db/suppliers";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listGuests } from "@/lib/db/contacts";
import { listContributions } from "@/lib/db/contributions";
import { listInvolved } from "@/lib/db/involved";
import { listEvents, listRsvps } from "@/lib/db/rsvps";
import { areaGuestFacts, expectedGuests, guestFactsKind } from "@/lib/area-guests";
import { mealCost, pricesOf } from "@/lib/meals";
import type { AreaDetail } from "./area-cards";
import MoneyView from "./money-view";

/** Booked first, then quotes, then in touch, then not taken. */
const STAGE_ORDER = ["booked", "quoted", "enquired", "researching", "cancelled"];

export const metadata = { title: "Money — Wedding App" };

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; tab?: string; area?: string; open?: string; month?: string; error?: string; detail?: string }>;
}) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const { q, view, tab, area, open, month, error, detail } = await searchParams;

  const [areaRows, allSuppliers, found, guests, events, rsvps, contributions, tags] = await Promise.all([
    listAreas(wedding.id),
    listSuppliers(wedding.id),
    listPayments(wedding.id),
    // For Food & drink's cost per guest: only the count leaves this page.
    listGuests(wedding.id),
    listEvents(wedding.id),
    listRsvps(wedding.id),
    listContributions(wedding.id),
    listInvolved(wedding.id),
  ]);
  const expected = expectedGuests(guests ?? [], events ?? [], rsvps ?? []);
  const allPayments = found ?? [];
  const areas = areaOptions(areaRows).map((a) => ({ ...a, budget: areaRows?.find((r) => r.key === a.key)?.budget ?? null }));
  // The area filter (`?area=<key>`, or `none` for Other): the same money,
  // narrowed to one area, so an area page's "In Money ›" lands on just it.
  const filter = area || null;
  // Money towards it, for the top card: all of it, or what's towards the filtered area.
  const towards = contributions.filter((c) => filter === null || (filter === "none" ? !c.area_key || c.area_key === "other" : c.area_key === filter));
  const inArea = (key: string | null) =>
    filter === null ? true : filter === "none" ? !key || key === "other" || !areas.some((a) => a.key === key) : key === filter;
  const shownSuppliers = allSuppliers.filter((s) => inArea(s.supplier_details?.category ?? null));
  const payments = allPayments.filter((p) => inArea(paymentArea(p, allSuppliers)));
  const picked = filter && filter !== "none" ? areas.find((a) => a.key === filter) : null;
  const name = (s: (typeof allSuppliers)[number]) =>
    s.supplier_details?.company_name ?? [s.first_name, s.last_name].filter(Boolean).join(" ");

  // What each area's money card lists. "Other" (key "") gathers anything not
  // in one of the wedding's areas, as moneyByArea does.
  const known = new Set(areas.map((a) => a.key));
  const belongs = (key: string, area: string | null) => (key ? area === key : !area || !known.has(area));
  const balances = unscheduledBalances(allSuppliers, allPayments);
  const amount = (v: number | string | null | undefined) => Number(v ?? 0) || 0;
  const detailFor = (key: string): AreaDetail => {
    const mine = allPayments.filter((p) => belongs(key, paymentArea(p, allSuppliers)));
    return {
      suppliers: allSuppliers
        .filter((s) => belongs(key, s.supplier_details?.category ?? null))
        .map((s) => ({
          id: s.id,
          name: name(s),
          status: s.supplier_details?.status ?? "enquired",
          quote: amount(s.supplier_details?.quoted_cost),
          deposit: amount(s.supplier_details?.deposit_paid),
        }))
        .sort((a, b) => STAGE_ORDER.indexOf(a.status) - STAGE_ORDER.indexOf(b.status)),
      toPay: mine.filter((p) => !p.paid_on).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")),
      paid: mine.filter((p) => !!p.paid_on).sort((a, b) => b.paid_on!.localeCompare(a.paid_on!)),
      balances: balances
        .filter((b) => belongs(key, b.supplier.supplier_details?.category ?? null))
        .map((b) => ({ supplierId: b.supplier.id, name: name(b.supplier), balance: Math.round(b.balance * 100) / 100 })),
    };
  };

  return (
    <MoneyView
      // ?tab=payments is the old link to what is now By month.
      view={view === "month" || tab === "payments" ? "month" : "area"}
      weddingDate={wedding.wedding_date}
      total={moneyFor(undefined, shownSuppliers, payments, filter === null ? (wedding.budget ?? null) : (picked?.budget ?? null))}
      byArea={moneyByArea(areas, allSuppliers, allPayments)
        .filter((a) => filter === null || (filter === "none" ? a.key === "" : a.key === filter))
        .map((a) => {
          // Food & drink: what it comes to a head (agreed, or the budget until something's agreed).
          const spend = a.committed > 0 ? a.committed : (a.budget ?? 0);
          const perHead = guestFactsKind(a.key) === "food" && expected > 0 && spend > 0 ? { amount: spend / expected, guests: expected, budgeted: a.committed === 0 } : null;
          // What the caterer's prices come to for who's coming (only counts and prices; no names).
          const row = areaRows?.find((r) => r.key === a.key);
          const facts = guestFactsKind(a.key) === "food" && row ? areaGuestFacts("food", { guests: guests ?? [], households: [], events: events ?? [], rsvps: rsvps ?? [] }) : null;
          const foodCost = facts && facts.kind === "food" ? mealCost(facts.counts, pricesOf(row!)) : null;
          return { ...a, detail: { ...detailFor(a.key), perHead, foodCost } };
        })}
      query={q?.trim() || ""}
      towards={{
        total: towards.reduce((t, c) => t + c.amount, 0),
        arrived: towards.filter((c) => c.received_on).reduce((t, c) => t + c.amount, 0),
        // Bills family are paying themselves (0023): payments with someone tagged.
        bills: payments.filter((p) => tags.payment.has(p.id)).reduce((t, p) => t + p.amount, 0),
      }}
      open={open || null}
      month={month || null}
      payments={payments}
      suppliers={allSuppliers.map((s) => ({ id: s.id, name: name(s), area: s.supplier_details?.category ?? null }))}
      areas={areas}
      area={filter}
      scope={filter === null ? null : filter === "none" ? "Other" : (picked?.label ?? filter)}
      balances={unscheduledBalances(shownSuppliers, payments).map((b) => ({
        supplierId: b.supplier.id,
        name: name(b.supplier),
        balance: Math.round(b.balance * 100) / 100,
      }))}
      ready={found !== null}
      error={error}
      detail={detail}
    />
  );
}
