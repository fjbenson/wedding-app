"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, ChevronRight, Printer, Utensils } from "lucide-react";
import AddButton from "@/components/add-button";
import CopyText from "@/components/copy-text";
import { formatClock } from "@/lib/dates";
import type { MenuCourseWithDishes } from "@/lib/db/menu";
import {
  addCourseAction,
  addDishAction,
  removeCourseAction,
  removeDishAction,
  updateCourseAction,
  updateDishAction,
} from "./actions";

/**
 * The menu as a printed card (canvas 3 "Food & drink · Round 1", A, owner's
 * pick 18 Oct 2026). One menu for everyone: tap a course or a dish to change
 * it, "+ Add a dish" at the foot of a course, the black + for a new course.
 * Dietary tags are V · VG · GF. Edits save with a small Save and a message.
 */
const TAGS = [
  { tag: "V", label: "Vegetarian" },
  { tag: "VG", label: "Vegan" },
  { tag: "GF", label: "Gluten-free" },
];

type Editing = { kind: "course"; id: string } | { kind: "dish"; id: string } | { kind: "new-course" } | { kind: "new-dish"; course: string } | null;

export default function MenuEditor({
  courses,
  couple,
  date,
  areaHref,
  areaLabel,
}: {
  courses: MenuCourseWithDishes[];
  couple: string;
  date: string | null;
  areaHref: string;
  areaLabel: string;
}) {
  const [editing, setEditing] = useState<Editing>(null);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  /** Runs a server action without letting it throw into React; shows its message. */
  function run(job: () => Promise<{ error?: string }>) {
    start(async () => {
      try {
        const result = await job();
        if (result.error) setMessage(result.error);
        else {
          setMessage("");
          setEditing(null);
        }
      } catch {
        setMessage("That didn't save. Try again in a moment.");
      }
    });
  }

  return (
    <main className="page pb-40 lg:max-w-[1040px]">
      <Link
        href={areaHref}
        className="inline-flex items-center gap-1.5 rounded-full bg-champagne-100 py-1.5 pl-2.5 pr-3 text-[13px] font-medium text-champagne-600 print:hidden"
      >
        <Utensils className="h-4 w-4" strokeWidth={1.6} aria-hidden />
        {areaLabel} ›
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3 print:hidden">
        <h1 className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">The menu</h1>
        <AddButton label="Add a course" onClick={() => setEditing({ kind: "new-course" })} />
      </div>

      {message && (
        <p role="alert" className="mt-4 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {message}
        </p>
      )}

      {editing?.kind === "new-course" && (
        <CourseForm
          title="New course"
          initial={{ name: "", time: "", note: "", evening: false }}
          pending={pending}
          onCancel={() => setEditing(null)}
          onSave={(v) => run(() => addCourseAction(v))}
        />
      )}

      {/* On a laptop the menu is the paper, with the caterer, print and who you're feeding beside it (owner, 23 Oct 2026). */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
      <div className="mt-4 rounded-[22px] bg-white px-5 pb-6 pt-7 shadow-[0_0_0_1px_#E3D3AE,0_18px_40px_-24px_rgb(60_50_40/0.32)]">
        <div className="text-center">
          <p className="font-display text-[26px] font-light italic leading-tight text-ink">{couple}</p>
          {date && <p className="type-meta mt-1">{date}</p>}
        </div>

        {courses.length === 0 && editing?.kind !== "new-course" && (
          <button
            type="button"
            onClick={() => setEditing({ kind: "new-course" })}
            className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl border-[1.5px] border-dashed border-champagne-500 px-4 font-display text-[16px] italic text-champagne-600"
          >
            + Add the first course
          </button>
        )}

        {courses.map((course) => (
          <section key={course.id} className="mt-5 border-t border-[#D8C9A8]/60 pt-5 text-center">
            {editing?.kind === "course" && editing.id === course.id ? (
              <CourseForm
                title="Change this course"
                initial={{
                  name: course.name,
                  time: course.serve_time?.slice(0, 5) ?? "",
                  note: course.note ?? "",
                  evening: course.evening,
                }}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSave={(v) => run(() => updateCourseAction(course.id, v))}
                onRemove={() => run(() => removeCourseAction(course.id))}
              />
            ) : (
              <button type="button" onClick={() => setEditing({ kind: "course", id: course.id })} className="block w-full">
                <span className="label block tracking-[0.22em]">{course.name}</span>
                <span className="mt-0.5 block text-[12px] tabular-nums text-stone">
                  {[course.serve_time && formatClock(course.serve_time), course.note, course.evening && "evening guests join"]
                    .filter(Boolean)
                    .join(" · ") || "Add a time"}
                </span>
              </button>
            )}

            <ul className="mt-2">
              {course.dishes.map((dish) => (
                <li key={dish.id}>
                  {editing?.kind === "dish" && editing.id === dish.id ? (
                    <DishForm
                      initial={{ name: dish.name, tags: dish.tags, instead: dish.instead ?? "" }}
                      pending={pending}
                      onCancel={() => setEditing(null)}
                      onSave={(v) => run(() => updateDishAction(dish.id, v))}
                      onRemove={() => run(() => removeDishAction(dish.id))}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing({ kind: "dish", id: dish.id })}
                      className="row-press mt-2 block w-full"
                    >
                      <span className="font-display text-[19px] font-light leading-snug text-ink">
                        {dish.name}
                        {dish.tags.length > 0 && (
                          <span className="ml-1 font-body text-[11px] tracking-[0.04em] text-champagne-600">{dish.tags.join(" ")}</span>
                        )}
                      </span>
                      {dish.instead && <span className="mt-0.5 block text-[13px] italic text-stone">{dish.instead}</span>}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {editing?.kind === "new-dish" && editing.course === course.id ? (
              <DishForm
                initial={{ name: "", tags: [], instead: "" }}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSave={(v) => run(() => addDishAction(course.id, v))}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing({ kind: "new-dish", course: course.id })}
                className="mt-3 min-h-10 text-[14px] text-champagne-600 hover:text-ink print:hidden"
              >
                + Add a dish
              </button>
            )}
          </section>
        ))}
      </div>

      <div className="lg:sticky lg:top-6">
      {courses.length > 0 && (
        <div className="mt-4 flex items-center gap-2 lg:flex-col lg:items-stretch print:hidden">
          <div className="flex-1 rounded-full bg-ink text-center text-ivory">
            <CopyText text={menuText(courses, couple, date)} label="Copy for the caterer" buttonClassName="w-full justify-center px-4 !text-ivory" />
          </div>
          <PrintMenu />
        </div>
      )}

      <Link
        href={`${areaHref}#guests`}
        className="glass-card mt-4 flex items-center gap-3 rounded-[22px] px-4 py-3.5 print:hidden"
      >
        <span className="min-w-0 flex-1">
          <span className="type-item block text-[15px]">Who you&apos;re feeding</span>
          <span className="mt-0.5 block text-[13px] text-stone">Numbers, meal choices and dietary needs</span>
        </span>
        <ChevronRight className="h-4 w-4 text-stone" strokeWidth={1.8} aria-hidden />
      </Link>
      </div>
      </div>
    </main>
  );
}

function PrintMenu() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-sm text-ink shadow-[0_0_0_0.5px_rgb(60_50_40/0.18)]"
    >
      <Printer className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      Print the menu
    </button>
  );
}

/** The menu as plain text for an email to the caterer. */
function menuText(courses: MenuCourseWithDishes[], couple: string, date: string | null): string {
  const lines = [`Menu — ${couple}${date ? `, ${date}` : ""}`, ""];
  for (const c of courses) {
    const when = [c.serve_time && formatClock(c.serve_time), c.note, c.evening && "evening guests join"].filter(Boolean).join(", ");
    lines.push(`${c.name.toUpperCase()}${when ? ` (${when})` : ""}`);
    for (const d of c.dishes) {
      lines.push(`- ${d.name}${d.tags.length ? ` (${d.tags.join(", ")})` : ""}`);
      if (d.instead) lines.push(`  ${d.instead}`);
    }
    lines.push("");
  }
  lines.push("V vegetarian · VG vegan · GF gluten-free");
  return lines.join("\n");
}

const FIELD =
  "h-11 w-full rounded-xl border border-linen bg-ivory px-3 text-[16px] text-ink placeholder:text-stone/70 focus:border-champagne-500 focus:outline-none";

function CourseForm({
  title,
  initial,
  pending,
  onSave,
  onCancel,
  onRemove,
}: {
  title: string;
  initial: { name: string; time: string; note: string; evening: boolean };
  pending: boolean;
  onSave: (v: { name: string; time: string; note: string; evening: boolean }) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const [v, setV] = useState(initial);
  const [sure, setSure] = useState(false);
  return (
    <div className="mt-4 rounded-2xl bg-ivory p-4 text-left shadow-[0_0_0_0.5px_rgb(60_50_40/0.12)]">
      <p className="label">{title}</p>
      <input
        id="course-name"
        aria-label="Course name"
        value={v.name}
        onChange={(e) => setV({ ...v, name: e.target.value })}
        placeholder="Canapés, Wedding breakfast…"
        className={`${FIELD} mt-3`}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          id="course-time"
          aria-label="Time"
          type="time"
          value={v.time}
          onChange={(e) => setV({ ...v, time: e.target.value })}
          className={FIELD}
        />
        <input
          id="course-note"
          aria-label="Where or a note"
          value={v.note}
          onChange={(e) => setV({ ...v, note: e.target.value })}
          placeholder="On the lawn"
          className={FIELD}
        />
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-[15px]">
        <input
          type="checkbox"
          checked={v.evening}
          onChange={(e) => setV({ ...v, evening: e.target.checked })}
          className="h-5 w-5 accent-[#B8914F]"
        />
        Evening guests join for this
      </label>
      <FormButtons pending={pending} onSave={() => onSave(v)} onCancel={onCancel} onRemove={onRemove && (sure ? onRemove : () => setSure(true))} removeLabel={sure ? "Remove it and its dishes" : "Remove this course"} />
    </div>
  );
}

function DishForm({
  initial,
  pending,
  onSave,
  onCancel,
  onRemove,
}: {
  initial: { name: string; tags: string[]; instead: string };
  pending: boolean;
  onSave: (v: { name: string; tags: string[]; instead: string }) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <div className="mt-3 rounded-2xl bg-ivory p-4 text-left shadow-[0_0_0_0.5px_rgb(60_50_40/0.12)]">
      <input
        id="dish-name"
        aria-label="Dish"
        value={v.name}
        onChange={(e) => setV({ ...v, name: e.target.value })}
        placeholder="Heritage tomato and burrata"
        className={FIELD}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {TAGS.map(({ tag, label }) => {
          const on = v.tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => setV({ ...v, tags: on ? v.tags.filter((t) => t !== tag) : [...v.tags, tag] })}
              className={`flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] ${
                on ? "bg-champagne-100 font-medium text-ink shadow-[0_0_0_1.5px_#B8914F]" : "bg-white text-stone shadow-[0_0_0_0.5px_rgb(60_50_40/0.18)]"
              }`}
            >
              {on && <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
              {label}
            </button>
          );
        })}
      </div>
      <input
        id="dish-instead"
        aria-label="Something different for some guests"
        value={v.instead}
        onChange={(e) => setV({ ...v, instead: e.target.value })}
        placeholder="Vegetarians: wild mushroom wellington"
        className={`${FIELD} mt-2`}
      />
      <FormButtons pending={pending} onSave={() => onSave(v)} onCancel={onCancel} onRemove={onRemove} removeLabel="Remove this dish" />
    </div>
  );
}

function FormButtons({
  pending,
  onSave,
  onCancel,
  onRemove,
  removeLabel,
}: {
  pending: boolean;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
  removeLabel: string;
}) {
  return (
    <div className="mt-3 flex items-center gap-2">
      {onRemove && (
        <button type="button" onClick={onRemove} disabled={pending} className="mr-auto min-h-11 text-[13px] text-stone hover:text-ink">
          {removeLabel}
        </button>
      )}
      <button type="button" onClick={onCancel} className={`${onRemove ? "" : "ml-auto "}min-h-11 px-3 text-[14px] text-stone hover:text-ink`}>
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="min-h-11 rounded-full bg-ink px-5 text-[14px] font-medium text-ivory disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
