"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDecor, deleteDecor, setDecorHelpers, updateDecor, type DecorFields } from "@/lib/db/decor";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";
import { SOURCES, STATUSES } from "@/lib/decor";
import type { DecorSource, DecorStatus } from "@/types/db";

/**
 * Decor's things (0027_decor.sql). The card's saves return a message rather
 * than redirecting; adding goes back to where you came from. Each finds the
 * wedding itself; row-level security and the (id, wedding_id) links stop a
 * thing pointing at another wedding's guests.
 */
type Result = { error?: string };

const done = () => {
  revalidatePath("/area/[key]", "page");
  revalidatePath("/day");
  revalidatePath("/day/decor");
};

const failed = (what: string, error: unknown): Result => {
  console.error(`${what} failed`, error);
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01" || code === "PGRST205") return { error: "Decor isn't set up yet (0027_decor.sql)." };
  return { error: `That didn't save. ${describe(error)}` };
};

const text = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);
const isStatus = (v: unknown): v is DecorStatus => STATUSES.some((s) => s.value === v);
const isSource = (v: unknown): v is DecorSource => SOURCES.some((s) => s.value === v);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/i;

/** The add screen. */
export async function saveDecorAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  // Back to the Decor page or The Day's pack list, whichever it was added from.
  const sent = text(formData.get("back"));
  const back = sent && /^\/(area\/[\w-]+|day\/decor)$/.test(sent) ? sent : "/day/decor";
  const name = text(formData.get("name"));
  if (!name) redirect(`/decor/new?back=${encodeURIComponent(back)}&error=${encodeURIComponent("It needs a name.")}`);
  const quantity = Number(text(formData.get("quantity")));
  const from = text(formData.get("from"));
  const status = formData.get("status");
  const source = formData.get("source");
  const collect = text(formData.get("collect_on"));
  const giveBack = text(formData.get("return_on"));
  const fields: DecorFields = {
    name,
    place: text(formData.get("place")),
    quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : null,
    status: isStatus(status) ? status : "to_get",
    source: isSource(source) ? source : null,
    from_contact_id: from && UUID.test(from) ? from : null,
    from_name: from === "typed" ? text(formData.get("from_name")) : null,
    collect_on: collect && ISO.test(collect) ? collect : null,
    return_on: giveBack && ISO.test(giveBack) ? giveBack : null,
    setup_names: text(formData.get("setup_names")),
    notes: text(formData.get("notes")),
  };
  const helpers = formData.getAll("member").filter((v): v is string => typeof v === "string" && UUID.test(v));
  let id: string;
  try {
    id = await createDecor(wedding.id, fields);
    if (helpers.length) await setDecorHelpers(wedding.id, id, helpers);
  } catch (error) {
    const result = failed("Adding a decor thing", error);
    redirect(`/decor/new?back=${encodeURIComponent(back)}&error=${encodeURIComponent(result.error ?? "That didn't save.")}`);
  }
  done();
  redirect(back);
}

/** One or more fields from the card, by name only. */
export async function updateDecorFieldsAction(id: string, fields: Record<string, string | null>): Promise<Result> {
  const tidy: Partial<DecorFields> = {};
  for (const [key, raw] of Object.entries(fields)) {
    const v = raw?.trim() ? raw.trim() : null;
    if (key === "name") {
      if (!v) return { error: "It needs a name." };
      tidy.name = v;
    } else if (key === "quantity") {
      const n = Number(v);
      tidy.quantity = v && Number.isInteger(n) && n > 0 ? n : null;
    } else if (key === "status") {
      if (!isStatus(v)) return { error: "That isn't a step." };
      tidy.status = v;
    } else if (key === "source") {
      tidy.source = isSource(v) ? v : null;
    } else if (key === "from_contact_id") {
      tidy.from_contact_id = v && UUID.test(v) ? v : null;
    } else if (key === "collect_on" || key === "return_on") {
      tidy[key] = v && ISO.test(v) ? v : null;
    } else if (key === "place" || key === "from_name" || key === "setup_names" || key === "notes") {
      tidy[key] = v;
    }
  }
  try {
    await updateDecor(id, tidy);
  } catch (error) {
    return failed("Changing a decor thing", error);
  }
  done();
  return {};
}

export async function setDecorHelpersAction(id: string, contactIds: string[]): Promise<Result> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "Sign in again." };
  try {
    await setDecorHelpers(wedding.id, id, contactIds.filter((c) => UUID.test(c)));
  } catch (error) {
    return failed("Changing who sets it up", error);
  }
  done();
  return {};
}

export async function removeDecorAction(id: string): Promise<Result> {
  try {
    await deleteDecor(id);
  } catch (error) {
    return failed("Removing a decor thing", error);
  }
  done();
  return {};
}
