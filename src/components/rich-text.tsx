import { Check } from "lucide-react";
import { parseNote } from "@/lib/note-lines";

/**
 * A note's or key facts' words: plain lines, bullets ("- ") and tick-boxes
 * ("[ ] ", "[x] "), a blank line between paragraphs. `onToggle` (from a
 * client component) makes the tick-boxes tappable; without it they just show.
 */
export default function RichText({
  text,
  className = "",
  onToggle,
}: {
  text: string;
  className?: string;
  onToggle?: (lineIndex: number) => void;
}) {
  type Block = { kind: "p"; lines: string[] } | { kind: "ul"; items: string[] } | { kind: "ticks"; items: { text: string; done: boolean; index: number }[] };
  const blocks: Block[] = [];
  parseNote(text).forEach((line, index) => {
    const last = blocks[blocks.length - 1];
    if (line.kind === "tick") {
      if (last?.kind === "ticks") last.items.push({ text: line.text, done: line.done, index });
      else blocks.push({ kind: "ticks", items: [{ text: line.text, done: line.done, index }] });
    } else if (line.kind === "bullet") {
      if (last?.kind === "ul") last.items.push(line.text);
      else blocks.push({ kind: "ul", items: [line.text] });
    } else if (line.text.trim() === "") {
      blocks.push({ kind: "p", lines: [] });
    } else if (last?.kind === "p") {
      last.lines.push(line.text.trimEnd());
    } else {
      blocks.push({ kind: "p", lines: [line.text.trimEnd()] });
    }
  });

  return (
    <div className={`space-y-2 text-[15px] leading-relaxed text-ink ${className}`}>
      {blocks.map((b, i) =>
        b.kind === "ul" ? (
          <ul key={i} className="list-disc space-y-0.5 pl-5 marker:text-champagne-600">
            {b.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : b.kind === "ticks" ? (
          <ul key={i} className="space-y-1 font-body not-italic">
            {b.items.map((item) => {
              const box = (
                <span
                  aria-hidden
                  className={`mt-[0.25em] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${
                    item.done ? "border-champagne-600 bg-champagne-600 text-white" : "border-champagne-400 bg-white"
                  }`}
                >
                  {item.done && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              );
              const words = <span className={`text-[15px] ${item.done ? "text-stone line-through" : ""}`}>{item.text}</span>;
              return (
                <li key={item.index}>
                  {onToggle ? (
                    <button type="button" role="checkbox" aria-checked={item.done} onClick={() => onToggle(item.index)} className="flex w-full items-start gap-2.5 text-left">
                      {box}
                      {words}
                    </button>
                  ) : (
                    <span className="flex items-start gap-2.5">
                      {box}
                      {words}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : b.lines.length > 0 ? (
          <p key={i} className="whitespace-pre-wrap">
            {b.lines.join("\n")}
          </p>
        ) : null,
      )}
    </div>
  );
}
