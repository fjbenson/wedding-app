"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMilestone } from "@/lib/db/milestones";
import { createNote, deleteNote, fileNote, getNote, linkNoteToMilestone, updateNote } from "@/lib/db/notes";
import { getCurrentWedding } from "@/lib/db/weddings";
import { describe } from "@/lib/errors";

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function failed(back: string, message: string, error: unknown): never {
  console.error(message, error);
  const code = (error as { code?: string }).code;
  const detail =
    code === "PGRST205" || code === "42P01" ? "Run supabase/migrations/0008_notes.sql in Supabase first." : describe(error);
  redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}&detail=${encodeURIComponent(detail)}`);
}

/** Only ever back to a page inside the app, never wherever a form says. */
function safeReturn(value: string | null): string {
  return value && /^\/[a-z0-9/_?=&%-]*$/i.test(value) && !value.startsWith("//") ? value : "/inbox";
}

function refresh() {
  revalidatePath("/inbox");
  revalidatePath("/area/[key]", "page");
  revalidatePath("/", "layout");
}

/** Quick capture (screen 35): a thought and/or a link, filed now or left for the inbox. */
export async function captureAction(formData: FormData) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");

  const body = text(formData, "body");
  let url = text(formData, "url");
  // A bare "example.com" pasted without https:// still makes a working link.
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  const back = safeReturn(text(formData, "return_to"));

  if (!body && !url) redirect(`/capture?error=${encodeURIComponent("Write something or paste a link.")}`);

  try {
    await createNote(wedding.id, { body, url, area_key: text(formData, "area") });
  } catch (error) {
    failed("/capture", "That didn't save.", error);
  }

  refresh();
  redirect(`${back}${back.includes("?") ? "&" : "?"}captured=1`);
}

/** Files an inbox item under an area. */
export async function fileNoteAction(noteId: string, formData: FormData) {
  try {
    await fileNote(noteId, text(formData, "area"));
  } catch (error) {
    failed("/inbox", "That didn't file it.", error);
  }
  refresh();
}

/** Turns a capture into a to-do (the brief: "sorted into areas or turned into tasks"). */
export async function noteToTodoAction(noteId: string) {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/");
  try {
    const note = await getNote(noteId);
    if (!note) return;
    const title = (note.body ?? note.url ?? "").split("\n")[0].slice(0, 120);
    await createMilestone({
      wedding_id: wedding.id,
      title,
      description: [note.body, note.url].filter(Boolean).join("\n\n") || null,
      category: note.area_key,
      due_date: null,
      status: "todo",
      remind_at: null,
      assigned_to: null,
    });
    await deleteNote(noteId);
  } catch (error) {
    failed("/inbox", "That didn't make a to-do.", error);
  }
  refresh();
  revalidatePath("/plan");
}

export async function deleteNoteAction(noteId: string) {
  try {
    await deleteNote(noteId);
  } catch (error) {
    failed("/inbox", "That didn't remove it.", error);
  }
  refresh();
}

/*
 * The inbox's note wall (canvas 2, "Inbox · Sticky-note wall", option A):
 * a tapped note opens a panel, and these are called straight from it. They
 * return a message rather than redirecting or throwing, so a failure shows
 * on the panel instead of blanking the screen.
 */
type Result = { error?: string };

async function attempt(message: string, work: () => Promise<unknown>): Promise<Result> {
  try {
    await work();
  } catch (error) {
    console.error(message, error);
    return { error: message };
  }
  refresh();
  return {};
}

/** Tags a note with an area (it stays on the wall too); an empty area un-files it. */
export async function fileInboxNoteAction(noteId: string, areaKey: string): Promise<Result> {
  return attempt("That didn't file it. Try again.", () => fileNote(noteId, areaKey || null));
}

/**
 * Makes a note into a to-do: "Done by" a date, "Start around" one (a nudge,
 * src/lib/plan.ts), or no date yet. The note stays on the wall with a "To-do"
 * tag that opens it (owner, 11 Oct 2026) — or, until 0014_note_todo.sql is
 * run, is removed as before. Returns the new to-do's id so the wall can say
 * where it went.
 */
export async function inboxNoteToTodoAction(
  noteId: string,
  when: { kind: "due" | "start" | "none"; date: string | null },
): Promise<Result & { milestoneId?: string }> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { error: "Couldn't find your wedding. Reload the page." };
  const date = when.kind !== "none" && when.date && /^\d{4}-\d{2}-\d{2}$/.test(when.date) ? when.date : null;
  if (when.kind !== "none" && !date) return { error: "Pick a date, or choose No date." };

  let milestoneId: string | undefined;
  const result = await attempt("That didn't make a to-do. Try again.", async () => {
    const note = await getNote(noteId);
    if (!note) return;
    const milestone = await createMilestone({
      wedding_id: wedding.id,
      title: (note.body ?? note.url ?? "").split("\n")[0].slice(0, 120),
      description: [note.body, note.url].filter(Boolean).join("\n\n") || null,
      category: note.area_key,
      due_date: when.kind === "due" ? date : null,
      status: "todo",
      remind_at: when.kind === "start" ? date : null,
      assigned_to: null,
    });
    milestoneId = milestone.id;
    if (!(await linkNoteToMilestone(noteId, milestone.id))) await deleteNote(noteId);
  });
  if (result.error) return result;
  revalidatePath("/plan");
  return { milestoneId };
}

/** Changes a note's words; a link it was captured with stays. Emptying both removes it. */
export async function saveInboxNoteAction(noteId: string, body: string, url: string | null): Promise<Result> {
  const text = body.trim() || null;
  return attempt("That didn't save. Try again.", () =>
    text || url ? updateNote(noteId, { body: text, url }) : deleteNote(noteId),
  );
}

export async function removeInboxNoteAction(noteId: string): Promise<Result> {
  return attempt("That wasn't removed. Try again.", () => deleteNote(noteId));
}
