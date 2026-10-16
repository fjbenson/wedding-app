"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import CardSheet from "@/components/card-sheet";
import { replaceQuery } from "@/lib/url-state";
import { toggleMilestoneAction } from "./actions";
import { loadPlanCardAction, removePlanCardAction, type CardKind, type PlanCardData } from "./card-actions";
import { AppointmentBody, IdeaBody, MomentBody, PaymentBody, TodoBody } from "./plan-card-body";

const UNSAVED = "That didn't save — the app may have just been updated. Pull down to refresh, then try again.";

/**
 * A to-do, an appointment, a payment, a run sheet moment or an Inspo idea opens as a card over whatever page you're on —
 * the calendar, the List, the Hub's This week, an area page — like a guest
 * or a supplier (owner, 16 Oct 2026: look at something in a card, add
 * something new on a full screen). Mounted once in the (app) layout; the open
 * card lives in the address (?todo= / ?appointment= / ?payment= / ?moment= / ?idea=, set by `CardLink`), so
 * it survives a refresh and closing it leaves you where you were. Inside,
 * everything is changed in place (`plan-card-body.tsx`): taps save at once,
 * typing gets a small Save — the guest card's rule.
 */
export default function PlanCards() {
  const params = useSearchParams();
  const todo = params.get("todo");
  const appointment = params.get("appointment");
  const payment = params.get("payment");
  const moment = params.get("moment");
  const idea = params.get("idea");
  const kind: CardKind | null = todo
    ? "todo"
    : appointment
      ? "appointment"
      : payment
        ? "payment"
        : moment
          ? "moment"
          : idea
            ? "idea"
            : null;
  const id = todo ?? appointment ?? payment ?? moment ?? idea;

  const close = useCallback(() => replaceQuery({ todo: null, appointment: null, payment: null, moment: null, idea: null }, { sync: true }), []);
  if (!kind || !id) return null;
  return <PlanCard key={`${kind}:${id}`} kind={kind} id={id} onClose={close} />;
}

function PlanCard({ kind, id, onClose }: { kind: CardKind; id: string; onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<PlanCardData | null | undefined>(undefined);
  const [error, setError] = useState<string>();
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

  const remove = (title: string) => {
    if (!confirm(kind === "todo" ? `Remove "${title}" from the plan?` : kind === "idea" ? "Remove this from Inspo?" : `Remove "${title}"?`)) return;
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

  const label = { todo: "To-do", appointment: "Appointment", payment: "Payment", moment: "On the day", idea: "Inspo" }[kind];
  const title = !data
    ? label
    : data.kind === "todo"
      ? data.milestone.title
      : data.kind === "appointment"
        ? data.appointment.title
        : data.kind === "moment"
          ? data.moment.title
          : data.kind === "idea"
            ? (data.idea.title ?? "An idea")
            : data.payment.description;

  return (
    <CardSheet label={title} onClose={onClose} top={<span className="label">{label}</span>}>
      {data === undefined && <p className="py-10 text-center text-sm text-stone">One moment…</p>}
      {data === null && <p className="py-10 text-center text-[15px] text-stone">This isn&apos;t here any more.</p>}

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

          {data.kind === "todo" ? (
            <TodoBody milestone={data.milestone} areas={data.areas} weddingDate={data.weddingDate} />
          ) : data.kind === "appointment" ? (
            <AppointmentBody appointment={data.appointment} areas={data.areas} suppliers={data.suppliers} weddingDate={data.weddingDate} />
          ) : data.kind === "moment" ? (
            <MomentBody moment={data.moment} areas={data.areas} />
          ) : data.kind === "idea" ? (
            <IdeaBody idea={data.idea} folderIds={data.folderIds} areas={data.areas} />
          ) : (
            <PaymentBody payment={data.payment} areas={data.areas} suppliers={data.suppliers} weddingDate={data.weddingDate} />
          )}

          <div className="mt-6 border-t border-linen pt-4 text-center">
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(title)}
              className="text-xs text-stone underline underline-offset-4 hover:text-ink disabled:opacity-60"
            >
              {{ todo: "Remove from the plan", appointment: "Remove this appointment", payment: "Remove this payment", moment: "Remove from the run sheet", idea: "Remove this idea" }[kind]}
            </button>
          </div>
        </div>
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
