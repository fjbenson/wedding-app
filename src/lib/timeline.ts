import type { TimelineSources } from "@/lib/db/timeline";
import type { TimelineKind } from "@/types/db";

/**
 * One line of a timeline (canvas 3 "Timeline · Round 3", owner's pick):
 * everything with them in date order, coming up above Today, before below.
 * Put together here from what's already stored; only `comms` and `stage`
 * come from the timeline's own table.
 */
export type TimelineGroup = "comms" | "money" | "plan" | "files";

export interface TimelineItem {
  key: string;
  /** Which mark it gets. */
  mark: "call" | "meeting" | "email" | "message" | "note" | "post" | "pay" | "todo" | "appt" | "stage" | "file";
  group: TimelineGroup;
  /** Small capitals above it: "Call", "Paid", "To-do". */
  kind: string;
  date: string | null;
  title: string;
  /** A grey line under it. */
  line?: string;
  amount?: number;
  /** Above Today: still to pay, to do or go to. */
  upcoming: boolean;
  /** Ticked, paid or been. */
  done: boolean;
  /** Opens its card (`CardLink`) or the file. */
  href?: string;
  /** A timeline entry, which can be taken off. */
  entryId?: string;
  /** To-dos that came out of this call. */
  todos?: { id: string; title: string; done: boolean }[];
}

export const KIND_LABEL: Record<TimelineKind, string> = {
  call: "Call",
  meeting: "Meeting",
  email: "Email",
  message: "Message",
  note: "Note",
  save_the_date: "Save the date",
  invitation: "Invitation",
  thank_you: "Thank-you",
  stage: "Stage",
};

const HOW: Record<string, string> = { email: "Emailed", post: "Posted", hand: "By hand", text: "Texted" };

export function buildTimeline(src: TimelineSources, today: string): TimelineItem[] {
  const items: TimelineItem[] = [];
  const fromCall = new Map<string, TimelineItem["todos"]>();
  for (const t of src.todos) {
    if (!t.timeline_entry_id) continue;
    const list = fromCall.get(t.timeline_entry_id) ?? [];
    list.push({ id: t.id, title: t.title, done: t.status !== "todo" && t.status !== "in_progress" });
    fromCall.set(t.timeline_entry_id, list);
  }

  for (const e of src.entries) {
    const who = e.contact_id ? src.names[e.contact_id] : undefined;
    const sending = e.kind === "save_the_date" || e.kind === "invitation" || e.kind === "thank_you";
    const mark: TimelineItem["mark"] =
      e.kind === "stage" ? "stage" : sending ? (e.how === "email" ? "email" : "post") : (e.kind as "call" | "meeting" | "email" | "message" | "note");
    items.push({
      key: `entry:${e.id}`,
      mark,
      group: e.kind === "stage" ? "plan" : "comms",
      kind: KIND_LABEL[e.kind],
      date: e.happened_on,
      title: e.kind === "stage" ? (e.summary ?? "") : sending ? (e.how ? HOW[e.how] : "Sent") : (e.summary ?? ""),
      line: [e.kind !== "stage" && sending ? e.summary : null, who].filter(Boolean).join(" · ") || undefined,
      upcoming: e.happened_on > today,
      done: true,
      entryId: e.id,
      todos: fromCall.get(e.id),
    });
  }

  for (const p of src.payments) {
    const who = p.contact_id ? src.names[p.contact_id] : undefined;
    items.push({
      key: `pay:${p.id}`,
      mark: "pay",
      group: "money",
      kind: p.paid_on ? "Paid" : "Payment",
      date: p.paid_on ?? p.due_date,
      title: p.description,
      line: [p.paid_on ? null : p.due_date && p.due_date < today ? "Overdue" : "Still to pay", who].filter(Boolean).join(" · "),
      amount: Number(p.amount),
      upcoming: !p.paid_on,
      done: !!p.paid_on,
      href: `/money/payments/${p.id}`,
    });
  }

  for (const a of src.appointments) {
    items.push({
      key: `appt:${a.id}`,
      mark: "appt",
      group: "plan",
      kind: "Appointment",
      date: a.on_date,
      title: a.title,
      line: a.location ?? undefined,
      upcoming: a.on_date >= today,
      done: a.on_date < today,
      href: `/plan/appointments/${a.id}`,
    });
  }

  // To-dos from a call sit under it as well as on their own line.
  for (const t of src.todos) {
    const done = t.status !== "todo" && t.status !== "in_progress";
    items.push({
      key: `todo:${t.id}`,
      mark: "todo",
      group: "plan",
      kind: "To-do",
      date: done ? (t.completed_at?.slice(0, 10) ?? t.due_date) : t.due_date,
      title: t.title,
      line: !done && t.due_date && t.due_date < today ? "Overdue" : done ? "Done" : undefined,
      upcoming: !done,
      done,
      href: `/plan/${t.id}`,
    });
  }

  for (const f of src.files) {
    items.push({
      key: `file:${f.id}`,
      mark: "file",
      group: "files",
      kind: "File",
      date: f.created_at.slice(0, 10),
      title: f.name,
      line: f.kind === "contract" && f.signed ? "Signed" : undefined,
      upcoming: false,
      done: true,
    });
  }

  // Newest first on both sides of Today; undated things still to do at the top.
  return items.sort((a, b) => {
    if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
    if (!a.date || !b.date) return a.date === b.date ? 0 : a.date ? 1 : -1;
    return b.date.localeCompare(a.date);
  });
}
