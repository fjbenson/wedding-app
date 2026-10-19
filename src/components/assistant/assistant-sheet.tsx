"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, CalendarDays, Camera, Check, PenLine, StickyNote, UserPlus, Users, Wallet, X, type LucideIcon } from "lucide-react";
import AnswerBlock from "@/components/assistant/answer-blocks";
import SearchResults from "@/components/assistant/search-results";
import { confirmProposalAction, saveNoteAction } from "@/app/(app)/assistant/actions";
import { appointmentFlow } from "@/components/assistant/appointment-steps";
import { guestFlow } from "@/components/assistant/guest-steps";
import { paymentFlow } from "@/components/assistant/payment-steps";
import { StepsChat, StepsTray, type Flow, type StepsState } from "@/components/assistant/steps-flow";
import { todoFlow } from "@/components/assistant/todo-steps";
import type { AppointmentStepsBlock, Block, GuestStepsBlock, PaymentStepsBlock, StreamEvent, TodoStepsBlock } from "@/lib/assistant/blocks";

/**
 * Your assistant (CLAUDE.md, Next steps 8; canvas 2 "Your planner · Round
 * 1–2", renamed by the owner 13 Oct 2026 — the couple are the planners, it
 * does the small jobs). One front door, "Jot or ask…": a thought is saved
 * as a note, a question gets a short answer with a block drawn by the app,
 * a job gets a card that saves only on Yes.
 *
 * `variant` is the door: the Hub's pill under the ring, the round pen
 * above the menu bar on the other tabs, or a round pen in the laptop's
 * top bar.
 */

type Part = { kind: "text"; text: string } | { kind: "block"; block: Block };
type Turn = { role: "user"; text: string } | { role: "assistant"; parts: Part[]; error?: string; failedText?: string };
/** A job done a step at a time (steps-flow.tsx). */
type StepsBlock = GuestStepsBlock | TodoStepsBlock | PaymentStepsBlock | AppointmentStepsBlock;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flowOf = (block: StepsBlock): Flow<any, any> =>
  block.type === "guest_steps" ? guestFlow : block.type === "todo_steps" ? todoFlow : block.type === "payment_steps" ? paymentFlow : appointmentFlow;
const isSteps = (block: Block): block is StepsBlock =>
  block.type === "guest_steps" || block.type === "todo_steps" || block.type === "payment_steps" || block.type === "appointment_steps";

type CardState = { state: "saving" } | { state: "saved"; link?: string; note?: string } | { state: "changed" } | { state: "error"; message: string };

export default function AssistantSheet({ variant, subtitle }: { variant: "hub" | "fab" | "bar"; subtitle?: string }) {
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
            className="glass-card flex h-12 items-center gap-2.5 rounded-full pl-[9px] pr-[22px] text-ink transition hover:border-champagne-400"
          >
            <Mark />
            <span className="font-display text-[18px] italic">Ask your assistant</span>
          </button>
        </div>
      ) : variant === "bar" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask your assistant"
          title="Ask your assistant"
          className="glass-card flex h-10 w-10 items-center justify-center rounded-full text-champagne-600 transition hover:border-champagne-400"
        >
          <PenLine className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Your assistant"
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [steps, setSteps] = useState<Record<string, StepsState<any>>>({});
  const [busy, setBusy] = useState(false);
  /** What Claude has seen so far, sent back each turn (the API keeps nothing). */
  const history = useRef<unknown[]>([]);
  return { turns, setTurns, cards, setCards, steps, setSteps, busy, setBusy, history };
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
  const { turns, setTurns, cards, setCards, steps, setSteps, busy, setBusy, history } = conversation;
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
  const view = useVisibleArea();

  useEffect(() => {
    // Scroll the conversation only: scrollIntoView would also nudge the page on an iPhone.
    const list = bottom.current?.parentElement;
    if (list) list.scrollTop = list.scrollHeight;
  }, [turns, cards, steps]);

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
      setCards((c) => ({ ...c, [card.id]: { state: "saved", link: result.link, note: result.note } }));
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

  // ── A job done a step at a time (steps-flow.tsx) ──
  /** Only the latest set of steps can still be answered; an older one left half done reads as cancelled. */
  let latestSteps: StepsBlock | null = null;
  for (const turn of turns) {
    if (turn.role !== "assistant") continue;
    for (const part of turn.parts) if (part.kind === "block" && isSteps(part.block)) latestSteps = part.block;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stepsFor = (block: StepsBlock): StepsState<any> => {
    const state = steps[block.id] ?? flowOf(block).initial(block);
    return state.phase === "asking" && block.id !== latestSteps?.id ? { ...state, phase: "cancelled" } : state;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSteps = (block: StepsBlock, change: (state: StepsState<any>) => StepsState<any>) =>
    setSteps((all) => ({ ...all, [block.id]: change(all[block.id] ?? flowOf(block).initial(block)) }));
  const activeSteps = latestSteps && stepsFor(latestSteps).phase === "asking" ? latestSteps : null;

  function cancelSteps(block: StepsBlock) {
    updateSteps(block, (s) => ({ ...s, phase: "cancelled" }));
    remember(`[They cancelled adding "${flowOf(block).subject(block)}" — not saved.]`);
  }

  function editStep(block: StepsBlock, key: string) {
    const index = Math.max(0, flowOf(block).keys(block).indexOf(key));
    updateSteps(block, (s) => ({ ...s, phase: "asking", editing: true, index }));
  }

  async function yesSteps(block: StepsBlock) {
    const flow = flowOf(block);
    const values = stepsFor(block).values;
    updateSteps(block, (s) => ({ ...s, phase: "saving", error: undefined }));
    let result: Awaited<ReturnType<typeof confirmProposalAction>>;
    try {
      result = await confirmProposalAction(flow.proposal(block, values));
    } catch {
      // A page left open across an update can call an action that's gone.
      result = { ok: false, error: "That didn't save. Reload the page and try again." };
    }
    if (result.ok) {
      updateSteps(block, (s) => ({ ...s, phase: "saved", link: result.link, note: result.note }));
      remember(`[They tapped Yes on "${flow.subject(block)}" — saved.]`);
      router.refresh();
    } else {
      updateSteps(block, (s) => ({ ...s, phase: "error", error: result.error }));
    }
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

  const empty = turns.length === 0;
  const searching = draft.trim().length >= 2;
  const composer = (big: boolean) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(draft);
      }}
      className={big ? "" : "shrink-0 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"}
    >
      <div className={`flex items-end gap-2 rounded-[30px] border border-linen bg-white pl-5 pr-1.5 shadow-[0_16px_34px_-18px_rgb(60_45_20/0.45)] ${big ? "py-2.5" : "py-1.5"}`}>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search, jot or ask</span>
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
            autoFocus={big && canHover()}
            placeholder={hint ?? "Search, jot or ask…"}
            className={`block max-h-32 w-full resize-none bg-transparent py-2 leading-snug ${big ? "text-[17px]" : "text-[16px]"} text-ink [field-sizing:content] placeholder:text-stone focus:outline-none`}
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
  );

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-dvh"
      style={view ? { height: view.height } : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Your assistant"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 hidden h-full w-full cursor-default bg-ink/30 lg:block" />
      {/* Full screen on phones (canvas 2 "Your assistant · Round 3", A with B's
          groups, owner's pick 13 Oct 2026); a right-hand panel on laptops. */}
      <div className="absolute inset-0 flex flex-col bg-ivory bg-[radial-gradient(130%_60%_at_50%_-10%,#FFFCF6_0%,#FBF5EB_40%,rgba(239,229,213,0)_100%)] lg:left-auto lg:w-[460px] lg:rounded-l-[28px] lg:shadow-[-20px_0_50px_-20px_rgb(30_27_24/0.4)]">
        {empty ? (
          <>
            <div className="flex shrink-0 justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <CloseButton onClose={onClose} />
            </div>
            <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-10 ${searching ? "justify-start pt-4" : "justify-center"}`}>
              <div className={`text-center ${searching ? "hidden" : ""}`}>
                <Mark size="lg" />
                <h2 className="mt-4 font-display text-[34px] font-light leading-[1.1] tracking-[-0.01em] text-ink">
                  What can I do
                  <br />
                  for you?
                </h2>
                <p className="type-meta mt-3">Your assistant{subtitle ? ` · ${subtitle.split(" · ")[0]}` : ""}</p>
              </div>
              <div className="mt-7">{composer(true)}</div>
              {/* Typing searches the whole wedding at once (owner, 19 Oct 2026); send asks the assistant. */}
              <SearchResults query={draft} onGo={onClose} />
              <div className={`mt-6 flex flex-wrap justify-center gap-2 ${searching ? "hidden" : ""}`}>
                {PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.say) send(item.say);
                      else {
                        setHint("Jot a thought…");
                        input.current?.focus();
                      }
                    }}
                    className="flex h-10 items-center gap-2 rounded-full border border-linen bg-white/80 pl-3 pr-4 text-sm text-ink hover:border-champagne-400"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-champagne-600" strokeWidth={1.6} aria-hidden />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))] lg:pt-8">
              <Mark />
              <span className="min-w-0 flex-1 font-display text-[20px] font-light text-ink">Your assistant</span>
              <CloseButton onClose={onClose} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
            {turns.map((turn, i) =>
              turn.role === "user" ? (
                <div key={i} className="mt-4 flex justify-end">
                  <p className="max-w-[78%] whitespace-pre-wrap rounded-[20px_20px_6px_20px] bg-ink px-4 py-2.5 text-[16px] leading-snug text-ivory">
                    {turn.text}
                  </p>
                </div>
              ) : (
                <div key={i} className="mt-3.5">
                  {/* Words first, then what they're about (as on the canvas): a lookup often
                      arrives before the sentence that sums it up. */}
                  {turn.parts.some((p) => p.kind === "text" && p.text.trim()) && (
                    <p className="max-w-[92%] whitespace-pre-wrap text-[16px] leading-relaxed text-ink">
                      {turn.parts
                        .filter((p) => p.kind === "text")
                        .map((p) => p.text.trim())
                        .join("\n")
                        .trim()}
                    </p>
                  )}
                  {turn.parts.map((part, j) =>
                    part.kind === "text" ? null : isSteps(part.block) ? (
                      <StepsChat
                        key={j}
                        flow={flowOf(part.block)}
                        block={part.block}
                        state={stepsFor(part.block)}
                        onYes={() => yesSteps(part.block as StepsBlock)}
                        onCancel={() => cancelSteps(part.block as StepsBlock)}
                        onEdit={(key) => editStep(part.block as StepsBlock, key)}
                        setValues={(change) =>
                          updateSteps(part.block as StepsBlock, (s) => ({ ...s, values: { ...s.values, ...change } }))
                        }
                        onGo={onClose}
                      />
                    ) : part.block.type === "confirm" ? (
                      <ConfirmCard key={j} card={part.block} state={cards[part.block.id]} onYes={yes} onChange={change} onGo={onClose} />
                    ) : (
                      <AnswerBlock key={j} block={part.block} onGo={onClose} />
                    ),
                  )}
                  {busy && i === turns.length - 1 && turn.parts.length === 0 && !turn.error && (
                    <p className="text-[16px] text-stone">
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
            {activeSteps ? (
              <StepsTray
                flow={flowOf(activeSteps)}
                block={activeSteps}
                state={stepsFor(activeSteps)}
                update={(change) => updateSteps(activeSteps, change)}
                onCancel={() => cancelSteps(activeSteps)}
              />
            ) : (
              composer(false)
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** The opening screen's prompts: one flat set of pills, each with a small picture (owner, 17 Oct 2026). */
const PROMPTS: { label: string; icon: LucideIcon; say?: string }[] = [
  { label: "Who hasn’t replied?", icon: Users, say: "Who hasn’t replied?" },
  { label: "What’s left to pay?", icon: Wallet, say: "What’s left to pay?" },
  { label: "What’s on this week?", icon: CalendarDays, say: "What’s on this week?" },
  { label: "Add a guest", icon: UserPlus, say: "I’d like to add a guest." },
  { label: "A thought for later", icon: StickyNote },
];

/** The assistant's mark: a gold pen in a ring. */
function Mark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-champagne-400 bg-[#FFFDF8] ${
        size === "lg" ? "h-14 w-14" : "h-9 w-9"
      }`}
    >
      <PenLine className={`text-champagne-600 ${size === "lg" ? "h-6 w-6" : "h-4 w-4"}`} strokeWidth={1.4} aria-hidden />
    </span>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-linen bg-white/70 text-stone hover:text-ink"
    >
      <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
    </button>
  );
}

/** A mouse and keyboard: safe to put the cursor in the box straight away. */
function canHover() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}

/**
 * The part of the screen the keyboard leaves free. On an iPhone the keyboard
 * doesn't shrink the page; Safari scrolls it up instead, which pushed the
 * panel's top off the screen and then, when we followed it, made it jump.
 * So the panel stays pinned to the top and takes the visible height, and any
 * scroll Safari makes behind it is put straight back.
 */
function useVisibleArea() {
  const [area, setArea] = useState<{ height: number } | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    const update = () => {
      if (window.scrollY !== 0 || vv.offsetTop !== 0) window.scrollTo(0, 0);
      setArea({ height: vv.height });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      html.style.overflow = overflow;
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
      {state?.state === "saved" && state.note && <p className="mt-1.5 text-sm text-stone">{state.note}</p>}
      {state?.state === "error" && <p className="mt-2 text-sm text-[#9A3F2B]">{state.message}</p>}
    </div>
  );
}
