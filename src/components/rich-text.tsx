/**
 * Plain text with bullet points: a line starting "-", "*" or "•" becomes a
 * bullet, a blank line starts a new paragraph. For key facts and notes, so
 * typing a quick list on a phone just works — no formatting buttons needed.
 */
export default function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ({ kind: "p"; lines: string[] } | { kind: "ul"; items: string[] })[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
    } else if (line.trim() === "") {
      blocks.push({ kind: "p", lines: [] });
    } else if (last?.kind === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "p", lines: [line] });
    }
  }

  return (
    <div className={`space-y-2 text-[15px] leading-relaxed text-ink ${className}`}>
      {blocks.map((b, i) =>
        b.kind === "ul" ? (
          <ul key={i} className="list-disc space-y-0.5 pl-5 marker:text-champagne-600">
            {b.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
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
