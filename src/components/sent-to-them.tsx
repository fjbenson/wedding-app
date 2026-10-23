"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { markSentAction, sentToAction, unmarkSentAction } from "@/app/(app)/stationery/actions";
import { afterTheDay, HOWS, SENDINGS, sentLine, type SendingKind, type SentRecord } from "@/lib/stationery";

/**
 * "Sent to them" on a household's card (`bare`: the top of its History, owner 21 Oct 2026), or the card of a guest not in a
 * household (canvas 3 "Sent · On the household card"): the save the date,
 * invitation and thank-you, each a gold tick with how and when once it's
 * gone, dashed until then. Tap a dashed one to say how it went (today);
 * tap a ticked one to take it off. `tiles`: the household card's own row of three
 * (owner, 23 Oct 2026, canvas 4 "Cards · Rounds 1–10"), the panel opening under it.
 */
export default function SentToThem({ unit, bare = false, tiles = false }: { unit: string; bare?: boolean; tiles?: boolean }) {
  const [records, setRecords] = useState<SentRecord[] | null>(null);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState<SendingKind | null>(null);
  const [n, setN] = useState(0);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let live = true;
    sentToAction(unit)
      .then((r) => {
        if (!live) return;
        setRecords(r.records);
        setWeddingDate(r.weddingDate);
        setError(r.error);
      })
      .catch(() => live && setError("What's been sent didn't load."));
    return () => {
      live = false;
    };
  }, [unit, n]);

  const run = (job: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError(undefined);
      try {
        const r = await job();
        if (r.error) setError(r.error);
        else {
          setOpen(null);
          setN((x) => x + 1);
          router.refresh();
        }
      } catch {
        setError("That didn't work — the app may have just been updated. Pull down to refresh, then try again.");
      }
    });

  if (records === null && !error) return null;
  const first = (kind: SendingKind) => (records ?? []).find((r) => r.kind === kind);

  // What opens under a sending when it's tapped: take it off, or say how it went.
  const panel = (kind: SendingKind, sent: SentRecord | undefined, inset: string) =>
    open === kind &&
    (sent ? (
      <div className={`flex items-center justify-between gap-3 pb-3 ${inset}`}>
        <span className="text-[13px] text-stone">Not sent after all?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => unmarkSentAction(kind, unit))}
          className="h-9 rounded-full border border-linen bg-white px-3.5 text-[13px] text-ink"
        >
          {pending ? "Taking off…" : "Take it off"}
        </button>
      </div>
    ) : (
      <div className={`pb-3 ${inset}`}>
        <p className="text-[13px] text-stone">How did it go? (today)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {HOWS.map((h) => (
            <button
              key={h.value}
              type="button"
              disabled={pending}
              onClick={() => run(() => markSentAction({ kind, how: h.value, units: [unit] }))}
              className="h-9 rounded-full border border-linen bg-white px-3.5 text-[13px] text-ink hover:border-champagne-400 disabled:opacity-60"
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>
    ));

  if (tiles) {
    const opened = SENDINGS.find((s) => s.kind === open);
    return (
      <section aria-label="Sent to them" className="mt-6">
        <h2 className="section-label">Sent</h2>
        {error && (
          <p role="alert" className="mt-2 text-sm text-ink">
            {error}
          </p>
        )}
        <div className="mt-2.5 flex gap-2">
          {SENDINGS.map((s) => {
            const sent = first(s.kind);
            const later = s.kind === "thank_you" && !sent && !afterTheDay(weddingDate);
            return (
              <button
                key={s.kind}
                type="button"
                disabled={pending}
                aria-expanded={open === s.kind}
                onClick={() => setOpen((o) => (o === s.kind ? null : s.kind))}
                className={`flex min-h-[64px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-2 text-center ${
                  sent ? "bg-white shadow-[0_0_0_1px_#E6E0D6]" : "border border-dashed border-champagne-600/60 bg-white/50"
                } ${open === s.kind ? "ring-2 ring-champagne-400" : ""} ${later ? "opacity-60" : ""}`}
              >
                <span className="text-[12px] leading-tight text-stone">{s.label}</span>
                <span className={`flex items-center gap-1 text-[13px] leading-tight ${sent ? "text-ink" : "text-champagne-600"}`}>
                  {sent && <Check className="h-3.5 w-3.5 shrink-0 text-champagne-600" strokeWidth={2.4} aria-hidden />}
                  {sent ? sentLine(sent) : later ? "After the day" : "Not yet"}
                </span>
              </button>
            );
          })}
        </div>
        {opened && <div className="mt-2">{panel(opened.kind, first(opened.kind), "")}</div>}
      </section>
    );
  }

  return (
    <section aria-label="Sent to them" className={bare ? "mb-3 border-b border-linen pb-1" : "mt-6 -mx-[22px] border-t border-linen px-[22px] pt-6"}>
      {!bare && <h2 className="label">Sent to them</h2>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      )}
      <ul className="mt-1">
        {SENDINGS.map((s) => {
          const sent = first(s.kind);
          const later = s.kind === "thank_you" && !sent && !afterTheDay(weddingDate);
          return (
            <li key={s.kind} className="border-b border-linen last:border-b-0">
              <button
                type="button"
                disabled={pending}
                aria-expanded={open === s.kind}
                onClick={() => setOpen((o) => (o === s.kind ? null : s.kind))}
                className={`flex min-h-[52px] w-full items-center gap-3 text-left ${later ? "opacity-60" : ""}`}
              >
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${sent ? "bg-champagne-600 text-white" : "border-[1.5px] border-dashed border-champagne-600"}`}
                >
                  {sent && <Check className="h-3.5 w-3.5" strokeWidth={2.4} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-ink">{s.label}</span>
                  <span className={`block text-[13px] ${sent ? "text-stone" : "text-champagne-600"}`}>
                    {sent ? sentLine(sent) : later ? "After the day" : "Not sent · Mark it sent ›"}
                  </span>
                </span>
              </button>
              {panel(s.kind, sent, "pl-9")}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
