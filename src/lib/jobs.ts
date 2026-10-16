/**
 * The app's jobs: plain server steps that add or change one thing, used by
 * the forms and (soon) by Your assistant, so both follow the same rules.
 *
 * Each job finds the wedding itself (`getCurrentWedding()`, the signed-in
 * person's) — there's no wedding to pass in, so nothing calling a job can
 * point it at someone else's. Row-level security still guards every query.
 * Jobs never redirect or throw: they return `{ ok: true, … }` or
 * `{ ok: false, error }`, and the caller decides what to show.
 */
import { revalidatePath } from "next/cache";
import { createContact, createHousehold } from "@/lib/db/contacts";
import { addToGroup, listGroups } from "@/lib/db/groups";
import { listStays, setGuestStay } from "@/lib/db/stays";
import { createMilestone } from "@/lib/db/milestones";
import { createPayment } from "@/lib/db/money";
import { createNote } from "@/lib/db/notes";
import { inviteGuestsToEvent, listEvents, listRsvps, setContactStatus, updateRsvp } from "@/lib/db/rsvps";
import { getCurrentWedding } from "@/lib/db/weddings";
import { todayISO } from "@/lib/dates";
import { describe } from "@/lib/errors";
import { joinRoles } from "@/lib/guest-roles";
import { splitName } from "@/lib/names";
import type { Contact, RsvpStatus } from "@/types/db";

export type JobResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; detail?: string };

const NO_WEDDING = { ok: false, error: "Your wedding couldn't be found." } as const;

/** Trims a typed value; blank means none. */
function tidy(value: string | null | undefined): string | null {
  return (value ?? "").trim() || null;
}

function isDate(value: string | null): boolean {
  return value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function failed(message: string, error: unknown): { ok: false; error: string; detail: string } {
  console.error(message, error);
  return { ok: false, error: "That didn't save.", detail: describe(error) };
}

// ── Add a guest ─────────────────────────────────────────────────────────

export interface NewGuest {
  /** "Ellen Daniels": the last word is the surname (`splitName`). */
  fullName: string;
  /** An existing household's id; or none. */
  householdId?: string | null;
  /** A new household to make and put them in (wins over `householdId`). */
  newHousehold?: string | null;
  roles?: string[];
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  isChild?: boolean;
  /** The event they're a guest of (day or evening); they go on it and every later one. */
  eventId?: string | null;
  meal?: string | null;
  diet?: string | null;
  /** Groups to put them in; ones that aren't this wedding's are ignored. */
  groupIds?: string[];
  /** A place they're staying; one that isn't this wedding's is ignored. */
  stayId?: string | null;
}

export async function addGuest(input: NewGuest): Promise<JobResult<{ id: string; note?: string }>> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;

  const { first, last } = splitName(input.fullName.trim());
  if (!first) return { ok: false, error: "Please add their name." };

  try {
    let householdId = input.householdId ?? null;
    const newHousehold = tidy(input.newHousehold);
    if (newHousehold) householdId = (await createHousehold({ weddingId: wedding.id, name: newHousehold })).id;

    const role = joinRoles(input.roles ?? []);
    const fields = {
      household_id: householdId,
      // Anyone with a job on the day counts as the bridal party (the plan's filter).
      contact_type: role ? ("bridal_party" as const) : ("guest" as const),
      role_on_the_day: role,
      first_name: first,
      last_name: last,
      email: tidy(input.email),
      phone: tidy(input.phone),
      notes: tidy(input.notes),
      is_child: Boolean(input.isChild),
    };

    let created: Contact;
    try {
      created = await createContact({ wedding_id: wedding.id, ...fields });
    } catch (error) {
      // Until 0004_guest_roles.sql is run in Supabase the column isn't there;
      // save everything else rather than fail.
      if ((error as { code?: string }).code !== "PGRST204") throw error;
      const { role_on_the_day: _unsaved, ...rest } = fields;
      created = await createContact({ wedding_id: wedding.id, ...rest } as Parameters<typeof createContact>[0]);
    }

    // On the event they're a guest of and every one after it — a day guest
    // is at the evening too; an evening guest only that.
    if (input.eventId) {
      const events = await listEvents(wedding.id);
      const from = events.findIndex((e) => e.id === input.eventId);
      for (const event of from === -1 ? [] : events.slice(from)) {
        await inviteGuestsToEvent(wedding.id, event.id, [created]);
      }
      // Meal and allergies go on their own event's answer (where the guest
      // card keeps them).
      const meal = tidy(input.meal);
      const diet = tidy(input.diet);
      if (from !== -1 && (meal || diet)) {
        const own = (await listRsvps(wedding.id, { eventId: events[from].id })).find(
          (r) => r.contact_id === created.id,
        );
        if (own) await updateRsvp(own.id, { meal_choice: meal, dietary_notes: diet });
      }
    }

    // Groups and a place to stay come after the guest exists. If either fails
    // the guest is still added, and the caller says so.
    let note: string | undefined;
    try {
      const groupIds = [...new Set(input.groupIds ?? [])];
      if (groupIds.length > 0) {
        const mine = new Set((await listGroups(wedding.id)).map((g) => g.id));
        for (const id of groupIds.filter((g) => mine.has(g))) await addToGroup(wedding.id, id, created.id);
      }
      if (input.stayId) {
        const mine = (await listStays(wedding.id)).some((s) => s.id === input.stayId);
        if (mine) await setGuestStay(created.id, "yes", input.stayId);
      }
    } catch (error) {
      console.error("adding guest to groups or a stay failed", error);
      note = "Added, but not to their group or place to stay. Do that on their card.";
    }

    revalidatePath("/people");
    return { ok: true, id: created.id, note };
  } catch (error) {
    return failed("adding guest failed", error);
  }
}

// ── A guest's answer ────────────────────────────────────────────────────

const ANSWERS: RsvpStatus[] = ["to_invite", "pending", "attending", "declined"];

/** To invite, Invited, Coming or Can't come — set on every event they're on. */
export async function setGuestAnswer(guestId: string, status: RsvpStatus): Promise<JobResult> {
  if (!ANSWERS.includes(status)) return { ok: false, error: "That isn't an answer." };
  try {
    await setContactStatus(guestId, status);
  } catch (error) {
    return failed("saving answer failed", error);
  }
  revalidatePath("/people");
  return { ok: true };
}

// ── Add a to-do ─────────────────────────────────────────────────────────

export interface NewTodo {
  title: string;
  /** yyyy-mm-dd, or none. */
  dueDate?: string | null;
  /** An area's key ("photos"), "other", or none. */
  area?: string | null;
  notes?: string | null;
}

export async function addTodo(input: NewTodo): Promise<JobResult<{ id: string }>> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;

  const title = tidy(input.title);
  if (!title) return { ok: false, error: "Please say what needs doing." };
  const dueDate = tidy(input.dueDate);
  if (!isDate(dueDate)) return { ok: false, error: "That date isn't right." };

  try {
    const milestone = await createMilestone({
      wedding_id: wedding.id,
      title,
      due_date: dueDate,
      remind_at: null,
      category: tidy(input.area),
      description: tidy(input.notes),
      status: "todo",
      assigned_to: null,
    });
    refreshPlan();
    return { ok: true, id: milestone.id };
  } catch (error) {
    return failed("adding to-do failed", error);
  }
}

/** Everywhere a to-do shows up. */
export function refreshPlan() {
  revalidatePath("/plan");
  revalidatePath("/");
  revalidatePath("/area/[key]", "page");
}

// ── Record a payment ────────────────────────────────────────────────────

export interface NewPayment {
  /** What it's for: "Deposit", "Wedding rings". */
  description: string;
  amount: number | null;
  /** The supplier it's to (their contact id), or none. */
  supplierId?: string | null;
  area?: string | null;
  /** yyyy-mm-dd it's due, if still to pay. */
  dueDate?: string | null;
  paid?: boolean;
  /** yyyy-mm-dd it was paid; today if paid and not given. */
  paidOn?: string | null;
  notes?: string | null;
}

export async function addPayment(input: NewPayment): Promise<JobResult> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;

  const description = tidy(input.description);
  if (!description || input.amount === null || !(input.amount >= 0)) {
    return { ok: false, error: "Please say what it's for and how much." };
  }
  const dueDate = tidy(input.dueDate);
  const paidOn = input.paid ? (tidy(input.paidOn) ?? todayISO()) : null;
  if (!isDate(dueDate) || !isDate(paidOn)) return { ok: false, error: "That date isn't right." };

  try {
    await createPayment(wedding.id, {
      description,
      amount: Math.round(input.amount * 100) / 100,
      contact_id: input.supplierId ?? null,
      area_key: tidy(input.area),
      due_date: dueDate,
      paid_on: paidOn,
      notes: tidy(input.notes),
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "PGRST204" || code === "PGRST205" || code === "42P01") {
      console.error("adding payment failed", error);
      return { ok: false, error: "That didn't save.", detail: "Run supabase/migrations/0006_money.sql in Supabase first." };
    }
    return failed("adding payment failed", error);
  }
  refreshMoney();
  return { ok: true };
}

/** Everywhere money shows. */
export function refreshMoney() {
  revalidatePath("/money");
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/area/[key]", "page");
}

// ── Save a note ─────────────────────────────────────────────────────────

export interface NewNote {
  body?: string | null;
  url?: string | null;
  /** Filed under an area's key, or left to sort. */
  area?: string | null;
}

export async function addNote(input: NewNote): Promise<JobResult> {
  const wedding = await getCurrentWedding();
  if (!wedding) return NO_WEDDING;

  const body = tidy(input.body);
  let url = tidy(input.url);
  // A bare "example.com" pasted without https:// still makes a working link.
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (!body && !url) return { ok: false, error: "Write something or paste a link." };

  try {
    await createNote(wedding.id, { body, url, area_key: tidy(input.area) });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "PGRST205" || code === "42P01") {
      console.error("saving note failed", error);
      return { ok: false, error: "That didn't save.", detail: "Run supabase/migrations/0008_notes.sql in Supabase first." };
    }
    return failed("saving note failed", error);
  }
  revalidatePath("/inbox");
  revalidatePath("/area/[key]", "page");
  revalidatePath("/", "layout");
  return { ok: true };
}
