"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import CardSheet from "@/components/card-sheet";
import ResetBoundary from "@/components/reset-boundary";
import { replaceQuery } from "@/lib/url-state";
import { toggleMilestoneAction } from "./actions";
import AppointmentForm from "./appointment-form";
import {
  loadPlanCardAction,
  removePlanCardAction,
  saveAppointmentCardAction,
  saveTodoCardAction,
  type PlanCardData,
} from "./card-actions";
import MilestoneForm from "./milestone-form";

const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

/**
 * A to-do or an appointment opens as a card over whatever page you're on —
 * the calendar, the List, the Hub's This week, an area page — like a guest
 * or a supplier (owner, 16 Oct 2026: look at something in a card, add
 * something new on a full screen). Mounted once in the (app) layout; the open
 * card lives in the address (?todo= / ?appointment=, set by `CardLink`), so
 * it survives a refresh and closing it leaves you where you were. Inside is
 * the same visual form as the edit page: Save rises once something changes,
 * and saving keeps the card open.
 */
export default function PlanCards() {
  const params = useSearchParams();
  const todo = params.get("todo");
  const appointment = params.get("appointment");
  const kind = todo ? "todo" : appointment ? "appointment" : null;
  const id = todo ?? appointment;

  const close = useCallback(() => replaceQuery({ todo: null, appointment: null }), []);
  if (!kind || !id) return null;
  return <PlanCard key={`${kind}:${id}`} kind={kind} id={id} onClose={close} />;
}

function PlanCard({ kind, id, onClose }: { kind: "todo" | "appointment"; id: string; onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<PlanCardData | null | undefined>(undefined);
  const [round, setRound] = useState(0);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    try {
      setData(await loadPlanCardAction(kind, id));
    } catch {
      setData(null);
    }
  }, [kind, id]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(t);
  }, [saved]);

  const save = async (formData: FormData) => {
    try {
      const result = kind === "todo" ? await saveTodoCardAction(id, formData) : await saveAppointmentCardAction(id, formData);
      setError(result.error);
      if (result.error) return;
      await load();
      // Drawn afresh from what's now saved, so Save sinks out of sight again.
      setRound((r) => r + 1);
      setSaved(true);
      router.refresh();
    } catch {
      setError(UNSAVED);
    }
  };

  const remove = (title: string) => {
    if (!confirm(kind === "todo" ? `Remove "${title}" from the plan?` : `Remove "${title}"?`)) return;
    startTransition(async () => {
      try {
        const result = await removePlanCardAction(kind, id);
        if (result.error) return setError(result.error);
        onClose();
        router.refresh();
      } catch {
        setError(UNSAVED);
      }
    });
  };

  const toggle = (done: boolean) =>
    startTransition(async () => {
      try {
        await toggleMilestoneAction(id, done);
        await load();
        router.refresh();
      } catch {
        setError(UNSAVED);
      }
    });

  const label = kind === "todo" ? "To-do" : "Appointment";
  const title = data ? (data.kind === "todo" ? data.milestone.title : data.appointment.title) : label;

  return (
    <CardSheet label={title} onClose={onClose} top={<span className="label">{label}</span>}>
      {data === undefined && <p className="py-10 text-center text-sm text-stone">One moment…</p>}
      {data === null && <p className="py-10 text-center text-[15px] text-stone">This isn&apos;t on the plan any more.</p>}

      {data && (
        <div className="pt-1">
          {error && (
            <p role="alert" className="mb-4 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
              {error}
            </p>
          )}

          {data.kind === "todo" && (
            <DoneButton done={data.milestone.status !== "todo" && data.milestone.status !== "in_progress"} pending={pending} onToggle={toggle} />
          )}

          <ResetBoundary>
            <div key={round}>
              {data.kind === "todo" ? (
                <MilestoneForm action={save} milestone={data.milestone} areas={data.areas} weddingDate={data.weddingDate} />
              ) : (
                <AppointmentForm
                  action={save}
                  appointment={data.appointment}
                  suppliers={data.suppliers}
                  areas={data.areas}
                  weddingDate={data.weddingDate}
                />
              )}
            </div>
          </ResetBoundary>

          <div className="mt-6 border-t border-linen pt-4 text-center">
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(title)}
              className="text-xs text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
            >
              {kind === "todo" ? "Remove from the plan" : "Remove this appointment"}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <p
          role="status"
          className="rise-in fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[60] mx-auto flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-ivory shadow-[0_10px_24px_-10px_rgb(30_27_24/0.6)]"
        >
          <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
          Saved
        </p>
      )}
    </CardSheet>
  );
}

/** Tick it off from the card: the same circle as the row's, with its word. */
function DoneButton({ done, pending, onToggle }: { done: boolean; pending: boolean; onToggle: (done: boolean) => void }) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onToggle(!done)}
      aria-pressed={done}
      className={`mb-4 flex h-11 items-center gap-2.5 rounded-full pl-1.5 pr-4 text-[15px] transition disabled:opacity-60 ${
        done ? "bg-champagne-100 text-champagne-600" : "border border-linen bg-white text-ink hover:border-champagne-400"
      }`}
    >
      <span
        className={`flex h-[30px] w-[30px] items-center justify-center rounded-full ${
          done ? "bg-champagne-600 text-white" : "border-[1.5px] border-stone/50 bg-white"
        }`}
      >
        {done && <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />}
      </span>
      {done ? "Done" : "Mark as done"}
    </button>
  );
}
