/**
 * A note's lines (owner, 19 Oct 2026, canvas 3 "Notes · Round 1", A): one
 * note can mix plain words, bullets and tick-boxes. Stored as plain text so
 * nothing else changes: "- " starts a bullet, "[ ] " a tick-box and "[x] " a
 * ticked one. Older notes that used "-", "*" or "•" read as bullets.
 */
export type LineKind = "text" | "bullet" | "tick";
export interface NoteLine {
  kind: LineKind;
  text: string;
  done: boolean;
}

export function parseNote(body: string | null | undefined): NoteLine[] {
  return (body ?? "").split("\n").map((raw) => {
    const tick = raw.match(/^\s*\[( |x|X)\]\s?(.*)$/);
    if (tick) return { kind: "tick" as const, text: tick[2], done: tick[1].toLowerCase() === "x" };
    const bullet = raw.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) return { kind: "bullet" as const, text: bullet[1], done: false };
    return { kind: "text" as const, text: raw, done: false };
  });
}

export function writeNote(lines: NoteLine[]): string {
  return lines
    .map((l) => (l.kind === "tick" ? `[${l.done ? "x" : " "}] ${l.text}` : l.kind === "bullet" ? `- ${l.text}` : l.text))
    .join("\n")
    .replace(/\s+$/, "");
}

/** How many tick-boxes, and how many are ticked: "1 of 4 ticked" on the wall. */
export function tickCount(body: string | null | undefined): { ticks: number; done: number } {
  const lines = parseNote(body).filter((l) => l.kind === "tick");
  return { ticks: lines.length, done: lines.filter((l) => l.done).length };
}

/** The same note with one line ticked or unticked. */
export function toggleLine(body: string, index: number): string {
  const lines = parseNote(body);
  const line = lines[index];
  if (!line || line.kind !== "tick") return body;
  lines[index] = { ...line, done: !line.done };
  return writeNote(lines);
}
