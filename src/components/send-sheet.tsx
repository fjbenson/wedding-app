"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Mail, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { markSentAction } from "@/app/(app)/stationery/actions";
import { DateInput } from "@/components/form-bits";
import { todayISO } from "@/lib/dates";
import { HOWS, SENDINGS, type SendHow, type SendingKind, type SendUnit } from "@/lib/stationery";

/**
 * Sending a save the date, invitation or thank-you to the households that
 * haven't had it (canvas 3 "Sent · Sending it, then Did it go?"). Email and
 * text open the couple's own app — everyone in Bcc for email — and the app
 * sends and keeps nothing; when they come back, "Did it go?" marks them sent.
 * Post and by hand just mark them, with the day. Marking an invitation moves
 * its guests from To invite to Yet to respond.
 */
export default function SendSheet({
  kind,
  units,
  weddingName,
  onClose,
  onOpenUnit,
}: {
  kind: SendingKind;
  /** The households (and people on their own) not sent it yet. */
  units: SendUnit[];
  weddingName: string;
  onClose: () => void;
  /** Opens a household's or guest's card, to add an email or address. */
  onOpenUnit?: (unit: SendUnit) => void;
}) {
  const sending = SENDINGS.find((s) => s.kind === kind)!;
  const reachable = (how: SendHow, u: SendUnit) =>
    how === "email" ? u.emails.length > 0 : how === "text" ? u.phones.length > 0 : how === "post" ? u.hasAddress : true;
  const firstHow: SendHow = units.some((u) => u.emails.length) ? "email" : units.some((u) => u.hasAddress) ? "post" : "hand";
  const [how, setHow] = useState<SendHow>(firstHow);
  const can = units.filter((u) => reachable(how, u));
  const cannot = units.filter((u) => !reachable(how, u));
  const [off, setOff] = useState<Set<string>>(new Set());
  const picked = can.filter((u) => !off.has(u.key));
  const [date, setDate] = useState(todayISO());
  const [subject, setSubject] = useState(`${weddingName}${/s$/i.test(weddingName) ? "'" : "'s"} wedding · ${sending.label}`);
  /** After "Open in my email": did it go? */
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => setAsking(false), [how]);

  const toggle = (key: string) =>
    setOff((all) => {
      const next = new Set(all);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const households = (n: number) => `${n} ${n === 1 ? "household" : "households"}`;
  const enc = encodeURIComponent;
  const emails = picked.flatMap((u) => u.emails);
  const phones = picked.flatMap((u) => u.phones);
  const href =
    how === "email"
      ? `mailto:?bcc=${emails.map(enc).join(",")}&subject=${enc(subject)}`
      : /iPhone|iPad|Mac/i.test(typeof navigator === "undefined" ? "" : navigator.userAgent)
        ? `sms:/open?addresses=${phones.join(",")}`
        : `sms:${phones.join(",")}`;

  const mark = () =>
    start(async () => {
      setError(null);
      try {
        const result = await markSentAction({ kind, how, date: how === "email" || how === "text" ? todayISO() : date, units: picked.map((u) => u.key) });
        if (result.error) setError(result.error);
        else {
          router.refresh();
          onClose();
        }
      } catch {
        setError("That didn't work — the app may have just been updated. Pull down to refresh, then try again.");
      }
    });

  const doneWord = how === "post" ? "posted" : how === "hand" ? "given" : "sent";
  const missingWord = how === "email" ? "no email" : how === "text" ? "no mobile number" : "no address yet";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Send ${sending.lower}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-ink/30" />
      <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-[28px] bg-ivory px-[22px] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-[28px] lg:pt-8">
        <span aria-hidden className="mx-auto block h-[5px] w-10 rounded-full bg-linen lg:hidden" />
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-figure text-[26px] leading-tight">Send {sending.lower}</p>
            <p className="mt-1 text-sm text-stone">{households(units.length)} not sent yet</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink">
            <X className="h-5 w-5" strokeWidth={1.6} aria-hidden />
          </button>
        </div>

        <h3 className="section-label mt-5">How</h3>
        <div role="radiogroup" aria-label="How" className="mt-2 flex flex-wrap gap-2">
          {HOWS.map((h) => {
            const n = units.filter((u) => reachable(h.value, u)).length;
            return (
              <button
                key={h.value}
                type="button"
                role="radio"
                aria-checked={how === h.value}
                onClick={() => setHow(h.value)}
                className={`h-9 rounded-full border px-3.5 text-[13px] ${
                  how === h.value ? "border-champagne-400 bg-champagne-100 font-medium text-champagne-600" : "border-linen bg-white text-ink"
                }`}
              >
                {h.label}
                {h.value !== "hand" && <span className="text-stone"> · {n}</span>}
              </button>
            );
          })}
        </div>

        <h3 className="section-label mt-5">Who · {picked.length} of {households(can.length)}</h3>
        {can.length > 0 ? (
          <ul className="glass-card mt-2 max-h-[34dvh] overflow-y-auto rounded-[18px] px-4">
            {can.map((u) => {
              const on = !off.has(u.key);
              return (
                <li key={u.key} className="border-b border-linen last:border-0">
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1.5 text-[15px] text-ink">
                    <input type="checkbox" checked={on} onChange={() => toggle(u.key)} className="sr-only" />
                    <span
                      aria-hidden
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${on ? "bg-champagne-600 text-white" : "border-[1.5px] border-dashed border-champagne-400"}`}
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={2.6} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{u.name}</span>
                    {u.members.length > 1 && <span className="text-xs text-stone">{u.members.length}</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone">No one here has {how === "email" ? "an email" : how === "text" ? "a mobile number" : "an address"} yet.</p>
        )}
        {cannot.length > 0 && (
          <div className="mt-2.5 rounded-[14px] border border-dashed border-champagne-400 px-3.5 py-2.5 text-[13px] text-[#3A342E]">
            {cannot.length} with {missingWord}:{" "}
            {cannot.slice(0, 6).map((u, i) => (
              <span key={u.key}>
                {i > 0 && ", "}
                {onOpenUnit ? (
                  <button type="button" onClick={() => onOpenUnit(u)} className="text-champagne-600 underline underline-offset-4 hover:text-ink">
                    {u.name}
                  </button>
                ) : (
                  u.name
                )}
              </span>
            ))}
            {cannot.length > 6 && ` +${cannot.length - 6}`}
          </div>
        )}

        {how === "email" && picked.length > 0 && (
          <label className="mt-5 block">
            <span className="section-label">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-[14px] border border-linen bg-white px-3.5 text-base text-ink focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
            />
          </label>
        )}
        {(how === "post" || how === "hand") && picked.length > 0 && (
          <label className="mt-5 block">
            <span className="section-label">{how === "post" ? "Posted on" : "Given on"}</span>
            <DateInput
              value={date}
              onChange={(e) => setDate(e.target.value || todayISO())}
              className="mt-1.5 h-12 w-full rounded-[14px] border border-linen bg-white px-3.5 text-base text-ink focus:border-champagne-400 focus:outline-none"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
            {error}
          </p>
        )}

        {picked.length > 0 &&
          (how === "email" || how === "text" ? (
            <>
              <a
                href={href}
                onClick={() => setAsking(true)}
                className="mt-5 flex h-[52px] items-center justify-center gap-2 rounded-full bg-ink text-base text-ivory"
              >
                {how === "email" ? <Mail className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden /> : <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />}
                {how === "email" ? "Open in my email" : "Open in Messages"}
              </a>
              <p className="mt-2.5 text-center text-xs leading-relaxed text-stone">
                {how === "email"
                  ? "Everyone goes in Bcc, so no one sees the others' addresses. It sends from your own email; the app keeps nothing."
                  : "A group text shows everyone's number to everyone in it. It sends from your own phone."}
              </p>
              {asking ? (
                <div className="mt-5 border-t border-linen pt-4">
                  <p className="font-display text-[20px] italic text-ink">Did it go?</p>
                  <div className="mt-3 flex gap-2.5">
                    <button type="button" onClick={() => setAsking(false)} className="h-[52px] w-[38%] rounded-full border border-linen bg-white text-[15px] text-ink">
                      Not yet
                    </button>
                    <button type="button" onClick={mark} disabled={pending} className="h-[52px] flex-1 rounded-full bg-ink text-[15px] text-ivory disabled:opacity-60">
                      {pending ? "Marking…" : `Yes, mark ${picked.length} as sent`}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-center">
                  <button type="button" onClick={() => setAsking(true)} className="text-[13px] text-champagne-600 underline underline-offset-4 hover:text-ink">
                    Already sent it? Mark them as sent
                  </button>
                </p>
              )}
            </>
          ) : (
            <button type="button" onClick={mark} disabled={pending} className="mt-5 flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base text-ivory disabled:opacity-60">
              {pending ? "Marking…" : `Mark ${picked.length} as ${doneWord}`}
            </button>
          ))}
        {kind === "invitation" && picked.length > 0 && (
          <p className="mt-3 text-center text-xs leading-relaxed text-stone">Marking them moves their guests from To invite to Yet to respond.</p>
        )}
      </div>
    </div>
  );
}
