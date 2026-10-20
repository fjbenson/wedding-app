"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, FileText, Mail, MessageCircle, NotebookPen, Phone, Send, Users } from "lucide-react";
import CardLink from "@/components/card-link";
import { removeEntryAction, timelineAction } from "@/app/(app)/timeline/actions";
import { formatDayMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { TimelineGroup, TimelineItem } from "@/lib/timeline";

const GROUPS: { value: TimelineGroup | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "comms", label: "Comms" },
  { value: "money", label: "Money" },
  { value: "plan", label: "Plan" },
  { value: "files", label: "Files" },
];

/** How many of the past show before "N earlier ›". */
const SHOWN = 5;

/**
 * Everything with someone, past and to come (canvas 3 "Timeline · Round 3",
 * owner: "bloody LOVE IT"): what's coming up above a Today line, what's
 * happened below it, newest first, one mark for each kind, and chips to show
 * one kind. "+ Add" opens Add to history (a call, a meeting…).
 *
 * `scope` is "supplier:<id>", "guest:<id>", "household:<id>" or "area:<key>".
 */
export default function Timeline({
  scope,
  label = "Timeline",
  bare = false,
  only,
}: {
  scope: string;
  label?: string;
  /** Inside another card (the area page's "Everything for…"): no heading. */
  bare?: boolean;
  /** Just one kind, no chips or Add (a payment's card: every payment to them). */
  only?: TimelineGroup;
}) {
  const [items, setItems] = useState<TimelineItem[] | null>(null);
  const [today, setToday] = useState("");
  const [error, setError] = useState<string>();
  const [group, setGroup] = useState<TimelineGroup | "all">("all");
  const [all, setAll] = useState(false);
  const [here, setHere] = useState("/");
  const [n, setN] = useState(0);

  useEffect(() => {
    let live = true;
    setHere(window.location.pathname + window.location.search);
    timelineAction(scope)
      .then((r) => {
        if (!live) return;
        setItems(r.items);
        setToday(r.today);
        setError(r.error);
      })
      .catch(() => live && setError("The timeline didn't load."));
    return () => {
      live = false;
    };
  }, [scope, n]);

  const pick = only ?? group;
  const shown = (items ?? []).filter((i) => pick === "all" || i.group === pick);
  const coming = shown.filter((i) => i.upcoming);
  const before = shown.filter((i) => !i.upcoming);
  const groups = GROUPS.filter((g) => g.value === "all" || (items ?? []).some((i) => i.group === g.value));
  const addHref = `/timeline/new?with=${encodeURIComponent(scope)}&back=${encodeURIComponent(here)}`;

  const remove = async (id: string) => {
    const r = await removeEntryAction(id).catch(() => ({ error: "That didn't come off." }));
    if (r.error) setError(r.error);
    else setN((x) => x + 1);
  };

  return (
    <section className={bare ? "" : "mt-7"}>
      {!bare && (
        <div className="flex items-baseline justify-between">
          <h2 className="section-label font-body">{label}</h2>
          {!only && (
            <Link href={addHref} className="text-[14px] text-champagne-600">
              + Add
            </Link>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-[14px] text-stone">{error}</p>}
      {items === null ? (
        <p className="mt-3 text-[14px] text-stone">…</p>
      ) : only && shown.length === 0 ? (
        <p className="mt-2 text-[14px] text-stone">Nothing yet.</p>
      ) : items.length === 0 ? (
        <p className="mt-2 text-[14px] text-stone">
          Nothing yet.{" "}
          <Link href={addHref} className="text-champagne-600">
            Add a call or a note ›
          </Link>
        </p>
      ) : (
        <>
          {!only && groups.length > 2 && (
            <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {groups.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGroup(g.value)}
                  aria-pressed={group === g.value}
                  className={`h-8 shrink-0 rounded-full border px-3 text-[13px] ${
                    group === g.value ? "border-champagne-400 bg-champagne-100 text-champagne-600" : "border-linen bg-white/70 text-ink"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          <ol className="relative mt-2 pl-10 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-[1.5px] before:bg-champagne-400/50">
            {coming.length > 0 && (
              <li className="pb-1 pt-2 text-[11.5px] uppercase tracking-[0.14em] text-stone">Coming up</li>
            )}
            {coming.map((item) => (
              <Row key={item.key} item={item} upcoming onRemove={remove} />
            ))}
            {/* Today sits on the line as a dot, with its words beside it: no rules across the page to cross the line. */}
            <li className="relative py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink" aria-label="Today">
              <span aria-hidden className="absolute -left-10 top-1/2 flex w-[30px] -translate-y-1/2 justify-center">
                <span className="h-3 w-3 rounded-full bg-ink ring-[3px] ring-ivory" />
              </span>
              Today{today ? ` · ${formatDayMonth(today)}` : ""}
            </li>
            {(all ? before : before.slice(0, SHOWN)).map((item) => (
              <Row key={item.key} item={item} onRemove={remove} />
            ))}
            {before.length === 0 && <li className="py-2 text-[14px] text-stone">Nothing before today.</li>}
          </ol>
          {!all && before.length > SHOWN && (
            <button type="button" onClick={() => setAll(true)} className="mt-1 py-2 text-[14px] text-stone hover:text-ink">
              {before.length - SHOWN} earlier ›
            </button>
          )}
          {bare && (
            <Link href={addHref} className="mt-1 inline-block py-2 text-[14px] text-champagne-600">
              + Add to history
            </Link>
          )}
        </>
      )}
    </section>
  );
}

function Mark({ item, upcoming }: { item: TimelineItem; upcoming?: boolean }) {
  const icon = "h-[15px] w-[15px]";
  const inner =
    item.mark === "call" ? <Phone className={icon} strokeWidth={1.8} />
    : item.mark === "meeting" ? <Users className={icon} strokeWidth={1.8} />
    : item.mark === "email" ? <Mail className={icon} strokeWidth={1.8} />
    : item.mark === "message" ? <MessageCircle className={icon} strokeWidth={1.8} />
    : item.mark === "note" ? <NotebookPen className={icon} strokeWidth={1.8} />
    : item.mark === "post" ? <Send className={icon} strokeWidth={1.8} />
    : item.mark === "pay" ? <span className="text-[14px] font-semibold">£</span>
    : item.mark === "appt" ? <CalendarDays className={icon} strokeWidth={1.8} />
    : item.mark === "file" ? <FileText className={icon} strokeWidth={1.8} />
    : item.done ? <Check className={icon} strokeWidth={2.4} />
    : null;
  // Filled when it's happened (paid, done, booked); dashed while to come.
  const look =
    item.mark === "stage" || (item.mark === "todo" && item.done)
      ? "bg-champagne-400 text-white"
      : upcoming && (item.mark === "pay" || item.mark === "appt" || item.mark === "todo")
        ? "border-[1.5px] border-dashed border-champagne-400 bg-ivory text-champagne-600"
        : item.mark === "pay" || item.mark === "appt"
          ? "bg-champagne-100 text-champagne-600"
          : item.mark === "file"
            ? "border-[1.5px] border-linen bg-ivory text-stone"
            : "border-[1.5px] border-champagne-400 bg-ivory text-champagne-600";
  return (
    <span aria-hidden className={`absolute -left-10 top-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full ${look}`}>
      {inner}
    </span>
  );
}

function Row({ item, upcoming, onRemove }: { item: TimelineItem; upcoming?: boolean; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const overdue = item.line?.startsWith("Overdue");
  const body = (
    <>
      <span className="block text-[11.5px] font-medium uppercase tracking-[0.12em] text-champagne-600">
        {item.kind}
        {item.date ? ` · ${formatDayMonth(item.date)}` : ""}
      </span>
      <span className={`mt-0.5 block text-[15px] leading-snug ${item.done && item.mark === "todo" ? "text-stone" : "text-ink"} ${item.amount != null ? "pr-20" : ""}`}>
        {item.title}
      </span>
      {item.line && <span className={`mt-0.5 block text-[13.5px] ${overdue ? "text-[#9A3F2B]" : "text-stone"}`}>{item.line}</span>}
      {item.amount != null && <span className="absolute right-0 top-3 text-[15px] text-ink">{formatMoney(item.amount)}</span>}
    </>
  );
  return (
    <li className="relative py-2.5">
      <Mark item={item} upcoming={upcoming} />
      {item.href ? (
        <CardLink href={item.href} className="relative block">
          {body}
        </CardLink>
      ) : item.entryId && item.mark !== "stage" ? (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="relative block w-full text-left">
          {body}
        </button>
      ) : (
        <div className="relative">{body}</div>
      )}
      {item.todos && item.todos.length > 0 && (
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {item.todos.map((t) => (
            <CardLink
              key={t.id}
              href={`/plan/${t.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-1.5 pr-2.5 text-[13px] text-ink shadow-[0_0_0_1px_#E6E0D6]"
            >
              <span
                aria-hidden
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-champagne-400 ${t.done ? "bg-champagne-400 text-white" : ""}`}
              >
                {t.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
              {t.title}
            </CardLink>
          ))}
        </span>
      )}
      {open && item.entryId && (
        <button type="button" onClick={() => onRemove(item.entryId!)} className="mt-1 py-1 text-[13.5px] text-stone underline underline-offset-2 hover:text-ink">
          Take this off the timeline
        </button>
      )}
    </li>
  );
}
