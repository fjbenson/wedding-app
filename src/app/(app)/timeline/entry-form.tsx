"use client";

import { useState } from "react";
import { Mail, MessageCircle, NotebookPen, Phone, Plus, Users, X } from "lucide-react";
import { SubmitBar } from "@/components/form-bits";
import { DateCard, Part, Tiles } from "@/components/visual-form";
import { todayISO } from "@/lib/dates";
import { saveEntryAction } from "./actions";

const KINDS = [
  { value: "call", label: "Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "email", label: "Email", icon: Mail },
  { value: "message", label: "Message", icon: MessageCircle },
  { value: "note", label: "Note", icon: NotebookPen },
];

/**
 * What it was (tiles), when (today to start), what was said (a slip of
 * paper, like the notes wall), then "Anything to do?" — each line a to-do
 * that sits under it on the timeline and in Plan.
 */
export default function EntryForm({
  with: withWho,
  back,
  self,
  name,
  area,
  weddingDate,
}: {
  with: string;
  back: string;
  self: string;
  name: string;
  area: string | null;
  weddingDate: string | null;
}) {
  const [date, setDate] = useState(todayISO());
  const [todos, setTodos] = useState<{ n: number; title: string; date: string }[]>([]);
  const [next, setNext] = useState(0);
  const add = () => {
    setTodos((t) => [...t, { n: next, title: "", date: "" }]);
    setNext((n) => n + 1);
  };
  const change = (n: number, patch: Partial<{ title: string; date: string }>) =>
    setTodos((list) => list.map((t) => (t.n === n ? { ...t, ...patch } : t)));

  return (
    <form action={saveEntryAction}>
      <input type="hidden" name="with" value={withWho} />
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="self" value={self} />
      <input type="hidden" name="area" value={area ?? ""} />

      <Tiles name="kind" defaultValue="call" columns="grid-cols-5" options={KINDS} />

      <Part label="When">
        <DateCard name="date" value={date} onChange={setDate} quick={false} clearable={false} weddingDate={weddingDate} />
      </Part>

      <Part label="What was said">
        <textarea
          name="summary"
          required
          rows={4}
          placeholder="e.g. Peonies are fine in June. She wants the colour swatches."
          className="mt-3 block min-h-[130px] w-full resize-y rounded-[4px] bg-[#FFFDF8] px-5 py-4 font-display text-[17px] italic leading-snug text-ink shadow-[0_1px_2px_rgb(60_45_20/0.08),0_14px_30px_-16px_rgb(60_45_20/0.35)] placeholder:text-stone/50 focus:outline-none"
        />
      </Part>

      <Part label="Anything to do?">
        <ul className="mt-2">
          {todos.map((t) => (
            <li key={t.n} className="flex items-center gap-2 border-b border-linen py-1">
              <span aria-hidden className="h-[18px] w-[18px] shrink-0 rounded-full border-[1.5px] border-dashed border-champagne-400" />
              <input
                name="todo"
                value={t.title}
                autoFocus
                onChange={(e) => change(t.n, { title: e.target.value })}
                placeholder="e.g. Send the swatches"
                aria-label="To-do"
                className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-ink placeholder:text-stone/60 focus:outline-none"
              />
              <input
                name="todo_date"
                type="date"
                value={t.date}
                onChange={(e) => change(t.n, { date: e.target.value })}
                aria-label="By when (optional)"
                className="w-[8.5rem] shrink-0 bg-transparent text-[14px] text-stone"
              />
              <button
                type="button"
                onClick={() => setTodos((list) => list.filter((x) => x.n !== t.n))}
                aria-label="Take this to-do off"
                className="flex h-9 w-9 shrink-0 items-center justify-center text-stone hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={1.6} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={add} className="mt-2 flex items-center gap-2 py-2 text-[15px] text-champagne-600">
          <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          Add a to-do
        </button>
      </Part>

      <p className="mt-6 text-[14px] text-stone">
        With <span className="text-ink">{name}</span>
      </p>

      <SubmitBar label="Save" />
    </form>
  );
}
