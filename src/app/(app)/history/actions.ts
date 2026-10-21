"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMilestones } from "@/lib/db/milestones";
import { createEntry, deleteEntry, loadTimeline, type TimelineScope } from "@/lib/db/timeline";
import { getCurrentWedding } from "@/lib/db/weddings";
import { todayISO } from "@/lib/dates";
import { buildTimeline, type TimelineItem } from "@/lib/timeline";
import type { TimelineKind } from "@/types/db";

const UUID = /^[0-9a-f-]{36}$/i;
const AREA = /^[a-z0-9-]{1,60}$/;

/** "supplier:<id>", "guest:<id>", "household:<id>" or "area:<key>" → a scope. */
export async function parseScope(value: string): Promise<TimelineScope | null> {
  const [kind, id] = value.split(":");
  if (kind === "area") return AREA.test(id ?? "") ? { area: id } : null;
  if (!UUID.test(id ?? "")) return null;
  if (kind === "supplier") return { supplier: id };
  if (kind === "guest") return { guest: id };
  if (kind === "household") return { household: id };
  return null;
}

/** A card's timeline, already in order. Never throws into the card. */
export async function timelineAction(scope: string): Promise<{ items: TimelineItem[]; today: string; error?: string }> {
  const today = todayISO();
  try {
    const wedding = await getCurrentWedding();
    const parsed = await parseScope(scope);
    if (!wedding || !parsed) return { items: [], today };
    return { items: buildTimeline(await loadTimeline(wedding.id, parsed), today), today };
  } catch (error) {
    console.error("loading a timeline failed", error);
    return { items: [], today, error: "The history didn't load." };
  }
}

export async function removeEntryAction(id: string): Promise<{ error?: string }> {
  if (!UUID.test(id)) return { error: "That isn't there any more." };
  try {
    await deleteEntry(id);
  } catch (error) {
    console.error("removing a timeline entry failed", error);
    return { error: "That didn't come off." };
  }
  revalidatePath("/", "layout");
  return {};
}

const KINDS: TimelineKind[] = ["call", "meeting", "email", "message", "note"];

/** Add to history (a full screen): the entry, then any to-dos that came out of it. */
export async function saveEntryAction(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const back = get("back").startsWith("/") && !get("back").startsWith("//") ? get("back") : "/";
  const fail = (message: string) => {
    const sep = get("self").includes("?") ? "&" : "?";
    redirect(`${get("self") || "/history/new"}${sep}error=${encodeURIComponent(message)}`);
  };
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  const scope = await parseScope(get("with"));
  const kind = get("kind") as TimelineKind;
  if (!scope || !KINDS.includes(kind)) return fail("Pick what it was: a call, a meeting…");
  const summary = get("summary");
  if (!summary) return fail("Add a line about what was said.");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(get("date")) ? get("date") : todayISO();
  const area = get("area");

  try {
    const id = await createEntry(wedding.id, {
      kind,
      summary,
      happened_on: date,
      contact_id: "supplier" in scope ? scope.supplier : "guest" in scope ? scope.guest : null,
      household_id: "household" in scope ? scope.household : null,
      area_key: "area" in scope ? scope.area : AREA.test(area) ? area : null,
    });
    const titles = formData.getAll("todo").map((t) => String(t).trim());
    const dates = formData.getAll("todo_date").map((d) => String(d));
    const todos = titles
      .map((title, i) => ({ title, due_date: /^\d{4}-\d{2}-\d{2}$/.test(dates[i] ?? "") ? dates[i] : null }))
      .filter((t) => t.title);
    if (todos.length) {
      await createMilestones(
        todos.map((t) => ({
          wedding_id: wedding.id,
          title: t.title,
          description: null,
          category: AREA.test(area) ? area : null,
          due_date: t.due_date,
          remind_at: null,
          status: "todo" as const,
          assigned_to: null,
          timeline_entry_id: id,
        })),
      );
    }
  } catch (error) {
    console.error("adding to the timeline failed", error);
    return fail("That didn't save. Please try again.");
  }
  revalidatePath("/", "layout");
  redirect(back);
}
