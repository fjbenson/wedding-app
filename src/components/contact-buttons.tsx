"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Phone } from "lucide-react";

type Kind = "phone" | "email";

/**
 * Two round buttons, phone and email (area page, round 4). Each opens a small
 * card with the number or address written out, to call/email or copy — so a
 * number can be pasted into WhatsApp as easily as rung.
 */
export default function ContactButtons({ name, phone, email }: { name: string; phone?: string | null; email?: string | null }) {
  const [open, setOpen] = useState<Kind | null>(null);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Escape, or a tap anywhere else, closes it. (A full-screen backdrop
  // wouldn't work: the glass card it sits in traps fixed positioning.)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (!phone && !email) return null;
  const value = open === "phone" ? phone : open === "email" ? email : null;

  function toggle(kind: Kind) {
    setCopied(false);
    setOpen((o) => (o === kind ? null : kind));
  }

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const circle = (on: boolean) =>
    `flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition hover:bg-cream ${
      on ? "ring-[1.5px] ring-ink" : ""
    }`;

  return (
    <div ref={box} className="relative">
      <div className="flex gap-2">
        {phone && (
          <button type="button" aria-label={`${name}'s phone number`} aria-expanded={open === "phone"} onClick={() => toggle("phone")} className={circle(open === "phone")}>
            <Phone className="h-4 w-4" strokeWidth={1.6} aria-hidden />
          </button>
        )}
        {email && (
          <button type="button" aria-label={`${name}'s email address`} aria-expanded={open === "email"} onClick={() => toggle("email")} className={circle(open === "email")}>
            <Mail className="h-4 w-4" strokeWidth={1.6} aria-hidden />
          </button>
        )}
      </div>

      {open && value && (
          <div role="dialog" aria-label={open === "phone" ? "Phone number" : "Email address"} className="absolute left-0 top-full z-30 mt-2 w-[min(280px,80vw)] rounded-[18px] bg-white p-4 shadow-[0_18px_40px_-16px_rgba(60,50,40,0.45)]">
            <p className="label text-stone">{name}</p>
            <p className="mt-1.5 break-all font-display text-xl text-ink">{value}</p>
            <div className="mt-3 flex gap-2">
              <a
                href={open === "phone" ? `tel:${value.replace(/\s+/g, "")}` : `mailto:${value}`}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-ink text-sm text-ivory hover:bg-ink/90"
              >
                {open === "phone" ? "Call" : "Email"}
              </a>
              <button
                type="button"
                onClick={copy}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-ink text-sm text-ink hover:bg-cream"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
      )}
    </div>
  );
}
