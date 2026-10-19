"use client";

import { useEffect, useState } from "react";
import { Download, Mail, Send, Share } from "lucide-react";
import CardSheet from "@/components/card-sheet";
import CopyText from "@/components/copy-text";
import type { TableShape } from "@/types/db";

export interface VenueTable {
  name: string;
  shape: TableShape;
  capacity: number;
  /** Where it stands in the room, as % (as the floor plan draws it). */
  x: number;
  y: number;
  /** Who sits there, chair by chair, with any dietary needs. */
  guests: { name: string; needs: string[] }[];
}

const ROSE: [number, number, number] = [154, 63, 43];
const GOLD: [number, number, number] = [142, 106, 44];
const INK: [number, number, number] = [30, 27, 24];
const STONE: [number, number, number] = [107, 101, 94];

/** Every table written out, for the email and the copy button. */
export function planText(couple: string, date: string | null, tables: VenueTable[], unseated: VenueTable["guests"]) {
  const seated = tables.reduce((n, t) => n + t.guests.length, 0);
  const diets = [...tables.flatMap((t) => t.guests), ...unseated].filter((g) => g.needs.length).length;
  const line = (g: VenueTable["guests"][number]) => `- ${g.name}${g.needs.length ? ` (${g.needs.join(", ")})` : ""}`;
  return [
    `Seating plan: ${couple}${date ? `, ${date}` : ""}`,
    `${seated} seated at ${tables.length} ${tables.length === 1 ? "table" : "tables"}${diets ? ` · ${diets} with dietary needs` : ""}`,
    ...tables.map((t) => [`${t.name.toUpperCase()} (${t.guests.length} of ${t.capacity})`, ...t.guests.map(line)].join("\n")),
    ...(diets
      ? [
          [
            "DIETARY NEEDS BY TABLE",
            ...tables.flatMap((t) => t.guests.filter((g) => g.needs.length).map((g) => `${t.name}: ${g.name} (${g.needs.join(", ")})`)),
            ...unseated.filter((g) => g.needs.length).map((g) => `Not seated yet: ${g.name} (${g.needs.join(", ")})`),
          ].join("\n"),
        ]
      : []),
    ...(unseated.length ? [["NOT SEATED YET", ...unseated.map(line)].join("\n")] : []),
  ].join("\n\n");
}

/** The plan as a PDF: the room on the first page, then every table with its guests and their needs. */
export async function planPdf(couple: string, date: string | null, tables: VenueTable[], unseated: VenueTable["guests"]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const left = 15;

  doc.setTextColor(...INK);
  doc.setFont("times", "normal");
  doc.setFontSize(22);
  doc.text("Seating plan", left, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...STONE);
  doc.text([couple, date].filter(Boolean).join(" · "), left, 29);

  // The room, as the floor plan has it.
  const room = { x: left, y: 38, w: W - left * 2, h: (W - left * 2) * 0.75 };
  doc.setDrawColor(230, 224, 214);
  doc.roundedRect(room.x, room.y, room.w, room.h, 3, 3);
  for (const t of tables) {
    const cx = room.x + (t.x / 100) * room.w;
    const cy = room.y + (t.y / 100) * room.h;
    doc.setDrawColor(...GOLD);
    doc.setFillColor(255, 253, 248);
    if (t.shape === "round") {
      const r = Math.max(8, Math.min(14, 6 + t.capacity * 0.6));
      doc.circle(cx, cy, r, "FD");
    } else {
      const w = t.shape === "top" ? Math.max(30, Math.min(70, 10 + t.capacity * 5)) : Math.max(24, Math.min(54, 8 + t.capacity * 3));
      doc.roundedRect(cx - w / 2, cy - 5, w, 10, 1.5, 1.5, "FD");
    }
    doc.setTextColor(...INK);
    doc.setFontSize(8);
    doc.text(t.name, cx, cy - 0.5, { align: "center", maxWidth: 30 });
    const diets = t.guests.filter((g) => g.needs.length).length;
    doc.setFontSize(7);
    doc.setTextColor(...(diets ? ROSE : STONE));
    doc.text(`${t.guests.length} seated${diets ? ` · ${diets} dietary` : ""}`, cx, cy + 3.5, { align: "center" });
  }
  doc.setFontSize(9);
  doc.setTextColor(...STONE);
  doc.text("Dietary needs are marked in red on the following pages.", left, room.y + room.h + 7);

  // Every table, its guests chair by chair, needs in rose.
  doc.addPage();
  let y = 20;
  const room4 = (lines: number) => {
    if (y + lines * 5.5 > 285) {
      doc.addPage();
      y = 20;
    }
  };
  const block = (title: string, guests: VenueTable["guests"], count?: string) => {
    room4(Math.min(guests.length, 4) + 2);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...INK);
    doc.text(title, left, y);
    if (count) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...STONE);
      doc.text(count, W - left, y, { align: "right" });
    }
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    for (const g of guests) {
      room4(1);
      doc.setTextColor(...INK);
      doc.text(g.name, left + 3, y);
      if (g.needs.length) {
        doc.setTextColor(...ROSE);
        doc.setFont("helvetica", "bold");
        doc.text(g.needs.join(", "), W - left, y, { align: "right" });
        doc.setFont("helvetica", "normal");
      }
      y += 5.5;
    }
    doc.setDrawColor(230, 224, 214);
    doc.line(left, y - 1.5, W - left, y - 1.5);
    y += 6;
  };
  for (const t of tables) block(t.name, t.guests, `${t.guests.length} of ${t.capacity}`);
  if (unseated.length) block("Not seated yet", unseated);

  return doc.output("blob");
}

/**
 * "Send to the venue" (owner, 19 Oct 2026): the plan as a PDF and written
 * out table by table. On a phone, Share opens the phone's own share sheet
 * with the PDF attached and the table in the message (pick Mail). Elsewhere,
 * the email opens with the table written in it, and the PDF downloads to
 * attach. The app sends nothing itself; guests' names and dietary needs go
 * only where the couple sends them (for the venue's catering).
 */
export default function SendToVenue({
  couple,
  date,
  tables,
  unseated,
}: {
  couple: string;
  /** The wedding's date, written out. */
  date: string | null;
  tables: VenueTable[];
  unseated: VenueTable["guests"];
}) {
  const [open, setOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const text = planText(couple, date, tables, unseated);
  const subject = `Seating plan: ${couple}`;
  const fileName = `Seating plan - ${couple.replace(/[^\p{L}\p{N} &'-]/gu, "").trim() || "wedding"}.pdf`;

  useEffect(() => {
    try {
      const probe = new File([""], "plan.pdf", { type: "application/pdf" });
      setCanShare(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShare(false);
    }
  }, []);

  const withPdf = async (use: (file: File) => Promise<void> | void) => {
    setBusy(true);
    setMessage(null);
    try {
      const blob = await planPdf(couple, date, tables, unseated);
      await use(new File([blob], fileName, { type: "application/pdf" }));
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setMessage("The plan couldn't be made just now. Try again, or copy the table instead.");
    } finally {
      setBusy(false);
    }
  };

  const share = () => withPdf((file) => navigator.share({ files: [file], title: subject, text }));
  const download = () =>
    withPdf((file) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    });

  const button = "flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-[15px] disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.12em] text-stone hover:text-ink"
      >
        <Send className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
        Send to the venue
      </button>

      {open && (
        <CardSheet label="Send to the venue" onClose={() => setOpen(false)} top={<span className="label">Seating</span>}>
          <h2 className="type-display text-[30px] leading-[1.05] tracking-[-0.02em]">Send to the venue</h2>
          <p className="mt-2 text-sm text-stone">
            The plan as a PDF, and every table written out with dietary needs marked. It goes only where you send it. It has
            guests&apos; names and dietary needs, for the venue&apos;s catering.
          </p>

          <div className="mt-5 space-y-2">
            {canShare && (
              <button type="button" onClick={share} disabled={busy} className={`${button} bg-ink text-ivory`}>
                <Share className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                <span className="flex-1">
                  {busy ? "Making the plan…" : "Share the plan"}
                  <span className="block text-[13px] text-ivory/70">The PDF attached and the table in the message. Pick Mail.</span>
                </span>
              </button>
            )}
            <a
              href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}
              className={`${button} ${canShare ? "border border-linen bg-white text-ink" : "bg-ink text-ivory"}`}
            >
              <Mail className="h-5 w-5" strokeWidth={1.6} aria-hidden />
              <span className="flex-1">
                Open in my email
                <span className={`block text-[13px] ${canShare ? "text-stone" : "text-ivory/70"}`}>The table written in. Attach the PDF yourself.</span>
              </span>
            </a>
            <button type="button" onClick={download} disabled={busy} className={`${button} border border-linen bg-white text-ink`}>
              <Download className="h-5 w-5" strokeWidth={1.6} aria-hidden />
              <span className="flex-1">{busy && !canShare ? "Making the plan…" : "Download the PDF"}</span>
            </button>
          </div>
          {message && (
            <p role="alert" className="mt-3 text-sm text-ink">
              {message}
            </p>
          )}

          <section className="mt-6 -mx-[22px] border-t border-linen px-[22px] pt-5">
            <div className="flex items-center justify-between">
              <h3 className="section-label">What they&apos;ll get</h3>
              <CopyText text={text} label="Copy the table" />
            </div>
            <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-linen bg-ivory px-3 py-2.5 font-body text-[13px] leading-relaxed text-ink">
              {text}
            </pre>
          </section>
        </CardSheet>
      )}
    </>
  );
}
