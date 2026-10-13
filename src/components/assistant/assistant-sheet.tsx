"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, Camera, Check, PenLine, X } from "lucide-react";
import AnswerBlock from "@/components/assistant/answer-blocks";
import { usePullToClose } from "@/components/use-pull-to-close";
import { confirmProposalAction, saveNoteAction } from "@/app/(app)/assistant/actions";
import type { Block, StreamEvent } from "@/lib/assistant/blocks";

/**
 * Your assistant (CLAUDE.md, Next steps 8; canvas 2 "Your planner · Round
 * 1–2", renamed by the owner 13 Oct 2026 — the couple are the planners, it
 * does the small jobs). One front door, "Jot or ask…": a thought is saved
 * as a note, a question gets a short answer with a block drawn by the app,
 * a job gets a card that saves only on Yes.
 *
 * `variant` is the door: the Hub's pill under the ring, or the round pen
 * above the menu bar on the other tabs.
 */

type Part = { kind: "text"; text: string } | { kind: "block"; block: Block };
type Turn = { role: "user"; text: string } | { role: "assistant"; parts: Part[]; error?: string; failedText?: string };
type CardState = { state: "saving" } | { state: "saved"; link?: string } | { state: "changed" } | { state: "error"; message: string };

export default function AssistantSheet({ variant, subtitle }: { variant: "hub" | "fab"; subtitle?: string }) {
  const [open, setOpen] = useState(false);
  // The conversation lasts while the page is open, so closing and reopening keeps it.
  const conversation = useConversation();

  return (
    <>
      {variant === "hub" ? (
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="glass-card flex h-11 items-center gap-2.5 rounded-full px-5 text-sm text-ink transition hover:border-champagne-400"
          >
            <PenLine className="h-[18px] w-[18px] text-champagne-600" strokeWidth={1.7} aria-hidden />
            Jot or ask…
          </button>
          <p className="mt-2.5 px-6 text-center text-[13px] text-stone">
            “Add Amy to the guest list” · “How many vegetarians?” · or just a note
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Jot or ask"
          className="glass fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+60px)] right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full text-ink print:hidden md:bottom-[84px] lg:hidden"
        >
          <PenLine className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </button>
      )}
      {open && <Panel onClose={() => setOpen(false)} subtitle={subtitle} conversation={conversation} />}
    </>
  );
}

function useConversation() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [busy, setBusy] = useState(false);
  /** What Claude has seen so far, sent back each turn (the API keeps nothing). */
  const history = useRef<unknown[]>([]);
  return { turns, setTurns, cards, setCards, busy, setBusy, history };
}

function Panel({
  onClose,
  subtitle,
  conversation,
}: {
  onClose: () => void;
  subtitle?: string;
  conversation: ReturnType<typeof useConversation>;
}) {
  const { turns, setTurns, cards, setCards, busy, setBusy, history } = conversation;
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // Escape closes it, and the page behind doesn't scroll while it's open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  const drag = usePullToClose(onClose);
  const view = useVisibleArea();

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns, cards]);

  /** Adds to the assistant's turn being written. */
  const addPart = useCallback(
    (part: Part) =>
      setTurns((all) => {
        const last = all[all.length - 1];
        if (last?.role !== "assistant") return [...all, { role: "assistant", parts: [part] }];
        const parts = [...last.parts];
        const tail = parts[parts.length - 1];
        if (part.kind === "text" && tail?.kind === "text") parts[parts.length - 1] = { kind: "text", text: tail.text + part.text };
        else parts.push(part);
        return [...all.slice(0, -1), { ...last, parts }];
      }),
    [setTurns],
  );

  const fail = useCallback(
    (message: string, text: string) =>
      setTurns((all) => {
        const last = all[all.length - 1];
        const turn = last?.role === "assistant" ? last : { role: "assistant" as const, parts: [] };
        return [...(last?.role === "assistant" ? all.slice(0, -1) : all), { ...turn, error: message, failedText: text }];
      }),
    [setTurns],
  );

  async function send(text: string) {
    const said = text.trim();
    if (!said || busy) return;
    setDraft("");
    setHint(null);
    setBusy(true);
    const before = history.current;
    const messages = [...before, { role: "user", content: said }];
    setTurns((all) => [...all, { role: "user", text: said }, { role: "assistant", parts: [] }]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        fail(body?.error ?? "Your assistant couldn't answer just now.", said);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          if (event.t === "text") addPart({ kind: "text", text: event.text });
          else if (event.t === "block") addPart({ kind: "block", block: event.block });
          else if (event.t === "done") {
            history.current = event.messages;
            finished = true;
          } else if (event.t === "error") fail(event.message, said);
        }
      }
      if (!finished) history.current = before;
      // A note saved, or anything the screens behind show, is fresh when closed.
      router.refresh();
    } catch {
      fail("Your assistant couldn't be reached. Check your signal and try again.", said);
    } finally {
      setBusy(false);
    }
  }

  /** Tells the assistant what happened to a card, ready for the next message. */
  function remember(note: string) {
    history.current = [...history.current, { role: "user", content: note }];
  }

  async function yes(card: Extract<Block, { type: "confirm" }>) {
    setCards((c) => ({ ...c, [card.id]: { state: "saving" } }));
    let result: Awaited<ReturnType<typeof confirmProposalAction>>;
    try {
      result = await confirmProposalAction(card.proposal);
    } catch {
      // A page left open across an update can call an action that's gone.
      result = { ok: false, error: "That didn't save. Reload the page and try again." };
    }
    if (result.ok) {
      setCards((c) => ({ ...c, [card.id]: { state: "saved", link: result.link } }));
      remember(`[They tapped Yes on "${card.title}" — saved.]`);
      router.refresh();
    } else {
      setCards((c) => ({ ...c, [card.id]: { state: "error", message: result.error } }));
    }
  }

  function change(card: Extract<Block, { type: "confirm" }>) {
    setCards((c) => ({ ...c, [card.id]: { state: "changed" } }));
    remember(`[They tapped Change on "${card.title}" — not saved.]`);
    setHint("What should I change?");
    input.current?.focus();
  }

  async function keepAsNote(text: string) {
    let result: { error?: string };
    try {
      result = await saveNoteAction(text);
    } catch {
      result = { error: "That didn't save. Reload the page and try again." };
    }
    if (!result.error) {
      setTurns((all) => [...all, { role: "assistant", parts: [{ kind: "block", block: { type: "note", body: text, url: null } }] }]);
      router.refresh();
    }
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-dvh"
      style={view ? { top: view.top, height: view.height } : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Your assistant"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - drag.offset / 400) }}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
      />
      <div
        style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
        className={`absolute inset-x-0 bottom-0 flex h-[92dvh] max-h-full flex-col rounded-t-[28px] bg-ivory shadow-[0_-20px_50px_-20px_rgb(30_27_24/0.4)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[460px] lg:rounded-none lg:rounded-l-[28px] ${
          drag.dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
      >
        <div onPointerDown={drag.start} className="flex h-7 shrink-0 touch-none items-start justify-center lg:hidden">
          <span aria-hidden className="mt-2.5 h-[5px] w-10 rounded-full bg-linen" />
        </div>
        <div onPointerDown={drag.start} className="flex shrink-0 touch-none items-center gap-3 px-5 pb-2 lg:touch-auto lg:pt-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-champagne-400 bg-[#FFFDF8]">
            <PenLine className="h-5 w-5 text-champagne-600" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[22px] font-light leading-tight text-ink">Your assistant</span>
            {subtitle && <span className="type-meta block">{subtitle}</span>}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-stone hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          {turns.length === 0 && (
            <div className="pt-6">
              <p className="font-display text-[18px] leading-snug text-ink">
                Jot a thought and I’ll keep it in your notes, or ask me to look something up or add something.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Who hasn’t replied?", "What’s left to pay?", "What’s on this week?"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="h-10 rounded-full border border-linen bg-white px-4 text-sm text-ink hover:border-champagne-400"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <div key={i} className="mt-4 flex justify-end">
                <p className="max-w-[78%] whitespace-pre-wrap rounded-[20px_20px_6px_20px] bg-ink px-4 py-2.5 text-[15px] leading-snug text-ivory">
                  {turn.text}
                </p>
              </div>
            ) : (
              <div key={i} className="mt-3.5">
                {/* Words first, then what they're about (as on the canvas): a lookup often
                    arrives before the sentence that sums it up. */}
                {turn.parts.some((p) => p.kind === "text" && p.text.trim()) && (
                  <p className="max-w-[90%] whitespace-pre-wrap font-display text-[18px] leading-snug text-ink">
                    {turn.parts
                      .filter((p) => p.kind === "text")
                      .map((p) => p.text.trim())
                      .join("\n")
                      .trim()}
                  </p>
                )}
                {turn.parts.map((part, j) =>
                  part.kind === "text" ? null : part.block.type === "confirm" ? (
                    <ConfirmCard key={j} card={part.block} state={cards[part.block.id]} onYes={yes} onChange={change} onGo={onClose} />
                  ) : (
                    <AnswerBlock key={j} block={part.block} onGo={onClose} />
                  ),
                )}
                {busy && i === turns.length - 1 && turn.parts.length === 0 && !turn.error && (
                  <p className="font-display text-[18px] italic text-stone">
                    <span className="animate-pulse">Just a moment…</span>
                  </p>
                )}
                {turn.error && (
                  <div className="mt-2 rounded-2xl bg-cream px-4 py-3 text-sm text-ink">
                    {turn.error}
                    {turn.failedText && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={() => keepAsNote(turn.failedText!)} className="h-9 rounded-full border border-linen bg-white px-3.5 text-sm">
                          Save it as a note
                        </button>
                        <button type="button" onClick={() => send(turn.failedText!)} className="h-9 rounded-full border border-linen bg-white px-3.5 text-sm">
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ),
          )}
          <div ref={bottom} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="shrink-0 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"
        >
          <div className="flex items-end gap-2 rounded-[26px] border border-linen bg-white py-1.5 pl-4 pr-1.5 shadow-[0_10px_24px_-14px_rgb(60_45_20/0.4)]">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Jot or ask</span>
              <textarea
                ref={input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(hover: hover)").matches) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={1}
                autoFocus={turns.length === 0 && canHover()}
                placeholder={hint ?? "Jot or ask…"}
                className="block max-h-32 w-full resize-none bg-transparent py-2 font-display text-[17px] leading-snug text-ink [field-sizing:content] placeholder:italic placeholder:text-stone focus:outline-none"
              />
            </label>
            <Link
              href={`/inspo/new?from=${encodeURIComponent(pathname)}`}
              onClick={onClose}
              aria-label="Save a photo"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone hover:text-ink"
            >
              <Camera className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />
            </Link>
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-ivory transition disabled:opacity-40"
            >
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** A mouse and keyboard: safe to put the cursor in the box straight away. */
function canHover() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}

/**
 * The part of the screen the keyboard leaves free. On an iPhone the keyboard
 * doesn't shrink the page; Safari scrolls it up instead, pushing the panel's
 * top off the screen. Sizing the panel to what's visible keeps the header
 * on screen and the box just above the keyboard.
 */
function useVisibleArea() {
  const [area, setArea] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setArea({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return area;
}

/** "Here's what I'll add:" — the details, then Yes and Change. Nothing saves before Yes. */
function ConfirmCard({
  card,
  state,
  onYes,
  onChange,
  onGo,
}: {
  card: Extract<Block, { type: "confirm" }>;
  state?: CardState;
  onYes: (card: Extract<Block, { type: "confirm" }>) => void;
  onChange: (card: Extract<Block, { type: "confirm" }>) => void;
  onGo: () => void;
}) {
  const done = state?.state === "saved" || state?.state === "changed";
  return (
    <div className="mt-3">
      <div className={`overflow-hidden rounded-[18px] border border-linen bg-white ${state?.state === "changed" ? "opacity-50" : ""}`}>
        <div className="px-4 py-3.5">
          <span className="block font-display text-[18px] leading-tight text-ink">{card.title}</span>
          <span className="type-meta mt-1 block">{card.action}</span>
        </div>
        {card.rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-t border-linen px-4 py-2.5 text-sm">
            <span className="shrink-0 text-stone">{label}</span>
            <span className="text-right text-ink">{value}</span>
          </div>
        ))}
        {!done && (
          <div className="flex gap-2 border-t border-linen px-4 py-3">
            <button
              type="button"
              onClick={() => onYes(card)}
              disabled={state?.state === "saving"}
              className="h-[46px] flex-1 rounded-full bg-ink text-[15px] text-ivory disabled:opacity-60"
            >
              {state?.state === "saving" ? "Saving…" : card.yes}
            </button>
            <button
              type="button"
              onClick={() => onChange(card)}
              disabled={state?.state === "saving"}
              className="h-[46px] flex-1 rounded-full border border-linen bg-white text-[15px] text-ink"
            >
              Change
            </button>
          </div>
        )}
      </div>
      {state?.state === "saved" && (
        <p className="mt-2.5 flex items-center gap-2 text-sm text-champagne-600">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-champagne-600 text-white">
            <Check className="h-3 w-3" strokeWidth={2.6} aria-hidden />
          </span>
          Done
          {state.link && (
            <>
              {" · "}
              <Link href={state.link} onClick={onGo} className="underline underline-offset-4 hover:text-ink">
                See it ›
              </Link>
            </>
          )}
        </p>
      )}
      {state?.state === "error" && <p className="mt-2 text-sm text-[#9A3F2B]">{state.message}</p>}
    </div>
  );
}
