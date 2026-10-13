"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { stayAfterSave } from "@/lib/return-to";
import { listAreas } from "@/lib/db/areas";
import { createPayment, deletePayment, saveBudgets, setBudget, updatePayment } from "@/lib/db/money";
import { getCurrentWedding } from "@/lib/db/weddings";
import { todayISO } from "@/lib/dates";
import { describe } from "@/lib/errors";
import { parseMoney } from "@/lib/money";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function failed(back: string, message: string, error: unknown): never {
  console.error(message, error);
  const code = (error as { code?: string }).code;
  const detail =
    code === "PGRST204" || code === "PGRST205" || code === "42P01"
      ? "Run supabase/migrations/0006_money.sql in Supabase first."
      : describe(error);
  redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}&detail=${encodeURIComponent(detail)}`);
}

/** Everywhere money shows. */
function refresh() {
  revalidatePath("/money");
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/area/[key]", "page");
}

/** The whole budget and each area's share (screen 22's "set budgets"). */
export async function saveBudgetsAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  try {
    const areas = ((await listAreas(wedding.id)) ?? []).filter((a) => a.enabled);
    await saveBudgets(
      wedding.id,
      parseMoney(formData.get("total")),
      areas.map((a) => ({ id: a.id, budget: parseMoney(formData.get(`area-${a.id}`)) })),
    );
  } catch (error) {
    failed("/money/budget", "That didn't save.", error);
  }

  refresh();
  redirect(stayAfterSave("/money/budget"));
}

/**
 * One budget from Money's + (Budget side): the whole wedding's (`for` =
 * "wedding") or one area's (`for` = its key). Lands on By area with that
 * area's money card open, so the change shows at once.
 */
export async function setBudgetAction(formData: FormData) {
  const back = "/money/budget/new";
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const target = text(formData, "for");
  const amount = parseMoney(formData.get("amount"));
  if (!target || amount === null) {
    redirect(`${back}?error=${encodeURIComponent("Please pick what it's for and say how much.")}`);
  }

  const area =
    target === "wedding" ? undefined : ((await listAreas(wedding.id)) ?? []).find((a) => a.key === target);
  if (target !== "wedding" && !area) redirect(`${back}?error=${encodeURIComponent("That area wasn't found.")}`);

  try {
    await setBudget(wedding.id, area?.id ?? null, amount);
  } catch (error) {
    failed(back, "That didn't save.", error);
  }

  refresh();
  redirect(area ? `/money?open=${encodeURIComponent(area.key)}` : "/money");
}

/** Adds a payment (paymentId null) or saves changes to one. */
export async function savePaymentAction(paymentId: string | null, formData: FormData) {
  const back = paymentId ? `/money/payments/${paymentId}` : "/money/payments/new";
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const description = text(formData, "description");
  const amount = parseMoney(formData.get("amount"));
  if (!description || amount === null) {
    redirect(`${back}?error=${encodeURIComponent("Please say what it's for and how much.")}`);
  }

  const paid = Boolean(formData.get("paid"));
  const fields = {
    description,
    amount,
    contact_id: text(formData, "supplier"),
    area_key: text(formData, "area"),
    due_date: text(formData, "due_date"),
    paid_on: paid ? (text(formData, "paid_on") ?? todayISO()) : null,
    notes: text(formData, "notes"),
  };

  try {
    if (paymentId) await updatePayment(paymentId, fields);
    else await createPayment(wedding.id, fields);
  } catch (error) {
    failed(back, "That didn't save.", error);
  }

  refresh();
  redirect(paymentId ? stayAfterSave(`/money/payments/${paymentId}`) : "/money?view=month");
}

/** The quick "paid" / "not paid after all" tap on a payment row. */
export async function markPaidAction(paymentId: string, paid: boolean) {
  try {
    await updatePayment(paymentId, { paid_on: paid ? todayISO() : null });
  } catch (error) {
    failed("/money?view=month", "That didn't change.", error);
  }
  refresh();
}

export async function deletePaymentAction(paymentId: string) {
  try {
    await deletePayment(paymentId);
  } catch (error) {
    failed(`/money/payments/${paymentId}`, "That didn't remove it.", error);
  }
  refresh();
  redirect("/money?view=month");
}
