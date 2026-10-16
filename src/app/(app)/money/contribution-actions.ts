"use server";

import { redirect } from "next/navigation";
import { createContribution, deleteContribution, updateContribution } from "@/lib/db/contributions";
import { listGuests } from "@/lib/db/contacts";
import { getCurrentWedding } from "@/lib/db/weddings";
import { todayISO } from "@/lib/dates";
import { describe } from "@/lib/errors";
import { refreshMoney } from "@/lib/jobs";
import { parseMoney } from "@/lib/money";
import { stayAfterSave } from "@/lib/return-to";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function failed(back: string, message: string, error: unknown): never {
  console.error(message, error);
  redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}&detail=${encodeURIComponent(describe(error))}`);
}

/**
 * Add or change one gift towards the wedding (who's paying for what). A
 * picked guest must be one of this wedding's guests; the database checks that
 * too (0022_contributions.sql).
 */
export async function saveContributionAction(id: string | null, formData: FormData) {
  const back = id ? `/money/contributions/${id}` : "/money/contributions/new";
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const name = text(formData, "name");
  const amount = parseMoney(formData.get("amount"));
  if (!name || amount === null) {
    redirect(`${back}?error=${encodeURIComponent("Please say who it's from and how much.")}`);
  }

  let contactId = text(formData, "contact");
  if (contactId && !(await listGuests(wedding.id)).some((g) => g.id === contactId)) contactId = null;
  const arrived = text(formData, "arrived") === "yes";
  const fields = {
    name,
    contact_id: contactId,
    amount,
    area_key: text(formData, "area"),
    received_on: arrived ? (text(formData, "received_on") ?? todayISO()) : null,
    notes: text(formData, "notes"),
  };

  try {
    if (id) await updateContribution(id, fields);
    else await createContribution(wedding.id, fields);
  } catch (error) {
    failed(back, "That didn't save.", error);
  }

  refreshMoney();
  redirect(id ? stayAfterSave(`/money/contributions/${id}`) : "/money/budget#paying");
}

export async function deleteContributionAction(id: string) {
  try {
    await deleteContribution(id);
  } catch (error) {
    failed(`/money/contributions/${id}`, "That wasn't removed.", error);
  }
  refreshMoney();
  redirect("/money/budget#paying");
}
